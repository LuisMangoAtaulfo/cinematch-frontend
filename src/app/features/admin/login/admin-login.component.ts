import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  styles: [`
  .input-password-wrapper {
    position: relative;
  }
  .input-password-wrapper input {
    padding-right: 42px;
  }
  .eye-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-sub);
    padding: 0;
    display: flex;
    align-items: center;
    line-height: 1;
    font-size: 16px;
  }
  .eye-btn:hover { color: var(--text); }
`],
  template: `
    <div class="auth-page">
      <div class="auth-box">
        <p class="auth-title">Administrador</p>
        <p class="auth-sub">Acceso al panel de control</p>
        <div class="card">
          <div class="form">
            <div class="form-group">
              <label for="correo">Correo electrónico</label>
              <input id="correo" type="email" placeholder="admin@cinematch.com"
                     [(ngModel)]="correo" name="correo">
            </div>
            <div class="form-group">
              <label for="pass">Contrasena</label>
              <div class="input-password-wrapper">
                <input id="pass"
                       [type]="verPassword() ? 'text' : 'password'"
                       placeholder="Tu contrasena"
                       [(ngModel)]="password" name="password">
                <button type="button" class="eye-btn"
                        (click)="verPassword.set(!verPassword())"
                        [title]="verPassword() ? 'Ocultar' : 'Ver contrasena'">
                  {{ verPassword() ? 'ocultar' : 'ver' }}
                </button>
              </div>
            </div>
            @if (error()) {
              <p class="form-error">{{ error() }}</p>
            }
            <button class="btn btn--primary btn--full" style="margin-top:4px"
                    [disabled]="cargando()"
                    (click)="onLogin()">
              {{ cargando() ? 'Ingresando...' : 'Ingresar' }}
            </button>
          </div>
        </div>
        <p class="auth-footer"><a routerLink="/login">Acceso de usuario</a></p>
      </div>
    </div>
  `
})
export class AdminLoginComponent {
  correo   = '';
  password = '';
  cargando = signal(false);
  error    = signal('');

  constructor(private auth: AuthService, private router: Router) {}

  verPassword = signal(false);

  onLogin(): void {
    this.error.set('');
    if (!this.correo || !this.password) {
      this.error.set('Completa todos los campos');
      return;
    }
    this.cargando.set(true);
    this.auth.loginAdmin({ correo: this.correo, password: this.password }).subscribe({
      next: () => {
        if (this.auth.isAdmin()) {
          this.router.navigate(['/admin/metricas']);
        } else {
          this.error.set('Esta cuenta no tiene permisos de administrador');
          this.auth.logoutAdmin();
          this.cargando.set(false);
        }
      },
      error: (e) => {
        this.error.set(e.status === 401 ? 'Credenciales incorrectas' : 'Error al iniciar sesión');
        this.cargando.set(false);
      }
    });
  }
}
