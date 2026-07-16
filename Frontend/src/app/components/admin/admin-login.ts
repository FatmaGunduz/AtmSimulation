import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-login-wrapper">
      <!-- Glow background blobs -->
      <div class="glow-blob blob-purple"></div>
      <div class="glow-blob blob-cyan"></div>

      <div class="login-card">
        <div class="logo">
          <span class="bank-emoji">🏛️</span> BANK ADMIN
        </div>
        <p class="subtitle">Banka Yönetim Merkezi Sistemine Güvenli Giriş</p>

        <div class="form-group">
          <label>Yönetici Kullanıcı Adı</label>
          <input type="text" [(ngModel)]="username" placeholder="Örn: admin" autocomplete="off">
        </div>

        <div class="form-group">
          <label>Yetkilendirme Şifresi</label>
          <input type="password" [(ngModel)]="password" placeholder="Şifreniz" (keyup.enter)="login()">
        </div>

        <div class="error-msg" *ngIf="error">⚠️ {{ error }}</div>

        <button class="login-btn" (click)="login()">
          <span>GÜVENLİ GİRİŞ</span>
          <span class="btn-shine"></span>
        </button>
        
        <button class="back-btn" (click)="goBackToAtm()">◀ ATM Ekranına Dön</button>
      </div>
    </div>
  `,
  styles: [`
    .admin-login-wrapper {
      min-height: 100vh;
      background: #0f172a; /* Slate 900 */
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      position: relative;
      overflow: hidden;
    }

    /* Ambient background glow blobs */
    .glow-blob {
      position: absolute;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      filter: blur(140px);
      opacity: 0.35;
      pointer-events: none;
      z-index: 1;
      animation: float 8s infinite alternate ease-in-out;
    }
    .blob-purple {
      background: #7c3aed; /* Violet 600 */
      top: -100px;
      left: -100px;
    }
    .blob-cyan {
      background: #06b6d4; /* Cyan 500 */
      bottom: -100px;
      right: -100px;
      animation-delay: -4s;
    }

    @keyframes float {
      0% { transform: translate(0, 0) scale(1); }
      100% { transform: translate(50px, 30px) scale(1.15); }
    }
    
    .login-card {
      background: rgba(15, 23, 42, 0.55); /* Frosted glass */
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      padding: 3rem 2.5rem;
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
      width: 90%;
      max-width: 420px;
      text-align: center;
      z-index: 10;
      position: relative;
    }

    .logo { 
      font-size: 1.8rem; 
      font-weight: 800; 
      margin-bottom: 0.6rem; 
      letter-spacing: -0.025em;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #38bdf8, #818cf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .bank-emoji {
      -webkit-text-fill-color: initial;
    }
    
    .subtitle { color: #94a3b8; margin-bottom: 2.5rem; font-size: 0.9rem; font-weight: 500; }

    .form-group { display: flex; flex-direction: column; text-align: left; margin-bottom: 1.5rem; gap: 0.5rem; }
    .form-group label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .form-group input {
      padding: 0.9rem 1.1rem; 
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1); 
      border-radius: 12px; 
      font-size: 1rem; 
      color: #fff;
      outline: none; 
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .form-group input::placeholder { color: #475569; }
    .form-group input:focus { 
      border-color: #38bdf8; 
      background: rgba(15, 23, 42, 0.95);
      box-shadow: 0 0 15px rgba(56, 189, 248, 0.25);
    }

    .error-msg { color: #f87171; font-weight: 600; margin-bottom: 1.25rem; font-size: 0.85rem; text-align: left; }

    .login-btn {
      width: 100%; 
      padding: 1.1rem; 
      background: linear-gradient(135deg, #0284c7, #6366f1);
      color: #fff; 
      border: none; 
      border-radius: 12px; 
      font-weight: 700; 
      font-size: 1.05rem; 
      cursor: pointer; 
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      margin-bottom: 1.25rem;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }
    .login-btn:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 8px 24px rgba(99, 102, 241, 0.5);
      background: linear-gradient(135deg, #0ea5e9, #4f46e5);
    }
    .login-btn:active {
      transform: translateY(0);
    }

    .back-btn { 
      background: none; 
      border: none; 
      color: #64748b; 
      cursor: pointer; 
      font-weight: 600; 
      font-size: 0.85rem; 
      transition: color 0.2s; 
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      margin-top: 0.5rem;
    }
    .back-btn:hover { color: #38bdf8; }
  `]
})
export class AdminLoginComponent {
  username = 'admin';
  password = '';
  error = '';

  constructor(
    private router: Router, 
    private notificationService: NotificationService,
    private adminService: AdminService
  ) {}

  login() {
    if (!this.username || !this.password) {
      this.error = 'Kullanıcı adı ve şifre gereklidir.';
      return;
    }

    this.adminService.login(this.username, this.password).subscribe({
      next: (res) => {
        if (res.success) {
          localStorage.setItem('admin_token', 'true'); // Guard için
          this.notificationService.show('Yönetici sistemine giriş yapıldı.', 'success');
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.error = res.message || 'Giriş başarısız!';
        }
      },
      error: (err) => {
        this.error = 'Bağlantı hatası! Lütfen backendin çalıştığından emin olun.';
      }
    });
  }

  goBackToAtm() {
    this.router.navigate(['/login']);
  }
}
