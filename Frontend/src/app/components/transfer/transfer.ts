import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AtmService } from '../../services/atm.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="atm-screen-content">
      <div class="screen-header">
        <h1>PARA TRANSFERİ</h1>
        <p>Alıcı bilgilerini ve tutarı giriniz</p>
      </div>

      <div class="transfer-form">
        <div class="field">
          <label>ALICI IBAN</label>
          <input type="text" [(ngModel)]="iban" placeholder="TR00 0000..." maxlength="26">
        </div>

        <div class="field">
          <label>TRANSFER TUTARI</label>
          <input type="number" [(ngModel)]="amount" placeholder="0" min="1" (keyup.enter)="onTransfer()">
          <p class="balance-hint">BAKİYE: ₺{{ (atmService.balance$ | async) | number:'1.2-2' }}</p>
        </div>
      </div>

      <div class="screen-footer-combined">
        <button class="back-btn-alt" (click)="goBack()">◀ GERİ DÖN</button>
        <button class="atm-action-btn" [disabled]="!isFormValid() || isLoading" (click)="onTransfer()">
          {{ isLoading ? 'GÖNDERİLİYOR...' : 'ONAYLA' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .atm-screen-content {
      height: 600px; background: #001f3f; color: #fff; display: flex; flex-direction: column;
      justify-content: space-between; padding: 2rem; font-family: 'Courier New', Courier, monospace; text-transform: uppercase;
    }
    .screen-header { text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 1rem; }
    
    .transfer-form { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 2rem; padding: 0 4rem; }
    .field { display: flex; flex-direction: column; gap: 0.8rem; }
    .field label { color: #3498db; font-weight: bold; font-size: 0.9rem; }
    .field input {
      background: #000; border: 2px solid #333; padding: 1rem; color: #fff;
      font-size: 1.2rem; border-radius: 8px; outline: none;
    }
    .balance-hint { font-size: 0.8rem; color: #2ecc71; margin-top: 0.4rem; text-align: right; }

    .screen-footer-combined { display: flex; align-items: center; justify-content: center; gap: 2rem; }
    .back-btn-alt {
      background: none; border: 1px solid #888; color: #888; padding: 1rem 2rem;
      font-weight: 900; border-radius: 10px; cursor: pointer; font-size: 1.1rem;
    }
    .back-btn-alt:hover { border-color: #fff; color: #fff; }

    .atm-action-btn {
      width: 40%; padding: 1.2rem; background: #2980b9; color: #fff; border: none;
      border-radius: 10px; font-size: 1.4rem; font-weight: 900; cursor: pointer;
    }
    .atm-action-btn:disabled { background: #333; color: #666; }
  `]
})
export class TransferComponent {
  iban: string = '';
  amount: number | null = null;
  isLoading: boolean = false;

  constructor(
    public atmService: AtmService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  isFormValid(): boolean {
    return this.iban.length >= 10 && this.amount !== null && this.amount > 0;
  }

  onTransfer() {
    if (!this.isFormValid()) return;
    this.isLoading = true;

    this.atmService.transfer(this.amount!, this.iban).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          this.notificationService.show(`Transfer başarıyla gerçekleştirildi.`, 'success');
          window.history.back();
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

  goBack() {
    window.history.back();
  }
}
