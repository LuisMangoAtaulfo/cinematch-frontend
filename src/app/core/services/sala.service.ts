import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Contenido, CrearSalaRequest, Match, Sala, UnirseRequest } from '../models';
import {
  OBTENER_SALA,
  CONTENIDO_POR_SALA,
  BUSCAR_MATCHES
} from '../graphql/queries';
import {
  CREAR_SALA,
  UNIRSE_A_SALA,
  FINALIZAR_SALA,
  APLICAR_FILTROS
} from '../graphql/mutations';

/**
 * Resultado tipado de getFiltros para distinguir los tres estados:
 *  - 'sin-filtros'  → 204: el creador aún no aplicó filtros
 *  - 'sin-resultados' → 200 con []: filtros aplicados pero no hay contenido
 *  - Contenido[]    → 200 con datos: catálogo listo
 */
export type FiltrosResult = 'sin-filtros' | 'sin-resultados' | Contenido[];

@Injectable({ providedIn: 'root' })
export class SalaService {
  constructor(private apollo: Apollo) {}

  crear(body: CrearSalaRequest): Observable<Sala> {
    return this.apollo
      .mutate<{ crearSala: Sala }>({
        mutation: CREAR_SALA,
        variables: { input: body }
      })
      .pipe(map(result => result.data!.crearSala as Sala));
  }

  unirse(body: UnirseRequest): Observable<Sala> {
    return this.apollo
      .mutate<{ unirseASala: Sala }>({
        mutation: UNIRSE_A_SALA,
        variables: { input: body }
      })
      .pipe(map(result => result.data!.unirseASala as Sala));
  }

  getById(id: number): Observable<Sala> {
    return this.apollo
      .watchQuery<{ obtenerSala: Sala }>({
        query: OBTENER_SALA,
        variables: { id }
      })
      .valueChanges.pipe(map(result => result.data?.obtenerSala as Sala));
  }

  /**
   * Consulta el catálogo guardado para una sala.
   *
   * Mapea la respuesta a FiltrosResult:
   *   204 / null → 'sin-filtros'   (creador no aplicó filtros aún)
   *   200 + []   → 'sin-resultados' (filtros aplicados, pero vacío)
   *   200 + [..] → Contenido[]     (catálogo listo)
   */
  getFiltros(salaId: number): Observable<FiltrosResult> {
    return this.apollo
      .watchQuery<{ contenidoPorSala: Contenido[] | null }>({
        query: CONTENIDO_POR_SALA,
        variables: { salaId }
      })
      .valueChanges.pipe(
        map((result): FiltrosResult => {
          const data = result.data?.contenidoPorSala;
          if (data === null || data === undefined) return 'sin-filtros';
          if (data.length === 0) return 'sin-resultados';
          return data as Contenido[];
        }),
        catchError(() => of('sin-filtros' as FiltrosResult))
      );
  }

  aplicarFiltros(body: any): Observable<Contenido[]> {
    return this.apollo
      .mutate<{ aplicarFiltros: Contenido[] }>({
        mutation: APLICAR_FILTROS,
        variables: { input: body }
      })
      .pipe(map(result => result.data!.aplicarFiltros as Contenido[]));
  }

  finalizar(id: number): Observable<void> {
    return this.apollo
      .mutate<{ finalizarSala: boolean }>({
        mutation: FINALIZAR_SALA,
        variables: { id }
      })
      .pipe(map(() => undefined));
  }

  getMatches(id: number): Observable<Match[]> {
    return this.apollo
      .watchQuery<{ buscarMatches: Match[] }>({
        query: BUSCAR_MATCHES,
        variables: { salaId: id }
      })
      .valueChanges.pipe(map(result => result.data?.buscarMatches as Match[] ?? []));
  }
}
