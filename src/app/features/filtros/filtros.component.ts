import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FiltrosService } from '../../core/services/filtros.service';
import { PlataformasService } from '../../core/services/admin.service'; // ajusta el path si es otro archivo
import { SalaStateService } from '../../core/services/sala-state.service';
import { GeneroContenido, TipoContenido, Plataforma } from '../../core/models';

@Component({
  selector: 'app-filtros',
  standalone: true,
  imports: [FormsModule],
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
                <select id="plataforma" [(ngModel)]="plataforma" name="plataforma"
                        [disabled]="cargandoPlataformas()">
                  <option value="">Todas</option>
                  @for (p of plataformas(); track p.id) {
                    <option [value]="p.nombre">{{ p.nombre }}</option>
                  }
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
              <div class="form-group">
                <label for="anio">Año</label>
                <select id="anio" [(ngModel)]="anio" name="anio">
                  <option value="">Todos</option>
                  @for (a of anios; track a) {
                    <option [value]="a">{{ a }}</option>
                  }
                </select>
              </div>

              @if (error()) {
                <p class="form-error">{{ error() }}</p>
              }

              <button class="btn btn--primary btn--full" style="margin-top:4px"
                      [disabled]="cargando() || cargandoPlataformas()"
                      (click)="aplicar()">
                {{ cargando() ? 'Aplicando...' : 'Aplicar filtros' }}
              </button>

              <button class="btn btn--ghost btn--full"
                      [disabled]="cargando() || cargandoPlataformas()"
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
export class FiltrosComponent implements OnInit {
  plataforma = '';
  tipo       = '';
  genero     = '';
  anio  = '';
  cargando            = signal(false);
  cargandoPlataformas = signal(true);
  error               = signal('');
  plataformas         = signal<Plataforma[]>([]);
  readonly anios = Array.from(
      { length: new Date().getFullYear() - 1979 },
      (_, i) => new Date().getFullYear() - i
  );


  constructor(
      private filtrosSvc:    FiltrosService,
      private plataformasSvc: PlataformasService,
      public  state:         SalaStateService,
      private router:        Router
  ) {}

  ngOnInit(): void {
    this.plataformasSvc.getHabilitadas().subscribe({
      next:  (data) => { this.plataformas.set(data); this.cargandoPlataformas.set(false); },
      error: ()     => { this.cargandoPlataformas.set(false); } // falla silenciosa, el select queda solo con "Todas"
    });
  }

  aplicar(): void {
    const salaId = this.state.salaId();
    if (!salaId) { this.router.navigate(['/home']); return; }

    this.error.set('');
    this.cargando.set(true);

    this.filtrosSvc.aplicar({
      salaId,
      ...(this.tipo       ? { tipo:       this.tipo      as TipoContenido }   : {}),
      ...(this.genero     ? { genero:     this.genero    as GeneroContenido } : {}),
      ...(this.plataforma ? { plataforma: this.plataforma }                   : {}),
      ...(this.anio       ? { anio:       Number(this.anio)} : {})
    }).subscribe({
      next: (contenido) => {
        if (!contenido.length) { /* ... ya existente */ }
        const usaFiltros = !!(this.tipo || this.genero || this.plataforma);
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