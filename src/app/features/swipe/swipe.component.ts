import { Component, signal, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { SalaStateService } from '../../core/services/sala-state.service';
import { EvaluacionesService } from '../../core/services/evaluaciones.service';
import { SalaService } from '../../core/services/sala.service';
import { AuthService } from '../../core/services/auth.service';
import { TMDbFacadeService } from '../../core/services/tmdb-facade.service';
import { Usuario } from '../../core/models';

@Component({
  selector: 'app-swipe',
  standalone: true,
  imports: [RouterLink],
  styles: [`
    .swipe-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius-lg); overflow: hidden;
      width: 100%; max-width: 340px; margin: 0 auto;
    }
    .swipe-card__img {
      width: 100%; height: 320px;
      background: linear-gradient(160deg, var(--surface2) 0%, #1e1e1e 100%);
      display: flex; align-items: flex-end; padding: 20px; position: relative;
      background-size: cover; background-position: center;
    }
    .swipe-card__img::after {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%);
    }
    .swipe-card__title {
      font-family: var(--font-disp); font-size: 22px;
      position: relative; z-index: 1; color: #fff;
    }
    .swipe-card__body { padding: 16px 20px 20px; display: flex; flex-direction: column; gap: 10px; }
    .swipe-card__meta { display: flex; gap: 8px; flex-wrap: wrap; }
    .swipe-actions { display: flex; gap: 16px; justify-content: center; margin-top: 24px; }
    .swipe-btn {
      width: 60px; height: 60px; border-radius: 50%;
      border: 2px solid var(--border); background: var(--surface);
      cursor: pointer; font-size: 22px;
      display: flex; align-items: center; justify-content: center;
      transition: transform var(--transition), border-color var(--transition), background var(--transition);
    }
    .swipe-btn:hover { transform: scale(1.1); }
    .swipe-btn--reject:hover { border-color: var(--danger); background: rgba(224,85,85,0.1); }
    .swipe-btn--approve:hover { border-color: var(--success); background: rgba(85,196,122,0.1); }
    .session-bar {
      display: flex; gap: 12px; align-items: center;
      padding: 10px 0; border-bottom: 1px solid var(--border); margin-bottom: 20px;
    }
    .session-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--success); }
  `],
  template: `
    <div class="page">
      <nav class="navbar">
        <span class="navbar__logo">CineMatch</span>
        <div class="navbar__actions">
          <a routerLink="/matches" class="btn btn--ghost btn--sm">
            Matches
            @if (state.totalMatches() > 0) {
              <span class="badge" style="margin-left:4px;">{{ state.totalMatches() }}</span>
            }
          </a>
          <a routerLink="/chat" class="btn btn--ghost btn--sm">Chat</a>
          <button class="btn btn--danger btn--sm" (click)="finalizar()">Finalizar</button>
        </div>
      </nav>

      <div style="flex:1; padding:24px;">
        <div style="max-width:380px; margin:0 auto;">

          <div class="session-bar">
            <div class="session-dot"></div>
            <span style="font-size:13px; color:var(--text-sub);">
              Sala {{ state.sala()?.codigo }} — 2 participantes
            </span>
          </div>

          @if (state.hayMas() && state.actual(); as contenido) {
            <div class="swipe-card">
              <div class="swipe-card__img"
                   [style.background-image]="contenido.imagen ? 'url(' + tmdb.getPosterUrl(contenido.imagen) + ')' : ''">
                <p class="swipe-card__title">{{ contenido.titulo }}</p>
              </div>
              <div class="swipe-card__body">
                <div class="swipe-card__meta">
                  <span class="tag">{{ contenido.anio }}</span>
                  <span class="tag">{{ contenido.genero }}</span>
                  <span class="tag">{{ contenido.tipo === 'PELICULA' ? 'Película' : 'Serie' }}</span>
                </div>
              </div>
            </div>

            <div class="swipe-actions">
              <button class="swipe-btn swipe-btn--reject"
                      [disabled]="evaluando()"
                      (click)="evaluar(false)" title="Rechazar">✕</button>
              <button class="swipe-btn swipe-btn--approve"
                      [disabled]="evaluando()"
                      (click)="evaluar(true)" title="Aprobar">✓</button>
            </div>
          } @else {
            <div style="text-align:center; padding:40px 0;">
              <p class="section-title">¡Eso es todo!</p>
              <p class="section-sub">Ya evaluaron todo el catálogo</p>
              <button class="btn btn--primary" style="margin-top:16px" (click)="finalizar()">
                Ver resultados
              </button>
            </div>
          }

        </div>
      </div>
    </div>
  `
})
export class SwipeComponent implements OnInit {
  evaluando = signal(false);
  private usuarioId = 0;

  constructor(
    public state: SalaStateService,
    public tmdb: TMDbFacadeService,
    private evalSvc: EvaluacionesService,
    private salaSvc: SalaService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const u = this.auth.usuario() as Usuario;
    this.usuarioId = u?.id ?? 0;
  }

  evaluar(decision: boolean): void {
    const contenido = this.state.actual();
    const salaId    = this.state.salaId();
    if (!contenido || !salaId) return;

    this.evaluando.set(true);
    this.evalSvc.evaluar({
      salaId,
      usuarioId: this.usuarioId,
      contenidoId: contenido.contenidoId,
      decision
    }).subscribe({
      next: () => {
        this.state.avanzar();
        this.evaluando.set(false);
      },
      error: () => {
        this.state.avanzar();   // avanzar aunque falle
        this.evaluando.set(false);
      }
    });
  }

  finalizar(): void {
    const salaId = this.state.salaId();
    if (!salaId) { this.router.navigate(['/home']); return; }

    this.salaSvc.finalizar(salaId).subscribe({
      next: () => this.router.navigate(['/resultados']),
      error: () => this.router.navigate(['/resultados'])
    });
  }
}
