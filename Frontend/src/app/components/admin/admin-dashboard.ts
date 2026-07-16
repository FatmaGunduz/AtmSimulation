import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest } from 'rxjs';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-content">
      <h1 class="page-title">Sistem İzleme Paneli</h1>

      <div class="kpi-grid">
        <div class="kpi-card blue">
          <div class="kpi-icon">🏧</div>
          <div class="kpi-info">
            <span class="label">Toplam ATM</span>
            <span class="value">{{ stats.totalAtms }}</span>
          </div>
        </div>

        <div class="kpi-card green">
          <div class="kpi-icon">✅</div>
          <div class="kpi-info">
            <span class="label">Aktif ATM</span>
            <span class="value">{{ stats.activeAtms }}</span>
          </div>
        </div>

        <div class="kpi-card yellow">
          <div class="kpi-icon">💰</div>
          <div class="kpi-info">
            <span class="label">Toplam Nakit</span>
            <span class="value">{{ stats.totalCash | number:'1.0-0' }} ₺</span>
          </div>
        </div>

        <div class="kpi-card purple">
          <div class="kpi-icon">👥</div>
          <div class="kpi-info">
            <span class="label">Toplam Müşteri</span>
            <span class="value">{{ stats.totalCustomers }}</span>
          </div>
        </div>

        <div class="kpi-card teal">
          <div class="kpi-icon">💳</div>
          <div class="kpi-info">
            <span class="label">Toplam Kart</span>
            <span class="value">{{ stats.totalCards }}</span>
          </div>
        </div>

        <div class="kpi-card red">
          <div class="kpi-icon">🚨</div>
          <div class="kpi-info">
            <span class="label">Başarısız İşlem</span>
            <span class="value">{{ stats.failedOps }}</span>
          </div>
        </div>
      </div>

      <div class="panels-grid">
        <div class="panel">
          <div class="panel-header">
            <span class="panel-icon">📊</span>
            <h3>Hızlı Bakış</h3>
          </div>
          <div class="stat-list">
            <div class="stat-row"><span>Çevrim içi ATM'ler:</span> <strong>{{ stats.activeAtms }}</strong></div>
            <div class="stat-row"><span>Arızalı ATM'ler:</span> <strong [class.has-error]="stats.errorAtms > 0">{{ stats.errorAtms }}</strong></div>
            <div class="stat-row"><span>Çevrim dışı ATM'ler:</span> <strong>{{ stats.offlineAtms }}</strong></div>
            <div class="stat-row"><span>Başarılı İşlem Adedi:</span> <strong class="success-count">{{ stats.successOps }}</strong></div>
            <div class="stat-row"><span>Başarısız İşlem Adedi:</span> <strong class="failed-count">{{ stats.failedOps }}</strong></div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <span class="panel-icon">⚡</span>
            <h3>Sistem Durumu</h3>
          </div>
          <div class="health-container">
            <div class="health-bar">
              <div class="health-fill" [style.width]="healthPercentage + '%'"></div>
            </div>
            <div class="health-text">Ağ Sağlığı: <span>%{{ healthPercentage | number:'1.0-0' }}</span></div>
          </div>
        </div>
      </div>

      <div class="alerts-panel">
        <div class="alerts-header">
          <span class="alerts-title-icon">🚨</span>
          <h3>Son Başarısız İşlem Bildirimleri</h3>
        </div>
        <div *ngIf="stats.recentAlerts?.length; else noAlerts" class="alert-list">
          <div class="alert-item" *ngFor="let alert of stats.recentAlerts">
            <div class="alert-left">
              <span class="alert-type">{{ getAlertTypeText(alert.type) }}</span>
              <span class="alert-subtitle">{{ getAtmName(alert.atmId) }} • {{ alert.date | date:'dd.MM.yyyy HH:mm' }}</span>
            </div>
            <div class="alert-amount">{{ alert.amount | number:'1.0-0' }} ₺</div>
          </div>
        </div>
        <ng-template #noAlerts>
          <p class="empty-state">Henüz sistemde başarısız bir işlem kaydı bulunmuyor. ATM hataları veya bakiye yetersizlikleri burada listelenecektir.</p>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .page-title { color: #fff; font-size: 1.8rem; margin-bottom: 2rem; font-weight: 800; letter-spacing: -0.025em; }
    
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    
    .kpi-card { 
      background: #202f46; /* Slightly lighter dark steel blue for card contrast */
      border-radius: 16px; 
      padding: 1.5rem; 
      display: flex; 
      align-items: center; 
      gap: 1.25rem;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); 
      border: 1px solid rgba(255, 255, 255, 0.08); 
      position: relative; 
      overflow: hidden;
      transition: all 0.3s ease;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      border-color: rgba(255, 255, 255, 0.15);
      box-shadow: 0 15px 25px -5px rgba(0,0,0,0.4);
    }
    .kpi-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
    
    .kpi-card.blue::before { background: #38bdf8; }
    .kpi-card.green::before { background: #34d399; }
    .kpi-card.yellow::before { background: #fbbf24; }
    .kpi-card.purple::before { background: #a78bfa; }
    .kpi-card.teal::before { background: #2dd4bf; }
    .kpi-card.red::before { background: #f87171; }
 
    .kpi-icon { 
      font-size: 1.8rem; 
      background: rgba(255, 255, 255, 0.05); 
      width: 50px; 
      height: 50px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      border-radius: 12px; 
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .kpi-info { display: flex; flex-direction: column; gap: 0.2rem; }
    .kpi-info .label { color: #e2e8f0; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .kpi-info .value { color: #fff; font-size: 1.5rem; font-weight: 800; }
 
    .panels-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
    
    .panel { 
      background: #202f46; /* Slightly lighter dark steel blue */
      border-radius: 16px; 
      padding: 1.75rem; 
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
      border: 1px solid rgba(255, 255, 255, 0.08); 
    }
    .panel-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 0.75rem; }
    .panel-icon { font-size: 1.4rem; }
    .panel h3 { color: #fff; margin: 0; font-size: 1.1rem; font-weight: 700; }
    
    .stat-list { display: flex; flex-direction: column; gap: 0.85rem; }
    .stat-row { display: flex; justify-content: space-between; color: #ffffff; font-size: 0.9rem; font-weight: 600; }
    .stat-row strong { color: #ffffff; font-weight: 700; }
    .stat-row strong.has-error { color: #f87171; }
    .stat-row strong.success-count { color: #34d399; }
    .stat-row strong.failed-count { color: #f87171; }
 
    .health-container { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; }
    .health-bar { width: 100%; height: 12px; background: rgba(255, 255, 255, 0.08); border-radius: 8px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.08); }
    .health-fill { height: 100%; background: linear-gradient(90deg, #10b981, #34d399); transition: 1s ease-out; border-radius: 8px; }
    .health-text { font-weight: 700; color: #cbd5e1; font-size: 0.9rem; display: flex; justify-content: space-between; }
    .health-text span { color: #34d399; font-size: 1.05rem; }
 
    .alerts-panel { 
      background: #202f46; /* Slightly lighter dark steel blue */
      border-radius: 16px; 
      padding: 1.75rem; 
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .alerts-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(239, 68, 68, 0.25); padding-bottom: 0.75rem; }
    .alerts-title-icon { font-size: 1.4rem; }
    .alerts-header h3 { color: #f87171; margin: 0; font-size: 1.1rem; font-weight: 700; }
    
    .alert-list { display: flex; flex-direction: column; gap: 0.75rem; }
    
    .alert-item { 
      display: flex; justify-content: space-between; align-items: center; 
      padding: 1rem 1.25rem; border-radius: 12px; 
      background: rgba(239, 68, 68, 0.08); /* Opaque transparent red back */
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-left: 4px solid #ef4444; /* Left border remains red to signal failure */
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .alert-item:hover {
      transform: translateX(4px);
      background: rgba(239, 68, 68, 0.12); /* Slightly brighter transparent red on hover */
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    .alert-left { display: flex; flex-direction: column; gap: 0.3rem; }
    .alert-type { font-weight: 700; color: #fff; font-size: 0.95rem; } /* Clean white text */
    .alert-subtitle { font-size: 0.8rem; color: #e2e8f0; opacity: 1; } /* Crisp Slate 200 for readability */
    .alert-amount { font-weight: 800; color: #fff; font-size: 1.1rem; } /* Clean white amount */
    
    .empty-state { color: #94a3b8; font-size: 0.9rem; text-align: center; padding: 2rem 0; font-style: italic; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats: any = {};
  healthPercentage = 0;
  atms: any[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    combineLatest([this.adminService.atms$, this.adminService.logs$]).subscribe(([atms, logs]) => {
      this.atms = atms || [];
      this.stats = this.adminService.getDashboardStats();
      this.healthPercentage = this.stats.totalAtms ? (this.stats.activeAtms / this.stats.totalAtms * 100) : 0;
    });
  }

  getAlertTypeText(type: string): string {
    if (!type) return 'Bilinmeyen Hata';
    const typeUpper = type.toUpperCase();
    
    if (typeUpper.includes('PARA ÇEKME') || typeUpper.includes('WITHDRAW')) {
      return 'Başarısız Para Çekme';
    }
    if (typeUpper.includes('PARA YATIRMA') || typeUpper.includes('DEPOSIT')) {
      return 'Başarısız Para Yatırma';
    }
    if (typeUpper.includes('TRANSFER') || typeUpper.includes('HAVALE') || typeUpper.includes('EFT')) {
      return 'Başarısız Para Transferi';
    }
    if (typeUpper.includes('FATURA') || typeUpper.includes('BILL')) {
      return 'Başarısız Fatura Ödeme';
    }
    return type;
  }

  getAtmName(atmId: any): string {
    if (!atmId) return 'ATM';
    const idStr = String(atmId).trim();
    const atm = this.atms.find(a => String(a.id) === idStr);
    return atm ? (atm.location || `ATM #${atmId}`) : `ATM #${atmId}`;
  }
}
