import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ChatService } from '../../../core/services/chat.service';

@Component({
  selector: 'app-login',
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

  constructor(private auth: AuthService, private router: Router, private chatSvc: ChatService) {}

  verPassword = signal(false);
  onLogin(): void {
    this.error.set('');
    if (!this.correo || !this.password) {
      this.error.set('Completa todos los campos');
      return;
    }
    this.cargando.set(true);
    this.auth.login({ correo: this.correo, password: this.password }).subscribe({
      next: () => {
        this.chatSvc.desconectar(); // Desconectar ChatService al hacer login
        this.router.navigate(['/home']);
      },
      error: (e) => {
        let mensaje = 'Error al iniciar sesión';
        if (e.graphQLErrors && e.graphQLErrors.length > 0) {
          mensaje = e.graphQLErrors[0].message;
        } else if (e.status === 401) {
          mensaje = 'Credenciales incorrectas';
        } else if (e.status === 404) {
          mensaje = 'Usuario no encontrado';
        }
        this.error.set(mensaje);
        this.cargando.set(false);
      }
    });
  }
}
