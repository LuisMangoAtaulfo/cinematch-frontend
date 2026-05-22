import { Component, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RetroalimentacionService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { CalificacionResponse } from '../../../core/models';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-retroalimentacion',
  standalone: true,
  imports: [RouterLink, DecimalPipe, FormsModule],
  styles: [`
    .bar-row { display: flex; align-items: center; gap: 10px; font-size: 13px; }
    .bar-track { flex: 1; height: 8px; background: var(--surface2); border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; background: var(--accent); border-radius: 4px; transition: width 0.4s ease; }
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

            <!-- Filtro de fechas -->
            <div style="display:flex; gap:12px; align-items:flex-end; margin-bottom:28px; flex-wrap:wrap;">
              <div class="form-group" style="flex:1; min-width:140px;">
                <label>Desde</label>
                <input
                    type="date"
                    [value]="fechaDesde()"
                    (change)="fechaDesde.set($any($event.target).value)"
                    [min]="fechaMin()"
                    [max]="fechaHasta() || fechaMax()">
              </div>
              <div class="form-group" style="flex:1; min-width:140px;">
                <label>Hasta</label>
                <input
                    type="date"
                    [value]="fechaHasta()"
                    (change)="fechaHasta.set($any($event.target).value)"
                    [min]="fechaDesde() || fechaMin()"
                    [max]="fechaMax()">
              </div>
            @if (fechaDesde() || fechaHasta()) {
              <button class="btn btn--ghost" style="height:44px;" (click)="limpiarFiltro()">
                Limpiar
              </button>
            }
            </div>

            <!-- Sin resultados -->
            @if (!calificacionesFiltradas().length) {
              <div class="card" style="text-align:center; padding:32px;">
                <p style="color:var(--text-sub);">No hay calificaciones en el rango seleccionado.</p>
              </div>
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
                    Basado en <strong style="color:var(--text);">{{ calificacionesFiltradas().length }}</strong> calificaciones
                  </p>
                  @if (fechaDesde() || fechaHasta()) {
                    <p style="font-size:12px; color:var(--accent); margin-top:4px;">● Filtro activo</p>
                  }
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
                        <div class="bar-fill" [style.width]="getPorcentaje(valor) + '%'"></div>
                      </div>
                      <span class="bar-count">{{ getConteo(valor) }}</span>
                    </div>
                  }
                </div>
              </div>

            }
          }
        </div>
      </div>
    </div>
  `
})
export class RetroalimentacionComponent implements OnInit {
  calificaciones = signal<CalificacionResponse[]>([]);
  cargando       = signal(true);
  readonly valoresDesc = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

  fechaDesde = signal('');
  fechaHasta = signal('');

  /** Fecha más antigua del dataset → mínimo seleccionable en el calendario */
  fechaMin = computed(() => {
    const lista = this.calificaciones();
    if (!lista.length) return '';
    const min = lista.reduce((a, b) => a.fecha < b.fecha ? a : b);
    return this.toDateInput(min.fecha);
  });

  /** Fecha más reciente del dataset → máximo seleccionable en el calendario */
  fechaMax = computed(() => {
    const lista = this.calificaciones();
    if (!lista.length) return '';
    const max = lista.reduce((a, b) => a.fecha > b.fecha ? a : b);
    return this.toDateInput(max.fecha);
  });

  calificacionesFiltradas = computed(() => {
    const lista    = this.calificaciones();
    const desde    = this.fechaDesde() ? new Date(this.fechaDesde()) : null;
    const hastaRaw = this.fechaHasta() ? new Date(this.fechaHasta()) : null;
    const hasta    = hastaRaw
        ? new Date(hastaRaw.getFullYear(), hastaRaw.getMonth(), hastaRaw.getDate() + 1)
        : null;

    return lista.filter(c => {
      const fecha = this.normalizarFecha(c.fecha); // ← único cambio aquí
      if (desde && fecha < desde) return false;
      if (hasta && fecha >= hasta) return false;
      return true;
    });
  });

  promedio = computed(() => {
    const lista = this.calificacionesFiltradas();
    if (!lista.length) return 0;
    return lista.reduce((sum, c) => sum + c.valor, 0) / lista.length;
  });

  constructor(
      private retroSvc: RetroalimentacionService,
      private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.retroSvc.getAll().subscribe({
      next:  (data) => { this.calificaciones.set(data); this.cargando.set(false); },
      error: ()     => this.cargando.set(false)
    });
  }

  getConteo(valor: number): number {
    return this.calificacionesFiltradas().filter(c => c.valor === valor).length;
  }

  getPorcentaje(valor: number): number {
    const total = this.calificacionesFiltradas().length;
    if (!total) return 0;
    return Math.round((this.getConteo(valor) / total) * 100);
  }

  limpiarFiltro(): void {
    this.fechaDesde.set('');
    this.fechaHasta.set('');
  }

  logout(): void { this.auth.logout(); }

  private toDateInput(fecha: string | Date): string {
    const d = typeof fecha === 'string' ? this.normalizarFecha(fecha) : fecha;
    const yyyy = d.getUTCFullYear();
    const mm   = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd   = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  private normalizarFecha(fechaStr: string): Date {
    const normalizada = fechaStr.includes('Z') || fechaStr.includes('+')
        ? fechaStr
        : fechaStr + 'Z';
    return new Date(normalizada);
  }
}