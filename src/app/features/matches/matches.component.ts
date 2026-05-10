import { Component, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatchesService } from '../../core/services/matches.service';
import { SalaStateService } from '../../core/services/sala-state.service';
import { TMDbFacadeService } from '../../core/services/tmdb-facade.service';
import { Match } from '../../core/models';

@Component({
  selector: 'app-matches',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <nav class="navbar">
        <span class="navbar__logo">CineMatch</span>
        <div class="navbar__actions">
          <a routerLink="/swipe" class="btn btn--ghost btn--sm">Volver</a>
          <a routerLink="/chat"  class="btn btn--ghost btn--sm">Chat</a>
        </div>
      </nav>

      <div style="flex:1; padding:24px;">
        <div style="max-width:500px; margin:0 auto;">
          <p class="section-title">Matches</p>
          <p class="section-sub">Contenido que ambos aprobaron</p>

          @if (cargando()) {
            <p style="color:var(--text-sub); text-align:center; padding:40px 0;">Cargando...</p>
          } @else if (matches().length === 0) {
            <div class="card" style="text-align:center; padding:40px;">
              <p style="color:var(--text-sub);">Aún no tienen matches</p>
              <p style="font-size:13px; color:var(--text-sub); margin-top:8px;">
                ¡Sigan evaluando para encontrar algo que les guste a los dos!
              </p>
            </div>
          } @else {
            <div style="display:flex; flex-direction:column; gap:10px;">
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
                      {{ match.contenido?.tipo === 'PELICULA' ? 'Película' : 'Serie' }} ·
                    </p>
                    @if (state.plataformasDe(match.contenido?.contenidoId ?? '').length > 0) {
                      <div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:4px;">
                        @for (p of state.plataformasDe(match.contenido?.contenidoId ?? ''); track p) {
                          <span class="tag" style="font-size:11px;">{{ p }}</span>
                        }
                      </div>
                    }
                  </div>
                  <span class="badge">Match</span>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class MatchesComponent implements OnInit {
  matches  = signal<Match[]>([]);
  cargando = signal(true);

  constructor(
    private matchesSvc: MatchesService,
    public state: SalaStateService,
    public tmdb: TMDbFacadeService
  ) {}

  ngOnInit(): void {
    const salaId = this.state.salaId();
    if (!salaId) { this.cargando.set(false); return; }

    this.matchesSvc.getBySala(salaId).subscribe({
      next: (data) => {
        this.matches.set(data);
        this.state.setMatches(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }
}
