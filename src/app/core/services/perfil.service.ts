import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PerfilUpdateRequest, Usuario } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly base = `${environment.apiUrl}/api/perfil`;

  constructor(private http: HttpClient) {
  }

  actualizar(id: number, body: PerfilUpdateRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.base}/${id}`, body);
  }

  obtener(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.base}/${id}`);
  }
}