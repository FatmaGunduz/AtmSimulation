import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AtmService } from '../../services/atm.service';
import { AdminService, AtmNode } from '../../services/admin.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="atm-screen-content">
      
      <!-- Üst Bilgi Alanı -->
      <div class="screen-header">
        <div class="welcome-text">
          <h1>LÜTFEN GİRİŞ YAPINIZ</h1>
          <p>İşlem yapmak için kart bilgilerinizi girin</p>
        </div>
      </div>

      <!-- ATM Seçimi -->
      <div class="atm-selector-group">
        <label class="field-label">🏧 KULLANIYOR OLDUĞUNUZ ATM</label>
        <div class="atm-options">
          <button 
            *ngFor="let atm of atmList"
            class="atm-option-btn"
            [class.selected]="cleanId(selectedAtmId) === cleanId(atm.id)"
            [class.offline]="atm.status !== 'ONLINE'"
            (click)="selectAtm(atm)">
            <span class="atm-loc">{{ atm.location }}</span>
            <span class="atm-status" [ngClass]="atm.status.toLowerCase()">{{ atm.status }}</span>
          </button>
        </div>
        <div class="atm-warning" *ngIf="selectedAtmStatus && selectedAtmStatus !== 'ONLINE'">
          ⚠️ Bu ATM şu an hizmet veremiyor. Lütfen başka bir ATM seçin.
        </div>
      </div>

      <!-- Giriş Formu -->
      <div class="login-fields">
        <div class="field">
          <label>KART NUMARASI</label>
          <input type="text" 
                 [(ngModel)]="displayCardNumber" 
                 name="cardNumber"
                 (input)="formatCardNumber($event)"
                 placeholder="0000 0000 0000 0000"
                 maxlength="19">
        </div>

        <div class="field">
          <label>PIN KODU</label>
          <input type="password" 
                 [(ngModel)]="pin" 
                 name="pin"
                 maxlength="4"
                 placeholder="****"
                 (keyup.enter)="onLogin()">
        </div>
      </div>

      <!-- ATM Alt Butonları -->
      <div class="screen-footer">
        <div class="helper-text" *ngIf="errorMessage">{{ errorMessage }}</div>
        
        <button class="atm-btn primary" [disabled]="!isFormValid() || isLoading" (click)="onLogin()">
          {{ isLoading ? 'LÜTFEN BEKLEYİN...' : 'GİRİŞ YAP' }}
        </button>

        <button class="admin-link-btn" (click)="goToAdmin()">
          ⚙️ BANKA YÖNETİM MERKEZİ GİRİŞİ
        </button>
      </div>

    </div>
  `,
  styles: [`
    .atm-screen-content {
      min-height: 600px;
      background: #1a1a1a;
      color: #00ff00;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 2rem 3rem;
      font-family: 'Courier New', Courier, monospace;
      text-transform: uppercase;
      gap: 1rem;
    }

    .screen-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 1.5rem; }
    .welcome-text h1 { font-size: 1.8rem; letter-spacing: 2px; margin: 0; color: #fff; }
    .welcome-text p { color: #888; font-size: 0.9rem; margin-top: 8px; }

    /* ATM Seçici */
    .atm-selector-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .field-label { font-size: 0.85rem; font-weight: bold; color: #f1c40f; letter-spacing: 1px; }
    .atm-options { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
    .atm-option-btn {
      background: #111; border: 2px solid #333; color: #ccc; padding: 0.6rem 0.8rem;
      border-radius: 6px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;
      font-family: 'Courier New', Courier, monospace; font-size: 0.7rem; transition: 0.2s;
    }
    .atm-option-btn:hover { border-color: #555; }
    .atm-option-btn.selected { border-color: #f1c40f; background: #1a1500; color: #fff; }
    .atm-option-btn.offline { opacity: 0.5; cursor: not-allowed; }
    .atm-loc { text-align: left; }
    .atm-status { font-size: 0.6rem; font-weight: bold; padding: 0.2rem 0.4rem; border-radius: 3px; }
    .online { background: #1a3a1a; color: #2ecc71; }
    .error { background: #3a1a1a; color: #e74c3c; }
    .offline { background: #333; color: #888; }
    .atm-warning { color: #e74c3c; font-size: 0.75rem; font-weight: bold; }

    /* Giriş Alanları */
    .login-fields { display: flex; flex-direction: column; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 0.6rem; }
    .field label { font-weight: bold; font-size: 1rem; color: #f1c40f; }
    .field input {
      background: #000; border: 2px solid #333; padding: 1rem;
      color: #fff; font-size: 1.8rem; text-align: center; border-radius: 8px; outline: none;
    }
    .field input:focus { border-color: #f1c40f; }

    .screen-footer { text-align: center; padding-top: 1rem; }
    .helper-text { color: #e74c3c; margin-bottom: 1rem; font-weight: bold; font-size: 0.85rem; }

    .atm-btn {
      width: 100%; padding: 1.2rem; font-size: 1.3rem; font-weight: 900;
      border: none; border-radius: 12px; cursor: pointer; transition: 0.3s;
    }
    .primary { background: #f1c40f; color: #000; }
    .primary:hover:not(:disabled) { background: #fff; }
    .primary:disabled { background: #333; color: #666; cursor: not-allowed; }

    .admin-link-btn {
      margin-top: 1rem; background: none; border: 1px dashed #555; color: #888;
      padding: 0.7rem; width: 100%; border-radius: 8px; cursor: pointer; font-family: inherit; transition: 0.3s;
    }
    .admin-link-btn:hover { border-color: #38bdf8; color: #38bdf8; background: rgba(56, 189, 248, 0.1); }
  `]
})
export class LoginComponent implements OnInit {
  displayCardNumber: string = '';
  cardNumber: string = '';
  pin: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  atmList: AtmNode[] = [];
  selectedAtmId: string = 'ATM-001';
  selectedAtmStatus: string = 'ONLINE';

  constructor(
    private router: Router, 
    private atmService: AtmService,
    private adminService: AdminService,
    private notificationService: NotificationService
  ) {}

  cleanId(id: string | number): string {
    if (!id) return '';
    return id.toString().replace('ATM-', '').replace(/^0+/, '');
  }

  ngOnInit() {
    this.adminService.atms$.subscribe(atms => {
      this.atmList = atms;
      // Önceki seçimi geri yükle
      this.selectedAtmId = this.atmService.selectedAtmId;
      const found = this.atmList.find(a => this.cleanId(a.id) === this.cleanId(this.selectedAtmId));
      if (found) this.selectedAtmStatus = found.status;
    });
  }

  selectAtm(atm: AtmNode) {
    this.selectedAtmId = atm.id;
    this.selectedAtmStatus = atm.status;
    this.atmService.setSelectedAtm(atm.id);
  }

  formatCardNumber(event: any) {
    let input = event.target.value.replace(/\D/g, '');
    let trimmed = input.substring(0, 16);
    this.cardNumber = trimmed;
    let numbers = [];
    for (let i = 0; i < trimmed.length; i += 4) {
      numbers.push(trimmed.substring(i, i + 4));
    }
    this.displayCardNumber = numbers.join(' ');
  }

  isFormValid(): boolean {
    return this.cardNumber.length === 16 
      && this.pin.length === 4 
      && this.selectedAtmStatus === 'ONLINE';
  }

  onLogin() {
    if (this.isLoading) return;
    if (!this.isFormValid()) return;
    
    // Set isLoading inside a setTimeout so the click event has time to complete
    setTimeout(() => {
      this.isLoading = true;
    });

    this.atmService.verifyPin(this.cardNumber, this.pin).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          this.router.navigate(['/accounts']);
        } else {
          this.errorMessage = result.message;
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Bağlantı hatası oluştu.';
      }
    });
  }

  goToAdmin() {
    this.router.navigate(['/admin-login']);
  }
}
