import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '../../core/services/api.services';
import { SalesReport, ProjectionReport } from '../../core/models/models';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="analytics-container">
      <div class="analytics-header">
        <div>
          <h2>Analítica Comercial & Modelos Predictivos</h2>
          <p>Métricas de ventas, comportamiento por medios de pago y predicción de compras a proveedores.</p>
        </div>
        <button (click)="loadReports()" class="btn btn-secondary btn-sm">
          🔄 Actualizar Métricas
        </button>
      </div>

      <!-- KPI Cards Row -->
      <div class="kpi-cards-grid">
        <div class="kpi-card card">
          <div class="kpi-icon-wrap bg-indigo">💰</div>
          <div class="kpi-content">
            <span class="kpi-label">Ventas Consolidadas</span>
            <span class="kpi-value">\${{ salesReport()?.totalSales || 0 | number:'1.0-0' }} COP</span>
            <span class="kpi-subtext">Últimos 30 días</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-wrap bg-emerald">📦</div>
          <div class="kpi-content">
            <span class="kpi-label">Total de Órdenes</span>
            <span class="kpi-value">{{ salesReport()?.totalOrders || 0 }}</span>
            <span class="kpi-subtext">Órdenes completadas</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-wrap bg-amber">🏷️</div>
          <div class="kpi-content">
            <span class="kpi-label">Ticket Promedio</span>
            <span class="kpi-value">\${{ salesReport()?.averageTicket || 0 | number:'1.0-0' }} COP</span>
            <span class="kpi-subtext">Gasto medio por cliente</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-wrap bg-sky">📈</div>
          <div class="kpi-content">
            <span class="kpi-label">Proyección Semanal</span>
            <span class="kpi-value">\${{ projections()?.projectedTotalRevenue || 0 | number:'1.0-0' }} COP</span>
            <span class="kpi-subtext">Pronóstico próximos 7 días</span>
          </div>
        </div>
      </div>

      <!-- Sección de Gráficas y Métricas -->
      <div class="analytics-split-grid">
        <!-- Desglose por Método de Pago -->
        <div class="card">
          <h3 class="card-title">Distribución por Método de Pago</h3>
          <div class="payment-bars-list">
            <div *ngFor="let item of paymentMethodEntries()" class="bar-row">
              <div class="bar-label-line">
                <span class="method-name">{{ item.method }}</span>
                <span class="method-amount">\${{ item.amount | number:'1.0-0' }} COP</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" [style.width.%]="item.percentage"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Ranking Top Productos -->
        <div class="card">
          <h3 class="card-title">Top Productos Más Vendidos</h3>
          <div class="top-products-list">
            <div *ngFor="let item of topProductsEntries(); let i = index" class="top-product-item">
              <span class="rank-badge">#{{ i + 1 }}</span>
              <span class="product-name">{{ item.name }}</span>
              <span class="units-badge">{{ item.quantity }} unidades</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Proyección Predictiva & Compras Sugeridas -->
      <div class="card">
        <div class="projection-title-row">
          <div>
            <h3 class="card-title">🤖 Sugerencias de Reabastecimiento a Proveedores</h3>
            <p class="subtitle">Modelo estadístico ponderado por rotación histórica para evitar roturas de stock.</p>
          </div>
          <span class="badge badge-success">{{ projections()?.period }}</span>
        </div>

        <div class="table-container">
          <table class="modern-table">
            <thead>
              <tr>
                <th>Producto Clave</th>
                <th>Demanda Semanal Estimada</th>
                <th>Acción de Reorden Sugerida</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of projections()?.suggestedPurchases">
                <td><strong>{{ p.productName }}</strong></td>
                <td><span class="units-pill">{{ p.estimatedWeeklyDemand }} unidades</span></td>
                <td><span class="action-text">{{ p.recommendedReorderAction }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .analytics-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .analytics-header h2 {
      font-size: 1.5rem;
      color: #fff;
    }
    .analytics-header p {
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    .kpi-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }
    .kpi-card {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.25rem;
    }
    .kpi-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .bg-indigo { background: rgba(79, 70, 229, 0.2); }
    .bg-emerald { background: rgba(16, 185, 129, 0.2); }
    .bg-amber { background: rgba(245, 158, 11, 0.2); }
    .bg-sky { background: rgba(14, 165, 233, 0.2); }
    .kpi-content {
      display: flex;
      flex-direction: column;
    }
    .kpi-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 600;
    }
    .kpi-value {
      font-size: 1.35rem;
      font-weight: 800;
      color: #fff;
    }
    .kpi-subtext {
      font-size: 0.7rem;
      color: #64748b;
    }
    .analytics-split-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    .card-title {
      font-size: 1.1rem;
      color: #fff;
      margin-bottom: 1.25rem;
    }
    .payment-bars-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .bar-label-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.8125rem;
      margin-bottom: 0.35rem;
    }
    .method-name {
      color: #fff;
      font-weight: 600;
    }
    .method-amount {
      color: var(--text-muted);
    }
    .progress-bar-bg {
      height: 8px;
      background: #1e293b;
      border-radius: var(--radius-full);
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #4f46e5, #818cf8);
      border-radius: var(--radius-full);
    }
    .top-products-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .top-product-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem 0.85rem;
      background: rgba(11, 15, 25, 0.4);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
    }
    .rank-badge {
      font-weight: 700;
      color: var(--primary-light);
      font-size: 0.8125rem;
      width: 24px;
    }
    .product-name {
      flex: 1;
      font-size: 0.85rem;
      color: #fff;
      font-weight: 500;
      padding: 0 0.5rem;
    }
    .units-badge {
      font-size: 0.75rem;
      color: #34d399;
      font-weight: 700;
      background: rgba(16, 185, 129, 0.1);
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
    }
    .projection-title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    .projection-title-row .subtitle {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin-top: 0.2rem;
    }
    .units-pill {
      color: #38bdf8;
      font-weight: 700;
    }
    .action-text {
      color: #cbd5e1;
      font-size: 0.8125rem;
    }
  `]
})
export class AnalyticsComponent implements OnInit {
  salesReport = signal<SalesReport | null>(null);
  projections = signal<ProjectionReport | null>(null);

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.analyticsService.getSalesReport().subscribe({
      next: (rep) => this.salesReport.set(rep),
      error: (e) => console.error(e)
    });

    this.analyticsService.getProjections().subscribe({
      next: (proj) => this.projections.set(proj),
      error: (e) => console.error(e)
    });
  }

  paymentMethodEntries(): { method: string; amount: number; percentage: number }[] {
    const report = this.salesReport();
    if (!report || !report.salesByPaymentMethod) return [];

    const total = report.totalSales || 1;
    return Object.entries(report.salesByPaymentMethod).map(([key, val]) => ({
      method: key,
      amount: val,
      percentage: Math.round((val / total) * 100)
    }));
  }

  topProductsEntries(): { name: string; quantity: number }[] {
    const report = this.salesReport();
    if (!report || !report.topSellingProducts) return [];

    return Object.entries(report.topSellingProducts).map(([name, quantity]) => ({
      name,
      quantity
    }));
  }
}
