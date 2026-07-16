import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AtmService } from '../../services/atm.service';

@Component({
  selector: 'app-account-actions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="atm-screen-content" [class.credit-theme]="isCreditCard">
      <div class="screen-header">
        <div class="balance-tag-top">
          {{ isCreditCard ? 'KULLANILABİLİR LİMİT:' : 'BAKİYE:' }} 
          ₺{{ (atmService.balance$ | async) | number:'1.2-2' }}
        </div>
        <h1>{{ accountName }}</h1>
        <p>Lütfen yapmak istediğiniz işlemi seçiniz</p>
      </div>

      <!-- BANKA HESABI BUTONLARI -->
      <div class="actions-grid" *ngIf="!isCreditCard">
        <button class="grid-btn" (click)="navigate('withdraw')">
          <span class="btn-text">PARA ÇEKME</span>
          <span class="btn-icon">💸</span>
        </button>
        <button class="grid-btn" (click)="navigate('deposit')">
          <span class="btn-text">PARA YATIRMA</span>
          <span class="btn-icon">💰</span>
        </button>
        <button class="grid-btn" (click)="navigate('transfer')">
          <span class="btn-text">PARA TRANSFERİ</span>
          <span class="btn-icon">🔄</span>
        </button>
        <button class="grid-btn" (click)="navigate('transactions')">
          <span class="btn-text">HESAP ÖZETİ</span>
          <span class="btn-icon">📜</span>
        </button>
        <button class="grid-btn other-btn" (click)="navigate('other-actions')">
          <span class="btn-text">DİĞER İŞLEMLER</span>
          <span class="btn-icon">➕</span>
        </button>
        <button class="grid-btn exit-btn" (click)="goBack()">
          <span class="btn-text">ANA MENÜ</span>
          <span class="btn-icon">⬅️</span>
        </button>
      </div>

      <!-- KREDİ KARTI BUTONLARI -->
      <div class="actions-grid card-grid" *ngIf="isCreditCard">
        <button class="grid-btn card-btn" (click)="navigate('withdraw')">
          <span class="btn-text">NAKİT AVANS</span>
          <span class="btn-icon">💴</span>
        </button>
        <button class="grid-btn card-btn" (click)="navigate('statement')">
          <span class="btn-text">KART BORCU ÖDEME</span>
          <span class="btn-icon">💳</span>
        </button>
        <button class="grid-btn card-btn" (click)="navigate('statement')">
          <span class="btn-text">EKSTRE GÖRÜNTÜLE</span>
          <span class="btn-icon">📄</span>
        </button>
        <button class="grid-btn card-btn" (click)="navigate('transactions')">
          <span class="btn-text">DÖNEM İÇİ İŞLEMLER</span>
          <span class="btn-icon">📅</span>
        </button>
        <button class="grid-btn other-btn" (click)="navigate('other-actions')">
          <span class="btn-text">KART AYARLARI</span>
          <span class="btn-icon">⚙️</span>
        </button>
        <button class="grid-btn exit-btn" (click)="goBack()">
          <span class="btn-text">ANA MENÜ</span>
          <span class="btn-icon">⬅️</span>
        </button>
      </div>

      <div class="screen-footer">
        <p>GÜVENLİĞİNİZ İÇİN İŞLEM SONUNDA KARTINIZI ALMAYI UNUTMAYINIZ</p>
      </div>
    </div>
  `,
  styles: [`
    .atm-screen-content {
      height: 600px; background: #001f3f; color: #fff; display: flex; flex-direction: column;
      justify-content: space-between; padding: 2rem; font-family: 'Courier New', Courier, monospace; text-transform: uppercase;
      transition: 0.5s;
    }
    .credit-theme { background: #000b1a; }
    .credit-theme .balance-tag-top { background: #3498db; }
    .credit-theme .screen-header { border-color: #3498db; }
    .credit-theme .grid-btn:hover { border-color: #3498db; }

    .screen-header { text-align: center; border-bottom: 2px solid #f1c40f; padding-bottom: 1rem; position: relative; }
    .balance-tag-top { 
      position: absolute; right: 0; top: -10px; background: #f1c40f; color: #000; padding: 0.4rem 1rem; 
      font-size: 0.8rem; font-weight: 900; border-radius: 5px;
    }

    .actions-grid {
      display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(3, 1fr);
      gap: 1.5rem; flex: 1; padding: 2rem 0;
    }

    .grid-btn {
      background: #1a252f; border: 2px solid #34495e; color: #fff; border-radius: 12px;
      display: flex; align-items: center; justify-content: space-between; padding: 0 1.5rem;
      cursor: pointer; transition: 0.3s;
    }
    .grid-btn:hover { background: #2c3e50; border-color: #f1c40f; transform: translateY(-3px); }
    .btn-text { font-size: 1rem; font-weight: 900; }
    .btn-icon { font-size: 1.6rem; }

    .other-btn { border-color: #9b59b6; }
    .exit-btn { border-color: #e74c3c; }
    .screen-footer { text-align: center; color: #888; font-size: 0.8rem; }
  `]
})
export class AccountActionsComponent implements OnInit {
  accountName: string = '';
  isCreditCard: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public atmService: AtmService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.accountName = params['name'] || 'İŞLEMLER';
      this.isCreditCard = params['type'] === 'credit';
    });
  }

  navigate(path: string) {
    this.router.navigate(['/' + path]);
  }

  goBack() {
    this.router.navigate(['/accounts']);
  }
}
