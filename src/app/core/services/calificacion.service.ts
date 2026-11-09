import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CalificacionRequest } from '../models';
import { REGISTRAR_CALIFICACION } from '../graphql/mutations';

@Injectable({ providedIn: 'root' })
export class CalificacionService {
  constructor(private apollo: Apollo) {}

  registrar(body: CalificacionRequest): Observable<boolean> {
    return this.apollo
      .mutate<{ registrarCalificacion: boolean }>({
        mutation: REGISTRAR_CALIFICACION,
        variables: { input: body }
      })
      .pipe(map(result => result.data!.registrarCalificacion));
  }
}
