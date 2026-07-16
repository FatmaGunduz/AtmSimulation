import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <router-outlet></router-outlet>

    <!-- Global Bildirim Kutusu -->
    <div class="toast-wrapper" *ngIf="notificationService.notification$ | async as n">
      <div class="toast-container" [ngClass]="n.type">
        <div class="toast-icon">{{ n.type === 'success' ? '✅' : n.type === 'error' ? '❌' : 'ℹ️' }}</div>
        <div class="toast-message">{{ n.message }}</div>
      </div>
    </div>
  `,
  styles: [`
    /* Bildirimler (Sistem genelinde aynı kalmalı) */
    .toast-wrapper { position: fixed; top: 30px; right: 30px; z-index: 10000; }
    .toast-container { 
      padding: 1rem 2rem; border-radius: 12px; display: flex; align-items: center; gap: 1rem; color: white;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4); animation: slideIn 0.3s ease-out; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-weight: bold;
    }
    .success { background: #2ecc71; }
    .error { background: #e74c3c; }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
  `]
})
export class App {
  constructor(public notificationService: NotificationService) {}
  protected readonly title = signal('AtmSimulation-ui');
}
