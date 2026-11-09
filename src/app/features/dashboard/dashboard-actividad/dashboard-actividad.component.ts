import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MetricasUsuarioService, MetricasUsuario } from '../../../core/services/metricas-usuario.service';

@Component({
  selector: 'app-dashboard-actividad',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <header class="dashboard-header">
        <h1>Mi Actividad</h1>
        <p>Resumen de tu actividad en CineMatch</p>
      </header>

      @if (cargando()) {
        <div class="loading">Cargando métricas...</div>
      } @else {
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">{{ metricas()?.totalSalas || 0 }}</div>
            <div class="metric-label">Salas creadas/unidas</div>
          </div>

          <div class="metric-card">
            <div class="metric-value">{{ metricas()?.salasActivas || 0 }}</div>
            <div class="metric-label">Salas activas</div>
          </div>

          <div class="metric-card">
            <div class="metric-value">{{ metricas()?.totalMatches || 0 }}</div>
            <div class="metric-label">Matches generados</div>
          </div>

          <div class="metric-card">
            <div class="metric-value">
              {{ (metricas()?.promedioCalificacion || 0) | number:'1.1-1' }}
            </div>
            <div class="metric-label">Calificación promedio</div>
          </div>

          <div class="metric-card">
            <div class="metric-value">{{ metricas()?.totalEvaluaciones || 0 }}</div>
            <div class="metric-label">Evaluaciones realizadas</div>
          </div>
        </div>
      }

      <div class="dashboard-actions">
        <a routerLink="/dashboard/tendencias" class="btn-link">
          Ver tendencias históricas →
        </a>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .dashboard-header {
      margin-bottom: 2rem;
    }

    .dashboard-header h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      color: var(--text-primary, #fff);
    }

    .dashboard-header p {
      color: var(--text-secondary, #aaa);
      font-size: 1rem;
    }

    .loading {
      text-align: center;
      padding: 2rem;
      color: var(--text-secondary, #aaa);
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .metric-card {
      background: var(--bg-card, #1a1a1a);
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      border: 1px solid var(--border, #333);
    }

    .metric-value {
      font-size: 2.5rem;
      font-weight: bold;
      color: var(--accent, #ff6b6b);
      margin-bottom: 0.5rem;
    }

    .metric-label {
      color: var(--text-secondary, #aaa);
      font-size: 0.9rem;
    }

    .dashboard-actions {
      text-align: center;
      margin-top: 2rem;
    }

    .btn-link {
      color: var(--accent, #ff6b6b);
      text-decoration: none;
      font-weight: 500;
    }

    .btn-link:hover {
      text-decoration: underline;
    }
  `]
})
export class DashboardActividadComponent implements OnInit {
  metricas = signal<MetricasUsuario | null>(null);
  cargando = signal(true);

  constructor(
    private metricasService: MetricasUsuarioService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const usuarioId = this.authService.usuario()?.id;
    if (usuarioId) {
      this.metricasService.getMetricas(usuarioId).subscribe({
        next: (data) => {
          this.metricas.set(data);
          this.cargando.set(false);
        },
        error: (err) => {
          console.error('Error cargando métricas:', err);
          this.cargando.set(false);
        }
      });
    } else {
      this.cargando.set(false);
    }
  }
}
