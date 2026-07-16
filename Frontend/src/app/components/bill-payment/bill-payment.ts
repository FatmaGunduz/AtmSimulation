import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AtmService } from '../../services/atm.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-bill-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="atm-screen-content">
      <div class="screen-header">
        <div class="balance-tag-top">BAKİYE: ₺{{ (atmService.balance$ | async) | number:'1.2-2' }}</div>
        <h1>FATURA ÖDEME</h1>
        <p>Lütfen fatura türünü ve abone numarasını giriniz</p>
      </div>

      <div class="bill-form">
        <div class="bill-types-grid">
          <button *ngFor="let type of billTypes" 
                  class="type-btn" 
                  [class.selected]="selectedType === type"
                  (click)="selectType(type)">
            {{ type }}
          </button>
        </div>

        <div class="input-section" *ngIf="selectedType">
          <div class="field">
            <label>{{ selectedType }} ABONE / TELEFON NUMARASI</label>
            <input type="text" 
                   [(ngModel)]="subscriberNo" 
                   [placeholder]="getPlaceholder()" 
                   [maxlength]="getMaxLength()"
                   (input)="filterNumeric($event)"
                   autocomplete="off">
            <small class="hint-text" *ngIf="subscriberNo.length > 0 && !isSubscriberValid()">
              {{ getValidationMessage() }}
            </small>
          </div>
          
          <div class="field" *ngIf="isSubscriberValid()">
            <label>FATURA TUTARI</label>
            <div class="simulated-bill">
              <span class="bill-amount">₺{{ simulatedAmount | number:'1.2-2' }}</span>
              <span class="bill-date">Son Ödeme: 25.05.2026</span>
            </div>
          </div>
        </div>
      </div>

      <div class="screen-footer-combined">
        <button class="back-btn-alt" (click)="goBack()">◀ GERİ DÖN</button>
        <button class="atm-action-btn" 
                [disabled]="!selectedType || !isSubscriberValid() || isLoading" 
                (click)="payBill()">
          {{ isLoading ? 'İŞLEM YAPILIYOR...' : 'ÖDEMEYİ ONAYLA' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .atm-screen-content {
      height: 600px; background: #001f3f; color: #fff; display: flex; flex-direction: column;
      justify-content: space-between; padding: 2rem; font-family: 'Courier New', Courier, monospace; text-transform: uppercase;
    }
    .screen-header { text-align: center; border-bottom: 2px solid #2ecc71; padding-bottom: 1rem; position: relative; }
    .balance-tag-top { 
      position: absolute; right: 0; top: -10px; background: #2ecc71; color: #000; padding: 0.4rem 1rem; 
      font-size: 0.9rem; font-weight: 900; border-radius: 5px;
    }

    .bill-form { flex: 1; display: flex; flex-direction: column; gap: 2rem; padding: 1.5rem 0; }
    
    .bill-types-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .type-btn {
      background: #1a252f; border: 2px solid #34495e; color: #fff; padding: 1rem;
      border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 0.8rem; transition: 0.3s;
    }
    .type-btn:hover { border-color: #2ecc71; }
    .type-btn.selected { border-color: #2ecc71; background: #2ecc71; color: #000; transform: scale(1.05); }

    .input-section { display: flex; flex-direction: column; gap: 1.5rem; animation: fadeIn 0.3s; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .field { display: flex; flex-direction: column; gap: 0.5rem; }
    .field label { color: #2ecc71; font-weight: bold; font-size: 0.8rem; }
    .field input {
      background: #000; border: 2px solid #333; padding: 1rem; color: #fff;
      font-size: 1.5rem; border-radius: 8px; outline: none; text-align: center; letter-spacing: 2px;
    }
    .field input:focus { border-color: #2ecc71; }
    .hint-text { color: #e74c3c; font-size: 0.7rem; text-align: center; font-weight: bold; margin-top: 0.2rem; }

    .simulated-bill {
      background: rgba(46, 204, 113, 0.1); border: 1px dashed #2ecc71; padding: 1rem;
      border-radius: 8px; display: flex; justify-content: space-between; align-items: center;
    }
    .bill-amount { font-size: 1.8rem; font-weight: 900; color: #2ecc71; }
    .bill-date { font-size: 0.7rem; color: #888; }

    .screen-footer-combined { display: flex; align-items: center; justify-content: center; gap: 2rem; }
    .back-btn-alt {
      background: none; border: 1px solid #888; color: #888; padding: 1rem 2rem;
      font-weight: 900; border-radius: 10px; cursor: pointer;
    }
    .atm-action-btn {
      width: 40%; padding: 1.2rem; background: #27ae60; color: #fff; border: none;
      border-radius: 10px; font-size: 1.4rem; font-weight: 900; cursor: pointer;
    }
    .atm-action-btn:disabled { background: #333; color: #666; }
  `]
})
export class BillPaymentComponent {
  billTypes = ['ELEKTRİK', 'SU', 'DOĞALGAZ', 'İNTERNET', 'TELEFON', 'DİĞER'];
  selectedType: string | null = null;
  subscriberNo: string = '';
  simulatedAmount: number = 452.30;
  isLoading: boolean = false;

  constructor(
    public atmService: AtmService,
    private notificationService: NotificationService
  ) {}

  selectType(type: string) {
    this.selectedType = type;
    this.subscriberNo = '';
    // Farklı faturalar için farklı tutarlar simüle edelim
    this.simulatedAmount = Math.floor(Math.random() * 500) + 150.50; 
  }

  filterNumeric(event: any) {
    this.subscriberNo = event.target.value.replace(/[^0-9]/g, '');
  }

  getPlaceholder(): string {
    switch(this.selectedType) {
      case 'TELEFON': return 'Örn: 05XXXXXXXXX';
      case 'İNTERNET': return 'Örn: 1XXXXXXXXX (10 hane)';
      case 'ELEKTRİK': return 'Örn: 10XXXXXXXX (10 hane)';
      case 'SU': return 'Örn: XXXXXXXX (8 hane)';
      case 'DOĞALGAZ': return 'Örn: XXXXXXXXXXXX (12 hane)';
      default: return 'Abone numarası';
    }
  }

  getMaxLength(): number {
    switch(this.selectedType) {
      case 'TELEFON': return 11;
      case 'İNTERNET': return 10;
      case 'ELEKTRİK': return 10;
      case 'SU': return 8;
      case 'DOĞALGAZ': return 12;
      default: return 15;
    }
  }

  getValidationMessage(): string {
    const required = this.getMaxLength();
    const current = this.subscriberNo.length;
    if (this.selectedType === 'TELEFON' && !this.subscriberNo.startsWith('0')) {
      return 'Telefon numarası 0 ile başlamalıdır!';
    }
    return `Eksik tuşlama yaptınız. Beklenen: ${required} hane, Girilen: ${current} hane.`;
  }

  isSubscriberValid(): boolean {
    if (!this.selectedType || !this.subscriberNo) return false;
    
    if (this.selectedType === 'TELEFON') {
      return this.subscriberNo.length === 11 && this.subscriberNo.startsWith('0');
    }
    
    return this.subscriberNo.length === this.getMaxLength();
  }

  payBill() {
    this.isLoading = true;
    this.atmService.transfer(this.simulatedAmount, `${this.selectedType} FATURASI`).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          // Admin log'una fatura ödemesini yaz
          this.atmService.payBill(this.selectedType!, this.simulatedAmount);
          this.notificationService.show(`${this.selectedType} faturası başarıyla ödendi.`, 'success');
          window.history.back();
        } else {
          this.notificationService.show(result.message, 'error');
        }
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.show('Ödeme sırasında bir hata oluştu!', 'error');
      }
    });
  }

  goBack() {
    window.history.back();
  }
}
