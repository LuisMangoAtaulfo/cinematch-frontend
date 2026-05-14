import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { SalaStateService }  from '../../core/services/sala-state.service';
import { MatchesService }    from '../../core/services/matches.service';
import { ChatService }       from '../../core/services/chat.service';
import { TMDbFacadeService } from '../../core/services/tmdb-facade.service';
import { Match }             from '../../core/models';

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <nav class="navbar">
        <span class="navbar__logo">CineMatch</span>
      </nav>

      <div style="flex:1; padding:24px;">
        <div style="max-width:500px; margin:0 auto;">

          <div style="text-align:center; margin-bottom:28px;">
            <p class="section-title">Resultados finales</p>
            <p class="section-sub">
              Encontraron
              <strong style="color:var(--accent);">
                {{ matches().length }} match{{ matches().length !== 1 ? 'es' : '' }}
              </strong>
              en esta sesión
            </p>
          </div>

          <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:28px;">
            @for (match of matches(); track match.id) {
              <div class="match-item">
                <img class="match-thumb"
                     [src]="tmdb.getPosterUrl(match.contenido?.imagen ?? null)"
                     [alt]="match.contenido?.titulo"
                     onerror="this.src='assets/placeholder.png'">
                <div class="match-info">
                  <p class="match-title">{{ match.contenido?.titulo }}</p>
                  <p class="match-meta">
                    {{ match.contenido?.anio }} ·
                    {{ match.contenido?.genero }} ·
                    {{ match.contenido?.tipo === 'PELICULA' ? 'Película' : 'Serie' }}
                  </p>
                  @if (state.plataformasDe(match.contenido?.contenidoId ?? '').length > 0) {
                    <div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:4px;">
                      @for (p of state.plataformasDe(match.contenido?.contenidoId ?? ''); track p) {
                        <span class="tag" style="font-size:11px;">{{ p }}</span>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            @if (matches().length === 0) {
              <div class="card" style="text-align:center; padding:40px;">
                <p style="color:var(--text-sub);">No hubo matches esta vez</p>
                <p style="font-size:13px; color:var(--text-sub); margin-top:8px;">¡Intenta de nuevo!</p>
              </div>
            }
          </div>

          <div style="display:flex; flex-direction:column; gap:10px;">
            <a routerLink="/calificacion" class="btn btn--primary btn--full">
              Calificar experiencia
            </a>
            <!--
              Usar <button> + navigate() en lugar de routerLink
              para garantizar que reset() se ejecute ANTES de navegar.
            -->
            <button class="btn btn--ghost btn--full" (click)="salir()">
              Salir sin calificar
            </button>
          </div>

        </div>
      </div>
    </div>
  `
})
export class ResultadosComponent implements OnInit {
  matches = signal<Match[]>([]);

  constructor(
      public  state:      SalaStateService,
      public  tmdb:       TMDbFacadeService,
      private matchesSvc: MatchesService,
      private chatSvc:    ChatService,
      private router:     Router
  ) {}

  ngOnInit(): void {
    const salaId = this.state.salaId();

    // 1. Cargar matches (el backend los tiene aunque el state se haya perdido)
    if (salaId) {
      this.matchesSvc.getBySala(salaId).subscribe({
        next:  (data) => this.matches.set(data),
        error: ()     => this.matches.set(this.state.matches())
      });
    } else {
      this.matches.set(this.state.matches());
    }

    // 2. Desconectar WS y resetear _finalizada.
    //    El backend ya borró los mensajes cuando se llamó PUT /finalizar,
    //    así que no hace falta un DELETE adicional desde el frontend.
    this.chatSvc.desconectar();
  }

  salir(): void {
    this.state.reset();           // limpia memoria + localStorage
    this.router.navigate(['/home']);
  }
}