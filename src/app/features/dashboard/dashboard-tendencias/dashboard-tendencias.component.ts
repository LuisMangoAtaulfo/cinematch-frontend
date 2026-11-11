import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MetricasService, MetricasDia, RetroalimentacionService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { CalificacionResponse } from '../../../core/models';

interface PuntoDatos {
  x: number;
  y: number;
  valor: number;
  fecha: string;
  fechaLabel: string;
}

@Component({
  selector: 'app-dashboard-tendencias',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  template: `
    <div class="page">
      <nav class="navbar">
        <span class="navbar__logo">CineMatch</span>
        <div class="navbar__actions">
          <a routerLink="/admin/dashboard" class="btn btn--ghost btn--sm">Panel</a>
          <a routerLink="/admin/metricas" class="btn btn--ghost btn--sm">Métricas</a>
          <a routerLink="/admin/plataformas" class="btn btn--ghost btn--sm">Plataformas</a>
          <a routerLink="/admin/retroalimentacion" class="btn btn--ghost btn--sm">Retroalimentación</a>
          <button class="btn btn--secondary btn--sm" (click)="logout()">Salir</button>
        </div>
      </nav>

      <div style="flex:1; padding:28px 24px;">
        <div class="container container--wide" style="margin:0 auto;">
          <p class="section-title">Análisis de Tendencias</p>
          <p class="section-sub">Evolución detallada de la actividad de la plataforma</p>

          @if (cargando()) {
            <p style="color:var(--text-sub);">Cargando historial...</p>
          } @else if (historial().length === 0) {
            <div class="card" style="text-align:center; padding:32px;">
              <p style="color:var(--text-sub);">No hay datos históricos disponibles.</p>
            </div>
          } @else {

            <!-- Filtro de rango -->
            <div style="display:flex; gap:12px; align-items:flex-end; margin-bottom:28px; flex-wrap:wrap;">
              <div class="form-group" style="flex:1; min-width:140px;">
                <label>Periodo rápido</label>
                <select (change)="aplicarPeriodoRapido($any($event.target).value)">
                  <option value="">Seleccionar...</option>
                  <option value="7">Últimos 7 días</option>
                  <option value="14">Últimos 14 días</option>
                  <option value="30">Últimos 30 días</option>
                  <option value="all">Todo el historial</option>
                </select>
              </div>
              <div class="form-group" style="flex:1; min-width:140px;">
                <label>Desde</label>
                <input type="date" [value]="fechaDesde()"
                       (change)="fechaDesde.set($any($event.target).value)"
                       [min]="fechaMin()" [max]="fechaHasta() || fechaMax()">
              </div>
              <div class="form-group" style="flex:1; min-width:140px;">
                <label>Hasta</label>
                <input type="date" [value]="fechaHasta()"
                       (change)="fechaHasta.set($any($event.target).value)"
                       [min]="fechaDesde() || fechaMin()" [max]="fechaMax()">
              </div>
              @if (fechaDesde() || fechaHasta()) {
                <button class="btn btn--ghost" style="height:44px;" (click)="limpiarFiltro()">
                  Limpiar
                </button>
              }
            </div>

            @if (!historialFiltrado().length) {
              <div class="card" style="text-align:center; padding:32px;">
                <p style="color:var(--text-sub);">No hay datos en el rango seleccionado.</p>
              </div>
            } @else {

              <!-- Resumen de periodo -->
              <div class="grid-3" style="margin-bottom:32px;">
                <div class="metric-card">
                  <p class="metric-value">{{ resumenPeriodo().promedioSalas | number:'1.1-1' }}</p>
                  <p class="metric-label">Promedio diario de salas</p>
                </div>
                <div class="metric-card">
                  <p class="metric-value">{{ resumenPeriodo().promedioMatches | number:'1.1-1' }}</p>
                  <p class="metric-label">Promedio diario de matches</p>
                </div>
                <div class="metric-card">
                  <p class="metric-value">{{ resumenPeriodo().diasActivos }}</p>
                  <p class="metric-label">Días con actividad</p>
                </div>
              </div>

              <!-- Gráfica de área: salas y matches -->
              <div class="card" style="margin-bottom:32px; position:relative;">
                <p style="font-weight:500; margin-bottom:4px;">Salas y matches por día</p>
                <p style="font-size:12px; color:var(--text-sub); margin-bottom:16px;">
                  Comparación diaria de creación de salas vs matches generados
                </p>
                <svg [attr.viewBox]="'0 0 ' + chartWidth + ' ' + chartHeight"
                     style="width:100%; height:320px;">
                  <!-- Grid horizontal -->
                  @for (i of gridLines; track i) {
                    <line [attr.x1]="padding" 
                          [attr.y1]="chartHeight - padding - chartInnerH() * i"
                          [attr.x2]="chartWidth - padding"
                          [attr.y2]="chartHeight - padding - chartInnerH() * i"
                          stroke="var(--border)" stroke-width="0.5" stroke-dasharray="4,4"/>
                    <text [attr.x]="padding - 8"
                          [attr.y]="chartHeight - padding - chartInnerH() * i + 4"
                          text-anchor="end" style="font-size:10px; fill:var(--text-sub);">
                      {{ maxArea() * i | number:'1.0-0' }}
                    </text>
                  }
                  <!-- Ejes -->
                  <line [attr.x1]="padding" [attr.y1]="padding"
                        [attr.x2]="padding" [attr.y2]="chartHeight - padding"
                        stroke="var(--border)" stroke-width="1"/>
                  <line [attr.x1]="padding" [attr.y1]="chartHeight - padding"
                        [attr.x2]="chartWidth - padding" [attr.y2]="chartHeight - padding"
                        stroke="var(--border)" stroke-width="1"/>

                  <!-- Área de salas -->
                  <polygon [attr.points]="areaSalas()" fill="var(--accent)" opacity="0.15"/>
                  <polyline [attr.points]="lineaSalas()" fill="none" 
                            stroke="var(--accent)" stroke-width="2"/>

                  <!-- Área de matches -->
                  <polygon [attr.points]="areaMatches()" fill="#6366f1" opacity="0.15"/>
                  <polyline [attr.points]="lineaMatches()" fill="none"
                            stroke="#6366f1" stroke-width="2"/>

                  <!-- Puntos interactivos -->
                  @for (p of puntosSalas(); track $index) {
                    <circle [attr.cx]="p.x" [attr.cy]="p.y" r="4"
                            fill="var(--accent)" stroke="white" stroke-width="1.5"
                            style="cursor:pointer;"
                            (mouseenter)="mostrarTooltip(p, 'Salas creadas')"
                            (mouseleave)="ocultarTooltip()"/>
                  }
                  @for (p of puntosMatches(); track $index) {
                    <circle [attr.cx]="p.x" [attr.cy]="p.y" r="4"
                            fill="#6366f1" stroke="white" stroke-width="1.5"
                            style="cursor:pointer;"
                            (mouseenter)="mostrarTooltip(p, 'Matches generados')"
                            (mouseleave)="ocultarTooltip()"/>
                  }

                  <!-- Etiquetas X -->
                  @for (et of etiquetasX(); track $index) {
                    <text [attr.x]="et.x" [attr.y]="chartHeight - padding + 16"
                          text-anchor="middle" style="font-size:10px; fill:var(--text-sub);">
                      {{ et.label }}
                    </text>
                  }
                </svg>

                <!-- Leyenda -->
                <div style="display:flex; gap:24px; justify-content:center; margin-top:12px;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:12px; height:12px; background:var(--accent); border-radius:2px; opacity:0.3;"></div>
                    <div style="width:16px; height:3px; background:var(--accent); margin-left:-20px;"></div>
                    <span style="font-size:13px; color:var(--text-sub);">Salas</span>
                  </div>
                  <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:12px; height:12px; background:#6366f1; border-radius:2px; opacity:0.3;"></div>
                    <div style="width:16px; height:3px; background:#6366f1; margin-left:-20px;"></div>
                    <span style="font-size:13px; color:var(--text-sub);">Matches</span>
                  </div>
                </div>

                <!-- Tooltip -->
                @if (tooltipVisible()) {
                  <div class="chart-tooltip" [style.left.px]="tooltipPos().x" [style.top.px]="tooltipPos().y">
                    <p style="font-size:11px; color:var(--text-sub); margin-bottom:2px;">{{ tooltipPos().fecha }}</p>
                    <p style="font-size:13px; font-weight:500;">
                      {{ tooltipPos().label }}: <strong>{{ tooltipPos().valor }}</strong>
                    </p>
                  </div>
                }
              </div>

              <!-- Gráfica de barras: calificación promedio por día -->
              <div class="card" style="margin-bottom:32px;">
                <p style="font-weight:500; margin-bottom:4px;">Calificación promedio por día</p>
                <p style="font-size:12px; color:var(--text-sub); margin-bottom:16px;">
                  Evolución diaria de la satisfacción de los usuarios (escala 1-10)
                </p>
                <svg [attr.viewBox]="'0 0 ' + chartWidth + ' ' + barChartHeight"
                     style="width:100%; height:250px;">
                  <!-- Línea de referencia (promedio = 7) -->
                  <line [attr.x1]="padding" 
                        [attr.y1]="barChartHeight - padding - (7/10) * barInnerH()"
                        [attr.x2]="chartWidth - padding"
                        [attr.y2]="barChartHeight - padding - (7/10) * barInnerH()"
                        stroke="var(--success)" stroke-width="1" stroke-dasharray="6,4" opacity="0.6"/>
                  <text [attr.x]="chartWidth - padding + 4"
                        [attr.y]="barChartHeight - padding - (7/10) * barInnerH() + 4"
                        style="font-size:9px; fill:var(--success);">Meta (7)</text>

                  <!-- Barras -->
                  @for (barra of barrasCalificacion(); track $index) {
                    <rect [attr.x]="barra.x" [attr.y]="barra.y"
                          [attr.width]="barra.width" [attr.height]="barra.height"
                          [attr.fill]="barra.color" rx="3"
                          style="cursor:pointer;"
                          (mouseenter)="mostrarTooltipBarra(barra)"
                          (mouseleave)="ocultarTooltip()"/>
                  }

                  <!-- Eje X -->
                  <line [attr.x1]="padding" [attr.y1]="barChartHeight - padding"
                        [attr.x2]="chartWidth - padding" [attr.y2]="barChartHeight - padding"
                        stroke="var(--border)" stroke-width="1"/>
                  <!-- Eje Y -->
                  <line [attr.x1]="padding" [attr.y1]="padding"
                        [attr.x2]="padding" [attr.y2]="barChartHeight - padding"
                        stroke="var(--border)" stroke-width="1"/>

                  <!-- Etiquetas Y -->
                  @for (v of [2, 4, 6, 8, 10]; track v) {
                    <text [attr.x]="padding - 8" 
                          [attr.y]="barChartHeight - padding - (v/10) * barInnerH() + 4"
                          text-anchor="end" style="font-size:10px; fill:var(--text-sub);">
                      {{ v }}
                    </text>
                  }
                </svg>
              </div>

              <!-- Tabla de datos -->
              <div class="card">
                <p style="font-weight:500; margin-bottom:16px;">Detalle diario</p>
                <div style="overflow-x:auto;">
                  <table style="width:100%; border-collapse:collapse; font-size:13px;">
                    <thead>
                      <tr style="border-bottom:2px solid var(--border);">
                        <th style="text-align:left; padding:8px 12px; color:var(--text-sub); font-weight:500;">Fecha</th>
                        <th style="text-align:right; padding:8px 12px; color:var(--text-sub); font-weight:500;">Salas</th>
                        <th style="text-align:right; padding:8px 12px; color:var(--text-sub); font-weight:500;">Activas</th>
                        <th style="text-align:right; padding:8px 12px; color:var(--text-sub); font-weight:500;">Matches</th>
                        <th style="text-align:right; padding:8px 12px; color:var(--text-sub); font-weight:500;">Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (dia of historialFiltradoReverso(); track dia.fecha) {
                        <tr style="border-bottom:1px solid var(--border);">
                          <td style="padding:10px 12px;">{{ formatearFecha(dia.fecha) }}</td>
                          <td style="text-align:right; padding:10px 12px; font-weight:500;">{{ dia.totalSalas }}</td>
                          <td style="text-align:right; padding:10px 12px; color:var(--success);">{{ dia.salasActivas }}</td>
                          <td style="text-align:right; padding:10px 12px; font-weight:500;">{{ dia.totalMatches }}</td>
                          <td style="text-align:right; padding:10px 12px;">
                            @if (dia.promedioCalificacion) {
                              <span [style.color]="getColorNota(dia.promedioCalificacion)">
                                {{ dia.promedioCalificacion | number:'1.1-1' }}
                              </span>
                            } @else {
                              <span style="color:var(--text-sub);">—</span>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              <div style="text-align:center; margin-top:32px;">
                <a routerLink="/admin/dashboard" class="btn btn--ghost">
                  ← Volver al panel principal
                </a>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chart-tooltip {
      position: absolute;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      pointer-events: none;
      z-index: 100;
      transform: translateX(-50%);
    }
    
    table {
      font-family: var(--font);
    }
  `]
})
export class DashboardTendenciasComponent implements OnInit {
  historial = signal<MetricasDia[]>([]);
  cargando = signal(true);

  fechaDesde = signal('');
  fechaHasta = signal('');

  readonly chartWidth = 800;
  readonly chartHeight = 320;
  readonly barChartHeight = 250;
  readonly padding = 40;
  readonly gridLines = [0.25, 0.5, 0.75, 1];

  tooltipVisible = signal(false);
  tooltipPos = signal({ x: 0, y: 0, fecha: '', valor: 0, label: '' });

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
    const lista = this.historial();
    const desde = this.fechaDesde() ? new Date(this.fechaDesde()) : null;
    const hastaRaw = this.fechaHasta() ? new Date(this.fechaHasta()) : null;
    const hasta = hastaRaw
      ? new Date(hastaRaw.getFullYear(), hastaRaw.getMonth(), hastaRaw.getDate() + 1)
      : null;
    return lista.filter(c => {
      const fecha = this.normalizarFecha(c.fecha);
      if (desde && fecha < desde) return false;
      if (hasta && fecha >= hasta) return false;
      return true;
    });
  });

  historialFiltradoReverso = computed(() => [...this.historialFiltrado()].reverse());

  chartInnerH = computed(() => this.chartHeight - 2 * this.padding);
  barInnerH = computed(() => this.barChartHeight - 2 * this.padding);

  maxArea = computed(() => {
    const lista = this.historialFiltrado();
    if (!lista.length) return 10;
    const max = Math.max(
      ...lista.map(d => Math.max(d.totalSalas, d.totalMatches)),
      10
    );
    return Math.ceil(max * 1.1);
  });

  resumenPeriodo = computed(() => {
    const lista = this.historialFiltrado();
    if (!lista.length) return { promedioSalas: 0, promedioMatches: 0, diasActivos: 0 };
    const diasActivos = lista.filter(d => d.totalSalas > 0 || d.totalMatches > 0).length;
    return {
      promedioSalas: lista.reduce((s, d) => s + d.totalSalas, 0) / lista.length,
      promedioMatches: lista.reduce((s, d) => s + d.totalMatches, 0) / lista.length,
      diasActivos
    };
  });

  stepX = computed(() => {
    const len = this.historialFiltrado().length;
    return len <= 1 ? 0 : (this.chartWidth - 2 * this.padding) / (len - 1);
  });

  lineaSalas = computed(() => {
    const lista = this.historialFiltrado();
    if (!lista.length) return '';
    const max = this.maxArea();
    const innerH = this.chartInnerH();
    const step = this.stepX();
    return lista.map((d, i) => {
      const x = this.padding + i * step;
      const y = this.chartHeight - this.padding - (d.totalSalas / max) * innerH;
      return `${x},${y}`;
    }).join(' ');
  });

  lineaMatches = computed(() => {
    const lista = this.historialFiltrado();
    if (!lista.length) return '';
    const max = this.maxArea();
    const innerH = this.chartInnerH();
    const step = this.stepX();
    return lista.map((d, i) => {
      const x = this.padding + i * step;
      const y = this.chartHeight - this.padding - (d.totalMatches / max) * innerH;
      return `${x},${y}`;
    }).join(' ');
  });

  areaSalas = computed(() => {
    const lista = this.historialFiltrado();
    if (!lista.length) return '';
    const line = this.lineaSalas();
    const ultimoX = this.padding + (lista.length - 1) * this.stepX();
    return `${this.padding},${this.chartHeight - this.padding} ${line} ${ultimoX},${this.chartHeight - this.padding}`;
  });

  areaMatches = computed(() => {
    const lista = this.historialFiltrado();
    if (!lista.length) return '';
    const line = this.lineaMatches();
    const ultimoX = this.padding + (lista.length - 1) * this.stepX();
    return `${this.padding},${this.chartHeight - this.padding} ${line} ${ultimoX},${this.chartHeight - this.padding}`;
  });

  puntosSalas = computed((): PuntoDatos[] => {
    const lista = this.historialFiltrado();
    if (!lista.length) return [];
    const max = this.maxArea();
    const innerH = this.chartInnerH();
    const step = this.stepX();
    return lista.map((d, i) => ({
      x: this.padding + i * step,
      y: this.chartHeight - this.padding - (d.totalSalas / max) * innerH,
      valor: d.totalSalas,
      fecha: this.formatearFecha(d.fecha),
      fechaLabel: d.fecha
    }));
  });

  puntosMatches = computed((): PuntoDatos[] => {
    const lista = this.historialFiltrado();
    if (!lista.length) return [];
    const max = this.maxArea();
    const innerH = this.chartInnerH();
    const step = this.stepX();
    return lista.map((d, i) => ({
      x: this.padding + i * step,
      y: this.chartHeight - this.padding - (d.totalMatches / max) * innerH,
      valor: d.totalMatches,
      fecha: this.formatearFecha(d.fecha),
      fechaLabel: d.fecha
    }));
  });

  etiquetasX = computed(() => {
    const lista = this.historialFiltrado();
    if (!lista.length) return [];
    const step = this.stepX();
    const maxEtiquetas = Math.min(lista.length, 10);
    const intervalo = Math.max(1, Math.ceil(lista.length / maxEtiquetas));
    return lista
      .map((d, i) => ({
        x: this.padding + i * step,
        label: this.formatearFechaCorta(d.fecha)
      }))
      .filter((_, i) => i % intervalo === 0 || i === lista.length - 1);
  });

  barrasCalificacion = computed(() => {
    const lista = this.historialFiltrado().filter(d => d.promedioCalificacion !== null && d.promedioCalificacion > 0);
    if (!lista.length) return [];
    const innerH = this.barInnerH();
    const innerW = this.chartWidth - 2 * this.padding;
    const barWidth = Math.min(30, (innerW / lista.length) * 0.7);
    const gap = (innerW - barWidth * lista.length) / (lista.length + 1);
    return lista.map((d, i) => {
      const x = this.padding + gap + i * (barWidth + gap);
      const height = ((d.promedioCalificacion ?? 0) / 10) * innerH;
      const y = this.barChartHeight - this.padding - height;
      let color = 'var(--accent)';
      if ((d.promedioCalificacion ?? 0) >= 8) color = 'var(--success)';
      else if ((d.promedioCalificacion ?? 0) < 5) color = 'var(--danger)';
      return {
        x, y, width: barWidth, height, color,
        valor: d.promedioCalificacion ?? 0,
        fecha: this.formatearFecha(d.fecha)
      };
    });
  });

  constructor(
    private metricasSvc: MetricasService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.metricasSvc.getHistorial().subscribe({
      next: (data) => { this.historial.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false)
    });
  }

  aplicarPeriodoRapido(periodo: string): void {
    if (!periodo) return;
    const lista = this.historial();
    if (!lista.length) return;

    if (periodo === 'all') {
      this.fechaDesde.set('');
      this.fechaHasta.set('');
      return;
    }

    const dias = parseInt(periodo);
    const ultimaFecha = this.normalizarFecha(lista[lista.length - 1].fecha);
    const desde = new Date(ultimaFecha);
    desde.setDate(desde.getDate() - dias + 1);
    this.fechaDesde.set(this.toDateInput(desde));
    this.fechaHasta.set(this.toDateInput(ultimaFecha));
  }

  limpiarFiltro(): void {
    this.fechaDesde.set('');
    this.fechaHasta.set('');
  }

  logout(): void { this.auth.logout(); }

  mostrarTooltip(punto: PuntoDatos, label: string): void {
    this.tooltipPos.set({
      x: punto.x,
      y: punto.y - 50,
      fecha: punto.fecha,
      valor: punto.valor,
      label
    });
    this.tooltipVisible.set(true);
  }

  mostrarTooltipBarra(barra: { x: number; y: number; valor: number; fecha: string }): void {
    this.tooltipPos.set({
      x: barra.x + 15,
      y: barra.y - 40,
      fecha: barra.fecha,
      valor: barra.valor,
      label: 'Promedio'
    });
    this.tooltipVisible.set(true);
  }

  ocultarTooltip(): void {
    this.tooltipVisible.set(false);
  }

  getColorNota(valor: number): string {
    if (valor >= 8) return 'var(--success)';
    if (valor >= 6) return '#f59e0b';
    return 'var(--danger)';
  }

  formatearFecha(fechaStr: string): string {
    return this.normalizarFecha(fechaStr)
      .toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatearFechaCorta(fechaStr: string): string {
    return this.normalizarFecha(fechaStr)
      .toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  }

  private toDateInput(fecha: string | Date): string {
    const d = typeof fecha === 'string' ? this.normalizarFecha(fecha) : fecha;
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private normalizarFecha(fechaStr: string): Date {
    const normalizada = fechaStr.includes('Z') || fechaStr.includes('+')
      ? fechaStr : fechaStr + 'Z';
    return new Date(normalizada);
  }
}
