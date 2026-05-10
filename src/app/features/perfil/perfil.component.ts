import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PerfilService } from '../../core/services/perfil.service';
import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../core/models';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <nav class="navbar">
        <span class="navbar__logo">CineMatch</span>
        <div class="navbar__actions">
          <a routerLink="/home" class="btn btn--ghost btn--sm">Volver</a>
        </div>
      </nav>

      <div style="flex:1; display:flex; align-items:center; justify-content:center; padding:24px;">
        <div style="width:100%; max-width:380px;">
          <p class="section-title">Mi perfil</p>
          <p class="section-sub">Actualiza tu información personal</p>
          <div class="card">
            <div class="form">
              <div class="form-group">
                <label for="nombre">Nombre</label>
                <input id="nombre" type="text" placeholder="Tu nombre"
                       [(ngModel)]="nombre" name="nombre">
              </div>
              <div class="form-group">
                <label for="desc">Descripción</label>
                <textarea id="desc" rows="3" style="resize:none;"
                          placeholder="Cuéntanos algo sobre ti"
                          [(ngModel)]="descripcion" name="descripcion"></textarea>
              </div>
              @if (mensaje()) {
                <p class="form-error" [style.color]="exito() ? 'var(--success)' : 'var(--danger)'">
                  {{ mensaje() }}
                </p>
              }
              <button class="btn btn--primary btn--full" style="margin-top:4px"
                      [disabled]="cargando()"
                      (click)="guardar()">
                {{ cargando() ? 'Guardando...' : 'Guardar cambios' }}
              </button>
              <a routerLink="/home" class="btn btn--ghost btn--full">Cancelar</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PerfilComponent implements OnInit {
  nombre      = '';
  descripcion = '';
  cargando = signal(false);
  mensaje  = signal('');
  exito    = signal(false);

  private usuarioId = 0;

  constructor(private perfilSvc: PerfilService, private auth: AuthService) {}

  ngOnInit(): void {
    const u = this.auth.usuario() as (Usuario | null);
    if (!u?.id) return;

    this.usuarioId = u.id;

    this.perfilSvc.obtener(this.usuarioId).subscribe({
      next: (datos) => {
        this.nombre      = datos.nombre ?? '';
        this.descripcion = datos.descripcion ?? '';
      },
      error: () => this.mensaje.set('Error al cargar el perfil')
    });
  }

  guardar(): void {
    this.mensaje.set('');
    if (!this.nombre.trim()) {
      this.mensaje.set('El nombre es requerido');
      this.exito.set(false);
      return;
    }
    this.cargando.set(true);
    this.perfilSvc.actualizar(this.usuarioId, {
      nombre: this.nombre,
      descripcion: this.descripcion
    }).subscribe({
      next: (datos) => {
        this.auth.setUsuario(datos);
        this.exito.set(true);
        this.mensaje.set('Perfil actualizado correctamente');
        this.cargando.set(false);
      },
      error: () => {
        this.exito.set(false);
        this.mensaje.set('Error al actualizar el perfil');
        this.cargando.set(false);
      }
    });
  }
}
