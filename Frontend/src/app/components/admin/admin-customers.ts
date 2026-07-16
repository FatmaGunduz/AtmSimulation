import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, CustomerMock, AccountMock, CardMock, CreditLimitIncreaseRequest } from '../../services/admin.service';

type ModalMode = 'none' | 'detail' | 'addCustomer' | 'addAccount' | 'addCard';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-content">
      <div class="header-row">
        <h1 class="page-title">Müşteri Portföyü</h1>
        <button class="add-btn" (click)="openAddCustomerModal()">➕ Yeni Müşteri Ekle</button>
      </div>

      <div class="requests-panel" *ngIf="pendingLimitRequests.length > 0">
        <div class="requests-header">
          <h2>Kredi Limit Artırım Talepleri</h2>
          <span>{{ pendingLimitRequests.length }} bekleyen talep</span>
        </div>
        <div class="request-list">
          <div class="request-card" *ngFor="let request of pendingLimitRequests">
            <div>
              <strong>{{ request.customerName }}</strong>
              <div class="request-meta">{{ request.cardNumber }} | Mevcut: ₺{{ request.currentLimit | number:'1.2-2' }}</div>
            </div>
            <div class="request-amount">₺{{ request.requestedLimit | number:'1.2-2' }}</div>
            <div class="request-actions">
              <button class="approve-btn" (click)="approveLimitRequest(request.id)">Onayla</button>
              <button class="reject-btn" (click)="rejectLimitRequest(request.id)">Reddet</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Ana Tablo -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Müşteri ID</th>
              <th>Ad Soyad</th>
              <th>TC Kimlik No</th>
              <th>Durum</th>
              <th>Hesaplar</th>
              <th>Kartlar</th>
              <th>Aksiyonlar</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let cust of customers" [class.blocked-row]="cust.status === 'BLOCKED'">
              <td class="font-mono">{{ cust.id }}</td>
              <td class="font-bold">{{ cust.name }}</td>
              <td>{{ maskTc(cust.tc) }}</td>
              <td>
                <span class="status-badge" [ngClass]="cust.status.toLowerCase()">
                  {{ cust.status === 'ACTIVE' ? 'AKTİF' : 'BLOKE' }}
                </span>
              </td>
              <td><span class="badge accounts">{{ cust.totalAccounts }} Hesap</span></td>
              <td><span class="badge cards">{{ cust.totalCards }} Kart</span></td>
              <td class="actions-cell">
                <button class="action-btn inspect-btn" (click)="openDetails(cust)">🔍 İncele</button>
                <button class="action-btn block-btn" 
                        [ngClass]="cust.status === 'ACTIVE' ? 'block' : 'unblock'"
                        (click)="toggleStatus(cust.id)">
                  {{ cust.status === 'ACTIVE' ? '🚫 Bloke' : '🔓 Bloke Kaldır' }}
                </button>
                <button class="action-btn delete-btn" (click)="deleteCustomer(cust.id)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ══════════════════════════════════════════════ -->
      <!-- MODAL: YENİ MÜŞTERİ EKLE -->
      <!-- ══════════════════════════════════════════════ -->
      <div class="modal-overlay" *ngIf="modalMode === 'addCustomer'" (click)="closeModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Yeni Müşteri Kaydı Oluştur</h2>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group full">
                <label>Ad Soyad</label>
                <input type="text" [(ngModel)]="newCust.name" placeholder="Örn: Ahmet Yılmaz">
              </div>
              <div class="form-group">
                <label>TC Kimlik No</label>
                <input type="text" [(ngModel)]="newCust.tc" 
                       (input)="filterOnlyDigits($event, 'tc')"
                       maxlength="11" placeholder="12345678901"
                       [class.input-ok]="newCust.tc.length === 11"
                       [class.input-err]="newCust.tc.length > 0 && newCust.tc.length < 11">
                <span class="field-hint" [class.ok]="newCust.tc.length === 11">
                  {{ newCust.tc.length }}/11 hane
                </span>
              </div>
              <div class="form-group">
                <label>Durum</label>
                <select [(ngModel)]="newCust.status">
                  <option value="ACTIVE">AKTİF</option>
                  <option value="BLOCKED">BLOKE</option>
                </select>
              </div>
            </div>
            <div class="error-msg" *ngIf="formError">{{ formError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeModal()">İptal</button>
            <button class="btn-save" (click)="saveNewCustomer()">Müşteriyi Kaydet</button>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════ -->
      <!-- MODAL: MÜŞTERİ DETAY + HESAP/KART YÖNETİMİ  -->
      <!-- ══════════════════════════════════════════════ -->
      <div class="modal-overlay" *ngIf="modalMode === 'detail' && selectedCustomer" (click)="closeModal()">
        <div class="modal-card wide" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2>{{ selectedCustomer.name }}</h2>
              <p>{{ selectedCustomer.id }} | TC: {{ maskTc(selectedCustomer.tc) }} |
                <span [class.text-red]="selectedCustomer.status === 'BLOCKED'">{{ selectedCustomer.status }}</span>
              </p>
            </div>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>

          <div class="modal-body">
            <div class="split-view">

              <!-- HESAPLAR -->
              <div class="split-pane">
                <div class="pane-header">
                  <h3 class="pane-title">Banka Hesapları ({{ selectedCustomer.accounts.length }})</h3>
                  <button class="mini-add-btn" (click)="openAddAccountModal()">+ Hesap Ekle</button>
                </div>
                <div class="empty-state" *ngIf="selectedCustomer.accounts.length === 0">Kayıtlı hesap yok.</div>

                <div class="detail-card" *ngFor="let acc of selectedCustomer.accounts">
                  <div class="card-top">
                    <span class="acc-type">{{ acc.type }}</span>
                    <span class="acc-currency">{{ acc.currency }}</span>
                    <button class="mini-delete-btn" (click)="removeAccount(acc.iban)">✕</button>
                  </div>
                  <div class="card-iban">{{ acc.iban }}</div>
                  <div class="card-balance">{{ acc.currency === 'TRY' ? '₺' : acc.currency + ' ' }}{{ acc.balance | number:'1.2-2' }}</div>
                </div>
              </div>

              <!-- KARTLAR -->
              <div class="split-pane">
                <div class="pane-header">
                  <h3 class="pane-title">Kartlar ({{ selectedCustomer.cards.length }})</h3>
                  <button class="mini-add-btn" (click)="openAddCardModal()">+ Kart Ekle</button>
                </div>
                <div class="empty-state" *ngIf="selectedCustomer.cards.length === 0">Kayıtlı kart yok.</div>

                <div class="detail-card" *ngFor="let card of selectedCustomer.cards" [class.blocked-row]="card.isBlocked">
                  <div class="card-top">
                    <span class="acc-type card">{{ card.type }}</span>
                    <span class="status-badge blocked" *ngIf="card.isBlocked" style="margin-left: 0.5rem; padding: 0.1rem 0.4rem; font-size: 0.65rem;">BLOKE</span>
                    <button class="mini-delete-btn" (click)="removeCard(card.cardNumber)">✕</button>
                  </div>
                  <div class="card-iban">{{ card.cardNumber }}</div>
                  <div class="card-stats" *ngIf="card.type === 'Kredi Kartı'">
                    <div class="stat"><small>Limit</small> ₺{{ card.limit | number:'1.2-2' }}</div>
                    <div class="stat text-red"><small>Borç</small> ₺{{ card.debt | number:'1.2-2' }}</div>
                  </div>
                  <div class="card-stats" *ngIf="card.type === 'Banka Kartı'">
                    <div class="stat"><small>Bakiye</small> ₺{{ card.balance | number:'1.2-2' }}</div>
                  </div>
                  <div class="card-top" *ngIf="card.isBlocked" style="margin-top: 0.5rem; border-top: 1px dashed #fee2e2; padding-top: 0.5rem; justify-content: flex-start;">
                    <button class="action-btn block-btn unblock" style="padding: 0.2rem 0.5rem; font-size: 0.65rem;" (click)="unblockSpecificCard(card.id)">✅ Blokeyi Kaldır</button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════ -->
      <!-- MODAL: YENİ HESAP EKLE                       -->
      <!-- ══════════════════════════════════════════════ -->
      <div class="modal-overlay" *ngIf="modalMode === 'addAccount'" (click)="closeModal()">
        <div class="modal-card small" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Hesap Ekle — {{ selectedCustomer?.name }}</h2>
            <button class="close-btn" (click)="backToDetail()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group full">
                <label>IBAN</label>
                <input type="text" [(ngModel)]="newAcc.iban"
                       (input)="formatIban($event)"
                       maxlength="32"
                       placeholder="TR00 0000 0000 0000 0000 0000 00"
                       [class.input-ok]="ibanDigitCount(newAcc.iban) === 24"
                       [class.input-err]="ibanDigitCount(newAcc.iban) > 0 && ibanDigitCount(newAcc.iban) < 24">
                <span class="field-hint" [class.ok]="ibanDigitCount(newAcc.iban) === 24">
                  TR + {{ ibanDigitCount(newAcc.iban) }}/24 rakam &mdash; Türk IBAN 26 karakter
                </span>
              </div>
              <div class="form-group">
                <label>Hesap Türü</label>
                <select [(ngModel)]="newAcc.type">
                  <option>Vadesiz TL</option>
                  <option>Vadeli TL</option>
                  <option>Dolar Hesabı</option>
                  <option>Euro Hesabı</option>
                </select>
              </div>
              <div class="form-group">
                <label>Döviz Cinsi</label>
                <select [(ngModel)]="newAcc.currency">
                  <option>TRY</option>
                  <option>USD</option>
                  <option>EUR</option>
                </select>
              </div>
              <div class="form-group full">
                <label>Başlangıç Bakiyesi (₺)</label>
                <input type="number" [(ngModel)]="newAcc.balance" placeholder="0.00">
              </div>
            </div>
            <div class="error-msg" *ngIf="formError">{{ formError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="backToDetail()">Geri</button>
            <button class="btn-save" (click)="saveNewAccount()">Hesabı Ekle</button>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════ -->
      <!-- MODAL: YENİ KART EKLE                        -->
      <!-- ══════════════════════════════════════════════ -->
      <div class="modal-overlay" *ngIf="modalMode === 'addCard'" (click)="closeModal()">
        <div class="modal-card small" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Kart Ekle — {{ selectedCustomer?.name }}</h2>
            <button class="close-btn" (click)="backToDetail()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group full">
                <label>Kart Numarası</label>
                <input type="text" [(ngModel)]="newCard.cardNumber"
                       (input)="formatCardNumber($event)"
                       maxlength="19"
                       placeholder="0000 0000 0000 0000"
                       [class.input-ok]="cardDigitCount(newCard.cardNumber || '') === 16"
                       [class.input-err]="cardDigitCount(newCard.cardNumber || '') > 0 && cardDigitCount(newCard.cardNumber || '') < 16">
                <span class="field-hint" [class.ok]="cardDigitCount(newCard.cardNumber || '') === 16">
                  {{ cardDigitCount(newCard.cardNumber || '') }}/16 rakam — Son 4 hane görünür, ortadaki '*' ile maskelenebilir
                </span>
              </div>
              <div class="form-group full">
                <label>Kart Türü</label>
                <select [(ngModel)]="newCard.type" (change)="onCardTypeChange()">
                  <option>Kredi Kartı</option>
                  <option>Banka Kartı</option>
                </select>
              </div>
              <ng-container *ngIf="newCard.type === 'Kredi Kartı'">
                <div class="form-group">
                  <label>Limit (₺)</label>
                  <input type="number" [(ngModel)]="newCard.limit" placeholder="50000">
                </div>
                <div class="form-group">
                  <label>Başlangıç Borç (₺)</label>
                  <input type="number" [(ngModel)]="newCard.debt" placeholder="0">
                </div>
              </ng-container>
              <ng-container *ngIf="newCard.type === 'Banka Kartı'">
                <div class="form-group full">
                  <label>Bağlı Bakiye (₺)</label>
                  <input type="number" [(ngModel)]="newCard.balance" placeholder="0">
                </div>
              </ng-container>
            </div>
            <div class="error-msg" *ngIf="formError">{{ formError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="backToDetail()">Geri</button>
            <button class="btn-save" (click)="saveNewCard()">Kartı Ekle</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page-content { display: flex; flex-direction: column; gap: 1.5rem; }
    .header-row { display: flex; justify-content: space-between; align-items: center; }
    .page-title { color: #fff; font-size: 1.8rem; font-weight: 700; margin: 0; }
    .add-btn { 
      background: linear-gradient(135deg, #0284c7, #6366f1); 
      color: #fff; 
      border: none; 
      padding: 0.7rem 1.4rem; 
      border-radius: 8px; 
      cursor: pointer; 
      font-weight: bold; 
      font-size: 0.95rem; 
      transition: all 0.2s; 
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }
    .add-btn:hover { 
      background: linear-gradient(135deg, #0ea5e9, #4f46e5); 
      transform: translateY(-1px); 
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
    }
    .requests-panel { 
      background: #202f46; 
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 16px; 
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 10px 30px rgba(0,0,0,0.3); 
      overflow: hidden; 
      color: #fff;
    }
    .requests-header { 
      display: flex; 
      align-items: center; 
      justify-content: space-between; 
      padding: 1.1rem 1.5rem; 
      background: rgba(15, 23, 42, 0.6); 
      border-bottom: 1px solid rgba(255, 255, 255, 0.08); 
    }
    .requests-header h2 { margin: 0; color: #38bdf8; font-size: 1.05rem; }
    .requests-header span { color: #cbd5e1; font-weight: 700; font-size: 0.82rem; }
    .request-list { display: flex; flex-direction: column; }
    .request-card { display: grid; grid-template-columns: 1.5fr auto auto; align-items: center; gap: 1rem; padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
    .request-card:last-child { border-bottom: none; }
    .request-meta { margin-top: 0.3rem; color: #94a3b8; font-size: 0.8rem; font-family: monospace; }
    .request-amount { color: #34d399; font-size: 1.1rem; font-weight: 800; }
    .request-actions { display: flex; gap: 0.5rem; }
    .approve-btn, .reject-btn { border: none; border-radius: 8px; padding: 0.45rem 0.8rem; color: #fff; font-weight: 700; cursor: pointer; transition: all 0.2s; }
    .approve-btn { background: #10b981; }
    .approve-btn:hover { background: #059669; }
    .reject-btn { background: #ef4444; }
    .reject-btn:hover { background: #dc2626; }
 
    .table-container { 
      background: #202f46; 
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 16px; 
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 10px 30px rgba(0,0,0,0.3); 
      overflow: hidden; 
    }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; }
    .data-table th { 
      background: rgba(15, 23, 42, 0.6); 
      padding: 1rem 1.5rem; 
      color: #94a3b8; 
      font-weight: 600; 
      font-size: 0.85rem; 
      text-transform: uppercase; 
      border-bottom: 2px solid rgba(255, 255, 255, 0.08); 
    }
    .data-table td { padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.03); color: #cbd5e1; vertical-align: middle; }
    .blocked-row { opacity: 0.7; }
 
    .font-bold { font-weight: bold; }
    .font-mono { font-family: monospace; color: #94a3b8; font-size: 0.85rem; }
    .text-red { color: #f87171; font-weight: bold; }
 
    .status-badge { padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.75rem; font-weight: bold; }
    .status-badge.active { background: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.1); }
    .status-badge.blocked { background: rgba(248, 113, 113, 0.15); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.1); }
 
    .badge { padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: bold; }
    .badge.accounts { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
    .badge.cards { background: rgba(167, 139, 250, 0.15); color: #a78bfa; }
 
    .actions-cell { display: flex; gap: 0.4rem; }
    .action-btn { padding: 0.4rem 0.7rem; border: none; border-radius: 6px; cursor: pointer; font-size: 0.72rem; font-weight: bold; transition: all 0.2s; color: #fff; }
    .inspect-btn { background: #3b82f6; }
    .inspect-btn:hover { background: #2563eb; }
    .block-btn.block { background: #ef4444; }
    .block-btn.block:hover { background: #dc2626; }
    .block-btn.unblock { background: #10b981; }
    .block-btn.unblock:hover { background: #059669; }
    .delete-btn { background: rgba(255, 255, 255, 0.08); color: #cbd5e1; border: 1px solid rgba(255, 255, 255, 0.05); }
    .delete-btn:hover { background: rgba(255, 255, 255, 0.15); color: #fff; }
 
    /* ───── MODAL BASE ───── */
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.7); z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn 0.2s ease-out;
      backdrop-filter: blur(4px);
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
 
    .modal-card {
      background: #202f46; width: 100%; max-width: 500px; max-height: 90vh; border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); display: flex; flex-direction: column; overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #fff;
    }
    .modal-card.wide { max-width: 860px; }
    .modal-card.small { max-width: 450px; }
 
    .modal-header { padding: 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05); background: rgba(15, 23, 42, 0.4); display: flex; justify-content: space-between; align-items: flex-start; }
    .modal-header h2 { margin: 0; font-size: 1.3rem; color: #fff; }
    .modal-header p { margin: 0; font-size: 0.85rem; color: #94a3b8; margin-top: 4px; }
    .close-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #64748b; margin-left: 1rem; transition: color 0.2s; }
    .close-btn:hover { color: #fff; }
 
    .modal-body { padding: 1.5rem; overflow-y: auto; }
    .modal-footer { padding: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.05); display: flex; justify-content: flex-end; gap: 1rem; background: rgba(15, 23, 42, 0.4); }
    .modal-footer button { padding: 0.8rem 1.5rem; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.2s; }
    .btn-cancel { background: rgba(255, 255, 255, 0.08); color: #cbd5e1; }
    .btn-cancel:hover { background: rgba(255, 255, 255, 0.15); }
    .btn-save { background: linear-gradient(135deg, #0284c7, #6366f1); color: #fff; }
    .btn-save:hover { background: linear-gradient(135deg, #0ea5e9, #4f46e5); box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4); }
 
    /* ───── FORMS ───── */
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .form-group.full { grid-column: 1 / -1; }
    .form-group label { font-size: 0.8rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .form-group input, .form-group select {
      padding: 0.75rem 1rem; background: rgba(15, 23, 42, 0.6); border: 2px solid rgba(255, 255, 255, 0.1); border-radius: 8px; font-size: 0.95rem; outline: none; transition: 0.2s; color: #fff;
    }
    .form-group input:focus, .form-group select:focus { border-color: #38bdf8; background: rgba(15, 23, 42, 0.85); box-shadow: 0 0 15px rgba(56, 189, 248, 0.2); }
    .form-group input.input-ok { border-color: #10b981; }
    .form-group input.input-err { border-color: #f59e0b; }
    .field-hint { font-size: 0.75rem; color: #64748b; margin-top: 2px; }
    .field-hint.ok { color: #34d399; font-weight: 600; }
    .error-msg { margin-top: 1rem; color: #f87171; font-weight: bold; font-size: 0.9rem; }
 
    /* ───── DETAIL PANES ───── */
    .split-view { display: flex; gap: 2rem; }
    .split-pane { flex: 1; display: flex; flex-direction: column; gap: 1rem; }
    .pane-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.5rem; border-bottom: 2px solid rgba(255, 255, 255, 0.08); }
    .pane-title { margin: 0; color: #fff; font-size: 1.1rem; }
    .mini-add-btn { background: rgba(255, 255, 255, 0.08); color: #cbd5e1; border: 1px solid rgba(255, 255, 255, 0.05); padding: 0.3rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.78rem; font-weight: bold; transition: all 0.2s; }
    .mini-add-btn:hover { background: rgba(255, 255, 255, 0.15); color: #fff; }
    .empty-state { color: #64748b; font-style: italic; padding: 1rem 0; }
 
    .detail-card { background: rgba(15, 23, 42, 0.3); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 1rem; position: relative; }
    .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .acc-type { background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }
    .acc-type.card { background: rgba(167, 139, 250, 0.15); color: #a78bfa; }
    .acc-currency { font-weight: bold; color: #94a3b8; font-size: 0.8rem; }
    .mini-delete-btn { background: none; border: none; cursor: pointer; color: #64748b; font-size: 1rem; transition: color 0.2s; }
    .mini-delete-btn:hover { color: #ef4444; }
    .card-balance { font-size: 1.2rem; font-weight: 900; color: #10b981; }
    .card-stats { display: flex; gap: 1.5rem; border-top: 1px dashed #e2e8f0; padding-top: 0.7rem; margin-top: 0.5rem; }
    .stat { display: flex; flex-direction: column; font-weight: bold; color: #334155; font-size: 1rem; }
    .stat small { font-size: 0.65rem; color: #94a3b8; text-transform: uppercase; font-weight: 600; }
  `]
})
export class CustomerManagementComponent implements OnInit {
  customers: CustomerMock[] = [];
  pendingLimitRequests: CreditLimitIncreaseRequest[] = [];
  
  modalMode: ModalMode = 'none';
  selectedCustomer: CustomerMock | null = null;
  formError = '';

  // Yeni müşteri formu
  newCust = { name: '', tc: '', status: 'ACTIVE' as 'ACTIVE' | 'BLOCKED' };

  // Yeni hesap formu
  newAcc: AccountMock = { iban: '', type: 'Vadesiz TL', balance: 0, currency: 'TRY' };

  // Yeni kart formu
  newCard: Partial<CardMock> = { cardNumber: '', type: 'Kredi Kartı', limit: 0, debt: 0 };

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.customers$.subscribe(data => {
      this.customers = data;
      // Seçili müşteri varsa güncel halini senkronize et
      if (this.selectedCustomer) {
        this.selectedCustomer = data.find(c => c.id === this.selectedCustomer!.id) || null;
        if (!this.selectedCustomer) this.modalMode = 'none';
      }
    });
    this.adminService.creditLimitRequests$.subscribe(data => {
      this.pendingLimitRequests = data.filter(r => r.status === 'PENDING');
    });
  }

  maskTc(tc: string) {
    return tc.substring(0, 3) + '*****' + tc.substring(8);
  }

  toggleStatus(id: string) { this.adminService.toggleCustomerStatus(id); }
  approveLimitRequest(id: string) { this.adminService.approveCreditLimitRequest(id); }
  rejectLimitRequest(id: string) { this.adminService.rejectCreditLimitRequest(id); }
  deleteCustomer(id: string) {
    if (confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) {
      this.adminService.deleteCustomer(id);
      if (this.selectedCustomer?.id === id) this.closeModal();
    }
  }

  // ── Modal Yönetimi ──
  closeModal() { this.modalMode = 'none'; this.selectedCustomer = null; this.formError = ''; }
  backToDetail() { this.formError = ''; this.modalMode = 'detail'; }

  openDetails(cust: CustomerMock) {
    this.selectedCustomer = cust;
    this.modalMode = 'detail';
  }

  openAddCustomerModal() {
    this.newCust = { name: '', tc: '', status: 'ACTIVE' };
    this.formError = '';
    this.modalMode = 'addCustomer';
  }

  openAddAccountModal() {
    this.newAcc = { iban: '', type: 'Vadesiz TL', balance: 0, currency: 'TRY' };
    this.formError = '';
    this.modalMode = 'addAccount';
  }

  openAddCardModal() {
    this.newCard = { cardNumber: '', type: 'Kredi Kartı', limit: 0, debt: 0 };
    this.formError = '';
    this.modalMode = 'addCard';
  }

  onCardTypeChange() {
    if (this.newCard.type === 'Banka Kartı') {
      this.newCard = { ...this.newCard, limit: undefined, debt: undefined, balance: 0 };
    } else {
      this.newCard = { ...this.newCard, balance: undefined, limit: 0, debt: 0 };
    }
  }

  // ── Kayıt İşlemleri ──
  saveNewCustomer() {
    this.formError = '';
    if (!this.newCust.name.trim()) { this.formError = 'Ad Soyad zorunludur!'; return; }
    if (!/^\d{11}$/.test(this.newCust.tc)) { this.formError = 'TC Kimlik No tam 11 rakam olmalıdır!'; return; }

    this.adminService.addCustomer({
      name: this.newCust.name.trim(),
      tc: this.newCust.tc,
      status: this.newCust.status,
      totalAccounts: 0,
      totalCards: 0,
      accounts: [],
      cards: []
    });
    this.closeModal();
  }

  saveNewAccount() {
    this.formError = '';
    const digitsOnly = this.ibanDigitCount(this.newAcc.iban);
    if (!this.newAcc.iban.trim()) { this.formError = 'IBAN zorunludur!'; return; }
    if (!this.newAcc.iban.toUpperCase().startsWith('TR')) { this.formError = 'IBAN TR ile başlamalıdır!'; return; }
    if (digitsOnly !== 24) { this.formError = `IBAN hatalı! TR + 24 rakam gerekiyor. (Girilen: ${digitsOnly} rakam)`; return; }
    if (!this.selectedCustomer) return;

    this.adminService.addAccountToCustomer(this.selectedCustomer.id, { ...this.newAcc });
    this.backToDetail();
  }

  saveNewCard() {
    this.formError = '';
    const digits = this.cardDigitCount(this.newCard.cardNumber || '');
    if (!this.newCard.cardNumber?.trim()) { this.formError = 'Kart numarası zorunludur!'; return; }
    if (digits !== 16) { this.formError = `Kart numarası 16 rakam olmalıdır! (Girilen: ${digits})`; return; }
    if (!this.selectedCustomer) return;

    this.adminService.addCardToCustomer(this.selectedCustomer.id, this.newCard as CardMock);
    this.backToDetail();
  }

  removeAccount(iban: string) {
    if (!this.selectedCustomer) return;
    this.adminService.removeAccountFromCustomer(this.selectedCustomer.id, iban);
  }

  removeCard(cardNumber: string) {
    if (!this.selectedCustomer) return;
    this.adminService.removeCardFromCustomer(this.selectedCustomer.id, cardNumber);
  }

  unblockSpecificCard(cardId: number | undefined) {
    if (!cardId) return;
    this.adminService.unblockCard(cardId).subscribe({
      next: () => {
        alert('Kart blokesi başarıyla kaldırıldı.');
        this.adminService.refreshCustomers();
      },
      error: (err) => {
        console.error('Kart blokesi kaldırılırken hata:', err);
        alert('Kart blokesi kaldırılırken hata oluştu.');
      }
    });
  }

  // ── Input Formatlama Yardımcıları ──

  /** Sadece rakam ı tuta (TC için) */
  filterOnlyDigits(event: Event, field: 'tc') {
    const input = event.target as HTMLInputElement;
    const clean = input.value.replace(/\D/g, '').substring(0, 11);
    this.newCust.tc = clean;
    input.value = clean;
  }

  /** TR IBAN oto-format: TR + her 4 rakamda boşluk */
  formatIban(event: Event) {
    const input = event.target as HTMLInputElement;
    let raw = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    // TR öneki zorla
    if (!raw.startsWith('TR')) {
      raw = 'TR' + raw.replace(/^TR/i, '');
    }
    // TR + 24 rakam = 26 karakter
    const prefix = 'TR';
    const digits = raw.substring(2).replace(/\D/g, '').substring(0, 24);
    // 4'er gruba böl
    const groups: string[] = [];
    for (let i = 0; i < digits.length; i += 4) {
      groups.push(digits.substring(i, i + 4));
    }
    const formatted = prefix + (groups.length ? ' ' + groups.join(' ') : '');
    this.newAcc.iban = formatted;
    input.value = formatted;
  }

  /** IBAN içindeki rakam sayısı (TR harfleri hariç) */
  ibanDigitCount(iban: string): number {
    return (iban || '').replace(/\D/g, '').length;
  }

  /** Kart numarası 4'er gruba düşen format */
  formatCardNumber(event: Event) {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').substring(0, 16);
    const groups: string[] = [];
    for (let i = 0; i < digits.length; i += 4) {
      groups.push(digits.substring(i, i + 4));
    }
    const formatted = groups.join(' ');
    this.newCard.cardNumber = formatted;
    input.value = formatted;
  }

  /** Kart numarasındaki rakam sayısı */
  cardDigitCount(cardNumber: string): number {
    return (cardNumber || '').replace(/\D/g, '').length;
  }
}
