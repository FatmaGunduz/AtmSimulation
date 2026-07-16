import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, GlobalLog } from '../../services/admin.service';

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-content">
      <div class="header-row">
        <h1 class="page-title">Merkezi İşlem İzleme (Log Monitor)</h1>
      </div>

      <div class="log-container">
        <div class="log-header">
          <div class="col id">Log ID</div>
          <div class="col date">Tarih / Saat</div>
          <div class="col atm">ATM Noktası</div>
          <div class="col cust">Müşteri</div>
          <div class="col type">İşlem Türü</div>
          <div class="col amount">Tutar</div>
          <div class="col status">Sonuç</div>
        </div>
        
        <div class="log-body" *ngIf="logs.length > 0; else emptyLogs">
          <div class="log-row" *ngFor="let log of logs" [class.failed]="log.status === 'FAILED'">
            <div class="col id">#{{ log.id }}</div>
            <div class="col date">{{ log.date | date:'dd.MM.yyyy HH:mm:ss' }}</div>
            <div class="col atm font-bold">{{ log.atmId }}</div>
            <div class="col cust">{{ log.customerName }}</div>
            <div class="col type">
              <span class="type-badge">{{ log.type }}</span>
            </div>
            <div class="col amount font-bold" [ngClass]="log.amount > 0 ? 'text-blue' : 'text-gray'">
              {{ log.amount > 0 ? '₺' + (log.amount | number:'1.2-2') : '-' }}
            </div>
            <div class="col status">
              <span class="status-indicator" [ngClass]="log.status.toLowerCase()">
                {{ log.status === 'SUCCESS' ? 'BAŞARILI' : 'BAŞARISIZ' }}
              </span>
            </div>
          </div>
        </div>

        <ng-template #emptyLogs>
          <div class="log-empty-state">
            <p>Henüz sistemde görüntülenebilecek işlem kaydı bulunmamaktadır.</p>
            <p>ATM işlemleri veya transferler yapıldığında burada otomatik olarak görünecektir.</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .page-content { display: flex; flex-direction: column; gap: 1.5rem; height: 100%; }
    .header-row { display: flex; justify-content: space-between; align-items: center; }
    .page-title { color: #fff; font-size: 1.8rem; font-weight: 700; margin: 0; }
 
    .log-container { 
      background: #202f46; /* Slightly lighter dark steel blue for card contrast */
      border-radius: 16px; 
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 10px 30px rgba(0,0,0,0.3); 
      display: flex; 
      flex-direction: column; 
      flex: 1; 
      overflow: hidden;
      font-family: 'Consolas', 'Courier New', monospace;
      color: #fff;
    }
    
    .log-header { 
      display: flex; 
      background: rgba(15, 23, 42, 0.95); 
      padding: 1.1rem 1.5rem; 
      border-bottom: 2px solid rgba(255, 255, 255, 0.1);
      color: #f1f5f9; /* Crisp Slate 100 for high contrast header */
      font-weight: bold; 
      text-transform: uppercase; 
      font-size: 0.8rem;
    }
    
    .log-body { flex: 1; overflow-y: auto; padding: 0.25rem 0; }
    
    .log-row { 
      display: flex; 
      padding: 0.9rem 1.5rem; 
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: #cbd5e1; 
      align-items: center; 
      font-size: 0.88rem; 
      transition: all 0.2s ease;
    }
    .log-row:hover { background: rgba(255, 255, 255, 0.05); }
    .log-row.failed { background: #2d1a1a; border-left: 3px solid #ef4444; border-bottom-color: rgba(239, 68, 68, 0.2); }
 
    .col { flex: 1; }
    .col.id { flex: 0.5; color: #94a3b8; } /* Lighter grey for better contrast */
    .col.date { flex: 1.5; color: #cbd5e1; } /* Lighter grey for better contrast */
    .col.atm { flex: 1.5; color: #38bdf8; }
    .col.cust { flex: 1.5; color: #fff; } /* Bright white for primary info */
    .col.type { flex: 1.5; }
    .col.amount { flex: 1; text-align: right; padding-right: 1.5rem; }
    .col.status { flex: 1; text-align: center; }
 
    .font-bold { font-weight: bold; }
    .text-blue { color: #38bdf8; }
    .text-gray { color: #64748b; }
 
    .type-badge { 
      background: rgba(255, 255, 255, 0.05); 
      border: 1px solid rgba(255, 255, 255, 0.05);
      color: #cbd5e1;
      padding: 0.25rem 0.6rem; 
      border-radius: 6px; 
      font-size: 0.75rem; 
    }
    
    .status-indicator { padding: 0.35rem 0.8rem; border-radius: 6px; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.02em; }
    .status-indicator.success { background: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.1); }
    .status-indicator.failed { background: rgba(248, 113, 113, 0.15); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.1); }
 
    .log-empty-state {
      padding: 3rem 1.5rem;
      color: #64748b;
      text-align: center;
      font-size: 0.9rem;
      background: transparent;
    }
 
    .log-empty-state p { margin: 0.6rem 0; }
  `]
})
export class TransactionMonitorComponent implements OnInit {
  logs: GlobalLog[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.logs$.subscribe(data => this.logs = data);
  }
}
