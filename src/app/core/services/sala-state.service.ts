import { Injectable, signal, computed, effect } from '@angular/core';
import { Contenido, Match, Sala } from '../models';

const LS_SALA_KEY  = 'cm_sala';   // guarda el objeto Sala serializado
const LS_IDX_KEY   = 'cm_indice'; // guarda el índice actual del catálogo

/**
 * SalaStateService mantiene el estado reactivo de la sala activa
 * durante toda la sesión de swipe. Compartido entre:
 * Filtros → Swipe → Matches → Chat → Resultados
 *
 * PERSISTENCIA: sala e índice se guardan en localStorage para
 * sobrevivir recargas de página (especialmente el segundo usuario).
 * El catálogo NO se persiste (es grande); en su lugar SwipeComponent
 * lo recupera de la API si al arrancar está vacío.
 */
@Injectable({ providedIn: 'root' })
export class SalaStateService {

  // ── Estado de sala ────────────────────────────────────
  private _sala      = signal<Sala | null>(this.leerSalaLS());
  private _contenido = signal<Contenido[]>([]);
  private _indice    = signal<number>(this.leerIndiceLS());
  private _matches   = signal<Match[]>([]);
  private _esCreador = signal<boolean>(false);

  // ── Readonly signals ──────────────────────────────────
  readonly sala      = this._sala.asReadonly();
  readonly contenido = this._contenido.asReadonly();
  readonly indice    = this._indice.asReadonly();
  readonly matches   = this._matches.asReadonly();
  readonly esCreador = this._esCreador.asReadonly();

  // ── Computed ──────────────────────────────────────────
  readonly hayMas       = computed(() => this._indice() < this._contenido().length);
  readonly actual       = computed(() => this._contenido()[this._indice()] ?? null);
  readonly totalMatches = computed(() => this._matches().length);
  readonly salaId       = computed(() => this._sala()?.id ?? null);
  readonly tieneFiltros = computed(() => this._contenido().length > 0);

  // Señal de catálogo sin uso interno (legacy, mantenida por compatibilidad)
  private _catalogo = signal<Contenido[]>([]);
  readonly catalogo = this._catalogo.asReadonly();

  constructor() {
    // Persistir sala en localStorage cada vez que cambia
    effect(() => {
      const sala = this._sala();
      if (sala) {
        localStorage.setItem(LS_SALA_KEY, JSON.stringify(sala));
      } else {
        localStorage.removeItem(LS_SALA_KEY);
      }
    });

    // Persistir índice en localStorage cada vez que avanza
    effect(() => {
      const idx = this._indice();
      localStorage.setItem(LS_IDX_KEY, String(idx));
    });
  }

  // ── Mutaciones ────────────────────────────────────────
  setSala(sala: Sala): void {
    this._sala.set(sala);
  }

  setContenido(lista: Contenido[]): void {
    this._contenido.set(lista);
    // Al cargar un catálogo nuevo resetear el índice solo si viene de cero
    // (no resetear si es una recarga que reanuda donde quedó)
    if (this._indice() >= lista.length) {
      this._indice.set(0);
    }
  }

  /**
   * Carga el catálogo en memoria y reanuda desde el índice guardado.
   * Usar en lugar de setContenido() cuando se recupera tras recarga.
   */
  reanudarContenido(lista: Contenido[]): void {
    this._contenido.set(lista);
    // El índice ya viene de localStorage; no lo tocamos
  }

  avanzar(): void {
    this._indice.update(i => i + 1);
  }

  agregarMatch(match: Match): void {
    this._matches.update(prev => [...prev, match]);
  }

  setMatches(matches: Match[]): void {
    this._matches.set(matches);
  }

  plataformasDe(contenidoId: string): string[] {
    return this._contenido().find(c => c.contenidoId === contenidoId)?.plataformas ?? [];
  }

  setEsCreador(valor: boolean): void {
    this._esCreador.set(valor);
  }

  reset(): void {
    this._sala.set(null);
    this._contenido.set([]);
    this._indice.set(0);
    this._matches.set([]);
    this._esCreador.set(false);
    localStorage.removeItem(LS_SALA_KEY);
    localStorage.removeItem(LS_IDX_KEY);
  }

  // ── Helpers localStorage ──────────────────────────────
  private leerSalaLS(): Sala | null {
    try {
      const raw = localStorage.getItem(LS_SALA_KEY);
      return raw ? (JSON.parse(raw) as Sala) : null;
    } catch {
      return null;
    }
  }

  private leerIndiceLS(): number {
    try {
      const raw = localStorage.getItem(LS_IDX_KEY);
      const n   = raw ? parseInt(raw, 10) : 0;
      return isNaN(n) ? 0 : n;
    } catch {
      return 0;
    }
  }
}