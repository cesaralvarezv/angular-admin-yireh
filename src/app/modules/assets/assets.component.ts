import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetService } from '../../core/services/api.services';
import { PhysicalAsset } from '../../core/models/models';

@Component({
  selector: 'app-assets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="assets-container">
      <div class="assets-header">
        <div>
          <h2>Inventario de Activos Físicos & Maquinaria</h2>
          <p>Fichas técnicas de equipos, amortización acumulada y cronograma de mantenimiento preventivo.</p>
        </div>
        <button (click)="openCreateModal()" class="btn btn-primary">
          ➕ Registrar Nuevo Equipo
        </button>
      </div>

      <!-- Tabla de Activos -->
      <div class="card">
        <div class="table-container">
          <table class="modern-table">
            <thead>
              <tr>
                <th>Placa / Código</th>
                <th>Nombre del Equipo</th>
                <th>Categoría</th>
                <th>Ubicación</th>
                <th>Costo Adquisición</th>
                <th>Próx. Mantenimiento</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let a of assets()">
                <td><strong>{{ a.assetCode }}</strong></td>
                <td>{{ a.name }}</td>
                <td><span class="category-chip">{{ a.category }}</span></td>
                <td>{{ a.location || 'No asignada' }}</td>
                <td>\${{ a.purchasePrice | number:'1.0-0' }} COP</td>
                <td>
                  <span [class.text-warning]="isMaintenanceSoon(a.nextMaintenanceDate)">
                    {{ a.nextMaintenanceDate || 'Sin programar' }}
                  </span>
                </td>
                <td>
                  <span class="badge" [class.badge-success]="a.status === 'OPERATIONAL'" [class.badge-warning]="a.status === 'IN_MAINTENANCE'">
                    {{ a.status }}
                  </span>
                </td>
                <td>
                  <div class="actions-group">
                    <button (click)="openEditModal(a)" class="btn-icon" title="Editar">✏️</button>
                    <button (click)="deleteAsset(a.id)" class="btn-icon text-danger" title="Eliminar">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal de Registro / Edición -->
      <div *ngIf="showModal()" class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-header">
            <h3>{{ isEditing ? 'Editar Activo Físico' : 'Registrar Nuevo Equipo' }}</h3>
            <button (click)="closeModal()" class="btn-close">✕</button>
          </div>

          <form (ngSubmit)="saveAsset()" class="modal-form">
            <div class="form-row">
              <div class="form-group">
                <label>Placa / Código Único:</label>
                <input type="text" class="form-input" [(ngModel)]="currentAsset.assetCode" name="assetCode" required placeholder="Ej: ACT-CAF-005" />
              </div>
              <div class="form-group">
                <label>Nombre del Equipo:</label>
                <input type="text" class="form-input" [(ngModel)]="currentAsset.name" name="name" required placeholder="Ej: Cafetera 2 Grupos" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Categoría:</label>
                <select class="form-input" [(ngModel)]="currentAsset.category" name="category" required>
                  <option value="Cafetería">Cafetería</option>
                  <option value="Refrigeración">Refrigeración</option>
                  <option value="Cocina & Hornos">Cocina & Hornos</option>
                  <option value="Terminales POS">Terminales POS</option>
                  <option value="Mobiliario">Mobiliario</option>
                </select>
              </div>
              <div class="form-group">
                <label>Ubicación:</label>
                <input type="text" class="form-input" [(ngModel)]="currentAsset.location" name="location" placeholder="Barra Principal" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Precio de Compra (COP):</label>
                <input type="number" class="form-input" [(ngModel)]="currentAsset.purchasePrice" name="purchasePrice" required />
              </div>
              <div class="form-group">
                <label>Fecha de Compra:</label>
                <input type="date" class="form-input" [(ngModel)]="currentAsset.purchaseDate" name="purchaseDate" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Calendario de Mantenimiento:</label>
                <input type="text" class="form-input" [(ngModel)]="currentAsset.maintenanceSchedule" name="maintenanceSchedule" placeholder="Trimestral - Descalcificación" />
              </div>
              <div class="form-group">
                <label>Próxima Fecha de Mantenimiento:</label>
                <input type="date" class="form-input" [(ngModel)]="currentAsset.nextMaintenanceDate" name="nextMaintenanceDate" />
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" (click)="closeModal()" class="btn btn-secondary">Cancelar</button>
              <button type="submit" class="btn btn-primary">Guardar Activo</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .assets-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .assets-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .assets-header h2 {
      font-size: 1.5rem;
      color: #fff;
    }
    .assets-header p {
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    .category-chip {
      background: rgba(255, 255, 255, 0.05);
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      color: #cbd5e1;
    }
    .text-warning {
      color: #fbbf24;
      font-weight: 600;
    }
    .actions-group {
      display: flex;
      gap: 0.5rem;
    }
    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      padding: 0.25rem;
      border-radius: 4px;
    }
    .btn-icon:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }
    .modal-card {
      width: 100%;
      max-width: 600px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 2rem;
      box-shadow: var(--shadow-lg);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .modal-header h3 {
      font-size: 1.25rem;
      color: #fff;
    }
    .btn-close {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 1.2rem;
      cursor: pointer;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .form-group label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 0.35rem;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
  `]
})
export class AssetsComponent implements OnInit {
  assets = signal<PhysicalAsset[]>([]);
  showModal = signal(false);
  isEditing = false;
  editingId: number | null = null;

  currentAsset: Partial<PhysicalAsset> = {
    category: 'Cafetería',
    status: 'OPERATIONAL'
  };

  constructor(private assetService: AssetService) {}

  ngOnInit(): void {
    this.loadAssets();
  }

  loadAssets(): void {
    this.assetService.getAllAssets().subscribe({
      next: (list) => this.assets.set(list),
      error: (e) => console.error(e)
    });
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.editingId = null;
    this.currentAsset = { category: 'Cafetería', status: 'OPERATIONAL' };
    this.showModal.set(true);
  }

  openEditModal(asset: PhysicalAsset): void {
    this.isEditing = true;
    this.editingId = asset.id;
    this.currentAsset = { ...asset };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveAsset(): void {
    if (this.isEditing && this.editingId) {
      this.assetService.updateAsset(this.editingId, this.currentAsset).subscribe({
        next: () => {
          this.closeModal();
          this.loadAssets();
        },
        error: (err) => alert(err.error?.message || 'Error actualizando activo.')
      });
    } else {
      this.assetService.createAsset(this.currentAsset).subscribe({
        next: () => {
          this.closeModal();
          this.loadAssets();
        },
        error: (err) => alert(err.error?.message || 'Error registrando activo.')
      });
    }
  }

  deleteAsset(id: number): void {
    if (confirm('¿Está seguro de eliminar este activo físico?')) {
      this.assetService.deleteAsset(id).subscribe({
        next: () => this.loadAssets(),
        error: (err) => alert(err.error?.message || 'Error eliminando activo.')
      });
    }
  }

  isMaintenanceSoon(dateStr?: string): boolean {
    if (!dateStr) return false;
    const target = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diffDays = (target - now) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays <= 15;
  }
}
