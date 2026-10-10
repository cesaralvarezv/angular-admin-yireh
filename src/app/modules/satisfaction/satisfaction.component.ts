import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SurveyService } from '../../core/services/api.services';
import { SatisfactionSurvey } from '../../core/models/models';

@Component({
  selector: 'app-satisfaction',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="satisfaction-container">
      <div class="satisfaction-header">
        <div>
          <h2>Métricas de Calidad & Encuestas CSAT</h2>
          <p>Monitoreo continuo de la experiencia del estudiante y comentarios post-entrega.</p>
        </div>
      </div>

      <!-- KPIs de Satisfacción -->
      <div class="kpi-grid">
        <div class="card kpi-card">
          <span class="csat-number">{{ averageScore() | number:'1.1-1' }}</span>
          <div class="stars-display">
            {{ getStars(averageScore()) }}
          </div>
          <span class="csat-label">Promedio de Satisfacción Global</span>
          <small>Sobre un máximo de 5.0 estrellas</small>
        </div>

        <div class="card kpi-card">
          <span class="csat-number text-emerald">{{ totalResponses() }}</span>
          <span class="csat-label">Encuestas Recibidas</span>
          <small>Calificaciones directas post-pedido</small>
        </div>

        <div class="card kpi-card">
          <span class="csat-number text-sky">{{ approvalRate() }}%</span>
          <span class="csat-label">Tasa de Aprobación</span>
          <small>Calificaciones de 4 y 5 estrellas</small>
        </div>
      </div>

      <!-- Opiniones y Comentarios -->
      <div class="card">
        <h3 class="card-title">Comentarios y Calificaciones Recientes</h3>

        <div class="surveys-list">
          <div *ngIf="surveys().length === 0" class="empty-state">
            No se han registrado encuestas todavía.
          </div>

          <div *ngFor="let s of surveys()" class="survey-item">
            <div class="survey-top">
              <div class="user-meta">
                <span class="stars">{{ getStars(s.rating) }}</span>
                <span class="user-email">{{ s.userEmail }}</span>
              </div>
              <span class="survey-date">{{ s.createdAt | date:'medium' }}</span>
            </div>

            <div *ngIf="s.quickTags" class="survey-tags">
              <span *ngFor="let tag of getTagsArray(s.quickTags)" class="tag-pill">
                🏷️ {{ tag }}
              </span>
            </div>

            <p *ngIf="s.comment" class="survey-comment">
              "{{ s.comment }}"
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .satisfaction-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .satisfaction-header h2 {
      font-size: 1.5rem;
      color: #fff;
    }
    .satisfaction-header p {
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }
    .kpi-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 1.75rem 1rem;
    }
    .csat-number {
      font-size: 2.75rem;
      font-weight: 800;
      color: #fff;
      line-height: 1;
      margin-bottom: 0.5rem;
    }
    .text-emerald { color: #34d399; }
    .text-sky { color: #38bdf8; }
    .stars-display {
      font-size: 1.25rem;
      color: #fbbf24;
      margin-bottom: 0.5rem;
    }
    .csat-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #cbd5e1;
    }
    .kpi-card small {
      color: #64748b;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }
    .card-title {
      font-size: 1.15rem;
      color: #fff;
      margin-bottom: 1.25rem;
    }
    .surveys-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .empty-state {
      text-align: center;
      color: var(--text-muted);
      padding: 2rem;
    }
    .survey-item {
      background: rgba(11, 15, 25, 0.4);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 1rem 1.25rem;
    }
    .survey-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .user-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .stars {
      color: #fbbf24;
      font-size: 0.95rem;
    }
    .user-email {
      font-weight: 600;
      font-size: 0.85rem;
      color: #fff;
    }
    .survey-date {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .survey-tags {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 0.5rem;
    }
    .tag-pill {
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      color: var(--primary-light);
      font-size: 0.7rem;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
    }
    .survey-comment {
      color: #cbd5e1;
      font-size: 0.85rem;
      font-style: italic;
    }
  `]
})
export class SatisfactionComponent implements OnInit {
  surveys = signal<SatisfactionSurvey[]>([]);

  totalResponses = computed(() => this.surveys().length);

  averageScore = computed(() => {
    const list = this.surveys();
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, s) => acc + s.rating, 0);
    return sum / list.length;
  });

  approvalRate = computed(() => {
    const list = this.surveys();
    if (list.length === 0) return 100;
    const positive = list.filter(s => s.rating >= 4).length;
    return Math.round((positive / list.length) * 100);
  });

  constructor(private surveyService: SurveyService) {}

  ngOnInit(): void {
    this.surveyService.getAllSurveys().subscribe({
      next: (res) => this.surveys.set(res),
      error: (e) => console.error(e)
    });
  }

  getStars(score: number): string {
    const rounded = Math.round(score);
    return '★'.repeat(rounded) + '☆'.repeat(Math.max(0, 5 - rounded));
  }

  getTagsArray(tagsStr: string): string[] {
    if (!tagsStr) return [];
    return tagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0);
  }
}
