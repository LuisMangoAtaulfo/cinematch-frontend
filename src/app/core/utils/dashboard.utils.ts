/**
 * Utilidades de fecha y geometría compartidas por los dashboards.
 * Mantienen el mismo tratamiento de fechas que el resto de la aplicación:
 * las fechas del backend llegan como ISO sin zona y se interpretan en UTC.
 */

export interface PuntoGrafica {
  x: number;
  y: number;
  valor: number;
  fecha: string;
}

export interface OpcionesLinea {
  ancho: number;
  alto: number;
  padding: number;
  maximo: number;
}

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function normalizarFecha(fecha: string): Date {
  const normalizada = fecha.includes('Z') || fecha.includes('+') ? fecha : `${fecha}Z`;
  return new Date(normalizada);
}

export function formatearFecha(fecha: string): string {
  return normalizarFecha(fecha).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatearFechaCorta(fecha: string): string {
  return normalizarFecha(fecha).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
  });
}

export function toDateInput(fecha: string | Date): string {
  const valor = typeof fecha === 'string' ? normalizarFecha(fecha) : fecha;
  const anio = valor.getUTCFullYear();
  const mes = String(valor.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(valor.getUTCDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/** Devuelve el nombre corto del día de la semana en UTC (Lun, Mar, ...). */
export function diaSemana(fecha: string): string {
  return DIAS_SEMANA[normalizarFecha(fecha).getUTCDay()];
}

/** Orden de lunes a domingo para ejes de categorías. */
export const ORDEN_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/** Redondea un máximo a un valor legible para el eje Y. */
export function redondearMaximo(valor: number): number {
  if (!Number.isFinite(valor) || valor <= 0) return 1;
  const exponente = Math.floor(Math.log10(valor));
  const base = Math.pow(10, exponente);
  const normalizado = valor / base;
  const paso = normalizado <= 1 ? 1 : normalizado <= 2 ? 2 : normalizado <= 5 ? 5 : 10;
  return paso * base;
}

export function promedio(valores: number[]): number {
  if (!valores.length) return 0;
  return valores.reduce((total, valor) => total + valor, 0) / valores.length;
}

export function generarSparkline(valores: number[], ancho = 100, alto = 20): string {
  if (!valores.length) return '';
  const maximo = Math.max(...valores, 1);
  const paso = ancho / (valores.length - 1 || 1);
  return valores
    .map((valor, indice) => `${indice * paso},${alto - (valor / maximo) * (alto - 2)}`)
    .join(' ');
}

export function generarLinea(valores: number[], opciones: OpcionesLinea): string {
  return generarPuntos(valores, opciones)
    .map((punto) => `${punto.x},${punto.y}`)
    .join(' ');
}

export function generarPuntos(valores: number[], opciones: OpcionesLinea): PuntoGrafica[] {
  const { ancho, alto, padding, maximo } = opciones;
  const anchoUtil = ancho - 2 * padding;
  const altoUtil = alto - 2 * padding;
  const paso = anchoUtil / (valores.length - 1 || 1);
  const tope = maximo || 1;

  return valores.map((valor, indice) => ({
    x: padding + indice * paso,
    y: padding + altoUtil - (valor / tope) * altoUtil,
    valor,
    fecha: '',
  }));
}

/** Coordenada Y para un valor dentro del área de un gráfico. */
export function posicionY(valor: number, alto: number, padding: number, maximo: number): number {
  const altoUtil = alto - 2 * padding;
  return padding + altoUtil - (valor / (maximo || 1)) * altoUtil;
}
