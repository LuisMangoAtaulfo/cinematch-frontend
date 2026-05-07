import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CalificacionResponse,
  Metricas,
  Plataforma,
  PlataformaEstadoRequest
} from '../models';
import { environment } from '../../../environments/environment';

// ── Métricas ──────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class MetricasService {
  private readonly base = `${environment.apiUrl}/api/metricas`;
  constructor(private http: HttpClient) {}

  get(): Observable<Metricas> {
    return this.http.get<Metricas>(this.base);
  }
}

// ── Plataformas ───────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class PlataformasService {
  private readonly base = `${environment.apiUrl}/api/plataformas`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<Plataforma[]> {
    return this.http.get<Plataforma[]>(this.base);
  }

  actualizarEstado(body: PlataformaEstadoRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/estado`, body);
  }
}

// ── Retroalimentación ─────────────────────────────────
@Injectable({ providedIn: 'root' })
export class RetroalimentacionService {
  private readonly base = `${environment.apiUrl}/api/retroalimentacion`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<CalificacionResponse[]> {
    return this.http.get<CalificacionResponse[]>(this.base);
  }

  getPromedio(): Observable<number> {
    return this.http.get<number>(`${this.base}/promedio`);
  }
}
