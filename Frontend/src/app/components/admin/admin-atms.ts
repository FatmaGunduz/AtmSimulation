import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AdminService, AtmNode, BanknoteInventory } from '../../services/admin.service';

@Component({
  selector: 'app-admin-atms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-content">
      <div class="header-row">
        <h1 class="page-title">🏧 ATM Filo Yönetimi</h1>
        <button class="refresh-btn" (click)="loadAtms()">🔄 Yenile</button>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ATM</th>
              <th>Durum / Kontrol</th>
              <th>Nakit Seviyesi</th>
              <th>Arızalar</th>
              <th>Son Bakım</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
<tr *ngFor="let atm of atms; trackBy: trackByAtmId"
                [class.row-online]="atm.status === 'ONLINE'"
                [class.row-error]="atm.status === 'ERROR'"
                [class.row-offline]="atm.status === 'OFFLINE'">

              <!-- ATM Kimliği -->
              <td>
                <div class="atm-id">{{ atm.id }}</div>
                <div class="atm-loc">{{ atm.location }}</div>
              </td>

              <!-- TOGGLE SWITCH + Durum -->
              <td>
                <div class="status-control" (click)="toggleStatus(atm.id)" title="Açmak/Kapatmak için tıkla">
                  <div class="toggle-switch" [class.is-on]="atm.status === 'ONLINE'">
                    <div class="toggle-knob"></div>
                  </div>
                  <span class="status-badge" [ngClass]="atm.status.toLowerCase()">{{ atm.status }}</span>
                </div>
              </td>

              <!-- Nakit Seviyesi -->
              <td>
                <div class="bar-wrap">
                  <div class="bar-track">
                    <div class="bar-fill"
                         [style.width]="atm.cashLevel + '%'"
                         [style.background]="atm.cashLevel < 20 ? '#ef4444' : atm.cashLevel < 50 ? '#f59e0b' : '#10b981'">
                    </div>
                  </div>
                  <span class="bar-label">%{{ atm.cashLevel }}</span>
                </div>
                <div class="cash-val">₺{{ adminService.calculateCashTotal(atm.banknotes) | number:'1.0-0' }}</div>
              </td>

              <!-- Arızalar -->
              <td class="issues-cell">
                <span class="no-issue" *ngIf="atm.issues.length === 0">—</span>
                <span class="issue-tag" *ngFor="let issue of atm.issues">{{ issue }}</span>
              </td>

              <!-- Son Bakım -->
              <td class="date-cell">{{ atm.lastMaintenance | date:'dd.MM.yy HH:mm' }}</td>

              <!-- İşlemler -->
              <td class="actions-cell">
                <button class="act-btn fix" *ngIf="atm.issues.length > 0" (click)="fixAtm(atm.id)" title="Tüm arızaları temizle">
                  🛠️
                </button>
                <button class="act-btn report" (click)="openReportModal(atm)" title="Arıza Bildir">
                  ⚠️
                </button>
                <button class="act-btn refill" (click)="openInventoryModal(atm)" title="Envanter Yönet">
                  💰
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ═══════════════════════════════════════ -->
      <!-- MODAL: ARIZA BİLDİR                    -->
      <!-- ═══════════════════════════════════════ -->
      <div class="modal-overlay" *ngIf="isReportModalOpen" (click)="closeReportModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2>⚠️ Arıza Bildirimi</h2>
              <p>{{ reportingAtm?.id }} — {{ reportingAtm?.location }}</p>
            </div>
            <button class="close-btn" (click)="closeReportModal()">✕</button>
          </div>
          <div class="modal-body">
            <div *ngIf="reportingAtm && reportingAtm.issues.length > 0">
              <p class="section-label">Mevcut Sorunlar</p>
              <div class="issue-item" *ngFor="let issue of reportingAtm.issues">
                <span>{{ issue }}</span>
                <button class="mini-remove" (click)="removeIssue(issue)">✕ Kaldır</button>
              </div>
            </div>
            <div class="no-issues-box" *ngIf="reportingAtm && reportingAtm.issues.length === 0">
              ✅ Kayıtlı sorun bulunmamaktadır.
            </div>

            <p class="section-label" style="margin-top:1.2rem">Hızlı Arıza Ekle</p>
            <div class="preset-issues">
              <button *ngFor="let preset of presetIssues" class="preset-btn" (click)="addPresetIssue(preset)">
                {{ preset }}
              </button>
            </div>

            <p class="section-label" style="margin-top:1rem">Özel Açıklama</p>
            <div class="custom-issue-row">
              <input type="text" [(ngModel)]="customIssue" placeholder="Açıklama girin..." (keyup.enter)="addCustomIssue()">
              <button class="act-btn fix" (click)="addCustomIssue()">Ekle</button>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeReportModal()">Kapat</button>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════ -->
      <!-- MODAL: ENVANTER YÖNETİMİ              -->
      <!-- ═══════════════════════════════════════ -->
      <div class="modal-overlay" *ngIf="isModalOpen" (click)="closeModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2>💰 Nakit Envanter Yönetimi</h2>
              <p>{{ editingAtm?.id }} — {{ editingAtm?.location }}</p>
            </div>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="inventory-grid">
              <div class="banknote-row">
                <div class="banknote-label">💵 200 TL</div>
                <input type="number" [(ngModel)]="editBanknotes.b200" min="0">
                <div class="subtotal">₺{{ (editBanknotes.b200 * 200) | number:'1.0-0' }}</div>
              </div>
              <div class="banknote-row">
                <div class="banknote-label">💵 100 TL</div>
                <input type="number" [(ngModel)]="editBanknotes.b100" min="0">
                <div class="subtotal">₺{{ (editBanknotes.b100 * 100) | number:'1.0-0' }}</div>
              </div>
              <div class="banknote-row">
                <div class="banknote-label">💵 50 TL</div>
                <input type="number" [(ngModel)]="editBanknotes.b50" min="0">
                <div class="subtotal">₺{{ (editBanknotes.b50 * 50) | number:'1.0-0' }}</div>
              </div>
              <div class="banknote-row">
                <div class="banknote-label">💵 20 TL</div>
                <input type="number" [(ngModel)]="editBanknotes.b20" min="0">
                <div class="subtotal">₺{{ (editBanknotes.b20 * 20) | number:'1.0-0' }}</div>
              </div>
              <div class="banknote-row">
                <div class="banknote-label">💵 10 TL</div>
                <input type="number" [(ngModel)]="editBanknotes.b10" min="0">
                <div class="subtotal">₺{{ (editBanknotes.b10 * 10) | number:'1.0-0' }}</div>
              </div>
            </div>
            <div class="total-summary">
              <span>Toplam ATM Bakiyesi:</span>
              <span class="total-val">₺{{ adminService.calculateCashTotal(editBanknotes) | number:'1.2-2' }}</span>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeModal()">İptal</button>
            <button class="btn-save" (click)="saveInventory()">Kasetleri Güncelle</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page-content { display: flex; flex-direction: column; gap: 1.5rem; }
    .header-row { display: flex; justify-content: space-between; align-items: center; }
    .page-title { color: #fff; font-size: 1.8rem; font-weight: 700; margin: 0; }
    .refresh-btn { 
      background: rgba(255, 255, 255, 0.05); 
      border: 1px solid rgba(255, 255, 255, 0.1); 
      padding: 0.5rem 1rem; 
      border-radius: 8px; 
      cursor: pointer; 
      font-weight: bold; 
      color: #fff; 
      transition: all 0.2s;
    }
    .refresh-btn:hover { background: rgba(255, 255, 255, 0.1); }
 
    /* ── TABLO ── */
    .table-container { 
      background: #202f46; 
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 16px; 
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 10px 30px rgba(0,0,0,0.3); 
      overflow: hidden; 
    }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; }
    .data-table th { 
      background: rgba(15, 23, 42, 0.6); 
      padding: 1rem; 
      color: #94a3b8; 
      font-weight: 600; 
      font-size: 0.8rem; 
      text-transform: uppercase; 
      border-bottom: 2px solid rgba(255, 255, 255, 0.08); 
    }
    .data-table td { padding: 1rem; border-bottom: 1px solid rgba(255, 255, 255, 0.03); vertical-align: middle; color: #ffffff; } /* Changed to white */
 
    .row-online { }
    .row-error { background: rgba(239, 68, 68, 0.04); }
    .row-offline { opacity: 0.65; }
 
    .atm-id { font-weight: 800; color: #fff; font-size: 0.9rem; font-family: monospace; }
    .atm-loc { font-size: 0.78rem; color: #cbd5e1; margin-top: 2px; } /* Lighter grey */
 
    /* ── TOGGLE SWITCH (kompakt) ── */
    .status-control {
      display: flex; align-items: center; gap: 8px;
      cursor: pointer; user-select: none; width: fit-content;
    }
    .status-control:hover { opacity: 0.85; }
    .toggle-switch {
      width: 40px; height: 22px; background: rgba(255, 255, 255, 0.1); border-radius: 11px;
      position: relative; transition: 0.25s; flex-shrink: 0;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .toggle-switch.is-on { background: #10b981; }
    .toggle-knob {
      position: absolute; top: 2px; left: 2px;
      width: 16px; height: 16px; background: #fff; border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: 0.25s;
    }
    .toggle-switch.is-on .toggle-knob { left: calc(100% - 18px); }
 
    .status-badge { padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.72rem; font-weight: 700; }
    .status-badge.online { background: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.1); }
    .status-badge.error { background: rgba(248, 113, 113, 0.15); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.1); }
    .status-badge.offline { background: rgba(255, 255, 255, 0.08); color: #cbd5e1; border: 1px solid rgba(255, 255, 255, 0.05); }
 
    /* ── NAKİT BAR ── */
    .bar-wrap { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }
    .bar-track { width: 80px; height: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 4px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.05); }
    .bar-fill { height: 100%; border-radius: 4px; transition: width 0.4s; }
    .bar-label { font-size: 0.72rem; font-weight: 700; color: #cbd5e1; } /* Lighter grey */
    .cash-val { font-size: 0.78rem; color: #ffffff; font-weight: 600; } /* Lighter grey to white */
 
    /* ── ARIZALAR ── */
    .issues-cell { max-width: 180px; }
    .no-issue { color: #cbd5e1; font-size: 0.85rem; } /* Lighter grey */
    .issue-tag { display: inline-block; background: rgba(248, 113, 113, 0.15); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.1); padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.68rem; font-weight: bold; margin: 2px; }
 
    .date-cell { font-size: 0.78rem; color: #cbd5e1; white-space: nowrap; } /* Lighter grey */
 
    /* ── AKSİYON BUTONLARI (emoji ikonlu, kompakt) ── */
    .actions-cell { display: flex; gap: 0.4rem; }
    .act-btn { width: 34px; height: 34px; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .act-btn.fix { background: rgba(248, 113, 113, 0.15); color: #f87171; }
    .act-btn.fix:hover { background: rgba(248, 113, 113, 0.28); }
    .act-btn.report { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
    .act-btn.report:hover { background: rgba(251, 191, 36, 0.28); }
    .act-btn.refill { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
    .act-btn.refill:hover { background: rgba(56, 189, 248, 0.28); }
 
    /* ── MODAL ── */
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.7); z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(4px);
    }
    .modal-card {
      background: #202f46; width: 100%; max-width: 480px; border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex; flex-direction: column; overflow: hidden; max-height: 90vh;
      color: #fff;
    }
    .modal-header { padding: 1.2rem 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05); background: rgba(15, 23, 42, 0.4); display: flex; justify-content: space-between; align-items: flex-start; }
    .modal-header h2 { margin: 0; font-size: 1.15rem; color: #fff; }
    .modal-header p { margin: 2px 0 0; font-size: 0.8rem; color: #94a3b8; }
    .close-btn { background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #64748b; margin-left: 1rem; transition: color 0.2s; }
    .close-btn:hover { color: #fff; }
    .modal-body { padding: 1.5rem; overflow-y: auto; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.05); display: flex; justify-content: flex-end; gap: 0.8rem; background: rgba(15, 23, 42, 0.4); }
    .modal-footer button { padding: 0.65rem 1.3rem; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.2s; }
    .btn-cancel { background: rgba(255, 255, 255, 0.08); color: #cbd5e1; }
    .btn-cancel:hover { background: rgba(255, 255, 255, 0.15); }
    .btn-save { background: #10b981; color: #fff; }
    .btn-save:hover { background: #059669; }
 
    .section-label { margin: 0 0 0.5rem; font-size: 0.78rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .issue-item { display: flex; justify-content: space-between; align-items: center; background: rgba(248, 113, 113, 0.15); border-radius: 8px; padding: 0.5rem 0.8rem; margin-bottom: 0.4rem; font-size: 0.82rem; font-weight: bold; color: #f87171; border: 1px solid rgba(248, 113, 113, 0.1); }
    .mini-remove { background: rgba(248, 113, 113, 0.2); border: none; color: #f87171; cursor: pointer; font-size: 0.7rem; font-weight: bold; padding: 0.2rem 0.5rem; border-radius: 4px; transition: all 0.2s; }
    .mini-remove:hover { background: #ef4444; color: #fff; }
    .no-issues-box { background: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.1); padding: 0.7rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: bold; }
    .preset-issues { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .preset-btn { background: rgba(251, 191, 36, 0.1); border: 1.5px solid rgba(251, 191, 36, 0.2); color: #fbbf24; padding: 0.3rem 0.6rem; border-radius: 8px; cursor: pointer; font-size: 0.72rem; font-weight: bold; transition: all 0.2s; }
    .preset-btn:hover { background: rgba(251, 191, 36, 0.2); }
    .custom-issue-row { display: flex; gap: 0.5rem; }
    .custom-issue-row input { flex: 1; padding: 0.55rem 0.8rem; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; outline: none; font-size: 0.88rem; color: #fff; }
    .custom-issue-row input:focus { border-color: #ef4444; }
 
    .inventory-grid { display: flex; flex-direction: column; gap: 0.8rem; }
    .banknote-row { display: flex; align-items: center; gap: 1rem; }
    .banknote-label { width: 85px; font-weight: bold; color: #cbd5e1; font-size: 0.9rem; }
    .banknote-row input { flex: 1; padding: 0.55rem; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; font-size: 1rem; text-align: center; font-weight: bold; outline: none; color: #fff; }
    .banknote-row input:focus { border-color: #3b82f6; }
    .subtotal { width: 85px; text-align: right; color: #64748b; font-weight: 600; font-size: 0.82rem; }
    .total-summary { margin-top: 1.2rem; padding-top: 1rem; border-top: 2px dashed rgba(255, 255, 255, 0.1); display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
    .total-val { font-size: 1.3rem; color: #10b981; font-weight: 900; }
  `]
})
export class AtmManagementComponent implements OnInit, OnDestroy {
  atms: AtmNode[] = [];
  private atmSubscription: Subscription | null = null;
  
  isModalOpen = false;
  editingAtm: AtmNode | null = null;
  editBanknotes: BanknoteInventory = { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0 };

  isReportModalOpen = false;
  reportingAtm: AtmNode | null = null;
  customIssue = '';
  presetIssues = [
    'Kart Okuyucu Arızası', 'Kasa Sıkışması', 'Para Dispansar Arızası',
    'Dokunmatik Ekran Arızası', 'Bağlantı Koptu', 'Kamera Arızası', 'Makbuz Yazıcı Boş'
  ];

  constructor(public adminService: AdminService) {}

  ngOnInit() {
    this.atmSubscription = this.adminService.atms$.subscribe(data => {
      this.atms = data;
      if (this.reportingAtm) {
        this.reportingAtm = data.find(a => a.id === this.reportingAtm!.id) || null;
      }
    });
    this.adminService.refreshAtms();
  }

  ngOnDestroy() {
    this.atmSubscription?.unsubscribe();
  }

  loadAtms() {
    this.adminService.refreshAtms();
  }

  fixAtm(id: string) { this.adminService.fixAtmIssue(id); }
  toggleStatus(id: string) { this.adminService.toggleAtmStatus(id); }

  openInventoryModal(atm: AtmNode) {
    this.editingAtm = atm;
    this.editBanknotes = JSON.parse(JSON.stringify(atm.banknotes));
    this.isModalOpen = true;
  }

  trackByAtmId(index: number, atm: AtmNode) {
    return atm.id;
  }
  closeModal() { this.isModalOpen = false; this.editingAtm = null; }
  saveInventory() {
    if (!this.editingAtm) return;

    const normalizedInventory: BanknoteInventory = {
      b200: Number(this.editBanknotes.b200),
      b100: Number(this.editBanknotes.b100),
      b50: Number(this.editBanknotes.b50),
      b20: Number(this.editBanknotes.b20),
      b10: Number(this.editBanknotes.b10)
    };

    this.editingAtm.banknotes = { ...normalizedInventory };
    this.editingAtm.cashLevel = this.adminService.calculateCashLevel(normalizedInventory);

    this.adminService.updateInventory(this.editingAtm.id, normalizedInventory).subscribe({
      next: () => {
        this.closeModal();
      },
      error: () => {
        this.closeModal();
      }
    });
  }

  openReportModal(atm: AtmNode) {
    this.reportingAtm = atm;
    this.customIssue = '';
    this.isReportModalOpen = true;
  }
  closeReportModal() { this.isReportModalOpen = false; this.reportingAtm = null; }

  addPresetIssue(issue: string) {
    if (!this.reportingAtm || this.reportingAtm.issues.includes(issue)) return;
    this.adminService.addIssueToAtm(this.reportingAtm.id, issue);
  }
  addCustomIssue() {
    if (!this.reportingAtm || !this.customIssue.trim()) return;
    this.adminService.addIssueToAtm(this.reportingAtm.id, this.customIssue.trim());
    this.customIssue = '';
  }
  removeIssue(issue: string) {
    if (!this.reportingAtm) return;
    this.adminService.removeIssueFromAtm(this.reportingAtm.id, issue);
  }
}
