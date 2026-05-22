import { Component, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { MetricasService, MetricasDia } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { Metricas } from '../../../core/models';

@Component({
  selector: 'app-metricas',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="page">
      <nav class="navbar">
        <span class="navbar__logo">CineMatch</span>
        <div class="navbar__actions">
          <a routerLink="/admin/plataformas"       class="btn btn--ghost btn--sm">Plataformas</a>
          <a routerLink="/admin/retroalimentacion" class="btn btn--ghost btn--sm">Retroalimentacion</a>
          <button class="btn btn--secondary btn--sm" (click)="logout()">Salir</button>
        </div>
      </nav>

      <div style="flex:1; padding:28px 24px;">
        <div class="container container--wide" style="margin:0 auto;">
          <p class="section-title">Panel de metricas</p>
          <p class="section-sub">Resumen de actividad de la plataforma</p>

          @if (cargando()) {
            <p style="color:var(--text-sub);">Cargando...</p>
          } @else {

            <!-- Date range filter -->
            <div style="display:flex; gap:12px; align-items:flex-end; margin-bottom:28px; flex-wrap:wrap;">
              <div class="form-group" style="flex:1; min-width:140px;">
                <label for="desde">Desde</label>
                <input id="desde" type="date"
                       [value]="fechaDesde()"
                       (change)="fechaDesde.set($any($event.target).value)"
                       [min]="fechaMin()"
                       [max]="fechaHasta() || fechaMax()">
              </div>
              <div class="form-group" style="flex:1; min-width:140px;">
                <label for="hasta">Hasta</label>
                <input id="hasta" type="date"
                       [value]="fechaHasta()"
                       (change)="fechaHasta.set($any($event.target).value)"
                       [min]="fechaDesde() || fechaMin()"
                       [max]="fechaMax()">
              </div>
              @if (fechaDesde() || fechaHasta()) {
                <button class="btn btn--ghost" style="height:44px; padding:0 16px;"
                        (click)="limpiarFiltro()">
                  Limpiar
                </button>
              }
            </div>

            @if (!historialFiltrado().length) {
              <div class="card" style="text-align:center; padding:32px;">
                <p style="color:var(--text-sub);">No hay datos en el rango seleccionado.</p>
              </div>
            } @else if (metricasAgregadas(); as m) {

              @if (fechaDesde() || fechaHasta()) {
                <p style="font-size:12px; color:var(--accent); margin-bottom:16px;">
                  Filtro activo
                </p>
              }

              <div class="grid-3" style="margin-bottom:24px;">
                <div class="metric-card">
                  <p class="metric-value">{{ m.salasActivas }}</p>
                  <p class="metric-label">Salas activas</p>
                </div>
                <div class="metric-card">
                  <p class="metric-value">{{ m.totalSalas }}</p>
                  <p class="metric-label">Salas totales</p>
                </div>
                <div class="metric-card">
                  <p class="metric-value">{{ m.totalMatches }}</p>
                  <p class="metric-label">Matches generados</p>
                </div>
              </div>

              <div class="card">
                <div class="metric-card" style="border:none; padding:0;">
                  <p class="metric-value">{{ m.promedioCalificacion | number:'1.1-1' }}</p>
                  <p class="metric-label">Promedio de calificacion</p>
                </div>
              </div>

            }
          }
        </div>
      </div>
    </div>
  `
})
export class MetricasComponent implements OnInit {

  historial  = signal<MetricasDia[]>([]);
  cargando   = signal(true);

  fechaDesde = signal('');
  fechaHasta = signal('');

  fechaMin = computed(() => {
    const lista = this.historial();
    if (!lista.length) return '';
    return this.toDateInput(lista[0].fecha);
  });

  fechaMax = computed(() => {
    const lista = this.historial();
    if (!lista.length) return '';
    return this.toDateInput(lista[lista.length - 1].fecha);
  });

  historialFiltrado = computed(() => {
    const lista    = this.historial();
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

  metricasAgregadas = computed((): Metricas | null => {
    const lista = this.historialFiltrado();
    if (!lista.length) return null;

    const totalSalas   = lista.reduce((s, d) => s + d.totalSalas,   0);
    const salasActivas = lista.reduce((s, d) => s + d.salasActivas, 0);
    const totalMatches = lista.reduce((s, d) => s + d.totalMatches, 0);
    const conPromedio  = lista.filter(d => d.promedioCalificacion !== null && d.promedioCalificacion > 0);
    const promedio     = conPromedio.length
        ? conPromedio.reduce((s, d) => s + (d.promedioCalificacion ?? 0), 0) / conPromedio.length
        : 0;

    return { totalSalas, salasActivas, totalMatches, promedioCalificacion: promedio };
  });

  constructor(
      private metricasSvc: MetricasService,
      private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.metricasSvc.getHistorial().subscribe({
      next:  (data) => { this.historial.set(data); this.cargando.set(false); },
      error: ()     => this.cargando.set(false)
    });
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