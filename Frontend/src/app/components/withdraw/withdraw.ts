import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AtmService } from '../../services/atm.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-withdraw',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="atm-screen-content">
      <div class="screen-header">
        <div class="balance-tag-top">BAKİYE: ₺{{ (atmService.balance$ | async) | number:'1.2-2' }}</div>
        <h1>PARA ÇEKME</h1>
        <p>Tutarı seçin veya girin, ardından ONAYLA'ya basın</p>
      </div>

      <div class="withdraw-layout">
        <div class="quick-amounts">
          <button class="side-btn" (click)="amount = 20">20 ₺ ◀</button>
          <button class="side-btn" (click)="amount = 50">50 ₺ ◀</button>
          <button class="side-btn" (click)="amount = 100">100 ₺ ◀</button>
        </div>

        <div class="custom-withdraw">
          <div class="input-wrapper">
            <label>ÇEKİLECEK TUTAR</label>
            <input type="number" [(ngModel)]="amount" placeholder="0" (keyup.enter)="onConfirmWithdraw()">
          </div>
        </div>

        <div class="quick-amounts right">
          <button class="side-btn text-right" (click)="amount = 200">▶ 200 ₺</button>
          <button class="side-btn text-right" (click)="amount = 500">▶ 500 ₺</button>
          <button class="side-btn text-right" (click)="amount = 1000">▶ 1000 ₺</button>
        </div>
      </div>

      <div class="screen-footer-combined">
        <button class="back-btn-alt" (click)="goBack()">◀ GERİ DÖN</button>
        <button class="atm-action-btn" [disabled]="!amount || amount < 10 || isLoading" (click)="onConfirmWithdraw()">
          {{ isLoading ? 'LÜTFEN BEKLEYİN...' : 'ONAYLA' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .atm-screen-content {
      height: 600px; background: #001f3f; color: #fff; display: flex; flex-direction: column;
      justify-content: space-between; padding: 2rem; font-family: 'Courier New', Courier, monospace; text-transform: uppercase;
    }
    .screen-header { text-align: center; border-bottom: 2px solid #e74c3c; padding-bottom: 1rem; position: relative; }
    .balance-tag-top { 
      position: absolute; right: 0; top: -10px; background: #e74c3c; color: #fff; padding: 0.4rem 1rem; 
      font-size: 0.9rem; font-weight: 900; border-radius: 5px;
    }

    .withdraw-layout { flex: 1; display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; }
    .quick-amounts { display: flex; flex-direction: column; gap: 1.5rem; }
    .side-btn {
      background: #2c3e50; color: #fff; border: 2px solid #e74c3c; padding: 1rem 1.2rem;
      font-size: 1.1rem; font-weight: 900; cursor: pointer; min-width: 140px;
    }
    .side-btn:hover { background: #e74c3c; color: #fff; }
    .text-right { text-align: right; }

    .custom-withdraw { flex: 1; display: flex; flex-direction: column; align-items: center; }
    .input-wrapper { display: flex; flex-direction: column; align-items: center; gap: 0.8rem; }
    .input-wrapper label { color: #e74c3c; font-weight: bold; font-size: 0.9rem; }
    .input-wrapper input {
      background: #000; border: 2px solid #333; padding: 1rem; color: #fff;
      font-size: 2.5rem; width: 220px; text-align: center; border-radius: 10px; outline: none;
    }

    .screen-footer-combined { display: flex; align-items: center; justify-content: center; gap: 2rem; }
    .back-btn-alt {
      background: none; border: 1px solid #888; color: #888; padding: 1rem 2rem;
      font-weight: 900; border-radius: 10px; cursor: pointer; font-size: 1.1rem;
    }
    .back-btn-alt:hover { border-color: #fff; color: #fff; }

    .atm-action-btn {
      width: 40%; padding: 1.2rem; background: #c0392b; color: #fff; border: none;
      border-radius: 10px; font-size: 1.4rem; font-weight: 900; cursor: pointer;
    }
    .atm-action-btn:disabled { background: #333; color: #666; }
  `]
})
export class WithdrawComponent {
  amount: number | null = null;
  isLoading: boolean = false;

  constructor(
    public atmService: AtmService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  onConfirmWithdraw() {
    if (!this.amount || this.amount < 10) return;
    this.isLoading = true;
    
    this.atmService.withdraw(this.amount).subscribe({
      next: (result) => {
        if (result.success) {
          this.playMoneySound();
          this.notificationService.show(`${this.amount} TL çekildi. Paranız hazırlanıyor...`, 'success');
          // Keep isLoading active during the audio playback
          setTimeout(() => {
            this.isLoading = false;
            window.history.back();
          }, 2500);
        } else {
          this.isLoading = false;
          this.notificationService.show(result.message, 'error');
        }
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.show('Bir hata oluştu!', 'error');
      }
    });
  }

  playMoneySound() {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const startTime = audioCtx.currentTime;
      const duration = 1.8;
      
      // 1. Smooth High-speed Motor Whir (running from 0.0s to 1.8s)
      const motorOsc = audioCtx.createOscillator();
      const motorGain = audioCtx.createGain();
      const motorFilter = audioCtx.createBiquadFilter();
      
      motorOsc.type = 'triangle';
      motorOsc.frequency.setValueAtTime(220, startTime);
      
      motorFilter.type = 'bandpass';
      motorFilter.frequency.setValueAtTime(300, startTime);
      motorFilter.Q.setValueAtTime(1.0, startTime);
      
      motorOsc.connect(motorFilter);
      motorFilter.connect(motorGain);
      motorGain.connect(audioCtx.destination);
      
      motorGain.gain.setValueAtTime(0, startTime);
      motorGain.gain.linearRampToValueAtTime(0.03, startTime + 0.2); // Smooth fade in
      motorGain.gain.setValueAtTime(0.03, startTime + 1.5);
      motorGain.gain.linearRampToValueAtTime(0, startTime + 1.8); // Fade out
      
      motorOsc.start(startTime);
      motorOsc.stop(startTime + 1.9);

      // 2. High-speed Bill Flutter (running from 0.3s to 1.4s)
      const billCount = 18;
      const billInterval = 0.06; // 60ms - high speed!
      const billStart = 0.3;
      
      // Create white noise buffer for crisp paper snaps
      const noiseBufferSize = audioCtx.sampleRate * 0.08; // 80ms of noise per bill
      const noiseBuffer = audioCtx.createBuffer(1, noiseBufferSize, audioCtx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBufferSize; i++) {
        noiseData[i] = Math.random() * 2 - 1;
      }
      
      for (let i = 0; i < billCount; i++) {
        const time = startTime + billStart + (i * billInterval);
        
        // A. Crisp Paper Slide (highpass filtered noise)
        const noiseSource = audioCtx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        
        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(2000, time);
        
        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0, time);
        noiseGain.gain.linearRampToValueAtTime(0.12, time + 0.01);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        
        noiseSource.start(time);
        noiseSource.stop(time + 0.08);
        
        // B. Light Mechanical Roller Click
        const clickOsc = audioCtx.createOscillator();
        const clickGain = audioCtx.createGain();
        
        clickOsc.type = 'sine';
        clickOsc.frequency.setValueAtTime(700, time);
        clickOsc.frequency.exponentialRampToValueAtTime(150, time + 0.015);
        
        clickOsc.connect(clickGain);
        clickGain.connect(audioCtx.destination);
        
        clickGain.gain.setValueAtTime(0, time);
        clickGain.gain.linearRampToValueAtTime(0.15, time + 0.002);
        clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
        
        clickOsc.start(time);
        clickOsc.stop(time + 0.03);
      }
      
      // 3. Light Tray Sliding Sound (at 1.5s) - no heavy thud!
      const slideTime = startTime + 1.5;
      
      const slideSource = audioCtx.createBufferSource();
      const slideBufferSize = audioCtx.sampleRate * 0.3;
      const slideBuffer = audioCtx.createBuffer(1, slideBufferSize, audioCtx.sampleRate);
      const slideData = slideBuffer.getChannelData(0);
      for (let i = 0; i < slideBufferSize; i++) {
        slideData[i] = Math.random() * 2 - 1;
      }
      slideSource.buffer = slideBuffer;
      
      const slideFilter = audioCtx.createBiquadFilter();
      slideFilter.type = 'lowpass';
      slideFilter.frequency.setValueAtTime(800, slideTime);
      slideFilter.frequency.exponentialRampToValueAtTime(250, slideTime + 0.25);
      
      const slideGain = audioCtx.createGain();
      slideGain.gain.setValueAtTime(0, slideTime);
      slideGain.gain.linearRampToValueAtTime(0.06, slideTime + 0.05);
      slideGain.gain.exponentialRampToValueAtTime(0.001, slideTime + 0.28);
      
      slideSource.connect(slideFilter);
      slideFilter.connect(slideGain);
      slideGain.connect(audioCtx.destination);
      
      slideSource.start(slideTime);
      slideSource.stop(slideTime + 0.3);
      
      // Light mechanical click at the end of slide
      const latchOsc = audioCtx.createOscillator();
      const latchGain = audioCtx.createGain();
      latchOsc.type = 'triangle';
      latchOsc.frequency.setValueAtTime(600, slideTime + 0.22);
      latchOsc.frequency.exponentialRampToValueAtTime(200, slideTime + 0.26);
      
      latchOsc.connect(latchGain);
      latchGain.connect(audioCtx.destination);
      
      latchGain.gain.setValueAtTime(0, slideTime + 0.22);
      latchGain.gain.linearRampToValueAtTime(0.08, slideTime + 0.23);
      latchGain.gain.exponentialRampToValueAtTime(0.001, slideTime + 0.26);
      
      latchOsc.start(slideTime + 0.22);
      latchOsc.stop(slideTime + 0.28);
      
      // 4. ATM Reminder Beep (at 1.9s)
      const beepTime = startTime + 1.9;
      const beepOsc = audioCtx.createOscillator();
      const beepGain = audioCtx.createGain();
      
      beepOsc.type = 'sine';
      beepOsc.frequency.setValueAtTime(2000, beepTime);
      
      beepOsc.connect(beepGain);
      beepGain.connect(audioCtx.destination);
      
      beepGain.gain.setValueAtTime(0, beepTime);
      beepGain.gain.linearRampToValueAtTime(0.08, beepTime + 0.02);
      beepGain.gain.setValueAtTime(0.08, beepTime + 0.12);
      beepGain.gain.exponentialRampToValueAtTime(0.001, beepTime + 0.18);
      
      beepOsc.start(beepTime);
      beepOsc.stop(beepTime + 0.25);
      
    } catch (e) {
      console.warn('AudioContext failed:', e);
    }
  }

  goBack() {
    window.history.back();
  }
}
