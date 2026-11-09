import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EvaluacionRequest } from '../models';
import { EVALUAR_CONTENIDO } from '../graphql/mutations';
import { COMPARAR_EVALUACIONES } from '../graphql/queries';

@Injectable({ providedIn: 'root' })
export class EvaluacionesService {
  constructor(private apollo: Apollo) {}

  evaluar(body: EvaluacionRequest): Observable<boolean> {
    return this.apollo
      .mutate<{ evaluarContenido: boolean }>({
        mutation: EVALUAR_CONTENIDO,
        variables: { input: body }
      })
      .pipe(map(result => result.data?.evaluarContenido ?? false));
  }

  comparar(salaId: number, contenidoId: string): Observable<boolean> {
    return this.apollo
      .watchQuery<{ compararEvaluaciones: boolean }>({
        query: COMPARAR_EVALUACIONES,
        variables: { salaId, contenidoId }
      })
      .valueChanges.pipe(map(result => result.data?.compararEvaluaciones ?? false));
  }
}
