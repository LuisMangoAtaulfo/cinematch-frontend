import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contenido, CrearSalaRequest, Match, Sala, UnirseRequest } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SalaService {
  private readonly base = `${environment.apiUrl}/api/salas`;
  private readonly baseFiltros = `${environment.apiUrl}/api/filtros`;

  constructor(private http: HttpClient) {}

  crear(body: CrearSalaRequest): Observable<Sala> {
    return this.http.post<Sala>(`${this.base}/crear`, body);
  }

  unirse(body: UnirseRequest): Observable<Sala> {
    return this.http.post<Sala>(`${this.base}/unirse`, body);
  }

  /** Nuevo — consultar estado actual de la sala (para polling del creador) */
  getById(id: number): Observable<Sala> {
    return this.http.get<Sala>(`${this.base}/${id}`);
  }

  /** Nuevo — consultar si el creador ya aplicó filtros (para polling del invitado) */
  getFiltros(salaId: number): Observable<Contenido[]> {
    return this.http.get<Contenido[]>(`${this.baseFiltros}/${salaId}`);
  }

  finalizar(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/finalizar`, {});
  }

  getMatches(id: number): Observable<Match[]> {
    return this.http.get<Match[]>(`${this.base}/${id}/matches`);
  }
}