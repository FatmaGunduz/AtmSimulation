import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AtmService, CreditCard } from '../../services/atm.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-limit-inquiry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="atm-screen-content">
      <div class="screen-header">
        <h1>KREDİ KARTI LİMİT AYARLARI</h1>
        <p>Kredi kartı limit artırım talebinizi admin onayına gönderebilirsiniz</p>
      </div>

      <div class="limit-dashboard">
        <div class="info-card credit-limit" *ngIf="activeCard">
          <div class="limit-labels">
            <span class="label">KREDİ KARTI LİMİTİ</span>
            <span class="value">₺{{ activeCard.limit | number:'1.2-2' }}</span>
          </div>
          <div class="limit-sub-labels">
            <span>Kullanılabilir: ₺{{ activeCard.availableLimit | number:'1.2-2' }}</span>
            <span>Borç: ₺{{ activeCard.debt | number:'1.2-2' }}</span>
          </div>
          <div class="request-box">
            <label>Talep Edilen Yeni Limit</label>
            <input type="number" min="1" step="500" [(ngModel)]="requestedCreditLimit" placeholder="Örn: 75000">
          </div>
          <button class="increase-btn" (click)="requestCreditIncrease()">LİMİT ARTIRIM TALEBİ GÖNDER</button>
        </div>

        <div class="info-card warning" *ngIf="!activeCard">
          <span class="label">KREDİ KARTI SEÇİLMEDİ</span>
          <p>Limit artırımı sadece kredi kartı işlemlerindeki Kart Ayarları ekranından talep edilebilir.</p>
        </div>
      </div>

      <div class="screen-footer">
        <button class="back-btn-alt" (click)="goBack()">◀ GERİ DÖN</button>
      </div>
    </div>
  `,
  styles: [`
    .atm-screen-content {
      height: 600px; background: #001f3f; color: #fff; display: flex; flex-direction: column;
      padding: 2rem; font-family: 'Courier New', Courier, monospace; text-transform: uppercase;
    }
    .screen-header { text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 1rem; margin-bottom: 1rem; }
    .screen-header h1 { color: #3498db; font-size: 1.8rem; margin: 0; }
    .screen-header p { color: #9ca3af; font-size: 0.8rem; }
    .limit-dashboard { flex: 1; display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; padding-right: 0.2rem; }
    .info-card { background: #1a252f; border: 2px solid #3498db; padding: 1rem; border-radius: 12px; }
    .credit-limit { border-color: #2ecc71; }
    .warning { border-color: #f39c12; }
    .warning p { color: #bbb; margin: 0.7rem 0 0; font-size: 0.78rem; line-height: 1.4; }
    .limit-labels { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; gap: 1rem; }
    .label { color: #888; font-size: 0.82rem; font-weight: 900; }
    .value { font-size: 1.4rem; font-weight: 900; color: #2ecc71; white-space: nowrap; }
    .limit-sub-labels { display: flex; justify-content: space-between; font-size: 0.76rem; color: #9ca3af; gap: 1rem; }
    .request-box { display: flex; flex-direction: column; gap: 0.4rem; margin: 1rem 0; }
    .request-box label { color: #888; font-size: 0.75rem; font-weight: 900; }
    .request-box input {
      background: #000; color: #fff; border: 1px solid #2ecc71; border-radius: 8px;
      padding: 0.8rem 1rem; font-family: inherit; font-size: 1rem; font-weight: 900;
    }
    .increase-btn {
      width: 100%; background: #2ecc71; color: #000; border: none; padding: 1rem; border-radius: 10px;
      font-weight: 900; font-size: 0.95rem; cursor: pointer; transition: 0.3s;
    }
    .increase-btn:hover { background: #fff; transform: translateY(-2px); }
    .back-btn-alt {
      width: 100%; background: none; border: 1px solid #888; color: #888; padding: 1rem;
      font-weight: 900; border-radius: 10px; cursor: pointer; margin-top: 1rem;
    }
    .back-btn-alt:hover { border-color: #fff; color: #fff; }
  `]
})
export class LimitInquiryComponent implements OnInit {
  limits: any = {};
  activeCard: CreditCard | undefined;
  requestedCreditLimit: number | null = null;

  constructor(
    private atmService: AtmService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.limits = this.atmService.getLimits();
    this.activeCard = this.atmService.getActiveCard();
    if (this.activeCard && !this.requestedCreditLimit) {
      this.requestedCreditLimit = this.activeCard.limit + 5000;
    }
  }

  toggleEcommerce() {
    this.atmService.toggleEcommerce();
    this.refreshData();
    this.notificationService.show('E-Ticaret yetkisi güncellendi', 'success');
  }

  toggleContactless() {
    this.atmService.toggleContactless();
    this.refreshData();
    this.notificationService.show('Temassız işlem yetkisi güncellendi', 'success');
  }

  requestCreditIncrease() {
    this.atmService.requestCreditLimitIncrease(Number(this.requestedCreditLimit)).subscribe({
      next: (result) => {
        this.refreshData();
        this.notificationService.show(result.message, result.success ? 'success' : 'error');
      },
      error: () => {
        this.notificationService.show('Limit artırım talebi gönderilirken hata oluştu.', 'error');
      }
    });
  }

  goBack() {
    window.history.back();
  }
}
