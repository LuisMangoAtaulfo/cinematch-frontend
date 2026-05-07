import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contenido, FiltrosRequest } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FiltrosService {
  private readonly base = `${environment.apiUrl}/api/filtros`;

  constructor(private http: HttpClient) {}

  aplicar(body: FiltrosRequest): Observable<Contenido[]> {
    return this.http.post<Contenido[]>(this.base, body);
  }
}
