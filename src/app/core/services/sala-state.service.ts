import { Injectable, signal, computed } from '@angular/core';
import { Contenido, Match, Sala } from '../models';

/**
 * SalaStateService mantiene el estado reactivo de la sala activa
 * durante toda la sesión de swipe. Compartido entre:
 * Filtros → Swipe → Matches → Chat → Resultados
 */
@Injectable({ providedIn: 'root' })
export class SalaStateService {
  // ── Estado de sala ────────────────────────────────────
  private _sala      = signal<Sala | null>(null);
  private _contenido = signal<Contenido[]>([]);
  private _indice    = signal(0);
  private _matches   = signal<Match[]>([]);
  private _esCreador = signal<boolean>(false);

  // ── Readonly signals ──────────────────────────────────
  readonly sala      = this._sala.asReadonly();
  readonly contenido = this._contenido.asReadonly();
  readonly indice    = this._indice.asReadonly();
  readonly matches   = this._matches.asReadonly();
  readonly esCreador = this._esCreador.asReadonly();

  // ── Computed ──────────────────────────────────────────
  readonly hayMas      = computed(() => this._indice() < this._contenido().length);
  readonly actual      = computed(() => this._contenido()[this._indice()] ?? null);
  readonly totalMatches = computed(() => this._matches().length);
  readonly salaId      = computed(() => this._sala()?.id ?? null);
  private _catalogo = signal<Contenido[]>([]);
  readonly catalogo = this._catalogo.asReadonly();


  private _tieneFiltros = signal(false);
  readonly tieneFiltros = this._tieneFiltros.asReadonly();

  // ── Mutaciones ────────────────────────────────────────
  setSala(sala: Sala): void {
    this._sala.set(sala);
  }

  setContenido(lista: Contenido[]): void {
    this._contenido.set(lista);
    this._indice.set(0);
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

  /** Indica si el usuario actual fue quien creó la sala */
  setEsCreador(valor: boolean): void {
    this._esCreador.set(valor);
  }

  setTieneFiltros(valor: boolean): void {
    this._tieneFiltros.set(valor);
  }

  reset(): void {
    this._sala.set(null);
    this._contenido.set([]);
    this._indice.set(0);
    this._matches.set([]);
    this._esCreador.set(false);
    this._tieneFiltros.set(false);
  }
}