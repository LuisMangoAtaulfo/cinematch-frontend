import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Contenido, FiltrosRequest } from '../models';
import { APLICAR_FILTROS } from '../graphql/mutations';

@Injectable({ providedIn: 'root' })
export class FiltrosService {
  constructor(private apollo: Apollo) {}

  aplicar(body: FiltrosRequest): Observable<Contenido[]> {
    return this.apollo
      .mutate<{ aplicarFiltros: Contenido[] }>({
        mutation: APLICAR_FILTROS,
        variables: { input: body }
      })
      .pipe(map(result => result.data!.aplicarFiltros));
  }
}
