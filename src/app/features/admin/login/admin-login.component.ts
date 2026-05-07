import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
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
              <label for="pass">Contraseña</label>
              <input id="pass" type="password" placeholder="Tu contraseña"
                     [(ngModel)]="password" name="password">
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
