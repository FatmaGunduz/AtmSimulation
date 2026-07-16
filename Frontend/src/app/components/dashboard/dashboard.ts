import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AtmService } from '../../services/atm.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="atm-screen-main">
      
      <!-- Üst Bilgi Barı -->
      <div class="screen-header-atm">
        <div class="user-tag">{{ atmService.customerName$ | async }}</div>
        <div class="date-tag">{{ now | date:'dd.MM.yyyy HH:mm' }}</div>
      </div>

      <!-- Orta Bilgi Alanı -->
      <div class="screen-center">
        <div class="balance-display">
          <span class="label">KULLANILABİLİR BAKİYE</span>
          <h2 class="amount">₺{{ (atmService.balance$ | async) | number:'1.2-2' }}</h2>
        </div>
      </div>

      <!-- ATM Menü Butonları (Yanlara Dizili) -->
      <div class="atm-menu-grid">
        <div class="menu-left">
          <button class="side-btn" (click)="navigate('withdraw')">PARA ÇEK <span class="arrow">◀</span></button>
          <button class="side-btn" (click)="navigate('deposit')">PARA YATIR <span class="arrow">◀</span></button>
        </div>
        
        <div class="menu-right">
          <button class="side-btn text-right" (click)="navigate('transfer')"><span class="arrow">▶</span> TRANSFER</button>
          <button class="side-btn text-right" (click)="navigate('change-pin')"><span class="arrow">▶</span> PIN DEĞİŞTİR</button>
          <button class="side-btn text-right logout" (click)="logout()"><span class="arrow">▶</span> KART İADE</button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .atm-screen-main {
      height: 600px;
      background: #001f3f;
      color: #fff;
      display: flex;
      flex-direction: column;
      font-family: 'Courier New', Courier, monospace;
      position: relative;
      overflow: hidden;
    }

    .screen-header-atm {
      background: rgba(255,255,255,0.1);
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      border-bottom: 2px solid #f1c40f;
    }

    .screen-center {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .balance-display .label { font-size: 1.2rem; color: #f1c40f; letter-spacing: 2px; }
    .balance-display .amount { font-size: 4rem; margin: 1rem 0; text-shadow: 0 0 15px rgba(255,255,255,0.5); }

    .atm-menu-grid {
      display: flex;
      justify-content: space-between;
      padding: 2rem;
      position: absolute;
      bottom: 20px;
      width: 100%;
    }

    .menu-left, .menu-right { display: flex; flex-direction: column; gap: 1.5rem; }

    .side-btn {
      background: #2c3e50;
      color: #fff;
      border: 2px solid #f1c40f;
      padding: 1.2rem 1.5rem;
      font-size: 1.1rem;
      font-weight: 900;
      cursor: pointer;
      min-width: 250px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: 0.3s;
    }
    .side-btn:hover { background: #f1c40f; color: #000; }
    .text-right { justify-content: flex-start; }
    .arrow { font-size: 1.5rem; }
    .logout { border-color: #e74c3c; }
    .logout:hover { background: #e74c3c; color: #fff; }
  `]
})
export class DashboardComponent {
  now = new Date();
  constructor(public atmService: AtmService, private router: Router) {}

  navigate(path: string) {
    this.router.navigate(['/' + path]);
  }

  logout() {
    this.atmService.logout();
    this.router.navigate(['/login']);
  }
}
