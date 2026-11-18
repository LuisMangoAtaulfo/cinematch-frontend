import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MetricasDia, MetricasService } from '../../../core/services/admin.service';
import { ReporteXlsxService } from '../../../core/services/reporte-xlsx.service';
import {
  ORDEN_SEMANA,
  PuntoGrafica,
  diaSemana,
  formatearFecha,
  formatearFechaCorta,
  generarLinea,
  generarPuntos,
  generarSparkline,
  normalizarFecha,
  posicionY,
  promedio,
  redondearMaximo,
  toDateInput,
} from '../../../core/utils/dashboard.utils';

@Component({
  selector: 'app-dashboard-actividad',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  template: `
    <div class="page">
      <nav class="navbar">
        <span class="navbar__logo">CineMatch</span>
        <div class="navbar__actions">
          <a routerLink="/admin/dashboard/tendencias" class="btn btn--ghost btn--sm">Satisfacción</a>
          <a routerLink="/admin/metricas" class="btn btn--ghost btn--sm">Métricas</a>
          <a routerLink="/admin/plataformas" class="btn btn--ghost btn--sm">Plataformas</a>
          <a routerLink="/admin/retroalimentacion" class="btn btn--ghost btn--sm">Retroalimentación</a>
          <button class="btn btn--secondary btn--sm" (click)="logout()">Salir</button>
        </div>
      </nav>

      <main class="dash">
        <div class="dash__inner">
          <header class="dash__head">
            <div>
              <p class="section-title">Dashboard de actividad y conversión</p>
              <p class="section-sub">{{ conclusion() }}</p>
            </div>
            <button
              id="btn-exportar-xlsx"
              data-testid="btn-exportar-xlsx"
              class="btn btn--primary"
              [disabled]="!hayDatos() || exportando()"
              [attr.title]="hayDatos() ? 'Descarga el reporte con los datos del periodo' : 'No hay datos para exportar'"
              (click)="exportar()">
              {{ exportando() ? 'Generando…' : 'Exportar XLSX' }}
            </button>
          </header>

          @if (msgExport()) {
            <p id="msg-export-ok" data-testid="msg-export-ok" class="export-msg" role="status">
              {{ msgExport() }}
            </p>
          }
          @if (errorExport()) {
            <p class="export-error" role="alert">{{ errorExport() }}</p>
          }

          <section class="card filters" aria-label="Filtros del dashboard">
            <div class="form-group">
              <label for="periodo-rapido">Periodo</label>
              <select id="periodo-rapido" (change)="aplicarPeriodoRapido($any($event.target).value)">
                <option value="">Personalizado</option>
                <option value="7">Últimos 7 días</option>
                <option value="14">Últimos 14 días</option>
                <option value="30">Últimos 30 días</option>
                <option value="all">Todo el historial</option>
              </select>
            </div>
            <div class="form-group">
              <label for="desde">Desde</label>
              <input id="desde" type="date"
                     [value]="fechaDesde()"
                     (change)="fechaDesde.set($any($event.target).value)"
                     [min]="fechaMin()"
                     [max]="fechaHasta() || fechaMax()">
            </div>
            <div class="form-group">
              <label for="hasta">Hasta</label>
              <input id="hasta" type="date"
                     [value]="fechaHasta()"
                     (change)="fechaHasta.set($any($event.target).value)"
                     [min]="fechaDesde() || fechaMin()"
                     [max]="fechaMax()">
            </div>
            @if (fechaDesde() || fechaHasta()) {
              <button class="btn btn--ghost" (click)="limpiarFiltro()">Limpiar</button>
            }
            <p class="filters__resumen">
              {{ historialFiltrado().length }} días en el periodo
            </p>
          </section>

          @if (cargando()) {
            <div class="card empty"><p>Cargando datos…</p></div>
          } @else if (errorCarga()) {
            <div class="card empty" role="alert">
              <p>No se pudieron cargar las métricas. Revisa la conexión con el backend.</p>
            </div>
          } @else if (!hayDatos()) {
            <div id="dashboard-vacio" data-testid="dashboard-vacio" class="card empty">
              <p>No hay actividad en el periodo seleccionado.</p>
              <p class="empty__hint">Ajusta el rango de fechas o limpia el filtro.</p>
            </div>
          } @else {
            <section class="kpis" aria-label="Indicadores principales">
              <article class="kpi metric-card" data-testid="kpi-salas">
                <p class="kpi__value">{{ totales().salas | number:'1.0-0' }}</p>
                <p class="kpi__label">Salas creadas</p>
                <p class="kpi__detail">{{ totales().diasActivos }} días con actividad</p>
                <svg class="sparkline" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
                  <polyline [attr.points]="sparklineSalas()" fill="none" stroke="var(--accent)" stroke-width="1.5"/>
                </svg>
              </article>

              <article class="kpi metric-card" data-testid="kpi-matches">
                <p class="kpi__value">{{ totales().matches | number:'1.0-0' }}</p>
                <p class="kpi__label">Matches generados</p>
                <p class="kpi__detail">{{ totales().conversion | number:'1.1-1' }}% de las salas</p>
                <svg class="sparkline" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
                  <polyline [attr.points]="sparklineMatches()" fill="none" stroke="#6366f1" stroke-width="1.5"/>
                </svg>
              </article>

              <article class="kpi metric-card" data-testid="kpi-conversion">
                <p class="kpi__value">{{ totales().conversion | number:'1.1-1' }}%</p>
                <p class="kpi__label">Conversión a match</p>
                <p class="kpi__detail">{{ totales().matches }} matches / {{ totales().salas }} salas</p>
                <svg class="sparkline" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
                  <polyline [attr.points]="sparklineConversion()" fill="none" stroke="var(--success)" stroke-width="1.5"/>
                </svg>
              </article>

              <article class="kpi metric-card" data-testid="kpi-activas">
                <p class="kpi__value">{{ totales().activasUltimoDia | number:'1.0-0' }}</p>
                <p class="kpi__label">Salas activas (último día)</p>
                <p class="kpi__detail">{{ totales().promedioDiario | number:'1.1-1' }} salas/día en promedio</p>
                <svg class="sparkline" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
                  <polyline [attr.points]="sparklineActivas()" fill="none" stroke="#f59e0b" stroke-width="1.5"/>
                </svg>
              </article>
            </section>

            <section class="charts">
              <article class="card chart" data-testid="chart-tendencia">
                <p class="chart__title">Salas y matches por día</p>
                <p class="chart__sub">Misma escala para comparar el volumen diario de ambos eventos.</p>
                <svg [attr.viewBox]="'0 0 ' + chartWidth + ' ' + chartHeight" role="img"
                     aria-label="Evolución diaria de salas y matches">
                  @for (linea of lineasGuia(); track $index) {
                    <line [attr.x1]="padding" [attr.y1]="linea.y"
                          [attr.x2]="chartWidth - padding" [attr.y2]="linea.y"
                          stroke="var(--border)" stroke-width="0.5" stroke-dasharray="4,4"/>
                    <text [attr.x]="padding - 8" [attr.y]="linea.y + 4"
                          text-anchor="end" class="svg-label">
                      {{ linea.valor | number:'1.0-0' }}
                    </text>
                  }
                  <line [attr.x1]="padding" [attr.y1]="padding"
                        [attr.x2]="padding" [attr.y2]="chartHeight - padding"
                        stroke="var(--border)" stroke-width="1"/>
                  <line [attr.x1]="padding" [attr.y1]="chartHeight - padding"
                        [attr.x2]="chartWidth - padding" [attr.y2]="chartHeight - padding"
                        stroke="var(--border)" stroke-width="1"/>

                  <polyline [attr.points]="lineaSalas()" fill="none" stroke="var(--accent)" stroke-width="2"/>
                  <polyline [attr.points]="lineaMatches()" fill="none" stroke="#6366f1" stroke-width="2"/>

                  @for (punto of puntosSalas(); track $index) {
                    <circle [attr.cx]="punto.x" [attr.cy]="punto.y" r="3.5"
                            fill="var(--accent)" stroke="var(--surface)" stroke-width="1.5"
                            (mouseenter)="mostrarDetalle($index)"
                            (mouseleave)="limpiarDetalle()">
                      <title>{{ detalleDe($index) }}</title>
                    </circle>
                  }
                  @for (punto of puntosMatches(); track $index) {
                    <circle [attr.cx]="punto.x" [attr.cy]="punto.y" r="3.5"
                            fill="#6366f1" stroke="var(--surface)" stroke-width="1.5"
                            (mouseenter)="mostrarDetalle($index)"
                            (mouseleave)="limpiarDetalle()">
                      <title>{{ detalleDe($index) }}</title>
                    </circle>
                  }

                  @for (etiqueta of etiquetasX(); track $index) {
                    <text [attr.x]="etiqueta.x" [attr.y]="chartHeight - padding + 16"
                          text-anchor="middle" class="svg-label">{{ etiqueta.label }}</text>
                  }
                </svg>
                <div class="legend">
                  <span class="legend__item"><i class="legend__dot legend__dot--accent"></i>Salas</span>
                  <span class="legend__item"><i class="legend__dot legend__dot--indigo"></i>Matches</span>
                </div>
                <p class="chart-hint">{{ detalleHover() || 'Pasa el cursor sobre un punto para ver el detalle.' }}</p>
              </article>

              <article class="card chart" data-testid="chart-slopegraph">
                <p class="chart__title">Antes y después del periodo</p>
                <p class="chart__sub">Promedio diario en la primera y la segunda mitad.</p>
                @if (slopegraph(); as slope) {
                  <svg viewBox="0 0 360 240" role="img"
                       aria-label="Comparación del promedio diario entre la primera y la segunda mitad">
                    <line x1="70" [attr.y1]="slope.arriba" x2="70" [attr.y2]="slope.abajo"
                          stroke="var(--border)" stroke-width="1"/>
                    <line x1="290" [attr.y1]="slope.arriba" x2="290" [attr.y2]="slope.abajo"
                          stroke="var(--border)" stroke-width="1"/>
                    <text x="70" y="24" text-anchor="middle" class="svg-label">Primera mitad</text>
                    <text x="290" y="24" text-anchor="middle" class="svg-label">Segunda mitad</text>

                    <line x1="70" [attr.y1]="slope.salasInicioY" x2="290" [attr.y2]="slope.salasFinY"
                          stroke="var(--accent)" stroke-width="2.5"/>
                    <line x1="70" [attr.y1]="slope.matchesInicioY" x2="290" [attr.y2]="slope.matchesFinY"
                          stroke="#6366f1" stroke-width="2.5"/>

                    <circle cx="70" [attr.cy]="slope.salasInicioY" r="4" fill="var(--accent)"/>
                    <circle cx="290" [attr.cy]="slope.salasFinY" r="4" fill="var(--accent)"/>
                    <circle cx="70" [attr.cy]="slope.matchesInicioY" r="4" fill="#6366f1"/>
                    <circle cx="290" [attr.cy]="slope.matchesFinY" r="4" fill="#6366f1"/>

                    <text x="62" [attr.y]="slope.salasInicioY - 8" text-anchor="end" class="svg-value">
                      {{ slope.salasInicio | number:'1.1-1' }}
                    </text>
                    <text x="298" [attr.y]="slope.salasFinY - 8" text-anchor="start" class="svg-value">
                      {{ slope.salasFin | number:'1.1-1' }}
                    </text>
                    <text x="62" [attr.y]="slope.matchesInicioY + 16" text-anchor="end" class="svg-value">
                      {{ slope.matchesInicio | number:'1.1-1' }}
                    </text>
                    <text x="298" [attr.y]="slope.matchesFinY + 16" text-anchor="start" class="svg-value">
                      {{ slope.matchesFin | number:'1.1-1' }}
                    </text>
                  </svg>
                  <div class="legend">
                    <span class="legend__item"><i class="legend__dot legend__dot--accent"></i>Salas/día</span>
                    <span class="legend__item"><i class="legend__dot legend__dot--indigo"></i>Matches/día</span>
                  </div>
                  <p class="chart-hint">{{ slope.resumen }}</p>
                } @else {
                  <p class="empty__hint">Se necesitan al menos dos días con actividad para comparar mitades.</p>
                }
              </article>
            </section>

            <article class="card chart" data-testid="chart-barras-semana">
              <p class="chart__title">Promedio de salas por día de la semana</p>
              <p class="chart__sub">Ayuda a decidir en qué días conviene impulsar la actividad.</p>
              <svg [attr.viewBox]="'0 0 ' + chartWidth + ' ' + barChartHeight" role="img"
                   aria-label="Promedio de salas creadas por día de la semana">
                <line [attr.x1]="padding" [attr.y1]="barChartHeight - padding"
                      [attr.x2]="chartWidth - padding" [attr.y2]="barChartHeight - padding"
                      stroke="var(--border)" stroke-width="1"/>
                @for (barra of barrasSemana(); track barra.dia) {
                  <rect [attr.x]="barra.x" [attr.y]="barra.y"
                        [attr.width]="barra.ancho" [attr.height]="barra.alto"
                        rx="4" [attr.fill]="barra.promedio > 0 ? 'var(--accent)' : 'var(--surface2)'">
                    <title>{{ barra.dia }}: {{ barra.promedio | number:'1.1-1' }} salas/día ({{ barra.dias }} días)</title>
                  </rect>
                  <text [attr.x]="barra.x + barra.ancho / 2" [attr.y]="barra.y - 6"
                        text-anchor="middle" class="svg-value">{{ barra.promedio | number:'1.1-1' }}</text>
                  <text [attr.x]="barra.x + barra.ancho / 2" [attr.y]="barChartHeight - padding + 16"
                        text-anchor="middle" class="svg-label">{{ barra.dia }}</text>
                }
              </svg>
            </article>

            <p class="footnote">
              Los datos se calculan con el historial diario de la plataforma. El reporte XLSX incluye
              el resumen del periodo, la serie diaria y el desglose por día de la semana.
            </p>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dash { flex: 1; padding: 28px 24px; }
    .dash__inner { max-width: 1180px; margin: 0 auto; }
    .dash__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
    .dash__head .section-sub { margin-bottom: 0; max-width: 720px; }
    .export-msg { background: rgba(34, 197, 94, 0.12); border: 1px solid var(--success); color: var(--success); border-radius: var(--radius); padding: 10px 14px; font-size: 13px; margin-bottom: 16px; }
    .export-error { background: rgba(239, 68, 68, 0.12); border: 1px solid var(--danger); color: var(--danger); border-radius: var(--radius); padding: 10px 14px; font-size: 13px; margin-bottom: 16px; }
    .filters { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 24px; padding: 16px; }
    .filters .form-group { flex: 1; min-width: 150px; }
    .filters__resumen { margin-left: auto; font-size: 12px; color: var(--text-sub); padding-bottom: 10px; }
    .kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 18px; display: flex; flex-direction: column; gap: 2px; }
    .kpi__value { font-family: var(--font-disp); font-size: 30px; line-height: 1.1; color: var(--accent); }
    .kpi__label { font-size: 13px; color: var(--text); }
    .kpi__detail { font-size: 12px; color: var(--text-sub); }
    .sparkline { width: 100%; height: 22px; margin-top: 8px; }
    .charts { display: grid; grid-template-columns: 1.6fr 1fr; gap: 16px; margin-bottom: 24px; }
    .chart { padding: 18px; margin-bottom: 0; }
    .chart__title { font-weight: 600; font-size: 14px; margin-bottom: 2px; color: var(--text); }
    .chart__sub { font-size: 12px; color: var(--text-sub); margin-bottom: 12px; }
    .chart svg { width: 100%; height: auto; display: block; }
    .svg-label { font-size: 10px; fill: var(--text-sub); }
    .svg-value { font-size: 10px; font-weight: 600; fill: var(--text); }
    .legend { display: flex; gap: 18px; justify-content: center; margin-top: 10px; }
    .legend__item { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-sub); }
    .legend__dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .legend__dot--accent { background: var(--accent); }
    .legend__dot--indigo { background: #6366f1; }
    .chart-hint { font-size: 12px; color: var(--text-sub); text-align: center; margin-top: 10px; min-height: 18px; }
    .empty { text-align: center; padding: 32px; margin-bottom: 24px; }
    .empty__hint { font-size: 13px; color: var(--text-sub); margin-top: 6px; }
    .footnote { font-size: 12px; color: var(--text-sub); text-align: center; margin-top: 8px; }
    @media (max-width: 980px) {
      .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .charts { grid-template-columns: 1fr; }
    }
    @media (max-width: 560px) {
      .dash { padding: 20px 14px; }
      .kpis { grid-template-columns: 1fr; }
      .filters__resumen { margin-left: 0; }
    }
  `],
})
export class DashboardActividadComponent implements OnInit {
  readonly chartWidth = 760;
  readonly chartHeight = 300;
  readonly barChartHeight = 240;
  readonly padding = 40;

  historial = signal<MetricasDia[]>([]);
  cargando = signal(true);
  errorCarga = signal(false);
  exportando = signal(false);
  msgExport = signal('');
  errorExport = signal('');
  detalleHover = signal('');

  fechaDesde = signal('');
  fechaHasta = signal('');

  private readonly opcionesLinea = computed(() => ({
    ancho: this.chartWidth,
    alto: this.chartHeight,
    padding: this.padding,
    maximo: this.maxValor(),
  }));

  fechaMin = computed(() => {
    const lista = this.historial();
    return lista.length ? toDateInput(lista[0].fecha) : '';
  });

  fechaMax = computed(() => {
    const lista = this.historial();
    return lista.length ? toDateInput(lista[lista.length - 1].fecha) : '';
  });

  historialFiltrado = computed(() => {
    const lista = this.historial();
    const desde = this.fechaDesde() ? new Date(this.fechaDesde()) : null;
    const hastaRaw = this.fechaHasta() ? new Date(this.fechaHasta()) : null;
    const hasta = hastaRaw
      ? new Date(hastaRaw.getFullYear(), hastaRaw.getMonth(), hastaRaw.getDate() + 1)
      : null;

    return lista.filter((dia) => {
      const fecha = normalizarFecha(dia.fecha);
      if (desde && fecha < desde) return false;
      if (hasta && fecha >= hasta) return false;
      return true;
    });
  });

  hayDatos = computed(() => this.historialFiltrado().length > 0);

  totales = computed(() => {
    const lista = this.historialFiltrado();
    const salas = lista.reduce((total, dia) => total + dia.totalSalas, 0);
    const matches = lista.reduce((total, dia) => total + dia.totalMatches, 0);
    const activasUltimoDia = lista.length ? lista[lista.length - 1].salasActivas : 0;
    return {
      salas,
      matches,
      activasUltimoDia,
      conversion: salas ? (matches / salas) * 100 : 0,
      promedioDiario: lista.length ? salas / lista.length : 0,
      diasActivos: lista.filter((dia) => dia.totalSalas > 0 || dia.totalMatches > 0).length,
    };
  });

  conclusion = computed(() => {
    const lista = this.historialFiltrado();
    if (!lista.length) return 'Sin datos en el periodo seleccionado.';

    const mitad = Math.floor(lista.length / 2);
    const primera = lista.slice(0, mitad);
    const segunda = lista.slice(lista.length - mitad);
    const conversion = this.totales().conversion.toFixed(1);
    const inicio = primera.length ? promedio(primera.map((dia) => dia.totalSalas)) : 0;
    const fin = segunda.length ? promedio(segunda.map((dia) => dia.totalSalas)) : 0;
    const cambio = inicio ? ((fin - inicio) / inicio) * 100 : 0;
    const direccion = cambio >= 0 ? 'creció' : 'bajó';

    return `${conversion}% de las salas terminaron en match; la actividad ${direccion} ${Math.abs(cambio).toFixed(1)}% en la segunda mitad del periodo.`;
  });

  maxValor = computed(() => {
    const lista = this.historialFiltrado();
    if (!lista.length) return 10;
    return redondearMaximo(Math.max(...lista.map((dia) => Math.max(dia.totalSalas, dia.totalMatches)), 1));
  });

  sparklineSalas = computed(() => generarSparkline(this.historialFiltrado().map((dia) => dia.totalSalas)));
  sparklineMatches = computed(() => generarSparkline(this.historialFiltrado().map((dia) => dia.totalMatches)));
  sparklineActivas = computed(() => generarSparkline(this.historialFiltrado().map((dia) => dia.salasActivas)));
  sparklineConversion = computed(() =>
    generarSparkline(this.historialFiltrado().map((dia) => (dia.totalSalas ? (dia.totalMatches / dia.totalSalas) * 100 : 0))),
  );

  lineaSalas = computed(() => generarLinea(this.historialFiltrado().map((dia) => dia.totalSalas), this.opcionesLinea()));
  lineaMatches = computed(() => generarLinea(this.historialFiltrado().map((dia) => dia.totalMatches), this.opcionesLinea()));

  puntosSalas = computed(() => this.puntosDe('totalSalas'));
  puntosMatches = computed(() => this.puntosDe('totalMatches'));

  lineasGuia = computed(() =>
    [0.25, 0.5, 0.75, 1].map((factor) => ({
      y: posicionY(this.maxValor() * factor, this.chartHeight, this.padding, this.maxValor()),
      valor: this.maxValor() * factor,
    })),
  );

  etiquetasX = computed(() => {
    const lista = this.historialFiltrado();
    if (!lista.length) return [];
    const paso = lista.length <= 7 ? 1 : Math.ceil(lista.length / 7);
    const anchoUtil = this.chartWidth - 2 * this.padding;
    const pasoX = anchoUtil / (lista.length - 1 || 1);

    return lista
      .map((dia, indice) => ({
        x: this.padding + indice * pasoX,
        label: formatearFechaCorta(dia.fecha),
      }))
      .filter((_, indice) => indice % paso === 0 || indice === lista.length - 1);
  });

  barrasSemana = computed(() => {
    const lista = this.historialFiltrado();
    const acumulado = new Map<string, { total: number; dias: number }>();
    ORDEN_SEMANA.forEach((dia) => acumulado.set(dia, { total: 0, dias: 0 }));

    lista.forEach((registro) => {
      const clave = diaSemana(registro.fecha);
      const actual = acumulado.get(clave);
      if (actual) {
        actual.total += registro.totalSalas;
        actual.dias += 1;
      }
    });

    const promedios = ORDEN_SEMANA.map((dia) => {
      const dato = acumulado.get(dia) ?? { total: 0, dias: 0 };
      return { dia, promedio: dato.dias ? dato.total / dato.dias : 0, total: dato.total, dias: dato.dias };
    });
    const maximo = redondearMaximo(Math.max(...promedios.map((barra) => barra.promedio), 1));
    const anchoUtil = this.chartWidth - 2 * this.padding;
    const anchoBarra = (anchoUtil / ORDEN_SEMANA.length) * 0.55;
    const altoUtil = this.barChartHeight - 2 * this.padding;

    return promedios.map((barra, indice) => {
      const centro = this.padding + (indice + 0.5) * (anchoUtil / ORDEN_SEMANA.length);
      const alto = (barra.promedio / maximo) * altoUtil;
      return {
        ...barra,
        x: centro - anchoBarra / 2,
        ancho: anchoBarra,
        alto,
        y: this.barChartHeight - this.padding - alto,
      };
    });
  });

  slopegraph = computed(() => {
    const lista = this.historialFiltrado();
    if (lista.length < 2) return null;

    const mitad = Math.floor(lista.length / 2);
    const primera = lista.slice(0, mitad);
    const segunda = lista.slice(lista.length - mitad);
    const salasInicio = promedio(primera.map((dia) => dia.totalSalas));
    const salasFin = promedio(segunda.map((dia) => dia.totalSalas));
    const matchesInicio = promedio(primera.map((dia) => dia.totalMatches));
    const matchesFin = promedio(segunda.map((dia) => dia.totalMatches));
    const maximo = redondearMaximo(Math.max(salasInicio, salasFin, matchesInicio, matchesFin, 1));
    const alto = 240;
    const padding = 40;
    const delta = salasInicio ? ((salasFin - salasInicio) / salasInicio) * 100 : 0;
    const direccion = delta >= 0 ? 'subió' : 'bajó';

    return {
      salasInicio,
      salasFin,
      matchesInicio,
      matchesFin,
      salasInicioY: posicionY(salasInicio, alto, padding, maximo),
      salasFinY: posicionY(salasFin, alto, padding, maximo),
      matchesInicioY: posicionY(matchesInicio, alto, padding, maximo),
      matchesFinY: posicionY(matchesFin, alto, padding, maximo),
      arriba: padding,
      abajo: alto - padding,
      resumen: `Las salas/día ${direccion} ${Math.abs(delta).toFixed(1)}% entre mitades.`,
    };
  });

  constructor(
    private metricasSvc: MetricasService,
    private reporteSvc: ReporteXlsxService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.metricasSvc.getHistorial().subscribe({
      next: (datos) => {
        this.historial.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.errorCarga.set(true);
        this.cargando.set(false);
      },
    });
  }

  aplicarPeriodoRapido(periodo: string): void {
    if (!periodo) return;
    const lista = this.historial();
    if (!lista.length) return;

    if (periodo === 'all') {
      this.limpiarFiltro();
      return;
    }

    const dias = Number(periodo);
    const ultima = normalizarFecha(lista[lista.length - 1].fecha);
    const desde = new Date(ultima);
    desde.setUTCDate(desde.getUTCDate() - dias + 1);
    this.fechaDesde.set(toDateInput(desde));
    this.fechaHasta.set(toDateInput(ultima));
  }

  limpiarFiltro(): void {
    this.fechaDesde.set('');
    this.fechaHasta.set('');
  }

  mostrarDetalle(indice: number): void {
    this.detalleHover.set(this.detalleDe(indice));
  }

  limpiarDetalle(): void {
    this.detalleHover.set('');
  }

  detalleDe(indice: number): string {
    const dia = this.historialFiltrado()[indice];
    if (!dia) return '';
    return `${formatearFecha(dia.fecha)} · ${dia.totalSalas} salas · ${dia.totalMatches} matches`;
  }

  logout(): void {
    this.auth.logout();
  }

  async exportar(): Promise<void> {
    if (!this.hayDatos() || this.exportando()) return;

    this.exportando.set(true);
    this.msgExport.set('');
    this.errorExport.set('');

    const lista = this.historialFiltrado();
    const totales = this.totales();
    const periodo = this.periodoTexto();

    try {
      await this.reporteSvc.descargar({
        nombreArchivo: 'cinematch-dashboard-actividad',
        hojas: [
          {
            nombre: 'Resumen',
            titulo: 'CineMatch · Actividad y conversión',
            subtitulo: this.conclusion(),
            periodo,
            columnas: [
              { titulo: 'Indicador', ancho: 30, tipo: 'texto' },
              { titulo: 'Valor', ancho: 16, tipo: 'decimal' },
              { titulo: 'Detalle', ancho: 44, tipo: 'texto' },
            ],
            filas: [
              ['Salas creadas', totales.salas, `${totales.diasActivos} días con actividad`],
              ['Matches generados', totales.matches, `${totales.conversion.toFixed(1)}% de conversión`],
              ['Conversión a match (%)', Number(totales.conversion.toFixed(1)), 'Matches / salas del periodo'],
              ['Promedio diario de salas', Number(totales.promedioDiario.toFixed(1)), 'Salas creadas por día'],
              ['Salas activas (último día)', totales.activasUltimoDia, 'Último día del periodo'],
            ],
          },
          {
            nombre: 'Serie diaria',
            titulo: 'Serie diaria de actividad',
            subtitulo: 'Salas y matches por fecha, con la conversión diaria.',
            periodo,
            columnas: [
              { titulo: 'Fecha', ancho: 14, tipo: 'texto' },
              { titulo: 'Salas', ancho: 10, tipo: 'entero' },
              { titulo: 'Activas', ancho: 10, tipo: 'entero' },
              { titulo: 'Matches', ancho: 10, tipo: 'entero' },
              { titulo: 'Conversión (%)', ancho: 14, tipo: 'porcentaje' },
              { titulo: 'Promedio calificación', ancho: 18, tipo: 'decimal' },
            ],
            filas: lista.map((dia) => [
              formatearFecha(dia.fecha),
              dia.totalSalas,
              dia.salasActivas,
              dia.totalMatches,
              Number((dia.totalSalas ? (dia.totalMatches / dia.totalSalas) * 100 : 0).toFixed(1)),
              Number((dia.promedioCalificacion ?? 0).toFixed(1)),
            ]),
            totales: [
              'Total',
              totales.salas,
              lista.reduce((total, dia) => total + dia.salasActivas, 0),
              totales.matches,
              Number(totales.conversion.toFixed(1)),
              '',
            ],
          },
          {
            nombre: 'Día de semana',
            titulo: 'Promedio de salas por día de la semana',
            subtitulo: 'Permite identificar los días con mayor actividad.',
            periodo,
            columnas: [
              { titulo: 'Día', ancho: 12, tipo: 'texto' },
              { titulo: 'Promedio de salas', ancho: 20, tipo: 'decimal' },
              { titulo: 'Total de salas', ancho: 16, tipo: 'entero' },
              { titulo: 'Días registrados', ancho: 16, tipo: 'entero' },
            ],
            filas: this.barrasSemana().map((barra) => [
              barra.dia,
              Number(barra.promedio.toFixed(1)),
              barra.total,
              barra.dias,
            ]),
          },
        ],
      });
      this.msgExport.set('Reporte XLSX generado con los datos del periodo.');
    } catch {
      this.errorExport.set('No se pudo generar el reporte. Intenta de nuevo.');
    } finally {
      this.exportando.set(false);
    }
  }

  private puntosDe(campo: 'totalSalas' | 'totalMatches'): PuntoGrafica[] {
    const lista = this.historialFiltrado();
    return generarPuntos(
      lista.map((dia) => dia[campo]),
      this.opcionesLinea(),
    ).map((punto, indice) => ({ ...punto, fecha: lista[indice]?.fecha ?? '' }));
  }

  private periodoTexto(): string {
    const lista = this.historialFiltrado();
    if (!lista.length) return 'Sin datos';
    const inicio = this.fechaDesde() || toDateInput(lista[0].fecha);
    const fin = this.fechaHasta() || toDateInput(lista[lista.length - 1].fecha);
    return `${inicio} a ${fin}`;
  }
}
