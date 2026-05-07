import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EvaluacionRequest } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EvaluacionesService {
  private readonly base = `${environment.apiUrl}/api/evaluaciones`;

  constructor(private http: HttpClient) {}

  evaluar(body: EvaluacionRequest): Observable<void> {
    return this.http.post<void>(this.base, body);
  }

  comparar(salaId: number, contenidoId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.base}/comparar`, {
      params: { salaId: salaId.toString(), contenidoId }
    });
  }
}
