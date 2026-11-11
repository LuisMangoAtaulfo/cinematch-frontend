import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MetricasService, MetricasDia } from '../../../core/services/admin.service';
import { RetroalimentacionService } from '../../../core/services/admin.service';
import { CalificacionResponse } from '../../../core/models';

@Component({
  selector: 'app-dashboard-actividad',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  template: `
    <div class="page">
      <nav class="navbar">
        <span class="navbar__logo">CineMatch</span>
        <div class="navbar__actions">
          <a routerLink="/admin/metricas" class="btn btn--ghost btn--sm">Métricas</a>
          <a routerLink="/admin/plataformas" class="btn btn--ghost btn--sm">Plataformas</a>
          <a routerLink="/admin/retroalimentacion" class="btn btn--ghost btn--sm">Retroalimentación</a>
          <button class="btn btn--secondary btn--sm" (click)="logout()">Salir</button>
        </div>
      </nav>

      <div style="flex:1; padding:28px 24px;">
        <div class="container container--wide" style="margin:0 auto;">
          <p class="section-title">Dashboard</p>
          <p class="section-sub">Métricas clave de la plataforma en tiempo real</p>

          @if (cargando()) {
            <p style="color:var(--text-sub);">Cargando datos...</p>
          } @else {

            <!-- Filtro de fechas -->
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
            } @else {

              <!-- KPIs en zona óptima (superior izquierda) -->
              <div class="grid-3" style="margin-bottom:32px;">
                <div class="metric-card">
                  <p class="metric-value">{{ metricasAgregadas().totalSalas }}</p>
                  <p class="metric-label">Salas totales</p>
                  <svg class="sparkline" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <polyline [attr.points]="sparklineSalas()" fill="none" stroke="var(--accent)" stroke-width="1.5"/>
                  </svg>
                </div>
                <div class="metric-card">
                  <p class="metric-value">{{ metricasAgregadas().salasActivas }}</p>
                  <p class="metric-label">Salas activas</p>
                  <svg class="sparkline" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <polyline [attr.points]="sparklineActivas()" fill="none" stroke="var(--success)" stroke-width="1.5"/>
                  </svg>
                </div>
                <div class="metric-card">
                  <p class="metric-value">{{ metricasAgregadas().totalMatches }}</p>
                  <p class="metric-label">Matches generados</p>
                  <svg class="sparkline" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <polyline [attr.points]="sparklineMatches()" fill="none" stroke="#6366f1" stroke-width="1.5"/>
                  </svg>
                </div>
              </div>

              <!-- Gauge de calificación promedio -->
              <div class="card gauge" style="margin-bottom:32px;">
                <p style="font-weight:500; margin-bottom:16px;">Calificación promedio de la plataforma</p>
                <div style="display:flex; align-items:center; gap:32px;">
                  <svg class="gauge-chart" width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="var(--surface2)" stroke-width="10"/>
                    <circle cx="60" cy="60" r="50" fill="none" 
                            [attr.stroke]="getColorPromedio()"
                            stroke-width="10"
                            stroke-linecap="round"
                            [attr.stroke-dasharray]="getStrokeDashArray()"
                            stroke-dashoffset="0"
                            transform="rotate(-90 60 60)"/>
                    <text x="60" y="60" text-anchor="middle" dominant-baseline="middle"
                          style="font-size:24px; font-weight:bold; fill:var(--text);">
                      {{ metricasAgregadas().promedioCalificacion | number:'1.1-1' }}
                    </text>
                    <text x="60" y="80" text-anchor="middle"
                          style="font-size:10px; fill:var(--text-sub);">
                      de 10
                    </text>
                  </svg>
                  <div style="flex:1;">
                    <p style="font-size:14px; color:var(--text); margin-bottom:8px;">
                      Basado en <strong>{{ calificaciones().length }}</strong> calificaciones
                    </p>
                    <p style="font-size:13px; color:var(--text-sub);">
                      Distribución:
                    </p>
                    <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">
                      @for (valor of [10, 9, 8, 7, 6]; track valor) {
                        <div style="text-align:center;">
                          <div style="font-size:18px; font-weight:bold; color:var(--accent);">
                            {{ getConteoCalificacion(valor) }}
                          </div>
                          <div style="font-size:11px; color:var(--text-sub);">
                            ★{{ valor }}
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </div>

              <!-- Gráfica de tendencias -->
              <div class="card line-chart evolucion" style="margin-bottom:32px;">
                <p style="font-weight:500; margin-bottom:16px;">Evolución de actividad</p>
                <svg [attr.viewBox]="'0 0 ' + chartWidth + ' ' + chartHeight" 
                     style="width:100%; height:300px;" 
                     (mousemove)="onChartMouseMove($event)"
                     (mouseleave)="tooltipVisible.set(false)">
                  <!-- Eje Y -->
                  <line [attr.x1]="padding" [attr.y1]="padding" 
                        [attr.x2]="padding" [attr.y2]="chartHeight - padding"
                        stroke="var(--border)" stroke-width="1"/>
                  <!-- Eje X -->
                  <line [attr.x1]="padding" [attr.y1]="chartHeight - padding"
                        [attr.x2]="chartWidth - padding" [attr.y2]="chartHeight - padding"
                        stroke="var(--border)" stroke-width="1"/>
                  
                  <!-- Líneas de grid horizontales -->
                  @for (i of [0.25, 0.5, 0.75, 1]; track i) {
                    <line [attr.x1]="padding" 
                          [attr.y1]="chartHeight - padding - (chartHeight - 2*padding) * i"
                          [attr.x2]="chartWidth - padding"
                          [attr.y2]="chartHeight - padding - (chartHeight - 2*padding) * i"
                          stroke="var(--border)" stroke-width="0.5" stroke-dasharray="4,4"/>
                    <text [attr.x]="padding - 8" 
                          [attr.y]="chartHeight - padding - (chartHeight - 2*padding) * i + 4"
                          text-anchor="end" style="font-size:10px; fill:var(--text-sub);">
                      {{ maxValor() * i | number:'1.0-0' }}
                    </text>
                  }
                  
                  <!-- Línea de salas -->
                  <polyline [attr.points]="lineaSalas()" 
                            fill="none" stroke="var(--accent)" stroke-width="2"/>
                  
                  <!-- Línea de matches -->
                  <polyline [attr.points]="lineaMatches()" 
                            fill="none" stroke="#6366f1" stroke-width="2"/>
                  
                  <!-- Puntos de datos -->
                  @for (punto of puntosSalas(); track $index) {
                    <circle [attr.cx]="punto.x" [attr.cy]="punto.y" r="3" 
                            fill="var(--accent)" 
                            (mouseenter)="mostrarTooltip(punto, 'salas')"
                            (mouseleave)="tooltipVisible.set(false)"/>
                  }
                  
                  @for (punto of puntosMatches(); track $index) {
                    <circle [attr.cx]="punto.x" [attr.cy]="punto.y" r="3" 
                            fill="#6366f1"
                            (mouseenter)="mostrarTooltip(punto, 'matches')"
                            (mouseleave)="tooltipVisible.set(false)"/>
                  }
                  
                  <!-- Etiquetas del eje X (fechas) -->
                  @for (fecha of etiquetasFechas(); track $index) {
                    <text [attr.x]="padding + (chartWidth - 2*padding) * ($index / (etiquetasFechas().length - 1 || 1))"
                          [attr.y]="chartHeight - padding + 16"
                          text-anchor="middle" style="font-size:10px; fill:var(--text-sub);">
                      {{ fecha }}
                    </text>
                  }
                </svg>
                
                <!-- Leyenda -->
                <div style="display:flex; gap:24px; justify-content:center; margin-top:16px;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:16px; height:3px; background:var(--accent);"></div>
                    <span style="font-size:13px; color:var(--text-sub);">Salas</span>
                  </div>
                  <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:16px; height:3px; background:#6366f1;"></div>
                    <span style="font-size:13px; color:var(--text-sub);">Matches</span>
                  </div>
                </div>
                
                <!-- Tooltip -->
                @if (tooltipVisible()) {
                  <div class="chart-tooltip" [style.left.px]="tooltipX()" [style.top.px]="tooltipY()">
                    <p style="font-weight:500; margin-bottom:4px;">{{ tooltipFecha() }}</p>
                    <p style="font-size:12px;">
                      @if (tooltipTipo() === 'salas') {
                        Salas: <strong>{{ tooltipValor() }}</strong>
                      } @else {
                        Matches: <strong>{{ tooltipValor() }}</strong>
                      }
                    </p>
                  </div>
                }
              </div>

              <!-- Enlace a tendencias detalladas -->
              <div style="text-align:center; margin-top:32px;">
                <a routerLink="/admin/dashboard/tendencias" class="btn btn--primary">
                  Ver análisis detallado →
                </a>
              </div>

            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sparkline {
      width: 100%;
      height: 20px;
      margin-top: 8px;
    }
    
    .chart-tooltip {
      position: absolute;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      pointer-events: none;
      z-index: 100;
    }
  `]
})
export class DashboardActividadComponent implements OnInit {
  historial = signal<MetricasDia[]>([]);
  calificaciones = signal<CalificacionResponse[]>([]);
  cargando = signal(true);

  fechaDesde = signal('');
  fechaHasta = signal('');

  // Configuración del gráfico
  readonly chartWidth = 800;
  readonly chartHeight = 300;
  readonly padding = 40;

  // Tooltip
  tooltipVisible = signal(false);
  tooltipX = signal(0);
  tooltipY = signal(0);
  tooltipFecha = signal('');
  tooltipValor = signal(0);
  tooltipTipo = signal('');

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

  metricasAgregadas = computed(() => {
    const lista = this.historialFiltrado();
    if (!lista.length) return { totalSalas: 0, salasActivas: 0, totalMatches: 0, promedioCalificacion: 0 };

    const totalSalas = lista.reduce((s, d) => s + d.totalSalas, 0);
    const salasActivas = lista.reduce((s, d) => s + d.salasActivas, 0);
    const totalMatches = lista.reduce((s, d) => s + d.totalMatches, 0);
    const conPromedio = lista.filter(d => d.promedioCalificacion !== null && d.promedioCalificacion > 0);
    const promedio = conPromedio.length
      ? conPromedio.reduce((s, d) => s + (d.promedioCalificacion ?? 0), 0) / conPromedio.length
      : 0;

    return { totalSalas, salasActivas, totalMatches, promedioCalificacion: promedio };
  });

  maxValor = computed(() => {
    const lista = this.historialFiltrado();
    if (!lista.length) return 10;
    const maxSalas = Math.max(...lista.map(d => d.totalSalas));
    const maxMatches = Math.max(...lista.map(d => d.totalMatches));
    return Math.max(maxSalas, maxMatches, 10);
  });

  sparklineSalas = computed(() => this.generarSparkline(this.historialFiltrado().map(d => d.totalSalas)));
  sparklineActivas = computed(() => this.generarSparkline(this.historialFiltrado().map(d => d.salasActivas)));
  sparklineMatches = computed(() => this.generarSparkline(this.historialFiltrado().map(d => d.totalMatches)));

  lineaSalas = computed(() => this.generarLinea(this.historialFiltrado().map(d => d.totalSalas)));
  lineaMatches = computed(() => this.generarLinea(this.historialFiltrado().map(d => d.totalMatches)));

  puntosSalas = computed(() => this.generarPuntos(this.historialFiltrado().map(d => d.totalSalas)));
  puntosMatches = computed(() => this.generarPuntos(this.historialFiltrado().map(d => d.totalMatches)));

  etiquetasFechas = computed(() => {
    const lista = this.historialFiltrado();
    if (lista.length <= 7) {
      return lista.map(d => this.formatearFechaCorta(d.fecha));
    }
    // Mostrar solo algunas fechas si hay muchas
    const step = Math.ceil(lista.length / 7);
    return lista.filter((_, i) => i % step === 0).map(d => this.formatearFechaCorta(d.fecha));
  });

  constructor(
    private metricasSvc: MetricasService,
    private retroSvc: RetroalimentacionService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.metricasSvc.getHistorial().subscribe({
      next: (data) => {
        this.historial.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });

    this.retroSvc.getAll().subscribe({
      next: (data) => this.calificaciones.set(data),
      error: () => {}
    });
  }

  limpiarFiltro(): void {
    this.fechaDesde.set('');
    this.fechaHasta.set('');
  }

  logout(): void {
    this.auth.logout();
  }

  getColorPromedio(): string {
    const promedio = this.metricasAgregadas().promedioCalificacion;
    if (promedio >= 8) return 'var(--success)';
    if (promedio >= 6) return '#f59e0b';
    return 'var(--danger)';
  }

  getStrokeDashArray(): string {
    const promedio = this.metricasAgregadas().promedioCalificacion;
    const porcentaje = (promedio / 10) * 314.16; // 2πr = 2*π*50 ≈ 314.16
    return `${porcentaje}, 314.16`;
  }

  getConteoCalificacion(valor: number): number {
    return this.calificaciones().filter(c => c.valor === valor).length;
  }

  onChartMouseMove(event: MouseEvent): void {
    // Este método se puede usar para interactividad adicional si es necesario
  }

  mostrarTooltip(punto: { x: number; y: number; valor: number; fecha: string }, tipo: string): void {
    this.tooltipX.set(punto.x);
    this.tooltipY.set(punto.y - 60);
    this.tooltipFecha.set(this.formatearFecha(punto.fecha));
    this.tooltipValor.set(punto.valor);
    this.tooltipTipo.set(tipo);
    this.tooltipVisible.set(true);
  }

  private generarSparkline(valores: number[]): string {
    if (!valores.length) return '';
    const max = Math.max(...valores, 1);
    const step = 100 / (valores.length - 1 || 1);
    return valores.map((v, i) => `${i * step},${20 - (v / max) * 18}`).join(' ');
  }

  private generarLinea(valores: number[]): string {
    if (!valores.length) return '';
    const chartArea = {
      x: this.padding,
      y: this.padding,
      width: this.chartWidth - 2 * this.padding,
      height: this.chartHeight - 2 * this.padding
    };
    const max = this.maxValor();
    const step = chartArea.width / (valores.length - 1 || 1);
    return valores.map((v, i) => {
      const x = chartArea.x + i * step;
      const y = chartArea.y + chartArea.height - (v / max) * chartArea.height;
      return `${x},${y}`;
    }).join(' ');
  }

  private generarPuntos(valores: number[]): Array<{ x: number; y: number; valor: number; fecha: string }> {
    const lista = this.historialFiltrado();
    if (!valores.length) return [];
    const chartArea = {
      x: this.padding,
      y: this.padding,
      width: this.chartWidth - 2 * this.padding,
      height: this.chartHeight - 2 * this.padding
    };
    const max = this.maxValor();
    const step = chartArea.width / (valores.length - 1 || 1);
    return valores.map((v, i) => ({
      x: chartArea.x + i * step,
      y: chartArea.y + chartArea.height - (v / max) * chartArea.height,
      valor: v,
      fecha: lista[i]?.fecha || ''
    }));
  }

  private formatearFecha(fechaStr: string): string {
    const fecha = this.normalizarFecha(fechaStr);
    return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private formatearFechaCorta(fechaStr: string): string {
    const fecha = this.normalizarFecha(fechaStr);
    return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
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
      ? fechaStr
      : fechaStr + 'Z';
    return new Date(normalizada);
  }
}
