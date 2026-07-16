import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-atm-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <div class="atm-machine-container">
      <!-- ATM Ana Kasa -->
      <div class="atm-body">
        
        <!-- Üst Marka Alanı -->
        <div class="atm-header">
          <div class="brand">BANKA MATIK <span>PREMIUM</span></div>
          <div class="status-led"></div>
        </div>

        <!-- Ana Ekran Alanı (Tüm Sayfalar Burada Açılır) -->
        <div class="atm-screen-frame">
          <div class="screen-glass">
            <router-outlet></router-outlet>
          </div>
        </div>

        <!-- Alt Donanım Paneli -->
        <div class="atm-hardware-panel">
          
          <!-- Kart Giriş Yuvası -->
          <div class="hardware-item card-slot">
            <div class="slot-label">KART GİRİŞİ</div>
            <div class="slot-visual">
              <div class="led-indicator active"></div>
            </div>
          </div>

          <!-- Para Çıkış Haznesi -->
          <div class="hardware-item cash-dispenser">
            <div class="slot-label">PARA ÇIKIŞI</div>
            <div class="dispenser-visual"></div>
          </div>

          <!-- Makbuz Yuvası -->
          <div class="hardware-item receipt-slot">
            <div class="slot-label">MAKBUZ</div>
            <div class="receipt-visual"></div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .atm-machine-container {
      min-height: 100vh;
      background: #1a1a1a;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      font-family: 'Inter', sans-serif;
    }

    /* ATM Kasası Tasarımı */
    .atm-body {
      background: linear-gradient(145deg, #2c3e50, #000000);
      width: 100%;
      max-width: 950px;
      padding: 3rem;
      border-radius: 40px;
      box-shadow: 
        0 30px 60px rgba(0,0,0,0.8),
        inset 0 0 20px rgba(255,255,255,0.1);
      border: 4px solid #34495e;
      position: relative;
    }

    /* ATM Üst Kısım */
    .atm-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding: 0 1rem;
    }
    .brand { color: #ecf0f1; font-weight: 900; font-size: 1.5rem; letter-spacing: 3px; }
    .brand span { color: #f1c40f; font-size: 0.8rem; vertical-align: top; }
    .status-led { width: 12px; height: 12px; background: #2ecc71; border-radius: 50%; box-shadow: 0 0 10px #2ecc71; }

    /* Ekran Çerçevesi */
    .atm-screen-frame {
      background: #000;
      padding: 15px;
      border-radius: 20px;
      box-shadow: inset 0 0 30px rgba(0,0,0,1);
      border: 8px solid #1a1a1a;
    }
    .screen-glass {
      background: #f8fafc;
      border-radius: 10px;
      overflow: hidden;
      min-height: 600px;
      position: relative;
    }

    /* Alt Donanım Paneli */
    .atm-hardware-panel {
      display: grid;
      grid-template-columns: 1fr 2fr 1fr;
      gap: 2rem;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 2px solid rgba(255,255,255,0.05);
    }

    .hardware-item { text-align: center; }
    .slot-label { color: #95a5a6; font-size: 0.7rem; font-weight: 800; margin-bottom: 0.8rem; letter-spacing: 1px; }

    /* Kart Yuvası */
    .slot-visual {
      height: 12px; background: #111; border-radius: 6px;
      position: relative; box-shadow: inset 0 2px 5px rgba(0,0,0,0.5);
      border: 1px solid #333;
    }
    .led-indicator {
      position: absolute; right: -20px; top: 0; width: 8px; height: 8px;
      border-radius: 50%; background: #333;
    }
    .led-indicator.active { background: #2ecc71; box-shadow: 0 0 8px #2ecc71; }

    /* Para Çıkış */
    .dispenser-visual {
      height: 15px; background: #000; border-radius: 4px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      border-bottom: 3px solid #222;
    }

    /* Makbuz */
    .receipt-visual {
      height: 8px; background: #111; border-radius: 4px;
    }
  `]
})
export class AtmLayoutComponent {}
