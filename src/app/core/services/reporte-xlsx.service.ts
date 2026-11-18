import { Injectable } from '@angular/core';
import type { Workbook } from 'exceljs';

export type TipoColumna = 'texto' | 'entero' | 'decimal' | 'porcentaje';

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
}

export interface ReporteXlsx {
  nombreArchivo: string;
  hojas: HojaReporte[];
}

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

    for (const hoja of reporte.hojas) {
      this.agregarHoja(libro, hoja);
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

  private agregarHoja(libro: Workbook, datos: HojaReporte): void {
    const hoja = libro.addWorksheet(datos.nombre);
    const totalColumnas = datos.columnas.length;
    const generado = new Date().toLocaleString('es-MX');

    hoja.columns = datos.columnas.map((columna) => ({
      width: columna.ancho ?? 18,
    }));

    hoja.mergeCells(1, 1, 1, totalColumnas);
    const titulo = hoja.getCell(1, 1);
    titulo.value = datos.titulo;
    titulo.font = { bold: true, size: 15, color: { argb: 'FF111827' } };
    hoja.getRow(1).height = 24;

    let filaActual = 2;

    if (datos.subtitulo) {
      hoja.mergeCells(filaActual, 1, filaActual, totalColumnas);
      const subtitulo = hoja.getCell(filaActual, 1);
      subtitulo.value = datos.subtitulo;
      subtitulo.font = { size: 11, color: { argb: 'FF6B7280' } };
      filaActual++;
    }

    hoja.mergeCells(filaActual, 1, filaActual, totalColumnas);
    const metadatos = hoja.getCell(filaActual, 1);
    metadatos.value = `Periodo: ${datos.periodo} · Generado: ${generado}`;
    metadatos.font = { size: 10, italic: true, color: { argb: 'FF6B7280' } };
    filaActual += 2;

    const filaEncabezado = filaActual;
    datos.columnas.forEach((columna, indice) => {
      const celda = hoja.getCell(filaEncabezado, indice + 1);
      celda.value = columna.titulo;
      celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
      celda.alignment = { vertical: 'middle' };
    });
    hoja.getRow(filaEncabezado).height = 20;
    hoja.views = [{ state: 'frozen', ySplit: filaEncabezado }];

    datos.filas.forEach((fila, indiceFila) => {
      const numeroFila = filaEncabezado + 1 + indiceFila;
      fila.forEach((valor, indiceColumna) => {
        const celda = hoja.getCell(numeroFila, indiceColumna + 1);
        celda.value = valor;
        const formato = FORMATO_NUMERO[datos.columnas[indiceColumna]?.tipo ?? 'texto'];
        if (formato && typeof valor === 'number') {
          celda.numFmt = formato;
        }
      });
    });

    if (datos.totales?.length) {
      const numeroFila = filaEncabezado + datos.filas.length + 1;
      datos.totales.forEach((valor, indiceColumna) => {
        const celda = hoja.getCell(numeroFila, indiceColumna + 1);
        celda.value = valor;
        celda.font = { bold: true };
        const formato = FORMATO_NUMERO[datos.columnas[indiceColumna]?.tipo ?? 'texto'];
        if (formato && typeof valor === 'number') {
          celda.numFmt = formato;
        }
      });
    }
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
