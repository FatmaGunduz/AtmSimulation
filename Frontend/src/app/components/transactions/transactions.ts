import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AtmService, Transaction } from '../../services/atm.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="atm-screen-content">
      <div class="screen-header">
        <div class="balance-tag-top">BAKİYE: ₺{{ (atmService.balance$ | async) | number:'1.2-2' }}</div>
        <h1>HESAP ÖZETİ</h1>
        <p>Son yaptığınız işlemler aşağıda listelenmiştir</p>
      </div>

      <div class="transactions-container">
        <div class="transaction-header">
          <span>TARİH</span>
          <span>AÇIKLAMA</span>
          <span class="text-right">TUTAR</span>
        </div>
        
        <div class="transaction-list">
          <div *ngFor="let t of (atmService.transactions$ | async)" class="transaction-item">
            <span class="date">{{ t.date | date:'dd.MM.yyyy HH:mm' }}</span>
            <span class="desc">{{ t.description }}</span>
            <span class="amount" [class.in]="t.type === 'IN'" [class.out]="t.type === 'OUT'">
              {{ t.type === 'IN' ? '+' : '-' }}₺{{ t.amount | number:'1.2-2' }}
            </span>
          </div>
          
          <div *ngIf="(atmService.transactions$ | async)?.length === 0" class="no-data">
            Henüz bir işlem bulunmamaktadır.
          </div>
        </div>
      </div>

      <div class="screen-footer">
        <button class="back-btn-wide" (click)="goBack()">◀ GERİ DÖN</button>
      </div>
    </div>
  `,
  styles: [`
    .atm-screen-content {
      height: 600px; background: #001f3f; color: #fff; display: flex; flex-direction: column;
      justify-content: space-between; padding: 2rem; font-family: 'Courier New', Courier, monospace; text-transform: uppercase;
    }
    .screen-header { text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 1rem; position: relative; }
    .balance-tag-top { 
      position: absolute; right: 0; top: -10px; background: #3498db; color: #fff; padding: 0.4rem 1rem; 
      font-size: 0.9rem; font-weight: 900; border-radius: 5px;
    }

    .transactions-container { flex: 1; display: flex; flex-direction: column; padding: 1.5rem 0; overflow: hidden; }
    .transaction-header {
      display: grid; grid-template-columns: 140px 1fr 120px; padding: 0.8rem;
      background: #3498db; color: #fff; font-weight: 900; font-size: 0.8rem; border-radius: 8px 8px 0 0;
    }
    .transaction-list {
      flex: 1; overflow-y: auto; background: rgba(0,0,0,0.3); border: 1px solid #3498db; border-top: none;
    }
    .transaction-item {
      display: grid; grid-template-columns: 140px 1fr 120px; padding: 1rem 0.8rem; border-bottom: 1px solid #1a252f;
      font-size: 0.9rem; align-items: center;
    }
    .date { color: #888; font-size: 0.8rem; }
    .desc { font-weight: bold; }
    .amount { font-weight: 900; text-align: right; }
    .amount.in { color: #2ecc71; }
    .amount.out { color: #e74c3c; }
    .text-right { text-align: right; }
    .no-data { text-align: center; padding: 3rem; color: #666; }

    .screen-footer { text-align: center; margin-top: 1rem; }
    .back-btn-wide {
      width: 100%; padding: 1.2rem; background: #2c3e50; color: #fff; border: 2px solid #3498db;
      border-radius: 12px; font-weight: 900; cursor: pointer; transition: 0.3s;
    }
    .back-btn-wide:hover { background: #3498db; color: #000; }
  `]
})
export class TransactionsComponent implements OnInit {
  constructor(public atmService: AtmService, private router: Router) {}
  ngOnInit() {}
  goBack() {
    window.history.back();
  }
}
