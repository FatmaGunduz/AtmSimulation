import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AtmService } from '../../services/atm.service';

@Component({
  selector: 'app-other-actions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="atm-screen-content">
      <div class="screen-header">
        <div class="balance-tag-top">BAKİYE: ₺{{ (atmService.balance$ | async) | number:'1.2-2' }}</div>
        <h1>DİĞER İŞLEMLER</h1>
        <p>Lütfen yapmak istediğiniz ek işlemi seçiniz</p>
      </div>

      <div class="other-actions-list">
        <button class="action-row" (click)="navigate('limit-inquiry')">
          <div class="action-info">
            <span class="action-title">LİMİT VE KART AYARLARI</span>
            <span class="action-desc">Günlük limitler ve kart yetkileri</span>
          </div>
          <span class="action-icon">⚙️</span>
        </button>

        <button class="action-row" (click)="navigate('bill-payment')">
          <div class="action-info">
            <span class="action-title">FATURA ÖDEME</span>
            <span class="action-desc">Elektrik, Su, Doğalgaz ve Diğer</span>
          </div>
          <span class="action-icon">🧾</span>
        </button>

        <button class="action-row disabled" (click)="showSoon()">
          <div class="action-info">
            <span class="action-title">GSM TL YÜKLEME</span>
            <span class="action-desc">Telefon hattınıza bakiye yükleyin</span>
          </div>
          <span class="action-icon">📱</span>
        </button>

        <button class="action-row disabled" (click)="showSoon()">
          <div class="action-info">
            <span class="action-title">KREDİ KARTI BORCU</span>
            <span class="action-desc">Ekstre görüntüleme ve borç ödeme</span>
          </div>
          <span class="action-icon">💳</span>
        </button>
      </div>

      <div class="screen-footer">
        <button class="back-btn-huge" (click)="goBack()">◀ ANA MENÜYE DÖN</button>
      </div>
    </div>
  `,
  styles: [`
    .atm-screen-content {
      height: 600px; background: #001f3f; color: #fff; display: flex; flex-direction: column;
      padding: 2rem; font-family: 'Courier New', Courier, monospace; text-transform: uppercase;
    }
    .screen-header { text-align: center; border-bottom: 2px solid #9b59b6; padding-bottom: 1rem; position: relative; margin-bottom: 1rem; }
    .balance-tag-top { 
      position: absolute; right: 0; top: -10px; background: #9b59b6; color: #fff; padding: 0.4rem 1rem; 
      font-size: 0.9rem; font-weight: 900; border-radius: 5px;
    }

    .other-actions-list { flex: 1; display: flex; flex-direction: column; gap: 0.8rem; padding: 1rem 0; }

    .action-row {
      background: #1a252f; border: 1px solid #34495e; color: #fff; padding: 1rem 1.5rem;
      border-radius: 12px; display: flex; justify-content: space-between; align-items: center;
      cursor: pointer; transition: 0.3s; text-align: left;
    }
    .action-row:hover:not(.disabled) { background: #9b59b6; border-color: #fff; transform: translateX(5px); }
    .action-row.disabled { opacity: 0.4; border-style: dotted; }

    .action-info { display: flex; flex-direction: column; gap: 0.2rem; }
    .action-title { font-size: 1rem; font-weight: 900; }
    .action-desc { font-size: 0.65rem; color: #888; }
    .action-icon { font-size: 1.4rem; }

    .screen-footer { margin-top: 1rem; }
    .back-btn-huge {
      width: 100%; padding: 1.4rem; background: #2c3e50; color: #fff; border: 3px solid #9b59b6;
      border-radius: 15px; font-weight: 900; font-size: 1.2rem; cursor: pointer; transition: 0.3s;
    }
    .back-btn-huge:hover { background: #9b59b6; color: #000; }
  `]
})
export class OtherActionsComponent {
  constructor(public atmService: AtmService, private router: Router) {}
  navigate(path: string) { this.router.navigate(['/' + path]); }
  goBack() { window.history.back(); }
  showSoon() { alert('Bu özellik çok yakında hizmetinizde olacak!'); }
}
