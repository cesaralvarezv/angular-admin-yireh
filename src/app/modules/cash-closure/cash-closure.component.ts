import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CashClosureService } from '../../core/services/api.services';
import { CashClosure } from '../../core/models/models';

@Component({
  selector: 'app-cash-closure',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="closure-container">
      <div class="closure-header">
        <div>
          <h2>Control de Caja & Cierre Diario (Z-Report)</h2>
          <p>Administración de turnos, arqueo de gaveta y cálculo de descuadres de efectivo.</p>
        </div>
      </div>

      <!-- Estado del Turno Actual -->
      <div class="active-shift-card card" [class.shift-open]="activeClosure()?.status === 'OPEN'">
        <div class="shift-status-badge">
          <span class="status-indicator"></span>
          Estado: <strong>{{ activeClosure()?.status === 'OPEN' ? 'TURNO ABIERTO' : 'NO HAY TURNO ABIERTO' }}</strong>
        </div>

        <!-- Si hay turno abierto: Mostrar estadísticas en tiempo real y formulario de cierre -->
        <div *ngIf="activeClosure()?.status === 'OPEN'" class="shift-details-grid">
          <div class="kpi-mini">
            <span class="label">Cajero a cargo:</span>
            <span class="value">{{ activeClosure()?.cashierEmail }}</span>
          </div>
          <div class="kpi-mini">
            <span class="label">Base inicial:</span>
            <span class="value">\${{ activeClosure()?.openingAmount | number:'1.0-0' }} COP</span>
          </div>
          <div class="kpi-mini highlight-cash">
            <span class="label">Ventas en Efectivo:</span>
            <span class="value">\${{ activeClosure()?.cashSalesSystem | number:'1.0-0' }} COP</span>
          </div>
          <div class="kpi-mini highlight-wallet">
            <span class="label">Débito Billetera:</span>
            <span class="value">\${{ activeClosure()?.virtualWalletSales | number:'1.0-0' }} COP</span>
          </div>
          <div class="kpi-mini highlight-card">
            <span class="label">Ventas Datáfono:</span>
            <span class="value">\${{ activeClosure()?.cardSales | number:'1.0-0' }} COP</span>
          </div>
          <div class="kpi-mini highlight-total">
            <span class="label">Total Facturado en Turno:</span>
            <span class="value">\${{ activeClosure()?.totalSalesSystem | number:'1.0-0' }} COP</span>
          </div>
        </div>

        <!-- Panel de Cierre Formal si está abierto -->
        <div *ngIf="activeClosure()?.status === 'OPEN'" class="closing-action-box">
          <h4>Arqueo y Cierre de Turno</h4>
          <p>Realice el conteo físico de los billetes y monedas en gaveta e ingrese el total a continuación:</p>

          <div class="closure-form-row">
            <div class="input-col">
              <label>Efectivo Físico Contado:</label>
              <input
                type="number"
                class="form-input"
                [(ngModel)]="declaredCash"
                placeholder="Ej: 145000"
              />
            </div>
            <div class="input-col">
              <label>Notas / Justificación de descuadre:</label>
              <input
                type="text"
                class="form-input"
                [(ngModel)]="closingNotes"
                placeholder="Observaciones de cierre..."
              />
            </div>
            <div class="button-col">
              <button
                (click)="onCloseShift()"
                class="btn btn-danger"
                [disabled]="declaredCash < 0 || closingProcessing()"
              >
                🔒 Cerrar Turno (Reporte Z)
              </button>
            </div>
          </div>

          <!-- Cálculo en vivo del descuadre -->
          <div *ngIf="declaredCash > 0" class="live-discrepancy" [class.has-diff]="liveDiscrepancy() !== 0">
            <span>Efectivo esperado en gaveta: <strong>\${{ expectedCash() | number:'1.0-0' }} COP</strong></span>
            <span>Diferencia / Descuadre: <strong [class.negative]="liveDiscrepancy() < 0" [class.positive]="liveDiscrepancy() > 0">
              {{ liveDiscrepancy() === 0 ? 'CUADRE EXACTO ($0)' : (liveDiscrepancy() | number:'1.0-0') + ' COP' }}
            </strong></span>
          </div>
        </div>

        <!-- Si NO hay turno abierto: Formulario de apertura -->
        <div *ngIf="activeClosure()?.status !== 'OPEN'" class="open-shift-box">
          <h3>Apertura de Turno de Caja</h3>
          <p>Para comenzar a atender clientes en mostrador, declare la base inicial en efectivo en gaveta:</p>

          <div class="open-form">
            <div class="form-group-inline">
              <label>Monto Base Inicial (Efectivo):</label>
              <input
                type="number"
                class="form-input"
                [(ngModel)]="openingAmount"
                placeholder="Ej: 100000"
              />
            </div>
            <div class="form-group-inline">
              <label>Notas de apertura:</label>
              <input
                type="text"
                class="form-input"
                [(ngModel)]="openingNotes"
                placeholder="Ej: Base sencilla billetes de 5k y 10k"
              />
            </div>
            <button
              (click)="onOpenShift()"
              class="btn btn-success"
              [disabled]="openingAmount <= 0 || openingProcessing()"
            >
              🚀 Abrir Turno de Caja
            </button>
          </div>
        </div>
      </div>

      <!-- Histórico de Cierres -->
      <div class="history-section card">
        <div class="section-title-row">
          <h3>Historial de Cierres y Actas (Z-Reports)</h3>
          <button (click)="loadClosuresHistory()" class="btn btn-secondary btn-sm">
            🔄 Actualizar
          </button>
        </div>

        <div class="table-container">
          <table class="modern-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cajero</th>
                <th>Apertura</th>
                <th>Cierre</th>
                <th>Base</th>
                <th>Ventas Sist.</th>
                <th>Declarado</th>
                <th>Descuadre</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of closuresHistory()">
                <td>#{{ c.id }}</td>
                <td>{{ c.cashierEmail }}</td>
                <td>{{ c.openingTime | date:'short' }}</td>
                <td>{{ c.closingTime ? (c.closingTime | date:'short') : 'En curso' }}</td>
                <td>\${{ c.openingAmount | number:'1.0-0' }}</td>
                <td>\${{ c.totalSalesSystem | number:'1.0-0' }}</td>
                <td>{{ c.declaredCash ? ('\$' + (c.declaredCash | number:'1.0-0')) : '-' }}</td>
                <td>
                  <span *ngIf="c.status === 'CLOSED'" [class.badge-success]="c.discrepancy === 0" [class.badge-danger]="c.discrepancy !== 0">
                    {{ c.discrepancy === 0 ? 'Sin diferencia' : ('\$' + (c.discrepancy | number:'1.0-0')) }}
                  </span>
                  <span *ngIf="c.status === 'OPEN'">-</span>
                </td>
                <td>
                  <span class="badge" [class.badge-success]="c.status === 'OPEN'" [class.badge-warning]="c.status === 'CLOSED'">
                    {{ c.status === 'OPEN' ? 'ABIERTO' : 'CERRADO' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .closure-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .closure-header h2 {
      font-size: 1.5rem;
      color: #fff;
    }
    .closure-header p {
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    .active-shift-card {
      border-left: 4px solid var(--danger);
    }
    .active-shift-card.shift-open {
      border-left-color: var(--success);
    }
    .shift-status-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      margin-bottom: 1.25rem;
    }
    .shift-details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .kpi-mini {
      background: rgba(11, 15, 25, 0.4);
      padding: 0.85rem;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      border: 1px solid var(--border-subtle);
    }
    .kpi-mini .label {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
    }
    .kpi-mini .value {
      font-size: 1.1rem;
      font-weight: 700;
      color: #fff;
    }
    .highlight-cash .value { color: #34d399; }
    .highlight-wallet .value { color: #60a5fa; }
    .highlight-card .value { color: #a78bfa; }
    .highlight-total .value { color: #fbbf24; font-size: 1.25rem; }

    .closing-action-box {
      background: rgba(15, 23, 42, 0.6);
      border: 1px dashed var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 1.25rem;
    }
    .closing-action-box h4 {
      color: #fff;
      margin-bottom: 0.25rem;
    }
    .closing-action-box p {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }
    .closure-form-row {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
    }
    .input-col {
      flex: 1;
    }
    .input-col label {
      display: block;
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
    }
    .live-discrepancy {
      margin-top: 1rem;
      padding: 0.75rem;
      background: rgba(11, 15, 25, 0.6);
      border-radius: var(--radius-sm);
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
    }
    .live-discrepancy .negative { color: #ef4444; }
    .live-discrepancy .positive { color: #3b82f6; }

    .open-shift-box h3 {
      color: #fff;
      margin-bottom: 0.5rem;
    }
    .open-shift-box p {
      color: var(--text-muted);
      font-size: 0.875rem;
      margin-bottom: 1.25rem;
    }
    .open-form {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
      flex-wrap: wrap;
    }
    .form-group-inline {
      flex: 1;
      min-width: 200px;
    }
    .form-group-inline label {
      display: block;
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
    }

    .section-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .section-title-row h3 {
      font-size: 1.15rem;
      color: #fff;
    }
  `]
})
export class CashClosureComponent implements OnInit {
  activeClosure = signal<CashClosure | null>(null);
  closuresHistory = signal<CashClosure[]>([]);

  // Apertura
  openingAmount: number = 100000;
  openingNotes: string = '';
  openingProcessing = signal(false);

  // Cierre
  declaredCash: number = 0;
  closingNotes: string = '';
  closingProcessing = signal(false);

  expectedCash = computed(() => {
    const c = this.activeClosure();
    if (!c) return 0;
    return (c.openingAmount || 0) + (c.cashSalesSystem || 0);
  });

  liveDiscrepancy = computed(() => {
    return (this.declaredCash || 0) - this.expectedCash();
  });

  constructor(private cashService: CashClosureService) {}

  ngOnInit(): void {
    this.loadCurrentClosure();
    this.loadClosuresHistory();
  }

  loadCurrentClosure(): void {
    this.cashService.getCurrentClosure().subscribe({
      next: (c) => this.activeClosure.set(c),
      error: () => this.activeClosure.set(null)
    });
  }

  loadClosuresHistory(): void {
    this.cashService.getAllClosures().subscribe({
      next: (list) => this.closuresHistory.set(list),
      error: () => this.closuresHistory.set([])
    });
  }

  onOpenShift(): void {
    if (this.openingAmount < 0) return;
    this.openingProcessing.set(true);

    this.cashService.openClosure(this.openingAmount, this.openingNotes).subscribe({
      next: (newC) => {
        this.openingProcessing.set(false);
        this.activeClosure.set(newC);
        this.loadClosuresHistory();
      },
      error: (err) => {
        this.openingProcessing.set(false);
        alert(err.error?.message || 'Error al abrir el turno de caja.');
      }
    });
  }

  onCloseShift(): void {
    if (this.declaredCash < 0) return;
    this.closingProcessing.set(true);

    this.cashService.closeClosure(this.declaredCash, this.closingNotes).subscribe({
      next: () => {
        this.closingProcessing.set(false);
        this.activeClosure.set(null);
        this.declaredCash = 0;
        this.closingNotes = '';
        this.loadClosuresHistory();
        alert('Turno de caja cerrado exitosamente.');
      },
      error: (err) => {
        this.closingProcessing.set(false);
        alert(err.error?.message || 'Error al cerrar el turno de caja.');
      }
    });
  }
}
