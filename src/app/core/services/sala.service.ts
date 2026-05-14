import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Contenido, CrearSalaRequest, Match, Sala, UnirseRequest } from '../models';
import { environment } from '../../../environments/environment';

/**
 * Resultado tipado de getFiltros para distinguir los tres estados:
 *  - 'sin-filtros'  → 204: el creador aún no aplicó filtros
 *  - 'sin-resultados' → 200 con []: filtros aplicados pero no hay contenido
 *  - Contenido[]    → 200 con datos: catálogo listo
 */
export type FiltrosResult = 'sin-filtros' | 'sin-resultados' | Contenido[];

@Injectable({ providedIn: 'root' })
export class SalaService {
  private readonly base        = `${environment.apiUrl}/api/salas`;
  private readonly baseFiltros = `${environment.apiUrl}/api/filtros`;

  constructor(private http: HttpClient) {}

  crear(body: CrearSalaRequest): Observable<Sala> {
    return this.http.post<Sala>(`${this.base}/crear`, body);
  }

  unirse(body: UnirseRequest): Observable<Sala> {
    return this.http.post<Sala>(`${this.base}/unirse`, body);
  }

  getById(id: number): Observable<Sala> {
    return this.http.get<Sala>(`${this.base}/${id}`);
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
    return this.http.get<Contenido[] | null>(`${this.baseFiltros}/${salaId}`).pipe(
        map((data): FiltrosResult => {
          if (data === null || data === undefined) return 'sin-filtros'; // 204
          if (data.length === 0)                   return 'sin-resultados';
          return data;
        }),
        catchError(() => of('sin-filtros' as FiltrosResult)) // error de red → tratar como sin filtros
    );
  }

  finalizar(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/finalizar`, {});
  }

  getMatches(id: number): Observable<Match[]> {
    return this.http.get<Match[]>(`${this.base}/${id}/matches`);
  }
}