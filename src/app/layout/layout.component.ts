import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { CashClosureService } from '../core/services/api.services';
import { CashClosure } from '../core/models/models';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <span class="brand-icon">☕</span>
          <div class="brand-info">
            <h1>Yireh Store</h1>
            <span class="brand-badge">Admin & POS</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section-title">Operaciones</div>
          <a routerLink="/pos" routerLinkActive="active" class="nav-link">
            <span class="nav-icon">🛒</span>
            <span>Punto de Venta (POS)</span>
          </a>
          <a routerLink="/cash-closure" routerLinkActive="active" class="nav-link">
            <span class="nav-icon">💰</span>
            <span>Cierre de Caja (Z)</span>
          </a>

          <div class="nav-section-title">Gerencia & Control</div>
          <a routerLink="/analytics" routerLinkActive="active" class="nav-link">
            <span class="nav-icon">📊</span>
            <span>Analítica & Proyecciones</span>
          </a>
          <a routerLink="/assets" routerLinkActive="active" class="nav-link">
            <span class="nav-icon">⚙️</span>
            <span>Inventario de Activos</span>
          </a>
          <a routerLink="/satisfaction" routerLinkActive="active" class="nav-link">
            <span class="nav-icon">⭐</span>
            <span>Encuestas CSAT / NPS</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-profile">
            <div class="user-avatar">
              {{ (currentUser()?.email || 'U')[0].toUpperCase() }}
            </div>
            <div class="user-meta">
              <span class="user-email">{{ currentUser()?.email }}</span>
              <span class="user-role">{{ isAdmin() ? 'Administrador' : 'Cajero Mostrador' }}</span>
            </div>
          </div>
          <button (click)="onLogout()" class="btn-logout" title="Cerrar sesión">
            🚪 Salir
          </button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="main-wrapper">
        <header class="topbar">
          <div class="topbar-left">
            <div class="cash-status-indicator">
              <span class="status-dot" [class.open]="activeClosure()?.status === 'OPEN'"></span>
              <span class="status-text">
                Caja: <strong>{{ activeClosure()?.status === 'OPEN' ? 'ABIERTA (ID #' + activeClosure()?.id + ')' : 'CERRADA' }}</strong>
              </span>
            </div>
          </div>

          <div class="topbar-right">
            <span class="date-chip">{{ todayDate }}</span>
            <button *ngIf="activeClosure()?.status !== 'OPEN'" routerLink="/cash-closure" class="btn btn-warning btn-sm">
              ⚠️ Abrir Turno de Caja
            </button>
          </div>
        </header>

        <section class="content-body">
          <router-outlet></router-outlet>
        </section>
      </main>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      min-height: 100vh;
      background: var(--bg-body);
    }
    .sidebar {
      width: 260px;
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 1.5rem 1.25rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .brand-icon {
      font-size: 2rem;
      filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.4));
    }
    .brand-info h1 {
      font-size: 1.125rem;
      font-weight: 700;
      color: #fff;
    }
    .brand-badge {
      font-size: 0.7rem;
      background: rgba(99, 102, 241, 0.2);
      color: var(--primary-light);
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
    }
    .sidebar-nav {
      flex: 1;
      padding: 1.25rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .nav-section-title {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      padding: 0.75rem 0.75rem 0.25rem;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 0.85rem;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: var(--radius-md);
      transition: var(--transition);
    }
    .nav-link:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #fff;
    }
    .nav-link.active {
      background: linear-gradient(135deg, rgba(79, 70, 229, 0.25) 0%, rgba(99, 102, 241, 0.1) 100%);
      color: #fff;
      border: 1px solid rgba(79, 70, 229, 0.3);
      font-weight: 600;
    }
    .nav-icon {
      font-size: 1.15rem;
    }
    .sidebar-footer {
      padding: 1.25rem;
      border-top: 1px solid var(--border-subtle);
      background: rgba(11, 15, 25, 0.5);
    }
    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.85rem;
    }
    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: white;
    }
    .user-meta {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .user-email {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-role {
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    .btn-logout {
      width: 100%;
      background: none;
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #f87171;
      padding: 0.45rem;
      border-radius: var(--radius-md);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
    }
    .btn-logout:hover {
      background: rgba(239, 68, 68, 0.15);
    }
    .main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
    .topbar {
      height: 64px;
      background: var(--bg-sidebar);
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
    }
    .cash-status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--danger);
      box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
    }
    .status-dot.open {
      background: var(--success);
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    }
    .topbar-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .date-chip {
      font-size: 0.8125rem;
      color: var(--text-muted);
      background: rgba(255, 255, 255, 0.04);
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-full);
      border: 1px solid var(--border-subtle);
    }
    .content-body {
      flex: 1;
      padding: 2rem;
    }
  `]
})
export class LayoutComponent implements OnInit {
  currentUser = signal<{ email: string; roles: string[] } | null>(null);
  activeClosure = signal<CashClosure | null>(null);
  todayDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

  constructor(
    private authService: AuthService,
    private cashService: CashClosureService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser.set(this.authService.currentUser());
    this.checkCashStatus();
  }

  checkCashStatus(): void {
    this.cashService.getCurrentClosure().subscribe({
      next: (closure) => this.activeClosure.set(closure),
      error: () => this.activeClosure.set(null)
    });
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
