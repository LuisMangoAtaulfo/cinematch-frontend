import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { FiltrosService } from '../../core/services/filtros.service';
import { SalaStateService } from '../../core/services/sala-state.service';
import { GeneroContenido, TipoContenido } from '../../core/models';

@Component({
  selector: 'app-filtros',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <nav class="navbar">
        <span class="navbar__logo">CineMatch</span>
        <div class="navbar__actions">
          <span class="tag">Sala {{ state.sala()?.codigo }}</span>
        </div>
      </nav>

      <div style="flex:1; display:flex; align-items:center; justify-content:center; padding:24px;">
        <div style="width:100%; max-width:380px;">
          <p class="section-title">Filtros</p>
          <p class="section-sub">Personaliza el catálogo de la sesión</p>
          <div class="card">
            <div class="form">

              <div class="form-group">
                <label for="plataforma">Plataforma</label>
                <select id="plataforma" [(ngModel)]="plataforma" name="plataforma">
                  <option value="">Todas</option>
                  <option>Netflix</option>
                  <option>Disney+</option>
                  <option>HBO Max</option>
                  <option>Prime Video</option>
                  <option>Apple TV+</option>
                </select>
              </div>

              <div class="form-group">
                <label for="tipo">Tipo</label>
                <select id="tipo" [(ngModel)]="tipo" name="tipo">
                  <option value="">Todos</option>
                  <option value="PELICULA">Película</option>
                  <option value="SERIE">Serie</option>
                </select>
              </div>

              <div class="form-group">
                <label for="genero">Género</label>
                <select id="genero" [(ngModel)]="genero" name="genero">
                  <option value="">Todos</option>
                  <option value="ACCION">Acción</option>
                  <option value="COMEDIA">Comedia</option>
                  <option value="DRAMA">Drama</option>
                  <option value="HORROR">Terror</option>
                  <option value="CIENCIA_FICCION">Ciencia ficción</option>
                  <option value="ANIMACION">Animación</option>
                  <option value="DOCUMENTAL">Documental</option>
                  <option value="THRILLER">Thriller</option>
                  <option value="ROMANCE">Romance</option>
                  <option value="FANTASIA">Fantasía</option>
                </select>
              </div>

              @if (error()) {
                <p class="form-error">{{ error() }}</p>
              }

              <button class="btn btn--primary btn--full" style="margin-top:4px"
                      [disabled]="cargando()"
                      (click)="aplicar()">
                {{ cargando() ? 'Aplicando...' : 'Aplicar filtros' }}
              </button>

              <button class="btn btn--ghost btn--full"
                      [disabled]="cargando()"
                      (click)="omitir()">
                {{ cargando() ? 'Cargando...' : 'Omitir filtros' }}
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class FiltrosComponent {
  plataforma = '';
  tipo       = '';
  genero     = '';
  cargando   = signal(false);
  error      = signal('');

  constructor(
    private filtrosSvc: FiltrosService,
    public state: SalaStateService,
    private router: Router
  ) {}

  aplicar(): void {
    const salaId = this.state.salaId();
    if (!salaId) { this.router.navigate(['/home']); return; }

    this.error.set('');
    this.cargando.set(true);

    this.filtrosSvc.aplicar({
      salaId,
      ...(this.tipo       ? { tipo:      this.tipo      as TipoContenido }   : {}),
      ...(this.genero     ? { genero:    this.genero    as GeneroContenido } : {}),
      ...(this.plataforma ? { plataforma: this.plataforma }                  : {})
    }).subscribe({
      next: (contenido) => {
        if (!contenido.length) {
          // ← catálogo vacío: avisar al usuario en lugar de navegar
          this.error.set('No encontramos contenido con esos filtros. Intenta con otros.');
          this.cargando.set(false);
          return;
        }
        this.state.setContenido(contenido);
        this.router.navigate(['/swipe']);
      },
      error: () => {
        this.error.set('No se pudieron cargar los filtros');
        this.cargando.set(false);
      }
    });
  }

  omitir(): void {
    const salaId = this.state.salaId();
    if (!salaId) { this.router.navigate(['/home']); return; }

    this.error.set('');
    this.cargando.set(true);

    this.filtrosSvc.aplicar({ salaId }).subscribe({
      next: (contenido) => {
        if (!contenido.length) {
          this.error.set('El catálogo está vacío. Contacta al administrador.');
          this.cargando.set(false);
          return;
        }
        this.state.setContenido(contenido);
        this.router.navigate(['/swipe']);
      },
      error: () => {
        this.error.set('No se pudo cargar el catálogo');
        this.cargando.set(false);
      }
    });
  }
}
