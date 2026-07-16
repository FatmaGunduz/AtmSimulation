import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, map, catchError } from 'rxjs';

export interface BanknoteInventory {
  b200: number;
  b100: number;
  b50: number;
  b20: number;
  b10: number;
}

export interface AtmNode {
  id: string;
  location: string;
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  cashLevel: number; // Yüzde olarak (0-100)
  banknotes: BanknoteInventory;
  issues: string[];
  lastMaintenance: Date;
}

export interface AccountMock {
  id?: string;
  iban: string;
  type: string;
  balance: number;
  currency: string;
}

export interface CardMock {
  id?: number;
  cardNumber: string;
  type: string;
  limit?: number;
  debt?: number;
  balance?: number;
  isBlocked?: boolean;
  accountId?: string;
}

export interface CustomerMock {
  id: string;
  name: string;
  tc: string;
  status: 'ACTIVE' | 'BLOCKED';
  totalAccounts: number;
  totalCards: number;
  accounts: AccountMock[];
  cards: CardMock[];
}

export interface GlobalLog {
  id: string;
  atmId: string;
  customerName: string;
  type: string;
  amount: number;
  date: Date;
  status: 'SUCCESS' | 'FAILED';
}

export interface CreditLimitIncreaseRequest {
  id: string;
  customerName: string;
  cardId: string;
  cardNumber: string;
  currentLimit: number;
  requestedLimit: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: Date;
  reviewedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'https://localhost:7204/api';
  private STORAGE_KEY = 'atm_admin_data_v1';
  private isBrowser: boolean;

  // Maksimum ATM Kapasitesi (Örn: 1.000.000 TL)
  private MAX_CAPACITY = 1000000;

  private atmsSubject = new BehaviorSubject<AtmNode[]>([]);
  private customersSubject = new BehaviorSubject<CustomerMock[]>([]);
  private logsSubject = new BehaviorSubject<GlobalLog[]>([]);
  private creditLimitRequestsSubject = new BehaviorSubject<CreditLimitIncreaseRequest[]>([]);

  atms$ = this.atmsSubject.asObservable();
  customers$ = this.customersSubject.asObservable();
  logs$ = this.logsSubject.asObservable();
  creditLimitRequests$ = this.creditLimitRequestsSubject.asObservable();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.loadInitialData();
  }

  private loadInitialData() {
    this.loadLocalWorkflowData();
    this.refreshAtms();
    this.refreshCustomers();
    this.refreshLogs();
    this.refreshCreditLimitRequests();
  }

  private loadLocalWorkflowData() {
    if (!this.isBrowser) return;

    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      const requests = (data.creditLimitRequests || []).map((r: any) => ({
        ...r,
        requestedAt: new Date(r.requestedAt),
        reviewedAt: r.reviewedAt ? new Date(r.reviewedAt) : undefined
      }));
      this.creditLimitRequestsSubject.next(requests);

      const logs = (data.logs || []).map((l: any) => ({
        ...l,
        date: new Date(l.date)
      }));
      if (logs.length > 0) {
        this.logsSubject.next(logs);
      }

      if (data.atms) {
        this.atmsSubject.next(data.atms.map((atm: any) => ({
          ...atm,
          lastMaintenance: new Date(atm.lastMaintenance)
        })));
      }
    } catch (err) {
      console.error('Admin yerel akis verisi okunamadi:', err);
    }
  }

  cleanId(id: string | number): string {
    if (!id) return '';
    return id.toString().replace('ATM-', '').replace(/^0+/, '');
  }

  // API'den ATM'leri çek ve yenile
  refreshAtms() {
    this.http.get<any[]>(`${this.apiUrl}/Admin/all-atms`).pipe(
      tap(atms => console.log('Backendden gelen ATMler:', atms)),
      map(atms => atms.map(a => this.mapBackendAtmToNode(a))),
      catchError((err) => {
        console.error('ATM listesi çekilirken hata oluştu:', err);
        return of(this.atmsSubject.value);
      })
    ).subscribe({
      next: (nodes) => {
        console.log('Maplenmiş ATMler:', nodes);
        const localAtms = this.atmsSubject.value;
        const merged = nodes.map(node => {
          const local = localAtms.find(a => this.cleanId(a.id) === this.cleanId(node.id));
          if (!local) return node;

          const localTotal = this.calculateCashTotal(local.banknotes);
          const serverTotal = this.calculateCashTotal(node.banknotes);

          // Preserve local inventory if backend returns zero counts after a local update.
          if (localTotal > 0 && serverTotal === 0) {
            return {
              ...node,
              banknotes: local.banknotes,
              cashLevel: this.calculateCashLevel(local.banknotes),
              status: local.status,
              issues: local.issues,
              lastMaintenance: local.lastMaintenance
            };
          }

          // Preserve manual offline state when backend still reports online.
          if (local.status === 'OFFLINE' && node.status === 'ONLINE') {
            return {
              ...node,
              status: local.status,
              banknotes: local.banknotes,
              cashLevel: this.calculateCashLevel(local.banknotes),
              issues: local.issues,
              lastMaintenance: local.lastMaintenance
            };
          }

          return node;
        });

        this.atmsSubject.next(merged);
      },
      error: (err) => {
        console.error('ATM listesi çekilirken hata oluştu (subscribe):', err);
      }
    });
  }

  // API'den Müşterileri çek ve yenile
  refreshCustomers() {
    this.http.get<any>(`${this.apiUrl}/Customer`).subscribe({
      next: (res: any) => {
        console.log('BACKENDDEN GELEN HAM MÜŞTERİ VERİSİ:', res);
        
        // .NET data/values/main sarmalayıcılarını kontrol et
        const mainList = res.$values || res.data || res.value || (Array.isArray(res) ? res : []);
        
        const mapped = mainList.map((c: any) => {
          const accs = (c.accounts?.$values || c.accounts || c.Accounts?.$values || c.Accounts || c.customerAccounts || c.customerAccounts?.$values || []);
          
          const flatCards: any[] = [];
          const mappedAccounts = accs.map((a: any) => {
            const cardsList = (a.cards?.$values || a.cards || a.Cards?.$values || a.Cards || []);
            cardsList.forEach((card: any) => {
              const cardId = (card.id || card.Id || '').toString();
              const cardNumber = card.cardNumber || card.CardNumber;
              const backendLimit = card.creditLimit || card.CreditLimit || card.limit || card.Limit || 0;
              const approvedLimit = this.getApprovedCreditLimitForCard(cardId, cardNumber);
              flatCards.push({
                id: card.id || card.Id,
                cardNumber,
                type: (card.type === 2 || card.Type === 2 || card.type === 'Banka Kartı') ? 'Banka Kartı' : 'Kredi Kartı',
                limit: approvedLimit ?? backendLimit,
                debt: card.creditDebt || card.CreditDebt || card.debt || card.Debt || 0,
                balance: card.balance || card.Balance || 0,
                isBlocked: card.isBlocked !== undefined ? card.isBlocked : card.IsBlocked,
                accountId: (card.accountId || card.AccountId || a.id || a.Id || '').toString()
              });
            });

            return {
              id: (a.id || a.Id || '').toString(),
              iban: a.iban || a.Iban || a.accountNumber || a.AccountNumber,
              type: (a.accountType === 1 || a.AccountType === 1) ? 'Vadesiz' : 'Vadeli',
              balance: a.balance || a.Balance || 0,
              currency: a.currency || a.Currency || 'TRY'
            };
          });
          
          return {
            id: (c.id || c.Id || '').toString(),
            name: c.fullName || c.FullName || c.name || c.Name || 'Bilinmeyen Müşteri',
            tc: c.tcNo || c.identityNumber || c.TcNo || c.identityNo || '12345678901',
            status: (c.isBlocked === true || c.IsBlocked === true || c.status === 2) ? 'BLOCKED' : 'ACTIVE' as 'ACTIVE' | 'BLOCKED',
            totalAccounts: mappedAccounts.length,
            totalCards: flatCards.length,
            accounts: mappedAccounts,
            cards: flatCards
          };
        });
        this.customersSubject.next(mapped);
      },
      error: (err) => console.error('Müşteri listesi çekilirken hata oluştu:', err)
    });
  }

  refreshLogs() {
    this.http.get<any[]>(`${this.apiUrl}/Admin/logs`).subscribe(logs => {
      const mapped: GlobalLog[] = logs.map(l => ({
        id: l.id.toString(),
        atmId: (l.atmId || '0').toString(),
        customerName: l.customerName || 'Bilinmiyor',
        type: l.type,
        amount: l.amount,
        date: new Date(l.createdAt),
        status: l.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED'
      }));
      this.logsSubject.next(mapped);
    });
  }

  refreshCreditLimitRequests() {
    this.http.get<any>(`${this.apiUrl}/Admin/credit-limit-requests`).subscribe({
      next: (res) => {
        const list = res.data || res.Data || res || [];
        const mapped = list.map((r: any) => ({
          id: (r.cardId || r.CardId || '').toString(),
          customerName: r.customerFullName || r.CustomerFullName || 'Müşteri',
          cardId: (r.cardId || r.CardId || '').toString(),
          cardNumber: r.cardNumber || r.CardNumber || '',
          currentLimit: r.currentCreditLimit || r.CurrentCreditLimit || 0,
          requestedLimit: r.requestedCreditLimit || r.RequestedCreditLimit || 0,
          status: (r.statusText === 'Onaylandı' || r.StatusText === 'Onaylandı') ? 'APPROVED' : (r.statusText === 'Reddedildi' || r.StatusText === 'Reddedildi') ? 'REJECTED' : 'PENDING',
          requestedAt: (r.requestDate || r.RequestDate) ? new Date(r.requestDate || r.RequestDate) : new Date(),
          reviewedAt: (r.approvedDate || r.ApprovedDate) ? new Date(r.approvedDate || r.ApprovedDate) : undefined
        }));
        this.creditLimitRequestsSubject.next(mapped);
      },
      error: (err) => console.error('Limit talepleri yüklenirken hata:', err)
    });
  }

  private mapBackendAtmToNode(a: any): AtmNode {
    // Backend PascalCase veya camelCase gönderebilir, ikisini de kontrol ediyoruz
    const id = (a.id || a.Id || '0').toString();
    const name = a.name || a.Name || '';
    const loc = a.location || a.Location || '';
    const location = name && loc ? `${name} (${loc})` : (name || loc || 'Bilinmiyor');
    const status = a.status !== undefined ? a.status : a.Status;
    
    const c200 = a.count200 || a.Count200 || 0;
    const c100 = a.count100 || a.Count100 || 0;
    const c50 = a.count50 || a.Count50 || 0;
    const c20 = a.count20 || a.Count20 || 0;
    const c10 = a.count10 || a.Count10 || 0;

    return {
      id,
      location,
      status: this.mapStatus(status),
      cashLevel: this.calculateCashLevelFromValues({
        count200: c200, count100: c100, count50: c50, count20: c20, count10: c10
      }),
      banknotes: {
        b200: c200, b100: c100, b50: c50, b20: c20, b10: c10
      },
      issues: (a.issues || a.Issues) ? (a.issues || a.Issues).split(';').map((i: string) => i.trim()).filter((i: string) => i !== '') : [],
      lastMaintenance: new Date()
    };
  }

  private mapStatus(s: any): 'ONLINE' | 'OFFLINE' | 'ERROR' {
    if (typeof s === 'string') {
      const upper = s.toUpperCase();
      if (upper === 'ACTIVE' || upper === 'ONLINE') return 'ONLINE';
      if (upper === 'MAINTENANCE' || upper === 'OFFLINE') return 'OFFLINE';
      return 'ERROR';
    }
    
    // Backend Enum: Active = 1, Maintenance = 2, HardwareFault = 3
    if (s === 1) return 'ONLINE';
    if (s === 2) return 'OFFLINE';
    if (s === 3) return 'ERROR';
    
    return 'OFFLINE';
  }

  private calculateCashLevelFromValues(a: any): number {
    const total = (a.count200 * 200) + (a.count100 * 100) + (a.count50 * 50) + (a.count20 * 20) + (a.count10 * 10);
    let perc = (total / this.MAX_CAPACITY) * 100;
    return Math.min(Math.round(perc), 100);
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/Admin/login`, { username, password }).pipe(
      tap(res => {
        if (res.success && res.token) {
          if (this.isBrowser) {
            localStorage.setItem('atm_token', res.token);
            localStorage.setItem('admin_user', JSON.stringify(res.userName));
          }
          // Login sonrası verileri tazele
          this.refreshAtms();
          this.refreshCustomers();
          this.refreshLogs();
        }
      })
    );
  }

  private saveData() {
    if (this.isBrowser) {
      const data = {
        atms: this.atmsSubject.value,
        customers: this.customersSubject.value,
        logs: this.logsSubject.value,
        creditLimitRequests: this.creditLimitRequestsSubject.value
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }
  }

  // ATM Actions
  fixAtmIssue(atmId: string) {
    this.http.patch(`${this.apiUrl}/Admin/fix-atm-issue/${atmId}`, {}).subscribe(() => {
      this.refreshAtms();
    });
  }

  toggleAtmStatus(atmId: string) {
    const atms = [...this.atmsSubject.value];
    const atm = atms.find(a => this.cleanId(a.id) === this.cleanId(atmId));
    if (!atm) return;

    const currentStatus = atm.status;
    const desiredStatus = currentStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    const statusCode = desiredStatus === 'ONLINE' ? 1 : 2;

    // Optimistically update UI immediately, then sync with backend.
    atm.status = desiredStatus;
    this.atmsSubject.next(atms);
    this.saveData();

    this.http.patch(`${this.apiUrl}/Admin/update-atm-status/${atmId}`, {
      status: statusCode,
      count200: atm.banknotes.b200,
      count100: atm.banknotes.b100,
      count50: atm.banknotes.b50,
      count20: atm.banknotes.b20,
      count10: atm.banknotes.b10
    }).subscribe({
      next: () => {
        console.log(`ATM ${atmId} statusu başarıyla güncellendi: ${desiredStatus}`);
      },
      error: (err) => {
        console.error('ATM durumu güncellenirken hata oluştu:', err);
        atm.status = currentStatus;
        this.atmsSubject.next(atms);
        this.saveData();
      }
    });
  }

  addIssueToAtm(atmId: string, issue: string) {
    this.http.post(`${this.apiUrl}/Admin/add-issue/${atmId}`, { issue }).subscribe(() => {
      this.refreshAtms();
    });
  }

  removeIssueFromAtm(atmId: string, issue: string) {
    const atms = [...this.atmsSubject.value];
    const atm = atms.find(a => this.cleanId(a.id) === this.cleanId(atmId));
    if (atm) {
      atm.issues = atm.issues.filter(i => i !== issue);
      // Eğer hiç arıza kalmazsa, durumu düzelt
      if (atm.issues.length === 0 && atm.status === 'ERROR') {
        atm.status = atm.cashLevel > 0 ? 'ONLINE' : 'OFFLINE';
        atm.lastMaintenance = new Date();
      }
      this.atmsSubject.next(atms);
      this.saveData();
    }
  }

  updateInventory(atmId: string, newInventory: BanknoteInventory) {
    const updateLocal = () => {
      const atms = [...this.atmsSubject.value];
      const atm = atms.find(a => this.cleanId(a.id) === this.cleanId(atmId));
      if (!atm) return;
      atm.banknotes = { ...newInventory };
      atm.cashLevel = this.calculateCashLevel(atm.banknotes);
      if (atm.status !== 'OFFLINE' && atm.cashLevel > 0 && atm.issues.length === 0) {
        atm.status = 'ONLINE';
      }
      atm.lastMaintenance = new Date();
      this.atmsSubject.next(atms);
      this.saveData();
    };

    updateLocal();

    const atm = this.atmsSubject.value.find(a => this.cleanId(a.id) === this.cleanId(atmId));
    const currentStatus = atm?.status ?? 'ONLINE';
    const statusCode = currentStatus === 'ONLINE' ? 1 : currentStatus === 'OFFLINE' ? 2 : 3;

    return this.http.patch<any>(`${this.apiUrl}/Admin/update-atm-status/${atmId}`, {
      status: statusCode,
      count200: newInventory.b200,
      count100: newInventory.b100,
      count50: newInventory.b50,
      count20: newInventory.b20,
      count10: newInventory.b10
    }).pipe(
      tap(() => {
        // Keep local state in sync; backend response is not required for UI update.
      }),
      catchError((err) => {
        console.error('ATM envanteri güncellenirken hata oluştu:', err);
        return of(null);
      })
    );
  }

  calculateCashTotal(b: BanknoteInventory): number {
    return (b.b200 * 200) + (b.b100 * 100) + (b.b50 * 50) + (b.b20 * 20) + (b.b10 * 10);
  }

  calculateCashLevel(b: BanknoteInventory): number {
    const total = this.calculateCashTotal(b);
    let perc = (total / this.MAX_CAPACITY) * 100;
    if (perc > 100) perc = 100;
    return Math.round(perc);
  }

  // Global Log Ekleme (AtmService tarafından çağrılır)
  addGlobalLog(entry: Omit<GlobalLog, 'id' | 'date'>) {
    const logs = [this.logsSubject.value[0] ? this.logsSubject.value : []].flat();
    const newLog: GlobalLog = {
      ...entry,
      id: 'L' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      date: new Date()
    };
    this.logsSubject.next([newLog, ...this.logsSubject.value]);
    this.saveData();
  }

  createCreditLimitIncreaseRequest(request: Omit<CreditLimitIncreaseRequest, 'id' | 'status' | 'requestedAt'>) {
    const pendingForCard = this.creditLimitRequestsSubject.value.find(r =>
      r.cardId === request.cardId && r.status === 'PENDING'
    );

    if (pendingForCard) {
      return { success: false, message: 'Bu kart icin zaten bekleyen bir limit artirim talebi var.' };
    }

    const newRequest: CreditLimitIncreaseRequest = {
      ...request,
      id: 'CLR' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      status: 'PENDING',
      requestedAt: new Date()
    };

    this.creditLimitRequestsSubject.next([newRequest, ...this.creditLimitRequestsSubject.value]);
    this.addGlobalLog({
      atmId: 'ATM',
      customerName: request.customerName,
      type: 'KREDI LIMIT ARTIRIM TALEBI',
      amount: request.requestedLimit,
      status: 'SUCCESS'
    });
    this.saveData();

    return { success: true, message: 'Limit artirim talebiniz admin onayina gonderildi.' };
  }

  approveCreditLimitRequest(requestId: string) {
    this.http.post<any>(`${this.apiUrl}/Admin/credit-limit-requests/${requestId}/decision`, {
      cardId: parseInt(requestId),
      isApproved: true
    }).subscribe({
      next: () => {
        this.refreshCustomers();
        this.refreshCreditLimitRequests();
        this.refreshLogs();
      },
      error: (err) => console.error('Limit onaylanırken hata:', err)
    });
  }

  rejectCreditLimitRequest(requestId: string) {
    this.http.post<any>(`${this.apiUrl}/Admin/credit-limit-requests/${requestId}/decision`, {
      cardId: parseInt(requestId),
      isApproved: false,
      rejectionReason: 'Talep reddedildi.'
    }).subscribe({
      next: () => {
        this.refreshCustomers();
        this.refreshCreditLimitRequests();
        this.refreshLogs();
      },
      error: (err) => console.error('Limit reddedilirken hata:', err)
    });
  }

  getApprovedCreditLimitForCard(cardId: string, cardNumber: string): number | null {
    const approved = this.creditLimitRequestsSubject.value
      .filter(r =>
        r.status === 'APPROVED' &&
        (r.cardId === cardId || r.cardNumber === cardNumber)
      )
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime())[0];

    return approved ? approved.requestedLimit : null;
  }

  getAtms(): AtmNode[] {
    return this.atmsSubject.value;
  }

  // Küpür Algoritması: ATM'den para çek (en büyükten başlayarak)
  withdrawFromAtm(atmId: string, amount: number): { success: boolean; message: string } {
    const atms = [...this.atmsSubject.value];
    const atm = atms.find(a => this.cleanId(a.id) === this.cleanId(atmId));
    if (!atm) return { success: false, message: 'ATM bulunamadı.' };
    if (atm.status !== 'ONLINE') return { success: false, message: 'ATM şu an hizmet veremiyor.' };

    const denominations = [
      { key: 'b200' as keyof BanknoteInventory, value: 200 },
      { key: 'b100' as keyof BanknoteInventory, value: 100 },
      { key: 'b50'  as keyof BanknoteInventory, value: 50  },
      { key: 'b20'  as keyof BanknoteInventory, value: 20  },
      { key: 'b10'  as keyof BanknoteInventory, value: 10  },
    ];

    // Mevcut banknot envanterinin kopyasını al
    const tempInventory: BanknoteInventory = { ...atm.banknotes };
    let remaining = amount;

    for (const denom of denominations) {
      if (remaining <= 0) break;
      const use = Math.min(Math.floor(remaining / denom.value), tempInventory[denom.key]);
      tempInventory[denom.key] -= use;
      remaining -= use * denom.value;
    }

    if (remaining > 0) {
      return { success: false, message: `ATM'de uygun küpür bulunmamaktadır! (₺${amount} için banknot kombinasyonu yok)` };
    }

    // Başarılı: envanteri güncelle
    atm.banknotes = tempInventory;
    atm.cashLevel = this.calculateCashLevel(atm.banknotes);
    if (atm.cashLevel === 0) atm.status = 'OFFLINE';
    this.atmsSubject.next(atms);
    this.saveData();
    return { success: true, message: 'Para çekildi.' };
  }

  // Küpür Algoritması: ATM'ye para yatır (en büyük banknotlara bölerek ekle)
  depositToAtm(atmId: string, amount: number): void {
    const atms = [...this.atmsSubject.value];
    const atm = atms.find(a => this.cleanId(a.id) === this.cleanId(atmId));
    if (!atm) return;

    // Yatırılan parayı mümkün olduğunca 200'lük ve 100'lük banknotlara dönüştür
    let remaining = amount;
    atm.banknotes.b200 += Math.floor(remaining / 200);
    remaining = remaining % 200;
    atm.banknotes.b100 += Math.floor(remaining / 100);
    remaining = remaining % 100;
    atm.banknotes.b50 += Math.floor(remaining / 50);
    remaining = remaining % 50;
    atm.banknotes.b20 += Math.floor(remaining / 20);
    remaining = remaining % 20;
    atm.banknotes.b10 += Math.floor(remaining / 10);

    atm.cashLevel = this.calculateCashLevel(atm.banknotes);
    if (atm.cashLevel > 0 && atm.issues.length === 0) atm.status = 'ONLINE';
    this.atmsSubject.next(atms);
    this.saveData();
  }

  // Müşteri Yönetimi
  addCustomer(customer: any) {
    this.http.post<any>(`${this.apiUrl}/Customer`, {
      fullName: customer.name,
      email: `${customer.name.toLowerCase().replace(/\s+/g, '.')}@bank.com`,
      password: 'customer123'
    }).subscribe({
      next: () => {
        this.refreshCustomers();
      },
      error: (err) => console.error('Müşteri eklenirken hata:', err)
    });
  }

  deleteCustomer(customerId: string) {
    this.http.delete(`${this.apiUrl}/Customer/${customerId}`).subscribe(() => {
      this.refreshCustomers();
    });
  }

  addAccountToCustomer(customerId: string, account: AccountMock) {
    const cust = this.customersSubject.value.find(c => c.id === customerId);
    const ownerName = cust ? cust.name : 'Müşteri';
    this.http.post<any>(`${this.apiUrl}/Account/create/${customerId}`, {
      ownerName: ownerName,
      initialBalance: account.balance || 0
    }).subscribe({
      next: () => {
        this.refreshCustomers();
      },
      error: (err) => console.error('Hesap eklenirken hata:', err)
    });
  }

  removeAccountFromCustomer(customerId: string, iban: string) {
    const cust = this.customersSubject.value.find(c => c.id === customerId);
    if (!cust) return;
    const acc = cust.accounts.find(a => a.iban === iban);
    if (!acc) return;
    const accountId = acc.id;
    this.http.delete(`${this.apiUrl}/Account/${accountId}`).subscribe({
      next: () => {
        this.refreshCustomers();
      },
      error: (err) => console.error('Hesap silinirken hata:', err)
    });
  }

  addCardToCustomer(customerId: string, card: CardMock) {
    this.http.post<any>(`${this.apiUrl}/Card`, {
      accountId: parseInt(card.accountId || '0'),
      cardNumber: (card.cardNumber || '').replace(/\s/g, ''),
      pin: '1234',
      exxpiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString(),
      creditLimit: card.limit || 15000.00
    }).subscribe({
      next: () => {
        this.refreshCustomers();
      },
      error: (err) => console.error('Kart eklenirken hata:', err)
    });
  }

  removeCardFromCustomer(customerId: string, cardNumber: string) {
    const cust = this.customersSubject.value.find(c => c.id === customerId);
    if (!cust) return;
    const card = cust.cards.find(c => c.cardNumber === cardNumber);
    if (!card) return;
    const cardId = card.id;
    this.http.delete(`${this.apiUrl}/Card/${cardId}`).subscribe({
      next: () => {
        this.refreshCustomers();
      },
      error: (err) => console.error('Kart silinirken hata:', err)
    });
  }

  toggleCustomerStatus(customerId: string) {
    const customer = this.customersSubject.value.find(c => c.id === customerId);
    if (!customer) return;

    if (customer.status === 'BLOCKED') {
      const blockedCards = customer.cards.filter(c => c.isBlocked && c.id);
      if (blockedCards.length === 0) {
        this.refreshCustomers();
        return;
      }

      let completed = 0;
      blockedCards.forEach(card => {
        this.http.put(`${this.apiUrl}/Card/unblock`, { cardId: card.id }).subscribe({
          next: () => {
            completed++;
            if (completed === blockedCards.length) {
              this.refreshCustomers();
            }
          },
          error: (err) => {
            console.error('Kart blokesi kaldırılırken hata oluştu:', err);
            completed++;
            if (completed === blockedCards.length) {
              this.refreshCustomers();
            }
          }
        });
      });
    } else {
      alert('Aktif bir müşteriyi sadece ATM üzerinde 3 kez yanlış şifre girildiğinde bloke edebilirsiniz. Buradan doğrudan bloke edilemez.');
    }
  }

  unblockCard(cardId: number) {
    return this.http.put<any>(`${this.apiUrl}/Card/unblock`, { cardId });
  }

  getDashboardStats() {
    const atms = this.atmsSubject.value;
    const customers = this.customersSubject.value;
    const logs = this.logsSubject.value;

    const activeAtms = atms.filter(a => a.status === 'ONLINE').length;
    const errorAtms = atms.filter(a => a.status === 'ERROR').length;
    const offlineAtms = atms.filter(a => a.status === 'OFFLINE').length;
    const totalCash = atms.reduce((acc, atm) => acc + this.calculateCashTotal(atm.banknotes), 0);
    const totalCards = customers.reduce((acc, customer) => acc + customer.cards.length, 0);
    const totalCustomers = customers.length;
    const successOps = logs.filter(l => l.status === 'SUCCESS').length;
    const failedOps = logs.filter(l => l.status === 'FAILED').length;
    const recentAlerts = logs
      .filter(l => l.status === 'FAILED')
      .slice(0, 5)
      .map(l => ({
        atmId: l.atmId,
        type: l.type,
        amount: l.amount,
        date: l.date
      }));

    return {
      totalAtms: atms.length,
      activeAtms,
      errorAtms,
      offlineAtms,
      totalCustomers,
      totalCards,
      totalCash,
      successOps,
      failedOps,
      recentAlerts
    };
  }
}
