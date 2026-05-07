import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrearSalaRequest, Match, Sala, UnirseRequest } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SalaService {
  private readonly base = `${environment.apiUrl}/api/salas`;

  constructor(private http: HttpClient) {}

  crear(body: CrearSalaRequest): Observable<Sala> {
    return this.http.post<Sala>(`${this.base}/crear`, body);
  }

  unirse(body: UnirseRequest): Observable<Sala> {
    return this.http.post<Sala>(`${this.base}/unirse`, body);
  }

  finalizar(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/finalizar`, {});
  }

  getMatches(id: number): Observable<Match[]> {
    return this.http.get<Match[]>(`${this.base}/${id}/matches`);
  }
}
