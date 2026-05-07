import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CalificacionRequest } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CalificacionService {
  private readonly base = `${environment.apiUrl}/api/calificaciones`;

  constructor(private http: HttpClient) {}

  registrar(body: CalificacionRequest): Observable<void> {
    return this.http.post<void>(this.base, body);
  }
}
