import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AtmService } from '../../services/atm.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-change-pin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="atm-screen-content">
      <div class="screen-header">
        <h1>PIN DEĞİŞTİRME</h1>
        <p>Lütfen mevcut ve yeni şifrenizi giriniz</p>
      </div>

      <div class="pin-form-container">
        <div class="field highlight">
          <label>MEVCUT PIN</label>
          <input type="password" [(ngModel)]="oldPin" name="oldPin" maxlength="4" placeholder="****">
        </div>

        <div class="field highlight">
          <label>YENİ PIN</label>
          <input type="password" [(ngModel)]="newPin" name="newPin" maxlength="4" placeholder="****" (keyup.enter)="onSubmit()">
        </div>

        <div class="field highlight">
          <label>YENİ PIN (TEKRAR)</label>
          <input type="password" [(ngModel)]="confirmPin" name="confirmPin" maxlength="4" placeholder="****" (keyup.enter)="onSubmit()">
        </div>
      </div>

      <div class="screen-footer-combined">
        <button class="back-btn-alt" (click)="goBack()">◀ GERİ DÖN</button>
        <button class="atm-action-btn" [disabled]="!isFormValid() || isLoading" (click)="onSubmit()">
          {{ isLoading ? 'BEKLEYİNİZ...' : 'ONAYLA' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .atm-screen-content {
      height: 600px; background: #001f3f; color: #fff; display: flex; flex-direction: column;
      justify-content: space-between; padding: 2rem; font-family: 'Courier New', Courier, monospace; text-transform: uppercase;
    }
    .screen-header { text-align: center; border-bottom: 2px solid #e67e22; padding-bottom: 1.5rem; margin-bottom: 1rem; }
    .screen-header h1 { font-size: 2rem; color: #e67e22; margin: 0; }

    .pin-form-container { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; }
    
    .field { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; width: 100%; }
    .field label { font-size: 0.9rem; font-weight: 900; color: #888; }
    .field.highlight label { color: #e67e22; }
    
    .field input {
      background: #000; border: 2px solid #333; padding: 1rem; color: #fff;
      font-size: 2rem; letter-spacing: 0.5rem; text-align: center; width: 200px;
      border-radius: 8px; outline: none; transition: 0.3s;
    }
    .field input:focus { border-color: #e67e22; box-shadow: 0 0 10px rgba(230,126,34,0.5); }

    .screen-footer-combined { display: flex; align-items: center; justify-content: center; gap: 2rem; margin-top: 2rem; }
    .back-btn-alt {
      background: none; border: 1px solid #888; color: #888; padding: 1rem 2rem;
      font-weight: 900; border-radius: 8px; cursor: pointer; font-size: 1.1rem;
    }
    .back-btn-alt:hover { border-color: #fff; color: #fff; }

    .atm-action-btn {
      width: 40%; padding: 1.2rem; background: #d35400; color: #fff; border: none;
      border-radius: 8px; font-size: 1.4rem; font-weight: 900; cursor: pointer;
    }
    .atm-action-btn:disabled { background: #333; color: #666; }
  `]
})
export class ChangePinComponent {
  oldPin: string = '';
  newPin: string = '';
  confirmPin: string = '';
  isLoading: boolean = false;

  constructor(
    private atmService: AtmService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  isFormValid(): boolean {
    return this.oldPin.length === 4 && this.newPin.length === 4 && this.confirmPin.length === 4;
  }

  onSubmit() {
    if (!this.isFormValid()) return;
    
    if (this.newPin !== this.confirmPin) {
      this.notificationService.show('Yeni şifreler eşleşmiyor!', 'error');
      return;
    }

    this.isLoading = true;
    this.atmService.changePin(this.oldPin, this.newPin).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.notificationService.show(res.message, 'success');
          window.history.back();
        } else {
          this.notificationService.show(res.message, 'error');
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
