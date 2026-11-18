import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RetroalimentacionService } from '../../../core/services/admin.service';
import { ReporteXlsxService } from '../../../core/services/reporte-xlsx.service';
import type { IndicadorReporte } from '../../../core/services/reporte-xlsx.service';
import { CalificacionResponse } from '../../../core/models';
import {
  ORDEN_SEMANA,
  diaSemana,
  formatearFecha,
  formatearFechaCorta,
  generarLinea,
  generarPuntos,
  normalizarFecha,
  posicionY,
  promedio,
  toDateInput,
} from '../../../core/utils/dashboard.utils';

interface SerieDia {
  fecha: string;
  etiqueta: string;
  promedio: number;
  total: number;
  satisfaccion: number;
  riesgo: number;
}

interface CeldaCalor {
  dia: string;
  rango: string;
  total: number;
  intensidad: number;
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
          <a routerLink="/admin/dashboard" class="btn btn--ghost btn--sm">Actividad</a>
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
              <p class="section-title">Satisfacción y calidad</p>
            </div>
            <button
              id="btn-exportar-xlsx"
              data-testid="btn-exportar-xlsx"
              class="btn btn--primary"
              [disabled]="!hayDatos() || exportando()"
              [attr.title]="hayDatos() ? 'Descargar XLSX' : 'No hay datos para exportar'"
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
            <p class="filters__resumen">{{ calificacionesFiltradas().length }} calificaciones en el periodo</p>
          </section>

          @if (cargando()) {
            <div class="card empty"><p>Cargando calificaciones…</p></div>
          } @else if (errorCarga()) {
            <div class="card empty" role="alert">
              <p>No se pudieron cargar las calificaciones. Revisa la conexión con el backend.</p>
            </div>
          } @else if (!hayDatos()) {
            <div id="dashboard-vacio" data-testid="dashboard-vacio" class="card empty">
              <p>No hay calificaciones en el periodo seleccionado.</p>
              <p class="empty__hint">Ajusta el rango de fechas o limpia el filtro.</p>
            </div>
          } @else {
            <section class="kpis" aria-label="Indicadores de satisfacción">
              <article class="kpi" data-testid="kpi-promedio">
                <p class="kpi__value">{{ resumen().promedio | number:'1.1-1' }}<span class="kpi__unidad">/10</span></p>
                <p class="kpi__label">Promedio de calificación</p>
                <p class="kpi__detail">{{ resumen().total }} calificaciones</p>
              </article>

              <article class="kpi" data-testid="kpi-total">
                <p class="kpi__value">{{ resumen().total | number:'1.0-0' }}</p>
                <p class="kpi__label">Calificaciones recibidas</p>
                <p class="kpi__detail">{{ serieDiaria().length }} días con datos</p>
              </article>

              <article class="kpi" data-testid="kpi-satisfaccion">
                <p class="kpi__value">{{ resumen().satisfaccion | number:'1.0-1' }}%</p>
                <p class="kpi__label">Satisfacción (nota ≥ 8)</p>
                <p class="kpi__detail">{{ resumen().satisfechos }} calificaciones altas</p>
              </article>

              <article class="kpi" data-testid="kpi-riesgo">
                <p class="kpi__value">{{ resumen().riesgo | number:'1.0-1' }}%</p>
                <p class="kpi__label">Riesgo (nota ≤ 5)</p>
                <p class="kpi__detail">{{ resumen().riesgoTotal }} calificaciones bajas</p>
              </article>
            </section>

            <section class="charts">
              <article class="card chart" data-testid="chart-distribucion">
                <p class="chart__title">Distribución de calificaciones</p>
                <svg [attr.viewBox]="'0 0 ' + chartWidth + ' ' + chartHeight" role="img"
                     aria-label="Distribución de calificaciones por nota">
                  <line [attr.x1]="padding" [attr.y1]="chartHeight - padding"
                        [attr.x2]="chartWidth - padding" [attr.y2]="chartHeight - padding"
                        stroke="var(--border)" stroke-width="1"/>
                  @for (barra of distribucion(); track barra.valor) {
                    <rect [attr.x]="barra.x" [attr.y]="barra.y"
                          [attr.width]="barra.ancho" [attr.height]="barra.alto"
                          rx="4" [attr.fill]="barra.color">
                      <title>Nota {{ barra.valor }}: {{ barra.total }} calificaciones ({{ barra.porcentaje | number:'1.1-1' }}%)</title>
                    </rect>
                    <text [attr.x]="barra.x + barra.ancho / 2" [attr.y]="barra.y - 6"
                          text-anchor="middle" class="svg-value">{{ barra.total }}</text>
                    <text [attr.x]="barra.x + barra.ancho / 2" [attr.y]="chartHeight - padding + 16"
                          text-anchor="middle" class="svg-label">{{ barra.valor }}</text>
                  }
                </svg>
                <p class="chart-hint">Verde: 8–10 · Ámbar: 6–7 · Rojo: 1–5</p>
              </article>

              <article class="card chart" data-testid="chart-promedio-diario">
                <p class="chart__title">Promedio diario y meta</p>
                <svg [attr.viewBox]="'0 0 ' + chartWidth + ' ' + chartHeight" role="img"
                     aria-label="Promedio diario de calificación con meta de siete puntos">
                  @for (guia of guiasPromedio(); track guia.valor) {
                    <line [attr.x1]="padding" [attr.y1]="guia.y"
                          [attr.x2]="chartWidth - padding" [attr.y2]="guia.y"
                          stroke="var(--border)" stroke-width="0.5" stroke-dasharray="4,4"/>
                    <text [attr.x]="padding - 8" [attr.y]="guia.y + 4"
                          text-anchor="end" class="svg-label">{{ guia.valor }}</text>
                  }
                  <line [attr.x1]="padding" [attr.y1]="padding"
                        [attr.x2]="padding" [attr.y2]="chartHeight - padding"
                        stroke="var(--border)" stroke-width="1"/>
                  <line [attr.x1]="padding" [attr.y1]="chartHeight - padding"
                        [attr.x2]="chartWidth - padding" [attr.y2]="chartHeight - padding"
                        stroke="var(--border)" stroke-width="1"/>
                  <line [attr.x1]="padding" [attr.y1]="metaY()"
                        [attr.x2]="chartWidth - padding" [attr.y2]="metaY()"
                        stroke="var(--success)" stroke-width="1.5" stroke-dasharray="6,4"/>
                  <text [attr.x]="chartWidth - padding" [attr.y]="metaY() - 6"
                        text-anchor="end" class="svg-value svg-value--meta">Meta 7</text>

                  <polyline [attr.points]="lineaPromedio()" fill="none" stroke="var(--accent)" stroke-width="2"/>
                  @for (punto of puntosPromedio(); track $index) {
                    <circle [attr.cx]="punto.x" [attr.cy]="punto.y" r="3.5"
                            fill="var(--accent)" stroke="var(--surface)" stroke-width="1.5">
                      <title>{{ serieDiaria()[$index]?.etiqueta }}: {{ punto.valor | number:'1.1-1' }} ({{ serieDiaria()[$index]?.total }} calificaciones)</title>
                    </circle>
                  }
                  @for (etiqueta of etiquetasX(); track $index) {
                    <text [attr.x]="etiqueta.x" [attr.y]="chartHeight - padding + 16"
                          text-anchor="middle" class="svg-label">{{ etiqueta.label }}</text>
                  }
                </svg>
              </article>
            </section>

            <section class="charts charts--wide">
              <article class="card chart" data-testid="heatmap">
                <p class="chart__title">Concentración de notas por día</p>
                <div class="heatmap" role="table" aria-label="Mapa de calor de calificaciones por día y rango de nota">
                  <div class="heatmap__grid" role="row">
                    <span class="heatmap__corner"></span>
                    @for (dia of diasSemana; track dia) {
                      <span class="heatmap__head" role="columnheader">{{ dia }}</span>
                    }
                  </div>
                  @for (fila of mapaCalor(); track fila.rango) {
                    <div class="heatmap__grid" role="row">
                      <span class="heatmap__row" role="rowheader">{{ fila.rango }}</span>
                      @for (celda of fila.celdas; track celda.dia) {
                        <span class="heatmap__cell" role="cell"
                              [style.background]="celda.total ? 'rgba(99, 102, 241, ' + (0.15 + celda.intensidad * 0.75) + ')' : 'var(--surface2)'"
                              [style.color]="celda.intensidad > 0.55 ? '#ffffff' : 'var(--text)'"
                              [attr.title]="celda.dia + ' · ' + celda.rango + ': ' + celda.total + ' calificaciones'">
                          {{ celda.total }}
                        </span>
                      }
                    </div>
                  }
                </div>
                <div class="heatmap__legend">
                  <span>Menos</span>
                  <i class="heatmap__scale"></i>
                  <span>Más</span>
                </div>
              </article>

              <article class="card chart" data-testid="tabla-detalle">
                <p class="chart__title">Últimas calificaciones</p>
                <div class="tabla-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th class="num">Nota</th>
                        <th class="num">Usuario</th>
                        <th class="num">Sala</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (calificacion of ultimasCalificaciones(); track calificacion.id) {
                        <tr>
                          <td>{{ formatear(calificacion.fecha) }}</td>
                          <td class="num">
                            <span class="nota" [style.background]="colorNota(calificacion.valor)">{{ calificacion.valor }}</span>
                          </td>
                          <td class="num">{{ calificacion.usuarioId }}</td>
                          <td class="num">{{ calificacion.salaId }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </article>
            </section>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dash { flex: 1; padding: 28px 24px; }
    .dash__inner { max-width: 1180px; margin: 0 auto; }
    .dash__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
    .export-msg { background: rgba(34, 197, 94, 0.12); border: 1px solid var(--success); color: var(--success); border-radius: var(--radius); padding: 10px 14px; font-size: 13px; margin-bottom: 16px; }
    .export-error { background: rgba(239, 68, 68, 0.12); border: 1px solid var(--danger); color: var(--danger); border-radius: var(--radius); padding: 10px 14px; font-size: 13px; margin-bottom: 16px; }
    .filters { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 24px; padding: 16px; }
    .filters .form-group { flex: 1; min-width: 150px; }
    .filters__resumen { margin-left: auto; font-size: 12px; color: var(--text-sub); padding-bottom: 10px; }
    .kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 18px; display: flex; flex-direction: column; gap: 2px; }
    .kpi__value { font-family: var(--font-disp); font-size: 30px; line-height: 1.1; color: var(--accent); }
    .kpi__unidad { font-size: 14px; color: var(--text-sub); margin-left: 2px; }
    .kpi__label { font-size: 13px; color: var(--text); }
    .kpi__detail { font-size: 12px; color: var(--text-sub); }
    .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .chart { padding: 18px; margin-bottom: 0; }
    .chart__title { font-weight: 600; font-size: 14px; margin-bottom: 2px; color: var(--text); }
    .chart svg { width: 100%; height: auto; display: block; }
    .svg-label { font-size: 10px; fill: var(--text-sub); }
    .svg-value { font-size: 10px; font-weight: 600; fill: var(--text); }
    .svg-value--meta { fill: var(--success); }
    .chart-hint { font-size: 12px; color: var(--text-sub); text-align: center; margin-top: 8px; min-height: 18px; }
    .heatmap { display: flex; flex-direction: column; gap: 6px; }
    .heatmap__grid { display: grid; grid-template-columns: 64px repeat(7, minmax(0, 1fr)); gap: 6px; align-items: center; }
    .heatmap__head, .heatmap__row { font-size: 11px; color: var(--text-sub); text-align: center; }
    .heatmap__row { text-align: left; font-weight: 500; }
    .heatmap__cell { display: flex; align-items: center; justify-content: center; min-height: 34px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    .heatmap__legend { display: flex; align-items: center; justify-content: flex-end; gap: 8px; font-size: 11px; color: var(--text-sub); margin-top: 12px; }
    .heatmap__scale { width: 120px; height: 8px; border-radius: 4px; background: linear-gradient(90deg, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.9)); }
    .tabla-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 8px 10px; color: var(--text-sub); font-weight: 500; border-bottom: 2px solid var(--border); }
    td { padding: 8px 10px; border-bottom: 1px solid var(--border); }
    .num { text-align: right; }
    .nota { display: inline-block; min-width: 26px; padding: 2px 8px; border-radius: 12px; color: #0f0f0f; font-weight: 600; text-align: center; }
    .empty { text-align: center; padding: 32px; margin-bottom: 24px; }
    .empty__hint { font-size: 13px; color: var(--text-sub); margin-top: 6px; }
    @media (max-width: 980px) {
      .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .charts, .charts--wide { grid-template-columns: 1fr; }
    }
    @media (max-width: 560px) {
      .dash { padding: 20px 14px; }
      .kpis { grid-template-columns: 1fr; }
      .filters__resumen { margin-left: 0; }
      .heatmap__grid { grid-template-columns: 48px repeat(7, minmax(0, 1fr)); gap: 4px; }
      .heatmap__cell { min-height: 28px; font-size: 11px; }
    }
  `],
})
export class DashboardTendenciasComponent implements OnInit {
  readonly chartWidth = 760;
  readonly chartHeight = 260;
  readonly padding = 40;
  readonly diasSemana = ORDEN_SEMANA;
  readonly rangosNotas = ['1–5', '6–7', '8–9', '10'];
  readonly meta = 7;

  calificaciones = signal<CalificacionResponse[]>([]);
  cargando = signal(true);
  errorCarga = signal(false);
  exportando = signal(false);
  msgExport = signal('');
  errorExport = signal('');

  fechaDesde = signal('');
  fechaHasta = signal('');

  fechaMin = computed(() => {
    const lista = this.calificaciones();
    if (!lista.length) return '';
    return toDateInput(lista.reduce((min, item) => (item.fecha < min ? item.fecha : min), lista[0].fecha));
  });

  fechaMax = computed(() => {
    const lista = this.calificaciones();
    if (!lista.length) return '';
    return toDateInput(lista.reduce((max, item) => (item.fecha > max ? item.fecha : max), lista[0].fecha));
  });

  calificacionesFiltradas = computed(() => {
    const lista = this.calificaciones();
    const desde = this.fechaDesde() ? new Date(this.fechaDesde()) : null;
    const hastaRaw = this.fechaHasta() ? new Date(this.fechaHasta()) : null;
    const hasta = hastaRaw
      ? new Date(hastaRaw.getFullYear(), hastaRaw.getMonth(), hastaRaw.getDate() + 1)
      : null;

    return lista.filter((calificacion) => {
      const fecha = normalizarFecha(calificacion.fecha);
      if (desde && fecha < desde) return false;
      if (hasta && fecha >= hasta) return false;
      return true;
    });
  });

  hayDatos = computed(() => this.calificacionesFiltradas().length > 0);

  serieDiaria = computed<SerieDia[]>(() => {
    const agrupado = new Map<string, number[]>();
    this.calificacionesFiltradas().forEach((calificacion) => {
      const clave = toDateInput(calificacion.fecha);
      const valores = agrupado.get(clave) ?? [];
      valores.push(calificacion.valor);
      agrupado.set(clave, valores);
    });

    return [...agrupado.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, valores]) => ({
        fecha,
        etiqueta: formatearFecha(fecha),
        promedio: promedio(valores),
        total: valores.length,
        satisfaccion: (valores.filter((valor) => valor >= 8).length / valores.length) * 100,
        riesgo: (valores.filter((valor) => valor <= 5).length / valores.length) * 100,
      }));
  });

  resumen = computed(() => {
    const lista = this.calificacionesFiltradas();
    const total = lista.length;
    const satisfechos = lista.filter((calificacion) => calificacion.valor >= 8).length;
    const riesgoTotal = lista.filter((calificacion) => calificacion.valor <= 5).length;
    return {
      total,
      promedio: total ? promedio(lista.map((calificacion) => calificacion.valor)) : 0,
      satisfechos,
      riesgoTotal,
      satisfaccion: total ? (satisfechos / total) * 100 : 0,
      riesgo: total ? (riesgoTotal / total) * 100 : 0,
    };
  });

  periodoAnterior = computed(() => {
    const actual = this.calificacionesFiltradas();
    if (!actual.length) return null;

    const fechas = actual.map((calificacion) => normalizarFecha(calificacion.fecha)).sort((a, b) => a.getTime() - b.getTime());
    const inicio = fechas[0];
    const fin = fechas[fechas.length - 1];
    const dias = Math.max(1, Math.round((fin.getTime() - inicio.getTime()) / 86400000) + 1);
    const limite = new Date(inicio);
    limite.setUTCDate(limite.getUTCDate() - dias);

    const previas = this.calificaciones().filter((calificacion) => {
      const fecha = normalizarFecha(calificacion.fecha);
      return fecha >= limite && fecha < inicio;
    });

    if (!previas.length) return null;

    const total = previas.length;
    const satisfechos = previas.filter((calificacion) => calificacion.valor >= 8).length;
    const riesgo = previas.filter((calificacion) => calificacion.valor <= 5).length;

    return {
      total,
      promedio: promedio(previas.map((calificacion) => calificacion.valor)),
      satisfaccion: (satisfechos / total) * 100,
      riesgo: (riesgo / total) * 100,
    };
  });

  indicadores = computed<IndicadorReporte[]>(() => {
    const resumen = this.resumen();
    const mitades = this.compararMitades();
    const diferencia = mitades?.diferencia ?? 0;

    return [
      {
        indicador: 'Promedio de calificación',
        valor: Number(resumen.promedio.toFixed(1)),
        meta: '≥ 7.0',
        estado: resumen.promedio >= 7 ? 'En meta' : resumen.promedio >= 6 ? 'En riesgo' : 'Fuera de meta',
      },
      {
        indicador: 'Satisfacción (≥ 8)',
        valor: `${resumen.satisfaccion.toFixed(1)}%`,
        meta: '≥ 70%',
        estado: resumen.satisfaccion >= 70 ? 'En meta' : resumen.satisfaccion >= 55 ? 'En riesgo' : 'Fuera de meta',
      },
      {
        indicador: 'Riesgo (≤ 5)',
        valor: `${resumen.riesgo.toFixed(1)}%`,
        meta: '≤ 10%',
        estado: resumen.riesgo <= 10 ? 'En meta' : resumen.riesgo <= 20 ? 'En riesgo' : 'Fuera de meta',
      },
      {
        indicador: 'Tendencia entre mitades',
        valor: `${diferencia >= 0 ? '+' : ''}${diferencia.toFixed(1)} pts`,
        meta: '≥ 0 pts',
        estado: diferencia >= 0 ? 'En meta' : diferencia >= -0.5 ? 'En riesgo' : 'Fuera de meta',
      },
    ];
  });

  distribucionTabla = computed(() => {
    const total = this.resumen().total;
    return this.distribucion().map((barra) => [
      barra.valor,
      barra.total,
      Number(barra.porcentaje.toFixed(1)),
    ]);
  });

  distribucion = computed(() => {
    const lista = this.calificacionesFiltradas();
    const total = lista.length;
    const conteos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((valor) => ({
      valor,
      total: lista.filter((calificacion) => calificacion.valor === valor).length,
    }));
    const maximo = Math.max(...conteos.map((item) => item.total), 1);
    const anchoUtil = this.chartWidth - 2 * this.padding;
    const anchoBarra = (anchoUtil / conteos.length) * 0.6;
    const altoUtil = this.chartHeight - 2 * this.padding;

    return conteos.map((item, indice) => {
      const centro = this.padding + (indice + 0.5) * (anchoUtil / conteos.length);
      const alto = (item.total / maximo) * altoUtil;
      const color = item.valor >= 8 ? 'var(--success)' : item.valor >= 6 ? '#f59e0b' : 'var(--danger)';
      return {
        ...item,
        x: centro - anchoBarra / 2,
        ancho: anchoBarra,
        alto,
        y: this.chartHeight - this.padding - alto,
        porcentaje: total ? (item.total / total) * 100 : 0,
        color,
      };
    });
  });

  lineaPromedio = computed(() =>
    generarLinea(
      this.serieDiaria().map((dia) => dia.promedio),
      { ancho: this.chartWidth, alto: this.chartHeight, padding: this.padding, maximo: 10 },
    ),
  );

  puntosPromedio = computed(() =>
    generarPuntos(
      this.serieDiaria().map((dia) => dia.promedio),
      { ancho: this.chartWidth, alto: this.chartHeight, padding: this.padding, maximo: 10 },
    ),
  );

  guiasPromedio = computed(() =>
    [0, 2, 4, 6, 8, 10].map((valor) => ({
      valor,
      y: posicionY(valor, this.chartHeight, this.padding, 10),
    })),
  );

  metaY = computed(() => posicionY(this.meta, this.chartHeight, this.padding, 10));

  etiquetasX = computed(() => {
    const serie = this.serieDiaria();
    if (!serie.length) return [];
    const paso = serie.length <= 7 ? 1 : Math.ceil(serie.length / 7);
    const anchoUtil = this.chartWidth - 2 * this.padding;
    const pasoX = anchoUtil / (serie.length - 1 || 1);

    return serie
      .map((dia, indice) => ({
        x: this.padding + indice * pasoX,
        label: formatearFechaCorta(dia.fecha),
      }))
      .filter((_, indice) => indice % paso === 0 || indice === serie.length - 1);
  });

  mapaCalor = computed(() => {
    const lista = this.calificacionesFiltradas();
    const celdas: CeldaCalor[] = [];

    this.rangosNotas.forEach((rango) => {
      this.diasSemana.forEach((dia) => {
        const total = lista.filter((calificacion) => {
          const mismoDia = diaSemana(calificacion.fecha) === dia;
          const valor = calificacion.valor;
          const enRango =
            (rango === '1–5' && valor <= 5) ||
            (rango === '6–7' && valor >= 6 && valor <= 7) ||
            (rango === '8–9' && valor >= 8 && valor <= 9) ||
            (rango === '10' && valor === 10);
          return mismoDia && enRango;
        }).length;
        celdas.push({ dia, rango, total, intensidad: 0 });
      });
    });

    const maximo = Math.max(...celdas.map((celda) => celda.total), 1);
    const filas = this.rangosNotas.map((rango) => ({
      rango,
      celdas: celdas
        .filter((celda) => celda.rango === rango)
        .map((celda) => ({ ...celda, intensidad: celda.total / maximo })),
    }));

    return filas;
  });

  ultimasCalificaciones = computed(() =>
    [...this.calificacionesFiltradas()]
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, 12),
  );

  constructor(
    private retroSvc: RetroalimentacionService,
    private reporteSvc: ReporteXlsxService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.retroSvc.getAll().subscribe({
      next: (datos) => {
        this.calificaciones.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.errorCarga.set(true);
        this.cargando.set(false);
      },
    });
  }

  limpiarFiltro(): void {
    this.fechaDesde.set('');
    this.fechaHasta.set('');
  }

  formatear(fecha: string): string {
    return formatearFecha(fecha);
  }

  colorNota(valor: number): string {
    if (valor >= 8) return 'var(--success)';
    if (valor >= 6) return '#f59e0b';
    return 'var(--danger)';
  }

  logout(): void {
    this.auth.logout();
  }

  async exportar(): Promise<void> {
    if (!this.hayDatos() || this.exportando()) return;

    this.exportando.set(true);
    this.msgExport.set('');
    this.errorExport.set('');

    const resumen = this.resumen();
    const serie = this.serieDiaria();
    const anterior = this.periodoAnterior();
    const periodo = this.periodoTexto();
    const comparar = (actual: number, previo: number | undefined, menorEsMejor = false) => {
      const variacion = previo == null || previo === 0 ? null : ((actual - previo) / previo) * 100;
      return {
        variacion,
        variacionPositiva: previo == null ? true : menorEsMejor ? actual <= previo : actual >= previo,
      };
    };

    try {
      await this.reporteSvc.descargar({
        nombreArchivo: 'cinematch-dashboard-satisfaccion',
        portada: {
          titulo: 'Satisfacción y calidad',
          subtitulo: 'Experiencia del usuario',
          responsable: 'Sushikiu · susanaortega360@gmail.com',
          periodo,
          indice: [
            'Resumen',
            'Serie diaria de satisfacción',
            'Detalle de calificaciones',
            'Metodología',
          ],
        },
        resumen: {
          titulo: 'Satisfacción y calidad',
          kpis: [
            {
              etiqueta: 'Promedio de calificación',
              valor: Number(resumen.promedio.toFixed(1)),
              formato: 'decimal',
              detalle: 'Escala de 1 a 10 · meta 7.0',
              ...comparar(resumen.promedio, anterior?.promedio),
            },
            {
              etiqueta: 'Calificaciones recibidas',
              valor: resumen.total,
              formato: 'entero',
              detalle: `${serie.length} días con datos`,
              ...comparar(resumen.total, anterior?.total),
            },
            {
              etiqueta: 'Satisfacción (nota ≥ 8)',
              valor: Number(resumen.satisfaccion.toFixed(1)),
              formato: 'porcentaje',
              detalle: `${resumen.satisfechos} calificaciones altas`,
              ...comparar(resumen.satisfaccion, anterior?.satisfaccion),
            },
            {
              etiqueta: 'Riesgo (nota ≤ 5)',
              valor: Number(resumen.riesgo.toFixed(1)),
              formato: 'porcentaje',
              detalle: `${resumen.riesgoTotal} calificaciones bajas`,
              ...comparar(resumen.riesgo, anterior?.riesgo, true),
            },
          ],
          indicadores: this.indicadores(),
          destacada: {
            titulo: 'Distribución por nota',
            columnas: [
              { titulo: 'Nota', ancho: 10, tipo: 'entero' },
              { titulo: 'Calificaciones', ancho: 16, tipo: 'entero' },
              { titulo: 'Porcentaje (%)', ancho: 16, tipo: 'porcentaje' },
            ],
            filas: this.distribucionTabla(),
            columnaBarras: 1,
          },
        },
        metodologia: {
          titulo: 'Metodología',
          puntos: [
            'Fuente: consulta GraphQL retroalimentacion, con el registro de calificaciones de la plataforma.',
            'Comparativo: ventana inmediatamente anterior de la misma duración que el periodo seleccionado.',
          ],
        },
        hojas: [
          {
            nombre: 'Serie diaria',
            titulo: 'Serie diaria de satisfacción',
            subtitulo: 'Promedio y proporción de notas altas por fecha.',
            periodo,
            columnas: [
              { titulo: 'Fecha', ancho: 14, tipo: 'texto' },
              { titulo: 'Promedio', ancho: 12, tipo: 'decimal' },
              { titulo: 'Calificaciones', ancho: 15, tipo: 'entero' },
              { titulo: 'Satisfacción (%)', ancho: 16, tipo: 'porcentaje' },
              { titulo: 'Riesgo (%)', ancho: 12, tipo: 'porcentaje' },
            ],
            filas: serie.map((dia) => [
              dia.etiqueta,
              Number(dia.promedio.toFixed(1)),
              dia.total,
              Number(dia.satisfaccion.toFixed(1)),
              Number(dia.riesgo.toFixed(1)),
            ]),
            totales: [
              'Total',
              Number(resumen.promedio.toFixed(1)),
              resumen.total,
              Number(resumen.satisfaccion.toFixed(1)),
              Number(resumen.riesgo.toFixed(1)),
            ],
            barrasDatos: [2, 3, 4],
            escalaColor: { columna: 1, minimo: 1, maximo: 10 },
          },
          {
            nombre: 'Calificaciones',
            titulo: 'Detalle de calificaciones',
            subtitulo: 'Registro completo de las calificaciones del periodo.',
            periodo,
            columnas: [
              { titulo: 'ID', ancho: 10, tipo: 'entero' },
              { titulo: 'Fecha', ancho: 22, tipo: 'texto' },
              { titulo: 'Calificación', ancho: 14, tipo: 'entero' },
              { titulo: 'Usuario ID', ancho: 12, tipo: 'entero' },
              { titulo: 'Sala ID', ancho: 12, tipo: 'entero' },
            ],
            filas: [...this.calificacionesFiltradas()]
              .sort((a, b) => b.fecha.localeCompare(a.fecha))
              .map((calificacion) => [
                calificacion.id,
                formatearFecha(calificacion.fecha),
                calificacion.valor,
                calificacion.usuarioId,
                calificacion.salaId,
              ]),
            escalaColor: { columna: 2, minimo: 1, maximo: 10 },
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

  private compararMitades(): { diferencia: number } | null {
    const lista = [...this.calificacionesFiltradas()].sort((a, b) => a.fecha.localeCompare(b.fecha));
    if (lista.length < 2) return null;

    const mitad = Math.floor(lista.length / 2);
    const inicio = promedio(lista.slice(0, mitad).map((calificacion) => calificacion.valor));
    const fin = promedio(lista.slice(lista.length - mitad).map((calificacion) => calificacion.valor));
    return { diferencia: fin - inicio };
  }

  private periodoTexto(): string {
    const lista = this.calificacionesFiltradas();
    if (!lista.length) return 'Sin datos';
    const fechas = lista.map((calificacion) => toDateInput(calificacion.fecha)).sort();
    return `${this.fechaDesde() || fechas[0]} a ${this.fechaHasta() || fechas[fechas.length - 1]}`;
  }
}
