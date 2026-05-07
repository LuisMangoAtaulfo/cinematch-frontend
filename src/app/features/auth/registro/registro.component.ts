import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-box">
        <p class="auth-title">Crear cuenta</p>
        <p class="auth-sub">Ingresa tus datos para comenzar</p>
        <div class="card">
          <div class="form">
            <div class="form-group">
              <label for="nombre">Nombre</label>
              <input id="nombre" type="text" placeholder="Tu nombre"
                     [(ngModel)]="nombre" name="nombre">
            </div>
            <div class="form-group">
              <label for="correo">Correo electrónico</label>
              <input id="correo" type="email" placeholder="correo@ejemplo.com"
                     [(ngModel)]="correo" name="correo">
            </div>
            <div class="form-group">
              <label for="pass">Contraseña</label>
              <input id="pass" type="password" placeholder="Mínimo 8 caracteres"
                     [(ngModel)]="password" name="password">
            </div>
            <div class="form-group">
              <label for="pass2">Confirmar contraseña</label>
              <input id="pass2" type="password" placeholder="Repite tu contraseña"
                     [(ngModel)]="confirmPassword" name="pass2">
            </div>
            @if (error()) {
              <p class="form-error">{{ error() }}</p>
            }
            <button class="btn btn--primary btn--full"
                    [disabled]="cargando()"
                    (click)="onRegistro()">
              {{ cargando() ? 'Creando cuenta...' : 'Registrarse' }}
            </button>
          </div>
        </div>
        <p class="auth-footer">¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión</a></p>
      </div>
    </div>
  `
})
export class RegistroComponent {
  nombre          = '';
  correo          = '';
  password        = '';
  confirmPassword = '';
  cargando = signal(false);
  error    = signal('');

  constructor(private auth: AuthService, private router: Router) {}

  onRegistro(): void {
    this.error.set('');
    if (!this.nombre || !this.correo || !this.password) {
      this.error.set('Completa todos los campos');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }
    if (this.password.length < 8) {
      this.error.set('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    this.cargando.set(true);
    this.auth.registrar({ nombre: this.nombre, correo: this.correo, password: this.password })
      .subscribe({
        next: () => this.router.navigate(['/home']),
        error: (e) => {
          this.error.set(
            e.status === 409 ? 'El correo ya está en uso' : 'Error al crear cuenta'
          );
          this.cargando.set(false);
        }
      });
  }
}
