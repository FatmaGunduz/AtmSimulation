import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AtmService } from '../../services/atm.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-statement',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="paper-bg">
      <div class="statement-container">
        
        <div class="bank-header">
          <h2>BANKA KREDİ KARTI HESAP ÖZETİ</h2>
          <p>Kart Numarası: {{ cardMasked }}</p>
        </div>

        <div class="summary-section">
          <div class="summary-box">
            <span class="label">Son Ödeme Tarihi</span>
            <span class="value date-val">25 MAYIS 2026</span>
          </div>
          <div class="summary-box">
            <span class="label">Toplam Ekstre Borcu</span>
            <span class="value debt-val">₺{{ totalDebt | number:'1.2-2' }}</span>
          </div>
          <div class="summary-box">
            <span class="label">Asgari Ödeme Tutarı</span>
            <span class="value min-val">₺{{ minPayment | number:'1.2-2' }}</span>
          </div>
        </div>

        <div class="transactions-section">
          <h3>GEÇMİŞ AY HARCAMALARI (NİSAN 2026)</h3>
          <table class="statement-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Açıklama</th>
                <th class="right">Tutar</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of cardHistory">
                <td>{{ item.date | date:'dd.MM.yyyy HH:mm' }}</td>
                <td>{{ item.description }}</td>
                <td class="right" [ngStyle]="{'color': item.type === 'IN' ? '#27ae60' : '#c0392b'}">
                  {{ item.type === 'IN' ? '+' : '-' }}₺{{ item.amount | number:'1.2-2' }}
                </td>
              </tr>
              <tr *ngIf="cardHistory.length === 0">
                <td colspan="3" style="text-align: center; color: #888; padding: 2rem;">Henüz bir işleminiz bulunmamaktadır.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="footer-info">
          <p>* Bu ekstre bilgilendirme amaçlıdır. Dönem içi işlemleriniz hesap özetine henüz yansımamıştır.</p>
        </div>
      </div>

      <!-- YENİ ÖDEME SEÇENEKLERİ -->
      <div class="payment-actions">
        <button class="back-btn" (click)="goBack()">◀ GERİ DÖN</button>
        <button class="pay-btn min-pay" [disabled]="totalDebt === 0 || isLoading" (click)="payAmount(minPayment)">
          ASGARİ ÖDE (₺{{ minPayment | number:'1.2-2' }})
        </button>
        <button class="pay-btn full-pay" [disabled]="totalDebt === 0 || isLoading" (click)="payAmount(totalDebt)">
          TÜM BORCU ÖDE (₺{{ totalDebt | number:'1.2-2' }})
        </button>
      </div>
    </div>
  `,
  styles: [`
    .paper-bg {
      height: 600px;
      background: #f5f6fa;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem;
      font-family: 'Arial', sans-serif;
    }

    .statement-container {
      background: #fff;
      width: 90%;
      max-width: 700px;
      flex: 1;
      padding: 2rem;
      border-radius: 4px;
      box-shadow: 0 10px 20px rgba(0,0,0,0.1);
      border-top: 10px solid #2980b9;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      overflow-y: auto;
    }

    .bank-header {
      text-align: center;
      border-bottom: 2px solid #ecf0f1;
      padding-bottom: 1rem;
    }
    .bank-header h2 { color: #2c3e50; font-weight: 900; letter-spacing: 1px; margin: 0; }
    .bank-header p { color: #7f8c8d; font-size: 0.85rem; margin-top: 5px; }

    .summary-section {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }

    .summary-box {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      flex: 1;
      text-align: center;
      border: 1px solid #e0e0e0;
    }
    .summary-box .label {
      display: block;
      font-size: 0.75rem;
      color: #7f8c8d;
      text-transform: uppercase;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .summary-box .value {
      display: block;
      font-size: 1.3rem;
      font-weight: 900;
    }
    .date-val { color: #c0392b; }
    .debt-val { color: #2980b9; }
    .min-val { color: #27ae60; }

    .transactions-section h3 {
      font-size: 0.9rem;
      color: #34495e;
      border-bottom: 1px solid #bdc3c7;
      padding-bottom: 5px;
    }

    .statement-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 0.85rem;
    }
    .statement-table th {
      text-align: left;
      padding: 8px;
      color: #7f8c8d;
      border-bottom: 2px solid #ecf0f1;
    }
    .statement-table td {
      padding: 10px 8px;
      color: #2c3e50;
      border-bottom: 1px solid #f1f2f6;
    }
    .statement-table th.right, .statement-table td.right {
      text-align: right;
      font-weight: bold;
    }

    .footer-info {
      margin-top: auto;
      font-size: 0.75rem;
      color: #95a5a6;
      text-align: center;
      font-style: italic;
    }

    .payment-actions {
      width: 90%;
      max-width: 700px;
      display: flex;
      justify-content: space-between;
      margin-top: 1rem;
      gap: 10px;
    }

    .back-btn, .pay-btn {
      padding: 1rem 1.5rem;
      font-weight: 900;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-size: 0.9rem;
      transition: 0.3s;
      flex: 1;
    }
    .back-btn { background: #bdc3c7; color: #2c3e50; flex: 0.5; }
    .back-btn:hover { background: #95a5a6; }
    
    .pay-btn:disabled { background: #e0e0e0; color: #999; cursor: not-allowed; }
    
    .min-pay { background: #f39c12; color: #fff; }
    .min-pay:hover:not(:disabled) { background: #e67e22; transform: scale(1.02); }
    
    .full-pay { background: #27ae60; color: #fff; }
    .full-pay:hover:not(:disabled) { background: #2ecc71; transform: scale(1.02); }
  `]
})
export class StatementComponent implements OnInit {
  cardMasked: string = '**** **** **** ****';
  totalDebt: number = 0;
  minPayment: number = 0;
  isLoading: boolean = false;
  cardHistory: any[] = [];

  constructor(
    private router: Router, 
    public atmService: AtmService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    // Servisteki kartlar güncellendiğinde bizim değerler de güncellensin
    this.atmService.cards$.subscribe(() => {
      this.updateCardInfo();
    });
    this.updateCardInfo(); // İlk açılışta hemen al
  }

  updateCardInfo() {
    const card = this.atmService.getActiveCard();
    if (card) {
      this.cardMasked = card.cardNumber;
      this.totalDebt = card.debt;
      this.minPayment = this.totalDebt * 0.40; // Asgari ödeme: borcun %40'ı
      this.cardHistory = card.history || [];
    }
  }

  goBack() {
    window.history.back();
  }

  payAmount(amount: number) {
    if (amount <= 0) return;
    this.isLoading = true;
    
    this.atmService.payCreditCardDebt(amount).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          this.notificationService.show('Ödeme Vadesiz Hesabınızdan başarıyla çekildi!', 'success');
        } else {
          this.notificationService.show(result.message, 'error');
        }
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.show('Bir hata oluştu!', 'error');
      }
    });
  }
}
