import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MetricasUsuarioService } from '../../../core/services/metricas-usuario.service';
import { MetricasDia } from '../../../core/services/admin.service';

@Component({
  selector: 'app-dashboard-tendencias',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <header class="dashboard-header">
        <h1>Mis Tendencias</h1>
        <p>Evolución de tu actividad en el tiempo</p>
      </header>

      @if (cargando()) {
        <div class="loading">Cargando historial...</div>
      } @else if (historial().length === 0) {
        <div class="empty-state">
          <p>No hay datos históricos disponibles.</p>
        </div>
      } @else {
        <div class="historial-container">
          <div class="historial-grid">
            @for (dia of historial(); track dia.fecha) {
              <div class="dia-card">
                <div class="dia-fecha">{{ dia.fecha | date:'dd/MM/yyyy' }}</div>
                <div class="dia-stats">
                  <div class="stat">
                    <span class="stat-value">{{ dia.totalSalas }}</span>
                    <span class="stat-label">salas</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value">{{ dia.totalMatches }}</span>
                    <span class="stat-label">matches</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value">{{ dia.salasActivas }}</span>
                    <span class="stat-label">activas</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value">
                      {{ dia.promedioCalificacion ? (dia.promedioCalificacion | number:'1.1-1') : '-' }}
                    </span>
                    <span class="stat-label">promedio</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <div class="dashboard-actions">
        <a routerLink="/dashboard/actividad" class="btn-link">
          ← Volver a actividad actual
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

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary, #aaa);
      background: var(--bg-card, #1a1a1a);
      border-radius: 12px;
      border: 1px solid var(--border, #333);
    }

    .historial-container {
      margin-bottom: 2rem;
    }

    .historial-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .dia-card {
      background: var(--bg-card, #1a1a1a);
      border-radius: 12px;
      padding: 1.5rem;
      border: 1px solid var(--border, #333);
    }

    .dia-fecha {
      font-size: 1.1rem;
      font-weight: bold;
      color: var(--accent, #ff6b6b);
      margin-bottom: 1rem;
      text-align: center;
    }

    .dia-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: 1.8rem;
      font-weight: bold;
      color: var(--text-primary, #fff);
    }

    .stat-label {
      display: block;
      font-size: 0.8rem;
      color: var(--text-secondary, #aaa);
      text-transform: uppercase;
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
export class DashboardTendenciasComponent implements OnInit {
  historial = signal<MetricasDia[]>([]);
  cargando = signal(true);

  constructor(
    private metricasService: MetricasUsuarioService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const usuarioId = this.authService.usuario()?.id;
    if (usuarioId) {
      this.metricasService.getHistorial(usuarioId).subscribe({
        next: (data) => {
          this.historial.set(data);
          this.cargando.set(false);
        },
        error: (err) => {
          console.error('Error cargando historial:', err);
          this.cargando.set(false);
        }
      });
    } else {
      this.cargando.set(false);
    }
  }
}
