import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, map, catchError } from 'rxjs';
import { AdminService } from './admin.service';

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'IN' | 'OUT';
}

interface Account {
  id: string;
  name: string;
  balance: number;
  accNo: string;
  history: Transaction[];
}

export interface CreditCard {
  id: string;
  name: string;
  cardNumber: string;
  limit: number;
  debt: number;
  availableLimit: number;
  history: Transaction[];
}

@Injectable({
  providedIn: 'root'
})
export class AtmService {
  private apiUrl = 'https://localhost:7204/api';
  private STORAGE_KEY = 'atm_simulation_data_v2';
  private isBrowser: boolean;

  // Seçili ATM ID'si (Login ekranından seçilir)
  private selectedAtmIdSubject = new BehaviorSubject<string>('ATM-001');
  selectedAtmId$ = this.selectedAtmIdSubject.asObservable();

  private accountsData: Account[] = [];
  private cardsData: CreditCard[] = [];
  private currentPin: string = '';
  
  private dailyLimit: number = 20000;
  private usedLimit: number = 0;
  private ecommerceEnabled: boolean = true;
  private contactlessEnabled: boolean = true;

  private accountsSubject = new BehaviorSubject<Account[]>([]);
  private cardsSubject = new BehaviorSubject<CreditCard[]>([]);
  private activeAccountId = new BehaviorSubject<string>('1');
  private activeCardId = new BehaviorSubject<string | null>(null);
  private balanceSubject = new BehaviorSubject<number>(0);
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  private loggedIn = new BehaviorSubject<boolean>(false);
  private customerNameSubject = new BehaviorSubject<string>('MÜŞTERİ');

  accounts$ = this.accountsSubject.asObservable();
  cards$ = this.cardsSubject.asObservable();
  balance$ = this.balanceSubject.asObservable();
  transactions$ = this.transactionsSubject.asObservable();
  customerName$ = this.customerNameSubject.asObservable();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private adminService: AdminService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      const savedAtm = localStorage.getItem('selected_atm_id');
      if (savedAtm) this.selectedAtmIdSubject.next(savedAtm);

      if (localStorage.getItem('atm_token')) {
        this.loggedIn.next(true);
        this.customerNameSubject.next(localStorage.getItem('customer_name') || 'MÜŞTERİ');
        this.loadAccountsAfterLogin();
      }
    }
  }

  cleanId(id: string | number): string {
    if (!id) return '';
    return id.toString().replace('ATM-', '').replace(/^0+/, '');
  }

  // ATM SEÇİMİ
  get selectedAtmId(): string {
    return this.selectedAtmIdSubject.value;
  }

  setSelectedAtm(atmId: string) {
    this.selectedAtmIdSubject.next(atmId);
    if (this.isBrowser) {
      localStorage.setItem('selected_atm_id', atmId);
    }
  }

  getSelectedAtmInfo() {
    return this.adminService.getAtms().find(a => this.cleanId(a.id) === this.cleanId(this.selectedAtmIdSubject.value)) || null;
  }

  private saveToStorage() {
    if (this.isBrowser) {
      const dataToSave = {
        accounts: this.accountsData,
        cards: this.cardsData,
        pin: this.currentPin,
        dailyLimit: this.dailyLimit,
        usedLimit: this.usedLimit,
        ecommerce: this.ecommerceEnabled,
        contactless: this.contactlessEnabled,
        selectedAtmId: this.selectedAtmIdSubject.value
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }

  private loadFromStorage() {
    if (this.isBrowser) {
      const savedAtm = localStorage.getItem('selected_atm_id');
      if (savedAtm) this.selectedAtmIdSubject.next(savedAtm);
    }
    // Veriler backendden çekilecek, LocalStorage'da sadece UI tercihleri kalabilir.
  }

  // AUTH & PIN
  isLoggedIn(): boolean { 
    if (this.isBrowser) {
      return !!localStorage.getItem('atm_token');
    }
    return false; 
  }

  logout() { 
    if (this.isBrowser) {
      localStorage.removeItem('atm_token');
      localStorage.removeItem('card_number');
    }
    this.loggedIn.next(false);
  }
  
  verifyPin(cardNumber: string, pin: string): Observable<{success: boolean, message: string, isBlocked?: boolean, remainingAttempts?: number}> {
    return this.http.post<any>(`${this.apiUrl}/Atm/verify-pin`, { cardNumber, pin }).pipe(
      tap(res => {
        if (res.success) {
          if (this.isBrowser) {
            localStorage.setItem('atm_token', res.token);
            localStorage.setItem('card_number', cardNumber);
            localStorage.setItem('customer_name', res.customerName || 'SN. FATOŞ');
          }
          this.customerNameSubject.next(res.customerName || 'SN. FATOŞ');
          this.loggedIn.next(true);
          this.loadAccountsAfterLogin();
        }
      }),
      map(res => ({ 
        success: res.success, 
        message: res.message,
        isBlocked: res.isBlocked,
        remainingAttempts: res.remainingAttempts
      })),
      catchError(err => {
        console.error('Login hatası:', err);
        const res = err.error;
        let msg = res?.message || 'Bağlantı sorunu oluştu.';
        
        // Eğer backend'den kalan hak bilgisi geliyorsa mesaja ekle
        if (res?.remainingAttempts !== undefined && res?.remainingAttempts > 0) {
          msg = `${res.message} Kalan hakkınız: ${res.remainingAttempts}`;
        } else if (res?.isBlocked) {
          msg = 'Kartınız bloke edilmiştir. Lütfen şubenizle iletişime geçin.';
        }

        return of({ 
          success: false, 
          message: msg, 
          isBlocked: res?.isBlocked, 
          remainingAttempts: res?.remainingAttempts 
        });
      })
    );
  }

  private loadAccountsAfterLogin() {
    this.http.get<any>(`${this.apiUrl}/Atm/accounts`).subscribe(res => {
      console.log('HESAPLAR HAM VERİ:', res);
      
      // Müşterinin tüm banka hesapları listesi
      const accList = (res.accounts?.$values || res.accounts || res.Accounts?.$values || res.Accounts || []);
      
      // Aktif giriş yapılan kart (Hybrid olarak tek kart)
      const activeCardRaw = res.card || res.Card;
      const cardList = activeCardRaw ? [activeCardRaw] : [];

      const mappedAccs = accList.map((a: any) => ({
        id: (a.id || a.Id || '0').toString(),
        name: a.name || a.Name || `Vadesiz Hesap - ${a.accountNumber || a.AccountNumber || a.iban || a.Iban || a.id}`,
        balance: a.balance || a.Balance || 0,
        accNo: a.iban || a.Iban || a.accountNumber || a.AccountNumber,
        history: []
      }));

      const mappedCards = cardList.map((c: any) => {
        const id = (c.id || c.Id || '0').toString();
        const cardNumber = c.cardNumber || c.CardNumber;
        const backendLimit = c.creditLimit || c.CreditLimit || 0;
        const approvedLimit = this.adminService.getApprovedCreditLimitForCard(id, cardNumber);
        const limit = approvedLimit ?? backendLimit;
        const debt = c.creditDebt || c.CreditDebt || 0;

        return {
          id,
          name: 'Kredi Kartı',
          cardNumber,
          limit,
          debt,
          availableLimit: limit - debt,
          history: []
        };
      });

      this.accountsData = mappedAccs;
      this.cardsData = mappedCards;
      
      this.accountsSubject.next(mappedAccs);
      this.cardsSubject.next(mappedCards);
      
      if (this.activeCardId.value && this.cardsData.some(c => c.id === this.activeCardId.value)) {
        const activeCard = this.cardsData.find(c => c.id === this.activeCardId.value);
        if (activeCard) {
          this.setActiveCard(activeCard.name);
          return;
        }
      }

      if (mappedAccs.length > 0) {
        const currentActiveId = this.activeAccountId.value;
        const stillExists = mappedAccs.find((a: any) => a.id === currentActiveId);
        if (stillExists) {
          this.setActiveAccount(stillExists.name);
        } else {
          this.setActiveAccount(mappedAccs[0].name);
        }
      }
    });
  }
  
  changePin(oldPin: string, newPin: string): Observable<{success: boolean, message: string}> {
    return this.http.post<any>(`${this.apiUrl}/Atm/change-pin`, { oldPin, newPin }).pipe(
      tap(res => {
        if (res.success) {
          this.adminService.addGlobalLog({ 
            atmId: this.selectedAtmId, 
            customerName: 'Müşteri', 
            type: 'ŞİFRE DEĞİŞTİRME', 
            amount: 0, 
            status: 'SUCCESS' 
          });
        }
      }),
      map(res => ({ success: res.success, message: res.message }))
    );
  }

  // AKTİF SEÇİMLER
  // AKTİF SEÇİMLER
  setActiveAccount(accountName: string) {
    const account = this.accountsData.find(a => a.name === accountName);
    if (account) {
      this.activeAccountId.next(account.id);
      this.activeCardId.next(null);
      this.balanceSubject.next(account.balance);
      
      // Backend'den geçmişi çek
      this.fetchTransactions(account.id);
    }
  }

  private fetchTransactions(accountId: string) {
    this.http.get<any[]>(`${this.apiUrl}/Atm/statement/${accountId}`).subscribe({
      next: (logs) => {
        const successfulLogs = (logs || []);
    console.log('Fetched transaction logs:', successfulLogs);
        const mapped: Transaction[] = successfulLogs.map(l => {
          const type = (l.type || l.Type || '').toUpperCase();
          const amount = l.amount || l.Amount || 0;
          const balanceBefore = l.balanceBefore || l.BalanceBefore || 0;
          const balanceAfter = l.balanceAfter || l.BalanceAfter || 0;
          const failReason = l.failReason || l.FailReason || '';
          const targetIban = l.toIban || l.ToIban || '';

          let description = 'İŞLEM';
          if (type === 'WITHDRAW') {
            description = 'PARA ÇEKME';
          } else if (type === 'DEPOSIT') {
            description = 'PARA YATIRMA';
          } else if (type === 'TRANSFER') {
            // For bill payments, the backend provides the bill name in failReason.
            // Use failReason if present; otherwise fall back to targetIban.
            description = failReason || targetIban || 'İŞLEM';
          } else {
            description = targetIban ? targetIban : (failReason || 'İŞLEM');
          }

          const direction: 'IN' | 'OUT' = balanceAfter >= balanceBefore ? 'IN' : 'OUT';

          return {
            id: (l.id || l.Id || '').toString(),
            date: new Date(l.createdAt || l.CreatedAt),
            description: description,
            amount: amount,
            type: direction
          };
        });
        this.transactionsSubject.next(mapped);
      },
      error: (err) => {
        console.error('Transactions load error:', err);
        this.transactionsSubject.next([]);
      }
    });
  }

  private fetchCardTransactions(accountId: string, cardId: string) {
    this.http.get<any[]>(`${this.apiUrl}/Atm/statement/${accountId}`).subscribe({
      next: (logs) => {
        const cardLogs = (logs || []).filter(l => {
          const status = l.status ?? l.Status;
          const isSuccess = status === true || String(status).toLowerCase() === 'success';
          if (!isSuccess) return false;

          const failReason = (l.failReason || l.FailReason || '').toString();
          const targetIban = (l.toIban || l.ToIban || '').toString();
          const isCardRelated = targetIban.toUpperCase().includes('KREDİ') ||
                                targetIban.toUpperCase().includes('KREDI') ||
                                targetIban.toUpperCase().includes('KART') ||
                                failReason.toLowerCase().includes('kredi kart') ||
                                failReason.toLowerCase().includes('avans') ||
                                failReason.toLowerCase().includes('borç');

          return isCardRelated;
        });
        
        const mapped: Transaction[] = cardLogs.map(l => {
          const amount = l.amount || l.Amount || 0;
          const failReason = (l.failReason || l.FailReason || '').toString();
          const targetIban = (l.toIban || l.ToIban || '').toString();
          
          let description = targetIban || failReason || 'KART İŞLEMİ';
          let direction: 'IN' | 'OUT' = 'OUT';
          
          if (failReason.toLowerCase().includes('nakit avans')) {
            description = 'NAKİT AVANS ÇEKİMİ';
            direction = 'OUT';
          } else if (failReason.toLowerCase().includes('borç ödeme') || failReason.toLowerCase().includes('borc odeme')) {
            description = 'KART BORCU ÖDEMESİ';
            direction = 'IN';
          }
          
          return {
            id: (l.id || l.Id || '').toString(),
            date: new Date(l.createdAt || l.CreatedAt),
            description: description,
            amount: amount,
            type: direction
          };
        });
        
        const card = this.cardsData.find(c => c.id === cardId);
        if (card) {
          card.history = mapped;
          this.cardsSubject.next([...this.cardsData]);
        }
        this.transactionsSubject.next(mapped);
      },
      error: (err) => {
        console.error('Card transactions load error:', err);
        this.transactionsSubject.next([]);
      }
    });
  }

  setActiveCard(cardName: string) {
    const card = this.cardsData.find(c => c.name === cardName);
    if (card) {
      this.activeCardId.next(card.id);
      this.activeAccountId.next('');
      this.balanceSubject.next(card.availableLimit);
      
      const mainAccountId = this.accountsData.length > 0 ? this.accountsData[0].id : '';
      if (mainAccountId) {
        this.fetchCardTransactions(mainAccountId, card.id);
      } else {
        this.transactionsSubject.next([]);
      }
    }
  }

  getActiveCard() {
    return this.cardsData.find(c => c.id === this.activeCardId.value);
  }

  getActiveAccount() {
    return this.accountsData.find(a => a.id === this.activeAccountId.value);
  }

  // İŞLEMLER
  private updateGlobalState(newBalance: number, type: string, amount: number, direction: 'IN' | 'OUT') {
    if (this.activeCardId.value) {
      const card = this.cardsData.find(c => c.id === this.activeCardId.value);
      if (card) {
        card.availableLimit = newBalance;
        if (direction === 'OUT') card.debt += amount; else card.debt -= amount;
        this.addTransactionToTarget(card.history, type, amount, direction);
      }
    } else {
      const acc = this.accountsData.find(a => a.id === this.activeAccountId.value);
      if (acc) {
        acc.balance = newBalance;
        if (type === 'PARA ÇEKME') this.usedLimit += amount;
        this.addTransactionToTarget(acc.history, type, amount, direction);
      }
    }
    this.accountsSubject.next([...this.accountsData]);
    this.cardsSubject.next([...this.cardsData]);
    this.balanceSubject.next(newBalance);
    this.saveToStorage();
  }

  private addTransactionToTarget(history: Transaction[], type: string, amount: number, direction: 'IN' | 'OUT') {
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date(), description: type, amount: amount, type: direction
    };
    history.unshift(newTransaction);
    this.transactionsSubject.next(history);
  }

  private getErrorMessage(err: any, fallback: string): string {
    const error = err?.error;

    if (typeof error === 'string' && error.trim()) return error;
    if (error?.message) return error.message;
    if (error?.Message) return error.Message;
    if (error?.title) return error.title;

    const validationErrors = error?.errors || error?.Errors;
    if (validationErrors) {
      const firstError = Object.values(validationErrors).flat()[0];
      if (firstError) return firstError.toString();
    }

    if (err?.status === 0) return 'Backend baglantisi kurulamadi. API calisiyor mu kontrol edin.';
    if (err?.status === 401) return 'Oturum gecersiz. Lutfen tekrar giris yapin.';
    if (err?.status === 404) return 'Backend endpoint bulunamadi.';
    if (err?.status >= 500) return 'Backend tarafinda sunucu hatasi olustu.';

    return fallback;
  }

  withdraw(amount: number): Observable<{success: boolean, message: string}> {
    const accountId = this.activeCardId.value ? 0 : (parseInt(this.activeAccountId.value) || 0);
    const atmId = parseInt(this.selectedAtmId.replace(/\D/g, '')) || 1;

    console.log('WITHDRAW isteği:', { accountId, atmId, amount });

    return this.http.post<any>(`${this.apiUrl}/Atm/withdraw`, {
      accountId,
      atmId,
      amount
    }).pipe(
      tap(res => {
        if (res.success) {
          this.adminService.withdrawFromAtm(this.selectedAtmId, amount);
          this.adminService.refreshAtms();
          const operationType = this.activeCardId.value ? 'NAKİT AVANS' : 'PARA ÇEKME';
          this.adminService.addGlobalLog({
            atmId: this.selectedAtmId,
            customerName: 'Müşteri',
            type: operationType,
            amount,
            status: 'SUCCESS'
          });
          this.loadAccountsAfterLogin();
        }
      }),
      map(res => ({ success: res.success, message: res.message || 'İşlem Başarılı' })),
      catchError(err => {
        const msg = this.getErrorMessage(err, 'Para cekme islemi basarisiz oldu.');
        console.error('WITHDRAW HATA:', err);
        this.adminService.addGlobalLog({
          atmId: this.selectedAtmId,
          customerName: 'Müşteri',
          type: `HATA: ${this.activeCardId.value ? 'NAKİT AVANS' : 'PARA ÇEKME'} - ${msg}`,
          amount,
          status: 'FAILED'
        });
        return of({ success: false, message: msg });
      })
    );
  }

  deposit(amount: number): Observable<{success: boolean, message: string}> {
    const accountId = parseInt(this.activeAccountId.value);
    const atmId = parseInt(this.selectedAtmId.replace(/\D/g, '')) || 1;

    return this.http.post<any>(`${this.apiUrl}/Atm/deposit`, {
      accountId,
      atmId,
      amount
    }).pipe(
      tap(res => {
        if (res.success) {
          this.adminService.depositToAtm(this.selectedAtmId, amount);
          this.adminService.refreshAtms();
          this.adminService.addGlobalLog({
            atmId: this.selectedAtmId,
            customerName: 'Müşteri',
            type: 'PARA YATIRMA',
            amount,
            status: 'SUCCESS'
          });
          this.loadAccountsAfterLogin();
        }
      }),
      map(res => ({ success: res.success, message: res.message || 'İşlem Başarılı' })),
      catchError(err => {
        const msg = this.getErrorMessage(err, 'Para yatirma islemi basarisiz oldu.');
        console.error('DEPOSIT HATA:', err);
        this.adminService.addGlobalLog({
          atmId: this.selectedAtmId,
          customerName: 'Müşteri',
          type: `HATA: PARA YATIRMA - ${msg}`,
          amount,
          status: 'FAILED'
        });
        return of({ success: false, message: msg });
      })
    );
  }

  transfer(amount: number, targetIban: string): Observable<{success: boolean, message: string}> {
    const fromAccountId = parseInt(this.activeAccountId.value);
    const atmId = parseInt(this.selectedAtmId.replace(/\D/g, '')) || 1;

    if (!fromAccountId) {
      return of({ success: false, message: 'Transfer icin once vadesiz hesap secmelisiniz.' });
    }
    
    return this.http.post<any>(`${this.apiUrl}/Atm/transfer`, {
      fromAccountId,
      toIban: targetIban,
      amount,
      atmId
    }).pipe(
      tap(res => {
        if (res.success) {
          this.adminService.addGlobalLog({
            atmId: this.selectedAtmId,
            customerName: 'Müşteri',
            type: `TRANSFER → ${targetIban}`,
            amount,
            status: 'SUCCESS'
          });
          this.loadAccountsAfterLogin();
        }
      }),
      map(res => ({ success: res.success, message: res.message || 'Transfer Başarılı' })),
      catchError(err => {
        const msg = this.getErrorMessage(err, 'Transfer islemi basarisiz oldu. IBAN ve bakiyeyi kontrol edin.');
        console.error('TRANSFER HATA:', err);
        this.adminService.addGlobalLog({
          atmId: this.selectedAtmId,
          customerName: 'Müşteri',
          type: `HATA: TRANSFER → ${targetIban} - ${msg}`,
          amount,
          status: 'FAILED'
        });
        return of({ success: false, message: msg });
      })
    );
  }

  payCreditCardDebt(amount: number): Observable<{success: boolean, message: string}> {
    const cardId = this.activeCardId.value;
    if (!cardId) return of({ success: false, message: 'Aktif kredi kartı bulunamadı!' });
    
    const mainAccount = this.accountsData[0];
    if (!mainAccount) return of({ success: false, message: 'Vadesiz hesap bulunamadı!' });
    
    const atmId = parseInt(this.selectedAtmId.replace(/\D/g, '')) || 1;
    
    return this.http.post<any>(`${this.apiUrl}/Atm/transfer`, {
      fromAccountId: parseInt(mainAccount.id),
      toIban: 'KREDİ KARTI',
      amount,
      atmId
    }).pipe(
      tap(res => {
        if (res.success) {
          this.adminService.addGlobalLog({
            atmId: this.selectedAtmId,
            customerName: 'Müşteri',
            type: 'KART BORCU ÖDEMESİ',
            amount,
            status: 'SUCCESS'
          });
          this.loadAccountsAfterLogin();
        }
      }),
      map(res => ({ success: res.success, message: res.message || 'Borç başarıyla ödendi!' })),
      catchError(err => {
        const msg = this.getErrorMessage(err, 'Kredi karti borc odeme islemi basarisiz oldu.');
        console.error('KART ÖDEME HATA:', err);
        this.adminService.addGlobalLog({
          atmId: this.selectedAtmId,
          customerName: 'Müşteri',
          type: `HATA: KART BORCU ÖDEMESİ - ${msg}`,
          amount,
          status: 'FAILED'
        });
        return of({ success: false, message: msg });
      })
    );
  }

  payBill(type: string, amount: number): void {
    const atmId = this.selectedAtmId;
    this.adminService.addGlobalLog({ atmId, customerName: 'Müşteri', type: `FATURA: ${type}`, amount, status: 'SUCCESS' });
  }

  getLimits() {
    return { dailyLimit: this.dailyLimit, usedLimit: this.usedLimit, remainingLimit: this.dailyLimit - this.usedLimit, ecommerce: this.ecommerceEnabled, contactless: this.contactlessEnabled };
  }
  
  toggleEcommerce() { this.ecommerceEnabled = !this.ecommerceEnabled; this.saveToStorage(); }
  toggleContactless() { this.contactlessEnabled = !this.contactlessEnabled; this.saveToStorage(); }
  requestLimitIncrease() { this.dailyLimit += 5000; this.saveToStorage(); }

  requestCreditLimitIncrease(requestedLimit: number): Observable<{success: boolean, message: string}> {
    const card = this.getActiveCard();
    if (!card) {
      return of({ success: false, message: 'Limit artırım talebi için önce kredi kartı seçmelisiniz.' });
    }

    if (!requestedLimit || requestedLimit <= card.limit) {
      return of({ success: false, message: 'Talep edilen limit mevcut limitten yüksek olmalıdır.' });
    }

    return this.http.post<any>(`${this.apiUrl}/Atm/card-settings/request-credit-limit-increase`, {
      requestedLimit,
      reason: 'Müşteri limit artış talebi'
    }).pipe(
      map(res => {
        this.loadAccountsAfterLogin();
        return { success: true, message: res.message || 'Limit artırım talebiniz alındı.' };
      }),
      catchError(err => {
        const msg = this.getErrorMessage(err, 'Limit artırım talebi gönderilemedi.');
        return of({ success: false, message: msg });
      })
    );
  }
}
