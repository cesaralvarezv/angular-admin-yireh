import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="brand-logo">☕</div>
          <h2>Yireh Store Admin</h2>
          <p>Portal Administrativo & Punto de Venta (POS)</p>
        </div>

        <form (ngSubmit)="onLogin()" class="login-form">
          <div *ngIf="errorMessage()" class="alert-error">
            {{ errorMessage() }}
          </div>

          <div class="form-group">
            <label for="email">Correo Institucional</label>
            <input
              id="email"
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              class="form-input"
              placeholder="ejemplo@yirehstore.com"
            />
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <input
              id="password"
              type="password"
              [(ngModel)]="password"
              name="password"
              required
              class="form-input"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" [disabled]="loading()" class="btn btn-primary btn-block">
            <span *ngIf="!loading()">Iniciar Sesión</span>
            <span *ngIf="loading()">Autenticando...</span>
          </button>
        </form>

        <div class="demo-logins">
          <p class="demo-title">Acceso rápido de prueba:</p>
          <div class="demo-buttons">
            <button type="button" class="btn btn-secondary btn-sm" (click)="fillDemo('admin')">
              👔 Gerente / Admin
            </button>
            <button type="button" class="btn btn-secondary btn-sm" (click)="fillDemo('cashier')">
              🛒 Cajero Mostrador
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background: radial-gradient(circle at 50% 20%, #1e1b4b 0%, #0b0f19 80%);
    }
    .login-card {
      width: 100%;
      max-width: 440px;
      background: rgba(20, 30, 51, 0.75);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(79, 70, 229, 0.25);
      border-radius: 20px;
      padding: 2.5rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }
    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .brand-logo {
      font-size: 3rem;
      margin-bottom: 0.5rem;
      display: inline-block;
      filter: drop-shadow(0 0 12px rgba(99, 102, 241, 0.5));
    }
    .login-header h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #fff;
    }
    .login-header p {
      color: #94a3b8;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
    .form-group {
      margin-bottom: 1.25rem;
    }
    .form-group label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 0.5rem;
    }
    .btn-block {
      width: 100%;
      padding: 0.85rem;
      font-size: 0.95rem;
      margin-top: 0.5rem;
    }
    .alert-error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid #ef4444;
      color: #fca5a5;
      padding: 0.75rem;
      border-radius: 8px;
      font-size: 0.8125rem;
      margin-bottom: 1.25rem;
      text-align: center;
    }
    .demo-logins {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      text-align: center;
    }
    .demo-title {
      font-size: 0.75rem;
      color: #64748b;
      margin-bottom: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .demo-buttons {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }
    .btn-sm {
      font-size: 0.75rem;
      padding: 0.4rem 0.75rem;
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  errorMessage = signal('');

  constructor(private authService: AuthService, private router: Router) {}

  onLogin(): void {
    if (!this.email || !this.password) {
      this.errorMessage.set('Por favor completa todos los campos.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        if (this.authService.isCashier() && !this.authService.isAdmin()) {
          this.router.navigate(['/pos']);
        } else {
          this.router.navigate(['/analytics']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.error?.message || 'Credenciales inválidas o error de conexión con el backend.'
        );
      }
    });
  }

  fillDemo(type: 'admin' | 'cashier'): void {
    if (type === 'admin') {
      this.email = 'admin@yirehstore.com';
      this.password = 'Admin123456';
    } else {
      this.email = 'cajero@yirehstore.com';
      this.password = 'Cajero123456';
    }
  }
}
