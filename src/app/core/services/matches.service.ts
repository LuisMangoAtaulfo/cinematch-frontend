import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Match } from '../models';
import { BUSCAR_MATCHES } from '../graphql/queries';

@Injectable({ providedIn: 'root' })
export class MatchesService {
  constructor(private apollo: Apollo) {}

  getBySala(salaId: number): Observable<Match[]> {
    return this.apollo
      .watchQuery<{ buscarMatches: Match[] }>({
        query: BUSCAR_MATCHES,
        variables: { salaId }
      })
      .valueChanges.pipe(map(result => result.data?.buscarMatches as Match[] ?? []));
  }
}
