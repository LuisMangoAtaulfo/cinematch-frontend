import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {
  CalificacionResponse,
  Metricas,
  Plataforma,
  PlataformaEstadoRequest
} from '../models';
import { environment } from '../../../environments/environment';
export interface MetricasDia {
  fecha:                string;
  totalSalas:           number;
  salasActivas:         number;
  totalMatches:         number;
  promedioCalificacion: number | null;
}
// Agrega esta interfaz junto a las demas

// ── Métricas ──────────────────────────────────────────
@Injectable({ providedIn: 'root' })
// El archivo queda así:
export class MetricasService {
  private readonly base = `${environment.apiUrl}/api/metricas`;
  constructor(private http: HttpClient) {}

  get(): Observable<Metricas> {
    return this.http.get<Metricas>(this.base);
  }

  // AGREGA ESTO:
  getHistorial(): Observable<MetricasDia[]> {
    return this.http.get<MetricasDia[]>(`${this.base}/historial`);
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

  getHabilitadas(): Observable<Plataforma[]> {
    return this.getAll().pipe(
        map(p => p.filter(x => x.habilitada))
    );
  }

  setEstado(id: number, habilitada: boolean): Observable<void> {
    return this.http.put<void>(`${this.base}/estado`, { id, habilitada });
  }

  // En PlataformasService
  estaEnUso(id: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.base}/${id}/en-uso`);
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
