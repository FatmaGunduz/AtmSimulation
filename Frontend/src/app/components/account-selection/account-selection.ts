import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AtmService } from '../../services/atm.service';

@Component({
  selector: 'app-account-selection',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="atm-screen-content">
      <div class="screen-header">
        <h1>HOŞ GELDİNİZ, {{ (atmService.customerName$ | async) }}</h1>
        <p *ngIf="selectedMode === 'select'">Lütfen yapmak istediğiniz işlem türünü seçiniz</p>
        <p *ngIf="selectedMode === 'debit'">Lütfen işlem yapmak istediğiniz banka hesabını seçiniz</p>
        <p *ngIf="selectedMode === 'credit'">Lütfen işlem yapmak istediğiniz kredi kartını seçiniz</p>
      </div>

      <!-- KART TİPİ SEÇİM EKRANI -->
      <div class="mode-selector-container" *ngIf="selectedMode === 'select'">
        <button class="mode-btn debit-btn" (click)="setMode('debit')">
          <span class="mode-icon">🏧</span>
          <div class="mode-text">
            <span class="mode-title">BANKA KARTI İŞLEMLERİ</span>
            <span class="mode-desc">Vadesiz/Vadeli hesaplarınızdan para yatırma, çekme ve transfer</span>
          </div>
        </button>

        <button class="mode-btn credit-btn" (click)="setMode('credit')">
          <span class="mode-icon">💳</span>
          <div class="mode-text">
            <span class="mode-title">KREDİ KARTI İŞLEMLERİ</span>
            <span class="mode-desc">Kredi kartı limit sorgulama, borç ödeme ve taksit işlemleri</span>
          </div>
        </button>
      </div>

      <!-- SEÇİLEN KART TİPİNE GÖRE LİSTE EKRANI -->
      <div class="selection-container" *ngIf="selectedMode !== 'select'">
        
        <!-- BANKA HESAPLARI BÖLÜMÜ -->
        <section class="selection-section" *ngIf="selectedMode === 'debit'">
          <h2 class="section-title">HESAPLARIM</h2>
          <div class="list">
            <div *ngFor="let acc of (atmService.accounts$ | async)" 
                 class="card-item account" (click)="selectAccount(acc.name)">
              <div class="info">
                <span class="name">{{ acc.name }}</span>
                <span class="sub">{{ acc.accNo }}</span>
              </div>
              <div class="balance">₺{{ acc.balance | number:'1.2-2' }}</div>
            </div>
          </div>
        </section>

        <!-- KREDİ KARTLARI BÖLÜMÜ -->
        <section class="selection-section" *ngIf="selectedMode === 'credit'">
          <h2 class="section-title">KREDİ KARTLARIM</h2>
          <div class="list">
            <div *ngFor="let card of (atmService.cards$ | async)" 
                 class="card-item credit-card" (click)="selectCard(card.name)">
              <div class="info">
                <span class="name">{{ card.name }}</span>
                <span class="sub">{{ card.cardNumber }}</span>
              </div>
              <div class="balance-info">
                <span class="label">Kullanılabilir:</span>
                <span class="value">₺{{ card.availableLimit | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- MOD SEÇİMİNE GERİ DÖN -->
        <button class="back-to-select-btn" (click)="setMode('select')">
          ↩️ BAŞKA KART TİPİYLE İŞLEM YAP
        </button>
      </div>

      <div class="screen-footer-selection">
        <button class="action-btn-selection pin-btn" (click)="goToChangePin()">
          <span class="icon">🔑</span> ŞİFRE İŞLEMLERİ
        </button>
        <button class="action-btn-selection logout-btn" (click)="logout()">
          <span class="icon">💳</span> KART İADE
        </button>
      </div>
    </div>
  `,
  styles: [`
    .atm-screen-content {
      height: 600px; background: #001f3f; color: #fff; display: flex; flex-direction: column;
      padding: 2rem; font-family: 'Courier New', Courier, monospace; text-transform: uppercase;
    }
    .screen-header { text-align: center; margin-bottom: 1.5rem; border-bottom: 2px solid #f1c40f; padding-bottom: 0.8rem; }
    .screen-header h1 { font-size: 1.8rem; color: #f1c40f; margin: 0; }
    .screen-header p { font-size: 0.8rem; color: #888; }

    .mode-selector-container {
      display: flex; flex-direction: column; gap: 1.2rem; flex: 1; justify-content: center;
    }
    .mode-btn {
      background: rgba(26, 37, 47, 0.85); border: 2px solid #34495e; padding: 1.2rem;
      border-radius: 14px; cursor: pointer; display: flex; align-items: center; text-align: left;
      transition: 0.3s; gap: 1.2rem; text-transform: uppercase; width: 100%;
    }
    .mode-btn:hover {
      border-color: #f1c40f; background: #2c3e50; transform: scale(1.02);
      box-shadow: 0 0 15px rgba(241, 196, 15, 0.15);
    }
    .mode-icon { font-size: 2.2rem; }
    .mode-text { display: flex; flex-direction: column; }
    .mode-title { font-size: 1.1rem; font-weight: 900; color: #f1c40f; display: block; }
    .mode-desc { font-size: 0.65rem; color: #bbb; display: block; margin-top: 4px; font-family: sans-serif; text-transform: none; }

    .back-to-select-btn {
      width: 100%; padding: 0.8rem; background: none; border: 2px dashed #f1c40f;
      color: #f1c40f; font-family: inherit; font-size: 0.8rem; font-weight: bold;
      border-radius: 8px; cursor: pointer; transition: 0.3s; margin-top: 0.5rem;
    }
    .back-to-select-btn:hover {
      background: rgba(241, 196, 15, 0.1); transform: scale(1.01);
    }

    .selection-container { flex: 1; display: flex; flex-direction: column; gap: 1.5rem; overflow-y: auto; padding-right: 5px; }
    
    .section-title { font-size: 0.9rem; color: #f1c40f; margin-bottom: 0.8rem; border-left: 4px solid #f1c40f; padding-left: 10px; }

    .card-item {
      background: #1a252f; border: 1px solid #34495e; padding: 1.2rem; border-radius: 12px;
      display: flex; justify-content: space-between; align-items: center; cursor: pointer;
      transition: 0.3s; margin-bottom: 0.8rem;
    }
    .card-item:hover { border-color: #f1c40f; transform: scale(1.02); background: #2c3e50; }
    
    .account { border-left: 5px solid #2ecc71; }
    .credit-card { border-left: 5px solid #3498db; }

    .info { display: flex; flex-direction: column; gap: 0.3rem; }
    .name { font-size: 1.1rem; font-weight: 900; }
    .sub { font-size: 0.7rem; color: #888; }
    
    .balance { font-size: 1.4rem; font-weight: 900; color: #2ecc71; }
    .balance-info { text-align: right; }
    .balance-info .label { font-size: 0.6rem; color: #888; display: block; }
    .balance-info .value { font-size: 1.2rem; font-weight: 900; color: #3498db; }

    .screen-footer-selection { display: flex; justify-content: space-between; gap: 2rem; margin-top: 1rem; }
    .action-btn-selection {
      flex: 1; padding: 1rem; border: none; border-radius: 10px; font-weight: 900;
      cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 0.8rem;
    }
    .pin-btn { background: #34495e; color: #f1c40f; border: 2px solid #f1c40f; }
    .logout-btn { background: #e74c3c; color: #fff; }
  `]
})
export class AccountSelectionComponent implements OnInit {
  selectedMode: 'select' | 'debit' | 'credit' = 'select';

  constructor(public atmService: AtmService, private router: Router) {}

  ngOnInit() {
    this.selectedMode = 'select';
  }

  setMode(mode: 'select' | 'debit' | 'credit') {
    this.selectedMode = mode;
  }

  selectAccount(name: string) {
    this.atmService.setActiveAccount(name);
    this.router.navigate(['/account-actions'], { queryParams: { name, type: 'debit' } });
  }

  selectCard(name: string) {
    this.atmService.setActiveCard(name);
    this.router.navigate(['/account-actions'], { queryParams: { name, type: 'credit' } });
  }

  goToChangePin() { this.router.navigate(['/change-pin']); }
  logout() { this.router.navigate(['/login']); }
}
