import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import {
  AuthResponse,
  LoginRequest,
  RegistroRequest, Rol,
  Usuario
} from '../models';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'cm_token';
const USER_KEY  = 'cm_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = `${environment.apiUrl}/api/auth`;

  // ── Signals ──────────────────────────────────────────
  private _token  = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private _usuario = signal<Partial<Usuario> | null>(
    JSON.parse(localStorage.getItem(USER_KEY) ?? 'null')
  );

  readonly token   = this._token.asReadonly();
  readonly usuario = this._usuario.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());
  readonly isAdmin    = computed(() => this._usuario()?.rol === 'ADMINISTRADOR');

  constructor(private http: HttpClient, private router: Router) {}

  // ── Registro ─────────────────────────────────────────
  registrar(body: RegistroRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/registrar`, body).pipe(
      tap(res => this.persist(res))
    );
  }

  // ── Login ─────────────────────────────────────────────
  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, body).pipe(
      tap(res => this.persist(res))
    );
  }
  // Login admin
  loginAdmin(body: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login/admin`, body).pipe(
        tap(res => this.persist(res))
    );
  }

  // ── Logout ────────────────────────────────────────────
  logout(): void {
    this.http.post(`${this.base}/logout`, {}).subscribe({
      complete: () => this.clear(),
      error: ()    => this.clear()
    });
  }

  // ── Logout Admin ────────────────────────────────────────────
  logoutAdmin(): void {
    this.http.post(`${this.base}/logout/admin`, {}).subscribe({
      complete: () => this.clear(),
      error: ()    => this.clear()
    });
  }

  // ── Helpers ───────────────────────────────────────────
  private persist(res: AuthResponse): void {
    const tokenParts = res.token.split('.');
    const payload = JSON.parse(atob(tokenParts[1]));

    const user: Partial<Usuario> = {
      id: payload.id,
      correo: payload.sub,
      nombre: res.nombre ?? undefined,
      rol: payload.rol as Rol
    };

    this._token.set(res.token);
    this._usuario.set(user);
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private clear(): void {
    this._token.set(null);
    this._usuario.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.router.navigate(['/login']);
  }
}
