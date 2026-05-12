import {
  Component, OnInit, OnDestroy, effect, signal,
  ElementRef, ViewChild, NgZone
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SalaStateService }    from '../../core/services/sala-state.service';
import { ChatService }         from '../../core/services/chat.service';
import { EvaluacionesService } from '../../core/services/evaluaciones.service';
import { SalaService }         from '../../core/services/sala.service';
import { AuthService }         from '../../core/services/auth.service';
import { Usuario }             from '../../core/models';

// - Swipe thresholds -
const THRESHOLD   = 0.30;   // fraction of card width needed to commit a swipe
const MAX_ROTATE  = 18;     // max card tilt in degrees
const FLY_DIST    = 1200;   // px the card travels off-screen on commit
const BADGE_START = 0.08;   // drag fraction at which badge starts appearing

@Component({
  selector: 'app-swipe',
  standalone: true,
  imports: [RouterLink],
  styles: [`
    /* -- Pause overlay -- */
    .pause-overlay {
      position: fixed; inset: 0; z-index: 200;
      background: rgba(10,10,10,0.82);
      backdrop-filter: blur(6px);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 20px; padding: 32px; text-align: center;
      animation: fadeIn .25s ease;
    }
    @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
    .pause-icon  { font-size:48px; animation:pulse 1.6s ease-in-out infinite; }
    @keyframes pulse {
      0%,100% { opacity:1; transform:scale(1); }
      50%     { opacity:.5; transform:scale(.92); }
    }
    .pause-title { font-family:var(--font-disp); font-size:20px; color:var(--text); margin:0; }
    .pause-sub   { font-size:13px; color:var(--text-sub); max-width:280px; line-height:1.6; margin:0; }
    .pause-badge {
      display:inline-flex; align-items:center; gap:7px;
      padding:6px 14px; border-radius:20px;
      border:1px solid var(--danger); color:var(--danger);
      font-size:12px; font-weight:500;
    }
    .pulse-dot {
      width:7px; height:7px; border-radius:50%;
      background:var(--danger); animation:pulse 1.6s ease-in-out infinite;
    }

    /* -- Reconnect bar -- */
    .reconnect-bar {
      background:var(--surface2); border-bottom:1px solid var(--border);
      padding:8px 24px; display:flex; align-items:center; gap:8px;
    }
    .reconnect-dot {
      width:7px; height:7px; border-radius:50%;
      background:var(--danger); animation:pulse 1.2s ease-in-out infinite;
    }

    /* -- Match banner -- */
    .match-banner {
      background:var(--accent); color:#0f0f0f;
      padding:12px 24px; text-align:center; font-weight:500; cursor:pointer;
    }

    /* -- Session bar -- */
    .session-bar {
      display:flex; gap:12px; align-items:center;
      padding:10px 0; border-bottom:1px solid var(--border); margin-bottom:20px;
    }
    .session-dot { width:8px; height:8px; border-radius:50%; }

    /* -- Card wrapper: isolates drag from page scroll -- */
    .card-wrapper {
      position: relative;
      width: 100%;
      max-width: 340px;
      margin: 0 auto;
      touch-action: none;      /* hand off ALL touch handling to pointer events */
      user-select: none;
      -webkit-user-select: none;
    }

    /* -- Swipe decision badges -- */
    .swipe-badge {
      position: absolute;
      top: 24px;
      z-index: 10;
      padding: 6px 16px;
      border-radius: 8px;
      border-width: 3px;
      border-style: solid;
      font-family: var(--font-disp);
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 0.05em;
      pointer-events: none;
      opacity: 0;
    }
    .swipe-badge--like {
      left: 20px;
      color: var(--success);
      border-color: var(--success);
      transform: rotate(-15deg);
    }
    .swipe-badge--nope {
      right: 20px;
      color: var(--danger);
      border-color: var(--danger);
      transform: rotate(15deg);
    }

    /* -- The draggable card -- */
    .swipe-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      width: 100%;
      cursor: grab;
      will-change: transform;
      box-shadow: var(--shadow);
    }
    .swipe-card:active { cursor: grabbing; }

    .swipe-card__img {
      width:100%; height:320px;
      background: linear-gradient(160deg, var(--surface2) 0%, #1e1e1e 100%);
      display:flex; align-items:flex-end; padding:20px; position:relative;
      background-size: cover;
      background-position: center;
    }
    .swipe-card__img::after {
      content:''; position:absolute; inset:0;
      background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%);
    }
    .swipe-card__title {
      font-family:var(--font-disp); font-size:22px; position:relative; z-index:1;
    }
    .swipe-card__body { padding:16px 20px 20px; display:flex; flex-direction:column; gap:10px; }
    .swipe-card__meta { display:flex; gap:8px; flex-wrap:wrap; }

    /* -- Action buttons (tap fallback) -- */
    .swipe-actions { display:flex; gap:16px; justify-content:center; margin-top:24px; }
    .swipe-btn {
      width:60px; height:60px; border-radius:50%;
      border:2px solid var(--border); background:var(--surface);
      cursor:pointer; font-size:22px;
      display:flex; align-items:center; justify-content:center;
      transition: transform var(--transition), border-color var(--transition),
                  background var(--transition), opacity var(--transition);
    }
    .swipe-btn:hover:not(:disabled) { transform:scale(1.1); }
    .swipe-btn--reject:hover:not(:disabled)  { border-color:var(--danger);  background:rgba(224,85,85,.1); }
    .swipe-btn--approve:hover:not(:disabled) { border-color:var(--success); background:rgba(85,196,122,.1); }
    /* Lit up while drag is in that direction */
    .swipe-btn--reject.active  { border-color:var(--danger);  background:rgba(224,85,85,.15); }
    .swipe-btn--approve.active { border-color:var(--success); background:rgba(85,196,122,.15); }
    .swipe-btn:disabled { opacity:.35; cursor:not-allowed; }

    /* -- Hint -- */
    .swipe-hint {
      text-align:center; font-size:12px; color:var(--text-sub);
      margin-top:14px; opacity:.7;
    }
  `],
  template: `
    <div class="page" style="position:relative;">

      <!-- Pause overlay -->
      @if (chatSvc.companeroDesconectado()) {
        <div class="pause-overlay" role="alert" aria-live="assertive">
          <span class="pause-icon">[!]</span>
          <div class="pause-badge">
            <span class="pulse-dot"></span>
            Sesion pausada
          </div>
          <p class="pause-title">{{ chatSvc.nombreCompanero() }} se desconecto</p>
          <p class="pause-sub">
            La sincronizacion esta pausada. Las evaluaciones se reanudaraan
            automaticamente cuando tu companero vuelva a conectarse.
          </p>
          <button class="btn btn--ghost btn--sm" (click)="finalizar()">
            Finalizar sesion igualmente
          </button>
        </div>
      }

      <!-- Navbar -->
      <nav class="navbar">
        <span class="navbar__logo">CineMatch</span>
        <div class="navbar__actions">
          <a routerLink="/matches" class="btn btn--ghost btn--sm">Matches</a>
          <a routerLink="/chat"    class="btn btn--ghost btn--sm">Chat</a>
          <button class="btn btn--danger btn--sm" (click)="finalizar()">Finalizar</button>
        </div>
      </nav>

      <!-- Reconnect banner -->
      @if (!chatSvc.conectado()) {
        <div class="reconnect-bar">
          <span class="reconnect-dot"></span>
          <span style="font-size:12px; color:var(--text-sub);">
            Reconectando al servidor... las evaluaciones estan pausadas.
          </span>
        </div>
      }

      <!-- Match banner -->
      @if (nuevoMatch()) {
        <div class="match-banner" (click)="nuevoMatch.set('')">
          Match! {{ nuevoMatch() }}
        </div>
      }

      <!-- Content area -->
      <div style="flex:1; padding:24px; overflow-y:auto;">
        <div style="max-width:380px; margin:0 auto;">

          <!-- Session bar -->
          <div class="session-bar">
            <div class="session-dot"
                 [style.background]="chatSvc.companeroDesconectado()
                   ? 'var(--danger)' : 'var(--success)'">
            </div>
            <span style="font-size:13px; color:var(--text-sub);">
              Sala {{ state.sala()?.codigo ?? '...' }} -
              @if (chatSvc.companeroDesconectado()) {
                <span style="color:var(--danger);">{{ chatSvc.nombreCompanero() }} desconectado</span>
              } @else {
                2 participantes
              }
            </span>
          </div>

          <!-- Empty catalog -->
          <!-- Empty catalog -->
          @if (!state.hayMas()) {
            <div style="text-align:center; padding:40px 0; color:var(--text-sub);">
              <p style="font-weight:500; margin-bottom:8px;">Has evaluado todo el catalogo!</p>

              @if (state.tieneFiltros()) {
                <p style="font-size:13px; margin-bottom:24px;">
                  No hay mas contenido con los filtros actuales.
                  Amplia los filtros para ver mas opciones.
                </p>
                <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
                  <a routerLink="/filtros" class="btn btn--primary btn--sm">Cambiar filtros</a>
                  <a routerLink="/matches" class="btn btn--ghost btn--sm">Ver matches</a>
                  <button class="btn btn--ghost btn--sm" (click)="finalizar()">Finalizar</button>
                </div>
              } @else {
                <p style="font-size:13px; margin-bottom:24px;">
                  Revisa tus matches o finaliza la sesion.
                </p>
                <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
                  <a routerLink="/matches" class="btn btn--ghost btn--sm">Ver matches</a>
                  <button class="btn btn--primary btn--sm" (click)="finalizar()">Finalizar</button>
                </div>
              }
            </div>
          }

          <!-- Swipe card -->
          @if (state.hayMas() && state.actual(); as c) {

            <div class="card-wrapper"
                 #cardWrapper
                 (pointerdown)="onPointerDown($event)"
                 (pointermove)="onPointerMove($event)"
                 (pointerup)="onPointerUp($event)"
                 (pointercancel)="onPointerCancel($event)">

              <!-- LIKE badge (shown while dragging right) -->
              <div class="swipe-badge swipe-badge--like" #badgeLike>LIKE</div>

              <!-- NOPE badge (shown while dragging left) -->
              <div class="swipe-badge swipe-badge--nope" #badgeNope>NOPALES</div>

              <div class="swipe-card" #card>
                <div class="swipe-card__img"
                     [style.background-image]="c.imagen ? 'url(' + c.imagen + ')' : 'none'">
                  <p class="swipe-card__title">{{ c.titulo }}</p>
                </div>

                <div class="swipe-card__body">
                  <div class="swipe-card__meta">
                    @if (c.anio)   { <span class="tag">{{ c.anio }}</span> }
                    @if (c.genero) { <span class="tag">{{ c.genero }}</span> }
                    @for (p of c.plataformas; track p) {
                      <span class="tag">{{ p }}</span>
                    }
                  </div>

                  @if (!c.plataformas || c.plataformas.length === 0) {
                    <span class="tag">Solo en cines</span>
                  }
                </div>
              </div>
            </div>

            <!-- Tap buttons (mirror drag visually while dragging) -->
            <div class="swipe-actions">
              <button class="swipe-btn swipe-btn--reject"
                      [class.active]="dragDir() === -1"
                      title="Rechazar"
                      [disabled]="evaluando() || chatSvc.companeroDesconectado() || !chatSvc.conectado()"
                      (click)="evaluar(false)">
                &#10007;
              </button>
              <button class="swipe-btn swipe-btn--approve"
                      [class.active]="dragDir() === 1"
                      title="Aprobar"
                      [disabled]="evaluando() || chatSvc.companeroDesconectado() || !chatSvc.conectado()"
                      (click)="evaluar(true)">
                &#10003;
              </button>
            </div>

            <p class="swipe-hint">Arrastra la tarjeta o usa los botones</p>

            @if (chatSvc.companeroDesconectado()) {
              <p style="text-align:center; font-size:12px; color:var(--danger);
                        margin-top:16px; display:flex; align-items:center;
                        justify-content:center; gap:6px;">
                Evaluaciones pausadas hasta que {{ chatSvc.nombreCompanero() }} regrese
              </p>
            }
          }

        </div>
      </div>

      <!-- Credits footer -->
      <footer style="padding:16px 24px; border-top:1px solid var(--border);
                     display:flex; flex-wrap:wrap; align-items:center; justify-content:center;
                     gap:16px; background:var(--bg);">
        <span style="display:flex; align-items:center; gap:8px; font-size:11px; color:var(--text-sub);">
          Movie data provided by
          <a href="https://www.themoviedb.org" target="_blank" rel="noopener"
             style="display:inline-flex; align-items:center; gap:4px;
                    color:var(--text-sub); text-decoration:none;">
            <img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb20f684adbe4ce1d0bf14f3bf3543b63.svg"
                 alt="TMDb" height="12"
                 style="height:12px; opacity:.6; filter:grayscale(1);">
          </a>
        </span>
        <span style="font-size:11px; color:var(--border);">|</span>
        <span style="font-size:11px; color:var(--text-sub);">
          Streaming availability by
          <a href="https://www.justwatch.com" target="_blank" rel="noopener"
             style="color:var(--text-sub); text-decoration:underline;">JustWatch</a>
        </span>
      </footer>

    </div>
  `
})
export class SwipeComponent implements OnInit, OnDestroy {

  @ViewChild('card')        cardEl!:      ElementRef<HTMLDivElement>;
  @ViewChild('cardWrapper') wrapperEl!:   ElementRef<HTMLDivElement>;
  @ViewChild('badgeLike')   badgeLikeEl!: ElementRef<HTMLDivElement>;
  @ViewChild('badgeNope')   badgeNopeEl!: ElementRef<HTMLDivElement>;

  evaluando  = signal(false);
  nuevoMatch = signal('');
  /** -1 = dragging left (nope)  |  0 = idle  |  1 = dragging right (like) */
  dragDir    = signal(0);

  private usuarioId         = 0;
  private matchesAnteriores = 0;

  // - Drag state -
  private dragging   = false;
  private startX     = 0;
  private startY     = 0;
  private currentX   = 0;
  private cardWidth  = 340;
  private rafId      = 0;
  private committed  = false;

  constructor(
      public  state:   SalaStateService,
      public  chatSvc: ChatService,
      private evalSvc: EvaluacionesService,
      private salaSvc: SalaService,
      private auth:    AuthService,
      private router:  Router,
      private ngZone:  NgZone
  ) {
    effect(() => {
      const matches = this.chatSvc.matches();
      if (matches.length > this.matchesAnteriores) {
        const ultimo = matches[matches.length - 1];
        this.nuevoMatch.set(ultimo.contenido?.titulo ?? 'Nuevo match');
        this.state.agregarMatch(ultimo);
        this.matchesAnteriores = matches.length;
      }
    });

    effect(() => {
      if (this.chatSvc.finalizada()) {
        this.router.navigate(['/resultados']);
      }
    });
  }

  ngOnInit(): void {
    const u      = this.auth.usuario() as Usuario;
    const token  = this.auth.token()!;
    const salaId = this.state.salaId()!;
    this.usuarioId = u?.id ?? 0;
    this.chatSvc.conectar(salaId, token, this.usuarioId);
    this.matchesAnteriores = this.chatSvc.matches().length;
  }

  ngOnDestroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  // -
  // Pointer event handlers
  // -

  onPointerDown(e: PointerEvent): void {
    if (this.evaluando() || this.committed) return;
    if (this.chatSvc.companeroDesconectado() || !this.chatSvc.conectado()) return;

    this.dragging = true;
    this.startX   = e.clientX;
    this.startY   = e.clientY;
    this.currentX = 0;
    this.cardWidth = this.wrapperEl?.nativeElement.offsetWidth || 340;

    // Pointer capture: keeps events flowing even when pointer leaves the element
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    // No transition while actively dragging (avoid lag)
    this.setCardTransition('none');
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.dragging) return;

    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;

    // Cancel drag if the gesture is more vertical than horizontal at its start
    // so the page can scroll normally on mobile
    if (Math.abs(dy) > Math.abs(dx) * 1.5 && Math.abs(dx) < 12) {
      this.cancelDrag();
      return;
    }

    this.currentX = dx;

    // Update dragDir signal (inside zone so template reacts)
    this.dragDir.set(dx > 0 ? 1 : -1);

    // Visual update outside zone: no need for CD on every frame
    this.ngZone.runOutsideAngular(() => {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.rafId = requestAnimationFrame(() => this.applyDragTransform(dx));
    });
  }

  onPointerUp(_e: PointerEvent): void {
    if (!this.dragging) return;
    this.dragging = false;

    const ratio = this.currentX / this.cardWidth;
    if (Math.abs(ratio) >= THRESHOLD) {
      this.commitSwipe(this.currentX > 0);
    } else {
      this.snapBack();
    }
  }

  onPointerCancel(_e: PointerEvent): void {
    this.cancelDrag();
  }

  // -
  // Drag visuals
  // -

  private applyDragTransform(dx: number): void {
    const card      = this.cardEl?.nativeElement;
    const likeBadge = this.badgeLikeEl?.nativeElement;
    const nopeBadge = this.badgeNopeEl?.nativeElement;
    if (!card) return;

    const ratio  = dx / this.cardWidth;
    const rotate = ratio * MAX_ROTATE;
    card.style.transform = `translateX(${dx}px) rotate(${rotate}deg)`;

    // Badge fades in after BADGE_START fraction
    const progress = (Math.abs(ratio) - BADGE_START) / (1 - BADGE_START);
    const opacity  = Math.max(0, Math.min(1, progress));

    if (dx > 0) {
      if (likeBadge) likeBadge.style.opacity = String(opacity);
      if (nopeBadge) nopeBadge.style.opacity = '0';
    } else {
      if (likeBadge) likeBadge.style.opacity = '0';
      if (nopeBadge) nopeBadge.style.opacity = String(opacity);
    }
  }

  private commitSwipe(approved: boolean): void {
    this.committed = true;
    const card = this.cardEl?.nativeElement;
    if (!card) { this.finishEval(approved); return; }

    const flyX   = approved ?  FLY_DIST : -FLY_DIST;
    const rotate = approved ?  MAX_ROTATE : -MAX_ROTATE;

    this.setCardTransition('transform .35s cubic-bezier(.5,1.4,.5,1), opacity .3s ease');
    card.style.transform = `translateX(${flyX}px) rotate(${rotate}deg)`;
    card.style.opacity   = '0';

    setTimeout(() => {
      this.ngZone.run(() => {
        this.resetCard();
        this.committed = false;
        this.dragDir.set(0);
        this.finishEval(approved);
      });
    }, 370);
  }

  private snapBack(): void {
    this.dragDir.set(0);
    // Spring-like easing: overshoots slightly then settles
    this.setCardTransition('transform .4s cubic-bezier(.25,1.5,.5,1)');
    const card      = this.cardEl?.nativeElement;
    const likeBadge = this.badgeLikeEl?.nativeElement;
    const nopeBadge = this.badgeNopeEl?.nativeElement;
    if (card)      card.style.transform      = 'translateX(0) rotate(0deg)';
    if (likeBadge) likeBadge.style.opacity   = '0';
    if (nopeBadge) nopeBadge.style.opacity   = '0';
  }

  private cancelDrag(): void {
    this.dragging = false;
    this.snapBack();
  }

  private setCardTransition(value: string): void {
    const card = this.cardEl?.nativeElement;
    if (card) card.style.transition = value;
  }

  private resetCard(): void {
    const card      = this.cardEl?.nativeElement;
    const likeBadge = this.badgeLikeEl?.nativeElement;
    const nopeBadge = this.badgeNopeEl?.nativeElement;
    if (card) {
      card.style.transform  = '';
      card.style.opacity    = '';
      card.style.transition = '';
    }
    if (likeBadge) likeBadge.style.opacity = '0';
    if (nopeBadge) nopeBadge.style.opacity = '0';
  }

  // -
  // Business logic
  // -

  private finishEval(approved: boolean): void {
    this.evaluar(approved);
  }

  evaluar(decision: boolean): void {
    const contenido = this.state.actual();
    const salaId    = this.state.salaId();
    if (!contenido || !salaId) return;
    if (this.chatSvc.companeroDesconectado()) return;

    this.evaluando.set(true);
    this.evalSvc.evaluar({
      salaId,
      usuarioId:   this.usuarioId,
      contenidoId: contenido.contenidoId,
      decision
    }).subscribe({
      next:  () => { this.state.avanzar(); this.evaluando.set(false); },
      error: () => { this.state.avanzar(); this.evaluando.set(false); }
    });
  }

  finalizar(): void {
    const salaId = this.state.salaId();
    if (!salaId) { this.router.navigate(['/home']); return; }
    this.salaSvc.finalizar(salaId).subscribe({
      next:  () => this.router.navigate(['/resultados']),
      error: () => this.router.navigate(['/resultados'])
    });
  }
}