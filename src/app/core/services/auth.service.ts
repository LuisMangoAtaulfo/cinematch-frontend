import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AuthResponse,
  LoginRequest,
  RegistroRequest, Rol,
  Usuario
} from '../models';
import {
  LOGIN,
  REGISTRAR,
  LOGIN_ADMIN,
  LOGOUT,
  LOGOUT_ADMIN
} from '../graphql/mutations';

const TOKEN_KEY = 'cm_token';
const USER_KEY  = 'cm_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // ── Signals ──────────────────────────────────────────
  private _token  = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private _usuario = signal<Partial<Usuario> | null>(
    JSON.parse(localStorage.getItem(USER_KEY) ?? 'null')
  );

  readonly token   = this._token.asReadonly();
  readonly usuario = this._usuario.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());
  readonly isAdmin    = computed(() => this._usuario()?.rol === 'ADMINISTRADOR');

  constructor(private apollo: Apollo, private router: Router) {}

  // ── Registro ─────────────────────────────────────────
  registrar(body: RegistroRequest): Observable<AuthResponse> {
    return this.apollo
      .mutate<{ registrar: AuthResponse }>({
        mutation: REGISTRAR,
        variables: { input: body }
      })
      .pipe(
        map(result => {
          const res = result.data!.registrar;
          this.persist(res);
          return res;
        })
      );
  }

  // ── Login ─────────────────────────────────────────────
  login(body: LoginRequest): Observable<AuthResponse> {
    return this.apollo
      .mutate<{ login: AuthResponse }>({
        mutation: LOGIN,
        variables: { input: body }
      })
      .pipe(
        map(result => {
          const res = result.data!.login;
          this.persist(res);
          return res;
        })
      );
  }

  // ── Login admin ───────────────────────────────────────
  loginAdmin(body: LoginRequest): Observable<AuthResponse> {
    return this.apollo
      .mutate<{ loginAdmin: AuthResponse }>({
        mutation: LOGIN_ADMIN,
        variables: { input: body }
      })
      .pipe(
        map(result => {
          const res = result.data!.loginAdmin;
          this.persist(res);
          return res;
        })
      );
  }

  // ── Logout ────────────────────────────────────────────
  logout(): void {
    this.apollo
      .mutate<{ logout: boolean }>({
        mutation: LOGOUT
      })
      .subscribe({
        complete: () => this.clear(),
        error: () => this.clear()
      });
  }

  // ── Logout Admin ──────────────────────────────────────
  logoutAdmin(): void {
    this.apollo
      .mutate<{ logoutAdmin: boolean }>({
        mutation: LOGOUT_ADMIN
      })
      .subscribe({
        complete: () => this.clear(),
        error: () => this.clear()
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

  setUsuario(usuario: Partial<Usuario>): void {
    this._usuario.set(usuario);
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
  }
}
