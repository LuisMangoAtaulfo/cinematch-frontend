import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PerfilUpdateRequest, Usuario } from '../models';
import { OBTENER_PERFIL } from '../graphql/queries';
import { ACTUALIZAR_PERFIL } from '../graphql/mutations';

@Injectable({ providedIn: 'root' })
export class PerfilService {
  constructor(private apollo: Apollo) {}

  actualizar(id: number, body: PerfilUpdateRequest): Observable<Usuario> {
    return this.apollo
      .mutate<{ actualizarPerfil: Usuario }>({
        mutation: ACTUALIZAR_PERFIL,
        variables: { id, input: body }
      })
      .pipe(map(result => result.data!.actualizarPerfil as Usuario));
  }

  obtener(id: number): Observable<Usuario> {
    return this.apollo
      .watchQuery<{ obtenerPerfil: Usuario }>({
        query: OBTENER_PERFIL,
        variables: { id }
      })
      .valueChanges.pipe(map(result => result.data?.obtenerPerfil as Usuario));
  }
}
