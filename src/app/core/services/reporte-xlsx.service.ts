import { Injectable } from '@angular/core';
import type { Workbook, Worksheet } from 'exceljs';

export type TipoColumna = 'texto' | 'entero' | 'decimal' | 'porcentaje';
export type EstadoIndicador = 'En meta' | 'En riesgo' | 'Fuera de meta';

export interface ColumnaReporte {
  titulo: string;
  ancho?: number;
  tipo?: TipoColumna;
}

export interface HojaReporte {
  nombre: string;
  titulo: string;
  subtitulo?: string;
  periodo: string;
  columnas: ColumnaReporte[];
  filas: (string | number | null)[][];
  totales?: (string | number | null)[];
  /** Índices (base 0) de columnas que llevan barras de datos. */
  barrasDatos?: number[];
  /** Escala de color para una columna numérica. */
  escalaColor?: { columna: number; minimo: number; maximo: number };
}

export interface PortadaReporte {
  titulo: string;
  subtitulo: string;
  responsable: string;
  periodo: string;
  indice: string[];
}

export interface KpiReporte {
  etiqueta: string;
  valor: string | number;
  formato?: TipoColumna;
  detalle?: string;
  variacion?: number | null;
  variacionPositiva?: boolean;
}

export interface IndicadorReporte {
  indicador: string;
  valor: string | number;
  meta: string;
  estado: EstadoIndicador;
}

export interface TablaDestacadaReporte {
  titulo: string;
  columnas: ColumnaReporte[];
  filas: (string | number | null)[][];
  columnaBarras?: number;
}

export interface ResumenReporte {
  titulo: string;
  kpis: KpiReporte[];
  indicadores: IndicadorReporte[];
  destacada?: TablaDestacadaReporte;
}

export interface MetodologiaReporte {
  titulo: string;
  puntos: string[];
}

export interface ReporteXlsx {
  nombreArchivo: string;
  portada?: PortadaReporte;
  resumen?: ResumenReporte;
  metodologia?: MetodologiaReporte;
  hojas: HojaReporte[];
}

const COLOR = {
  azul: 'FF0F172A',
  azulMedio: 'FF1E293B',
  acento: 'FF6366F1',
  texto: 'FF111827',
  textoSuave: 'FF64748B',
  borde: 'FFE2E8F0',
  fondoSuave: 'FFF8FAFC',
  blanco: 'FFFFFFFF',
  verde: 'FF16A34A',
  ambar: 'FFD97706',
  rojo: 'FFDC2626',
  gris: 'FFE5E7EB',
};

const TIPO_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const FORMATO_NUMERO: Record<TipoColumna, string | undefined> = {
  texto: undefined,
  entero: '#,##0',
  decimal: '#,##0.0',
  porcentaje: '0.0"%"',
};

/**
 * Genera reportes XLSX en el navegador con ExcelJS.
 * La dependencia se carga solo al exportar para no afectar el bundle inicial.
 */
@Injectable({ providedIn: 'root' })
export class ReporteXlsxService {
  async descargar(reporte: ReporteXlsx): Promise<void> {
    const { Workbook } = await import('exceljs');
    const libro: Workbook = new Workbook();

    libro.creator = 'CineMatch';
    libro.created = new Date();
    libro.title = reporte.portada?.titulo ?? 'Reporte CineMatch';
    libro.subject = reporte.portada?.subtitulo ?? 'Reporte';
    libro.company = 'CineMatch';
    libro.keywords = 'cinematch, dashboard, reporte, xlsx';
    libro.description = 'Reporte generado automáticamente por CineMatch';

    if (reporte.portada) {
      this.agregarPortada(libro, reporte.portada);
    }

    if (reporte.resumen) {
      this.agregarResumen(libro, reporte.resumen, reporte.portada?.periodo ?? '');
    }

    for (const hoja of reporte.hojas) {
      this.agregarHoja(libro, hoja);
    }

    if (reporte.metodologia) {
      this.agregarMetodologia(libro, reporte.metodologia);
    }

    const contenido = await libro.xlsx.writeBuffer();
    const blob = new Blob([contenido as unknown as BlobPart], { type: TIPO_XLSX });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');

    enlace.href = url;
    enlace.download = this.nombreArchivo(reporte.nombreArchivo);
    enlace.click();

    URL.revokeObjectURL(url);
  }

  // ── Portada ─────────────────────────────────────────────

  private agregarPortada(libro: Workbook, datos: PortadaReporte): void {
    const hoja = libro.addWorksheet('Portada', {
      properties: { tabColor: { argb: COLOR.azul } },
    });

    hoja.columns = Array.from({ length: 8 }, () => ({ width: 15 }));
    hoja.properties.defaultRowHeight = 18;
    hoja.pageSetup = this.configuracionImpresion('portrait');
    hoja.headerFooter = this.pieConfidencial();

    this.pintarRango(hoja, 1, 1, 3, 8, COLOR.azul);
    hoja.mergeCells(1, 1, 3, 8);
    const marca = hoja.getCell(1, 1);
    marca.value = 'CineMatch';
    marca.font = { bold: true, size: 32, color: { argb: COLOR.blanco } };
    marca.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    hoja.getRow(1).height = 22;
    hoja.getRow(2).height = 22;
    hoja.getRow(3).height = 22;

    hoja.mergeCells(5, 1, 5, 8);
    const titulo = hoja.getCell(5, 1);
    titulo.value = datos.titulo;
    titulo.font = { bold: true, size: 20, color: { argb: COLOR.azul } };

    hoja.mergeCells(6, 1, 6, 8);
    const subtitulo = hoja.getCell(6, 1);
    subtitulo.value = datos.subtitulo;
    subtitulo.font = { size: 12, color: { argb: COLOR.textoSuave } };

    const metadatos: Array<[string, string]> = [
      ['Responsable', datos.responsable],
      ['Periodo', datos.periodo],
      ['Generado', new Date().toLocaleString('es-MX')],
      ['Clasificación', 'Documento confidencial · uso interno'],
    ];
    let fila = 9;
    for (const [etiqueta, valor] of metadatos) {
      hoja.getCell(fila, 1).value = etiqueta;
      hoja.getCell(fila, 1).font = { bold: true, size: 10, color: { argb: COLOR.textoSuave } };
      hoja.mergeCells(fila, 2, fila, 8);
      const celdaValor = hoja.getCell(fila, 2);
      celdaValor.value = valor;
      celdaValor.font = { size: 11, color: { argb: COLOR.texto } };
      fila += 1;
    }

    fila += 2;
    hoja.getCell(fila, 1).value = 'Contenido del reporte';
    hoja.getCell(fila, 1).font = { bold: true, size: 12, color: { argb: COLOR.azul } };
    hoja.mergeCells(fila, 1, fila, 8);
    fila += 1;

    for (const item of datos.indice) {
      hoja.mergeCells(fila, 1, fila, 8);
      const celda = hoja.getCell(fila, 1);
      celda.value = `•  ${item}`;
      celda.font = { size: 11, color: { argb: COLOR.texto } };
      celda.alignment = { wrapText: true, vertical: 'middle' };
      hoja.getRow(fila).height = 18;
      fila += 1;
    }

    hoja.mergeCells(fila + 2, 1, fila + 2, 8);
    const nota = hoja.getCell(fila + 2, 1);
    nota.value = 'Reporte generado automáticamente a partir de los datos de la plataforma.';
    nota.font = { size: 9, italic: true, color: { argb: COLOR.textoSuave } };
  }

  // ── Resumen ─────────────────────────────────────────────

  private agregarResumen(libro: Workbook, datos: ResumenReporte, periodo: string): void {
    const hoja = libro.addWorksheet('Resumen', {
      properties: { tabColor: { argb: COLOR.acento } },
    });

    hoja.columns = [
      { width: 26 }, { width: 16 }, { width: 16 }, { width: 16 },
      { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 },
    ];
    hoja.properties.defaultRowHeight = 18;
    hoja.pageSetup = this.configuracionImpresion('landscape');
    hoja.headerFooter = this.pieConfidencial();

    this.pintarRango(hoja, 1, 1, 2, 8, COLOR.azul);
    hoja.mergeCells(1, 1, 2, 8);
    const encabezado = hoja.getCell(1, 1);
    encabezado.value = `CineMatch · ${datos.titulo}`;
    encabezado.font = { bold: true, size: 16, color: { argb: COLOR.blanco } };
    encabezado.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    hoja.getRow(1).height = 18;
    hoja.getRow(2).height = 16;

    hoja.mergeCells(3, 1, 3, 8);
    const subencabezado = hoja.getCell(3, 1);
    subencabezado.value = `Periodo: ${periodo}`;
    subencabezado.font = { size: 10, color: { argb: COLOR.textoSuave } };

    hoja.getCell(5, 1).value = 'Indicadores clave';
    hoja.mergeCells(5, 1, 5, 8);
    hoja.getCell(5, 1).font = { bold: true, size: 12, color: { argb: COLOR.azul } };

    const totalKpis = Math.min(datos.kpis.length, 4);
    for (let indice = 0; indice < totalKpis; indice += 1) {
      const kpi = datos.kpis[indice];
      const columna = indice * 2 + 1;

      this.pintarRango(hoja, 6, columna, 8, columna + 1, COLOR.fondoSuave);
      this.bordeRango(hoja, 6, columna, 8, columna + 1);

      hoja.mergeCells(6, columna, 6, columna + 1);
      const valor = hoja.getCell(6, columna);
      valor.value = kpi.valor;
      valor.font = { bold: true, size: 24, color: { argb: COLOR.azul } };
      valor.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      if (typeof kpi.valor === 'number' && kpi.formato) {
        valor.numFmt = FORMATO_NUMERO[kpi.formato] ?? 'General';
      }

      hoja.mergeCells(7, columna, 7, columna + 1);
      const etiqueta = hoja.getCell(7, columna);
      etiqueta.value = kpi.etiqueta;
      etiqueta.font = { bold: true, size: 10, color: { argb: COLOR.texto } };
      etiqueta.alignment = { indent: 1 };

      hoja.mergeCells(8, columna, 8, columna + 1);
      const detalle = hoja.getCell(8, columna);
      detalle.value = this.textoKpi(kpi);
      detalle.font = {
        size: 9,
        color: {
          argb: kpi.variacion == null
            ? COLOR.textoSuave
            : kpi.variacionPositiva ? COLOR.verde : COLOR.rojo,
        },
      };
      detalle.alignment = { indent: 1, wrapText: true };
    }

    hoja.getRow(6).height = 34;
    hoja.getRow(7).height = 16;
    hoja.getRow(8).height = 18;

    let fila = 10;
    hoja.getCell(fila, 1).value = 'Indicadores vs meta';
    hoja.mergeCells(fila, 1, fila, 8);
    hoja.getCell(fila, 1).font = { bold: true, size: 12, color: { argb: COLOR.azul } };
    fila += 1;

    const filaEncabezadoIndicadores = fila;
    ['Indicador', 'Valor', 'Meta', 'Estado'].forEach((titulo, indice) => {
      const celda = hoja.getCell(fila, indice + 1);
      celda.value = titulo;
      this.estiloEncabezado(celda);
    });
    fila += 1;

    const filaInicioIndicadores = fila;
    for (const indicador of datos.indicadores) {
      hoja.getCell(fila, 1).value = indicador.indicador;
      hoja.getCell(fila, 2).value = indicador.valor;
      hoja.getCell(fila, 3).value = indicador.meta;
      const estado = hoja.getCell(fila, 4);
      estado.value = indicador.estado;
      estado.font = { bold: true, size: 10, color: { argb: COLOR.blanco } };
      estado.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: this.colorEstado(indicador.estado) },
      };
      for (let columna = 1; columna <= 4; columna += 1) {
        this.bordeCelda(hoja.getCell(fila, columna));
      }
      fila += 1;
    }
    const filaFinIndicadores = fila - 1;

    if (filaFinIndicadores >= filaInicioIndicadores) {
      hoja.addConditionalFormatting({
        ref: `B${filaInicioIndicadores}:B${filaFinIndicadores}`,
        rules: [this.reglaBarras()],
      });
    }
    hoja.getRow(filaEncabezadoIndicadores).height = 20;

    fila += 2;
    if (datos.destacada) {
      fila = this.agregarTablaDestacada(hoja, fila, datos.destacada);
    }

    hoja.mergeCells(fila + 1, 1, fila + 1, 8);
    const nota = hoja.getCell(fila + 1, 1);
    nota.value = 'Los valores se calculan con los datos filtrados del periodo seleccionado.';
    nota.font = { size: 9, italic: true, color: { argb: COLOR.textoSuave } };
  }

  private agregarTablaDestacada(hoja: Worksheet, fila: number, datos: TablaDestacadaReporte): number {
    hoja.getCell(fila, 1).value = datos.titulo;
    hoja.mergeCells(fila, 1, fila, 8);
    hoja.getCell(fila, 1).font = { bold: true, size: 12, color: { argb: COLOR.azul } };
    fila += 1;

    const filaEncabezado = fila;
    datos.columnas.forEach((columna, indice) => {
      const celda = hoja.getCell(fila, indice + 1);
      celda.value = columna.titulo;
      this.estiloEncabezado(celda);
    });
    fila += 1;

    const filaInicio = fila;
    for (const valores of datos.filas) {
      valores.forEach((valor, indice) => {
        const celda = hoja.getCell(fila, indice + 1);
        celda.value = valor;
        const tipo = datos.columnas[indice]?.tipo ?? 'texto';
        if (typeof valor === 'number' && FORMATO_NUMERO[tipo]) {
          celda.numFmt = FORMATO_NUMERO[tipo] as string;
        }
        this.bordeCelda(celda);
        if ((fila - filaInicio) % 2 === 1) {
          celda.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: COLOR.fondoSuave },
          };
        }
      });
      fila += 1;
    }

    if (datos.columnaBarras != null && fila > filaInicio) {
      const letra = this.letraColumna(datos.columnaBarras);
      hoja.addConditionalFormatting({
        ref: `${letra}${filaInicio}:${letra}${fila - 1}`,
        rules: [this.reglaBarras()],
      });
    }

    hoja.getRow(filaEncabezado).height = 20;
    return fila;
  }

  private textoKpi(kpi: KpiReporte): string {
    const detalle = kpi.detalle ?? '';
    if (kpi.variacion == null) {
      return detalle;
    }
    const flecha = kpi.variacionPositiva ? '▲' : '▼';
    const comparativo = `${flecha} ${Math.abs(kpi.variacion).toFixed(1)}% vs periodo anterior`;
    return detalle ? `${detalle} · ${comparativo}` : comparativo;
  }

  private colorEstado(estado: EstadoIndicador): string {
    if (estado === 'En meta') return COLOR.verde;
    if (estado === 'En riesgo') return COLOR.ambar;
    return COLOR.rojo;
  }

  // ── Hojas de detalle ────────────────────────────────────

  private agregarHoja(libro: Workbook, datos: HojaReporte): void {
    const hoja = libro.addWorksheet(datos.nombre, {
      properties: { tabColor: { argb: COLOR.azulMedio } },
    });
    const totalColumnas = datos.columnas.length;

    hoja.columns = datos.columnas.map((columna) => ({ width: columna.ancho ?? 18 }));
    hoja.properties.defaultRowHeight = 18;

    this.pintarRango(hoja, 1, 1, 1, totalColumnas, COLOR.azul);
    hoja.mergeCells(1, 1, 1, totalColumnas);
    const titulo = hoja.getCell(1, 1);
    titulo.value = datos.titulo;
    titulo.font = { bold: true, size: 14, color: { argb: COLOR.blanco } };
    titulo.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    hoja.getRow(1).height = 24;

    let fila = 2;
    if (datos.subtitulo) {
      hoja.mergeCells(fila, 1, fila, totalColumnas);
      hoja.getCell(fila, 1).value = datos.subtitulo;
      hoja.getCell(fila, 1).font = { size: 10, color: { argb: COLOR.textoSuave } };
      fila += 1;
    }

    hoja.mergeCells(fila, 1, fila, totalColumnas);
    hoja.getCell(fila, 1).value = `Periodo: ${datos.periodo} · Generado: ${new Date().toLocaleString('es-MX')}`;
    hoja.getCell(fila, 1).font = { size: 9, italic: true, color: { argb: COLOR.textoSuave } };

    const filaEncabezado = fila + 2;
    datos.columnas.forEach((columna, indice) => {
      const celda = hoja.getCell(filaEncabezado, indice + 1);
      celda.value = columna.titulo;
      this.estiloEncabezado(celda);
    });
    hoja.getRow(filaEncabezado).height = 20;
    hoja.views = [{ state: 'frozen', ySplit: filaEncabezado }];

    const filaInicio = filaEncabezado + 1;
    datos.filas.forEach((valores, indiceFila) => {
      const numeroFila = filaInicio + indiceFila;
      valores.forEach((valor, indiceColumna) => {
        const celda = hoja.getCell(numeroFila, indiceColumna + 1);
        celda.value = valor;
        const tipo = datos.columnas[indiceColumna]?.tipo ?? 'texto';
        if (typeof valor === 'number' && FORMATO_NUMERO[tipo]) {
          celda.numFmt = FORMATO_NUMERO[tipo] as string;
        }
        this.bordeCelda(celda);
        if (indiceFila % 2 === 1) {
          celda.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: COLOR.fondoSuave },
          };
        }
      });
    });

    const filaFin = filaInicio + datos.filas.length - 1;

    if (datos.totales?.length) {
      const numeroFila = filaFin + 1;
      datos.totales.forEach((valor, indiceColumna) => {
        const celda = hoja.getCell(numeroFila, indiceColumna + 1);
        celda.value = valor;
        celda.font = { bold: true };
        celda.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: COLOR.gris },
        };
        this.bordeCelda(celda);
        const tipo = datos.columnas[indiceColumna]?.tipo ?? 'texto';
        if (typeof valor === 'number' && FORMATO_NUMERO[tipo]) {
          celda.numFmt = FORMATO_NUMERO[tipo] as string;
        }
      });
    }

    if (filaFin >= filaInicio) {
      hoja.autoFilter = {
        from: { row: filaEncabezado, column: 1 },
        to: { row: filaFin, column: totalColumnas },
      };
    }

    for (const indice of datos.barrasDatos ?? []) {
      if (filaFin >= filaInicio) {
        const letra = this.letraColumna(indice);
        hoja.addConditionalFormatting({
          ref: `${letra}${filaInicio}:${letra}${filaFin}`,
          rules: [this.reglaBarras()],
        });
      }
    }

    if (datos.escalaColor && filaFin >= filaInicio) {
      const letra = this.letraColumna(datos.escalaColor.columna);
      hoja.addConditionalFormatting({
        ref: `${letra}${filaInicio}:${letra}${filaFin}`,
        rules: [{
          type: 'colorScale',
          priority: 1,
          cfvo: [
            { type: 'num', value: datos.escalaColor.minimo },
            { type: 'num', value: datos.escalaColor.maximo },
          ],
          color: [
            { argb: COLOR.rojo },
            { argb: 'FFFFEB84' },
            { argb: COLOR.verde },
          ],
        }],
      });
    }

    hoja.pageSetup = this.configuracionImpresion('landscape');
    hoja.pageSetup.printTitlesRow = `1:${filaEncabezado}`;
    hoja.headerFooter = this.pieConfidencial();
  }

  private agregarMetodologia(libro: Workbook, datos: MetodologiaReporte): void {
    const hoja = libro.addWorksheet('Metodología', {
      properties: { tabColor: { argb: COLOR.textoSuave } },
    });
    hoja.columns = [{ width: 4 }, { width: 110 }];
    hoja.properties.defaultRowHeight = 20;
    hoja.pageSetup = this.configuracionImpresion('portrait');
    hoja.headerFooter = this.pieConfidencial();

    this.pintarRango(hoja, 1, 1, 1, 2, COLOR.azul);
    hoja.mergeCells(1, 1, 1, 2);
    const titulo = hoja.getCell(1, 1);
    titulo.value = datos.titulo;
    titulo.font = { bold: true, size: 14, color: { argb: COLOR.blanco } };
    titulo.alignment = { vertical: 'middle', indent: 1 };
    hoja.getRow(1).height = 24;

    let fila = 3;
    for (const punto of datos.puntos) {
      hoja.mergeCells(fila, 1, fila, 2);
      const celda = hoja.getCell(fila, 1);
      celda.value = `•  ${punto}`;
      celda.font = { size: 10, color: { argb: COLOR.texto } };
      celda.alignment = { wrapText: true, vertical: 'top' };
      this.bordeRango(hoja, fila, 1, fila, 2);
      if ((fila - 3) % 2 === 1) {
        this.pintarRango(hoja, fila, 1, fila, 2, COLOR.fondoSuave);
      }
      hoja.getRow(fila).height = 32;
      fila += 1;
    }
  }

  // ── Utilidades de formato ───────────────────────────────

  private estiloEncabezado(celda: { value: unknown; font: unknown; fill: unknown; alignment: unknown }): void {
    (celda as any).font = { bold: true, size: 10, color: { argb: COLOR.blanco } };
    (celda as any).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLOR.azulMedio },
    };
    (celda as any).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  }

  private reglaBarras(): any {
    return {
      type: 'dataBar',
      minLength: 0,
      maxLength: 100,
      gradient: true,
      border: true,
      showValue: true,
      cfvo: [{ type: 'min' }, { type: 'max' }],
      priority: 1,
    };
  }

  private pintarRango(
    hoja: Worksheet,
    filaInicio: number,
    columnaInicio: number,
    filaFin: number,
    columnaFin: number,
    color: string,
  ): void {
    for (let fila = filaInicio; fila <= filaFin; fila += 1) {
      for (let columna = columnaInicio; columna <= columnaFin; columna += 1) {
        hoja.getCell(fila, columna).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: color },
        };
      }
    }
  }

  private bordeRango(
    hoja: Worksheet,
    filaInicio: number,
    columnaInicio: number,
    filaFin: number,
    columnaFin: number,
  ): void {
    for (let fila = filaInicio; fila <= filaFin; fila += 1) {
      for (let columna = columnaInicio; columna <= columnaFin; columna += 1) {
        this.bordeCelda(hoja.getCell(fila, columna));
      }
    }
  }

  private bordeCelda(celda: { border: unknown }): void {
    (celda as any).border = {
      top: { style: 'thin', color: { argb: COLOR.borde } },
      left: { style: 'thin', color: { argb: COLOR.borde } },
      bottom: { style: 'thin', color: { argb: COLOR.borde } },
      right: { style: 'thin', color: { argb: COLOR.borde } },
    };
  }

  private letraColumna(indice: number): string {
    let numero = indice + 1;
    let letra = '';
    while (numero > 0) {
      const resto = (numero - 1) % 26;
      letra = String.fromCharCode(65 + resto) + letra;
      numero = Math.floor((numero - 1) / 26);
    }
    return letra;
  }

  private configuracionImpresion(orientacion: 'portrait' | 'landscape'): any {
    return {
      orientation: orientacion,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    };
  }

  private pieConfidencial(): any {
    return {
      oddFooter: '&CCineMatch · Confidencial · Página &P de &N',
      oddHeader: '&R&8Reporte generado automáticamente',
    };
  }

  private nombreArchivo(base: string): string {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const limpio = base.replace(/\.xlsx$/i, '');
    return `${limpio}-${anio}-${mes}-${dia}.xlsx`;
  }
}
