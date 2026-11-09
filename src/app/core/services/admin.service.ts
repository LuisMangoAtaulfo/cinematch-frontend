import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import {map, Observable} from 'rxjs';
import {
  CalificacionResponse,
  Metricas,
  Plataforma,
  PlataformaEstadoRequest
} from '../models';
import {
  OBTENER_METRICAS,
  HISTORIAL_METRICAS,
  LISTAR_PLATAFORMAS,
  PLATAFORMA_EN_USO
} from '../graphql/queries';
import { CAMBIAR_ESTADO_PLATAFORMA } from '../graphql/mutations';
import {
  OBTENER_RETROALIMENTACION,
  PROMEDIO_CALIFICACION
} from '../graphql/queries';

export interface MetricasDia {
  fecha:                string;
  totalSalas:           number;
  salasActivas:         number;
  totalMatches:         number;
  promedioCalificacion: number | null;
}

// ── Métricas ──────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class MetricasService {
  constructor(private apollo: Apollo) {}

  get(): Observable<Metricas> {
    return this.apollo.watchQuery<{ metricas: Metricas }>({
      query: OBTENER_METRICAS,
      fetchPolicy: 'network-only'
    }).valueChanges.pipe(
      map(result => result.data?.metricas as Metricas)
    );
  }

  getHistorial(): Observable<MetricasDia[]> {
    return this.apollo.watchQuery<{ historialMetricas: MetricasDia[] }>({
      query: HISTORIAL_METRICAS,
      fetchPolicy: 'network-only'
    }).valueChanges.pipe(
      map(result => result.data?.historialMetricas as MetricasDia[])
    );
  }
}

// ── Plataformas ───────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class PlataformasService {
  constructor(private apollo: Apollo) {}

  getAll(): Observable<Plataforma[]> {
    return this.apollo.watchQuery<{ plataformas: Plataforma[] }>({
      query: LISTAR_PLATAFORMAS,
      fetchPolicy: 'network-only'
    }).valueChanges.pipe(
      map(result => result.data?.plataformas as Plataforma[])
    );
  }

  actualizarEstado(body: PlataformaEstadoRequest): Observable<void> {
    return this.apollo.mutate<{ cambiarEstadoPlataforma: boolean }>({
      mutation: CAMBIAR_ESTADO_PLATAFORMA,
      variables: { input: { id: body.id, habilitada: body.habilitada } }
    }).pipe(
      map(() => undefined)
    );
  }

  getHabilitadas(): Observable<Plataforma[]> {
    return this.getAll().pipe(
        map(p => p.filter(x => x.habilitada))
    );
  }

  setEstado(id: number, habilitada: boolean): Observable<void> {
    return this.apollo.mutate<{ cambiarEstadoPlataforma: boolean }>({
      mutation: CAMBIAR_ESTADO_PLATAFORMA,
      variables: { input: { id, habilitada } }
    }).pipe(
      map(() => undefined)
    );
  }

  // En PlataformasService
  estaEnUso(id: number): Observable<boolean> {
    return this.apollo.watchQuery<{ plataformaEnUso: boolean }>({
      query: PLATAFORMA_EN_USO,
      variables: { id },
      fetchPolicy: 'network-only'
    }).valueChanges.pipe(
      map(result => result.data?.plataformaEnUso ?? false)
    );
  }
}

// ── Retroalimentación ─────────────────────────────────
@Injectable({ providedIn: 'root' })
export class RetroalimentacionService {
  constructor(private apollo: Apollo) {}

  getAll(): Observable<CalificacionResponse[]> {
    return this.apollo.watchQuery<{ retroalimentacion: CalificacionResponse[] }>({
      query: OBTENER_RETROALIMENTACION,
      fetchPolicy: 'network-only'
    }).valueChanges.pipe(
      map(result => result.data?.retroalimentacion as CalificacionResponse[])
    );
  }

  getPromedio(): Observable<number> {
    return this.apollo.watchQuery<{ promedioCalificacion: number }>({
      query: PROMEDIO_CALIFICACION,
      fetchPolicy: 'network-only'
    }).valueChanges.pipe(
      map(result => result.data?.promedioCalificacion ?? 0)
    );
  }
}
