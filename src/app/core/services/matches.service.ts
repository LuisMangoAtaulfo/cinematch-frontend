import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Match } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MatchesService {
  private readonly base = `${environment.apiUrl}/api/matches`;

  constructor(private http: HttpClient) {}

  getBySala(salaId: number): Observable<Match[]> {
    return this.http.get<Match[]>(`${this.base}/${salaId}`);
  }
}
