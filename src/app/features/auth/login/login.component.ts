import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-box">
        <p class="auth-title">Bienvenido</p>
        <p class="auth-sub">Inicia sesión para continuar</p>
        <div class="card">
          <div class="form">
            <div class="form-group">
              <label for="correo">Correo electrónico</label>
              <input id="correo" type="email" placeholder="correo@ejemplo.com"
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
            <button class="btn btn--primary btn--full"
                    [disabled]="cargando()"
                    (click)="onLogin()">
              {{ cargando() ? 'Ingresando...' : 'Iniciar sesión' }}
            </button>
          </div>
        </div>
        <p class="auth-footer">¿No tienes cuenta? <a routerLink="/registro">Regístrate</a></p>
        <p class="auth-footer" style="margin-top:8px">
          <a routerLink="/admin/login">Acceso administrador</a>
        </p>
      </div>
    </div>
  `
})
export class LoginComponent {
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
    this.auth.login({ correo: this.correo, password: this.password }).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (e) => {
        this.error.set(
          e.status === 401 ? 'Credenciales incorrectas' :
          e.status === 404 ? 'Usuario no encontrado' :
          'Error al iniciar sesión'
        );
        this.cargando.set(false);
      }
    });
  }
}
