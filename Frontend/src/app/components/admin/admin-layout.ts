import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
    <div class="admin-container">
      
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo">🏦 BANK ADMIN</div>
        </div>
        
        <nav class="sidebar-nav">
          <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-item">
            <span class="icon">📊</span>
            <span class="text">Dashboard</span>
          </a>
          <a routerLink="/admin/atms" routerLinkActive="active" class="nav-item">
            <span class="icon">🏧</span>
            <span class="text">ATM Yönetimi</span>
          </a>
          <a routerLink="/admin/customers" routerLinkActive="active" class="nav-item">
            <span class="icon">👥</span>
            <span class="text">Müşteriler</span>
          </a>
          <a routerLink="/admin/transactions" routerLinkActive="active" class="nav-item">
            <span class="icon">📜</span>
            <span class="text">İşlem İzleme (Log)</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <button class="logout-btn" (click)="logout()">
            <span class="icon">🚪</span> Sistemden Çık
          </button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="main-wrapper">
        
        <!-- Top Header -->
        <header class="top-header">
          <div class="header-title">Banka Yönetim Merkezi</div>
          <div class="header-profile">
            <div class="avatar">AD</div>
            <span class="name">Sistem Yöneticisi</span>
          </div>
        </header>

        <!-- Dynamic Content -->
        <main class="content-area">
          <router-outlet></router-outlet>
        </main>

      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      display: flex;
      height: 100vh;
      background: #18253b; /* Slightly lighter, richer dark steel blue */
      color: #f8fafc;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
 
    /* SIDEBAR */
    .sidebar {
      width: 280px;
      background: #0f172a; /* Solid Slate 900 for solid contrast */
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      color: #fff;
      display: flex;
      flex-direction: column;
      z-index: 10;
    }
 
    .sidebar-header {
      padding: 2rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .logo { 
      font-size: 1.4rem; 
      font-weight: 800; 
      letter-spacing: -0.025em; 
      background: linear-gradient(135deg, #38bdf8, #818cf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
 
    .sidebar-nav {
      flex: 1;
      padding: 1.5rem 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
 
    .nav-item {
      display: flex;
      align-items: center;
      padding: 0.9rem 1.5rem;
      color: #cbd5e1; /* Slate 300 - much lighter and more readable than 94a3b8 */
      text-decoration: none;
      transition: all 0.3s ease;
      border-left: 4px solid transparent;
      font-weight: 600; /* Made slightly bolder */
    }
    .nav-item:hover { background: rgba(255, 255, 255, 0.05); color: #fff; }
    .nav-item.active { 
      background: linear-gradient(90deg, rgba(56, 189, 248, 0.15), rgba(99, 102, 241, 0.02)); 
      border-left-color: #38bdf8; 
      color: #38bdf8; 
      font-weight: bold; 
    }
    .nav-item .icon { font-size: 1.2rem; margin-right: 1rem; }
 
    .sidebar-footer { padding: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.05); }
    .logout-btn {
      width: 100%; 
      padding: 0.8rem; 
      background: rgba(239, 68, 68, 0.1); 
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #ef4444; 
      border-radius: 10px; 
      font-weight: bold; 
      cursor: pointer; 
      transition: all 0.3s ease;
    }
    .logout-btn:hover { 
      background: #ef4444; 
      color: #fff; 
      box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
    }
 
    /* MAIN WRAPPER */
    .main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
 
    /* TOP HEADER */
    .top-header {
      height: 70px;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      z-index: 5;
    }
    .header-title { font-size: 1.15rem; font-weight: 700; color: #fff; }
    .header-profile { display: flex; align-items: center; gap: 0.85rem; }
    .avatar { 
      width: 36px; 
      height: 36px; 
      border-radius: 50%; 
      background: linear-gradient(135deg, #38bdf8, #818cf8); 
      color: #fff; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-weight: bold; 
      font-size: 0.85rem;
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
    }
    .name { font-weight: 600; color: #cbd5e1; font-size: 0.9rem; }
 
    /* CONTENT AREA */
    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
      position: relative;
    }
  `]
})
export class AdminLayoutComponent {
  constructor(private router: Router) {}

  logout() {
    localStorage.removeItem('admin_token');
    this.router.navigate(['/login']);
  }
}
