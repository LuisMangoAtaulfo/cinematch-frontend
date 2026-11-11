import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import { OBTENER_METRICAS, HISTORIAL_METRICAS } from '../graphql/queries/metricas.queries';
import { MetricasDia } from './admin.service';

export interface MetricasUsuario {
  totalSalas: number;
  salasActivas: number;
  totalMatches: number;
  promedioCalificacion: number;
  totalEvaluaciones: number;
}

@Injectable({ providedIn: 'root' })
export class MetricasUsuarioService {
  constructor(private apollo: Apollo) {}

  getMetricas(usuarioId: number): Observable<MetricasUsuario> {
    return this.apollo
      .watchQuery<{ metricasUsuario: MetricasUsuario }>({
        query: OBTENER_METRICAS,
        variables: { id: usuarioId },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((r) => r.data!.metricasUsuario as MetricasUsuario));
  }

  getHistorial(usuarioId: number): Observable<MetricasDia[]> {
    return this.apollo
      .watchQuery<{ historialMetricasUsuario: MetricasDia[] }>({
        query: HISTORIAL_METRICAS,
        variables: { id: usuarioId },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((r) => (r.data!.historialMetricasUsuario || []) as MetricasDia[]));
  }
}
