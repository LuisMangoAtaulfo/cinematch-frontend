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

  // ── Readonly signals ──────────────────────────────────
  readonly sala      = this._sala.asReadonly();
  readonly contenido = this._contenido.asReadonly();
  readonly indice    = this._indice.asReadonly();
  readonly matches   = this._matches.asReadonly();

  // ── Computed ──────────────────────────────────────────
  readonly hayMas = computed(() => this._indice() < this._contenido().length);
  readonly actual = computed(() => this._contenido()[this._indice()] ?? null);
  readonly totalMatches = computed(() => this._matches().length);
  readonly salaId = computed(() => this._sala()?.id ?? null);

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

  reset(): void {
    this._sala.set(null);
    this._contenido.set([]);
    this._indice.set(0);
    this._matches.set([]);
  }
}
