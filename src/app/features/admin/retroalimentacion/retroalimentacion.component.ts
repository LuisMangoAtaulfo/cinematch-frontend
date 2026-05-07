import { Component, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RetroalimentacionService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { CalificacionResponse } from '../../../core/models';
import {DecimalPipe} from "@angular/common";

@Component({
  selector: 'app-retroalimentacion',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  styles: [`
    .bar-row { display: flex; align-items: center; gap: 10px; font-size: 13px; }
    .bar-track { flex: 1; height: 8px; background: var(--surface2); border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; background: var(--accent); border-radius: 4px; }
    .bar-label { width: 16px; text-align: right; color: var(--text-sub); }
    .bar-count { width: 28px; color: var(--text-sub); font-size: 12px; }
  `],
  template: `
    <div class="page">
      <nav class="navbar">
        <span class="navbar__logo">CineMatch</span>
        <div class="navbar__actions">
          <a routerLink="/admin/metricas"    class="btn btn--ghost btn--sm">Métricas</a>
          <a routerLink="/admin/plataformas" class="btn btn--ghost btn--sm">Plataformas</a>
          <button class="btn btn--secondary btn--sm" (click)="logout()">Salir</button>
        </div>
      </nav>

      <div style="flex:1; padding:28px 24px;">
        <div style="max-width:520px; margin:0 auto;">
          <p class="section-title">Retroalimentación</p>
          <p class="section-sub">Calificaciones agregadas de los usuarios</p>

          @if (cargando()) {
            <p style="color:var(--text-sub);">Cargando...</p>
          } @else {
            <!-- Promedio -->
            <div class="card" style="display:flex; align-items:center; gap:24px; margin-bottom:16px;">
              <div style="text-align:center;">
                <p style="font-family:var(--font-disp); font-size:52px; color:var(--accent); line-height:1;">
                  {{ promedio() | number:'1.1-1' }}
                </p>
                <p style="font-size:12px; color:var(--text-sub);">Promedio general</p>
              </div>
              <div style="flex:1;">
                <p style="font-size:13px; color:var(--text-sub); margin-bottom:4px;">
                  Basado en <strong style="color:var(--text);">{{ calificaciones().length }}</strong> calificaciones
                </p>
              </div>
            </div>

            <!-- Distribución -->
            <div class="card">
              <p style="font-weight:500; margin-bottom:16px;">Distribución de calificaciones</p>
              <div style="display:flex; flex-direction:column; gap:10px;">
                @for (valor of valoresDesc; track valor) {
                  <div class="bar-row">
                    <span class="bar-label">{{ valor }}</span>
                    <div class="bar-track">
                      <div class="bar-fill"
                           [style.width]="getPorcentaje(valor) + '%'"></div>
                    </div>
                    <span class="bar-count">{{ getConteo(valor) }}</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class RetroalimentacionComponent implements OnInit {
  calificaciones = signal<CalificacionResponse[]>([]);
  cargando       = signal(true);
  readonly valoresDesc = [10,9,8,7,6,5,4,3,2,1];

  promedio = computed(() => {
    const lista = this.calificaciones();
    if (!lista.length) return 0;
    return lista.reduce((sum, c) => sum + c.valor, 0) / lista.length;
  });

  constructor(private retroSvc: RetroalimentacionService, private auth: AuthService) {}

  ngOnInit(): void {
    this.retroSvc.getAll().subscribe({
      next: (data) => { this.calificaciones.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false)
    });
  }

  getConteo(valor: number): number {
    return this.calificaciones().filter(c => c.valor === valor).length;
  }

  getPorcentaje(valor: number): number {
    const total = this.calificaciones().length;
    if (!total) return 0;
    return Math.round((this.getConteo(valor) / total) * 100);
  }

  logout(): void { this.auth.logout(); }
}
