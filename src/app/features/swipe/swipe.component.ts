import {
  Component, OnInit, OnDestroy, effect, signal,
  ElementRef, ViewChild, NgZone
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { interval, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { SalaStateService }    from '../../core/services/sala-state.service';
import { ChatService }         from '../../core/services/chat.service';
import { EvaluacionesService } from '../../core/services/evaluaciones.service';
import { SalaService }         from '../../core/services/sala.service';
import { AuthService }         from '../../core/services/auth.service';
import { Usuario }             from '../../core/models';
import {InactividadService} from "../../core/services/inactividad.service";

const THRESHOLD        = 0.30;
const MAX_ROTATE       = 18;
const FLY_DIST         = 1200;
const BADGE_START      = 0.08;
const POLL_INTERVAL_MS = 4000;

@Component({
  selector: 'app-swipe',
  standalone: true,
  imports: [RouterLink],
  styles: [`
    .pause-overlay {
      position: fixed; inset: 0; z-index: 200;
      background: rgba(10,10,10,0.82); backdrop-filter: blur(6px);
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 20px; padding: 32px; text-align: center;
      animation: fadeIn .25s ease;
    }
    @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
    .pause-icon { font-size:48px; animation:pulse 1.6s ease-in-out infinite; }
    @keyframes pulse {
      0%,100% { opacity:1; transform:scale(1); }
      50%     { opacity:.5; transform:scale(.92); }
    }
    .pause-title { font-family:var(--font-disp); font-size:20px; color:var(--text); margin:0; }
    .pause-sub   { font-size:13px; color:var(--text-sub); max-width:280px; line-height:1.6; margin:0; }
    .pause-badge {
      display:inline-flex; align-items:center; gap:7px; padding:6px 14px;
      border-radius:20px; border:1px solid var(--danger); color:var(--danger);
      font-size:12px; font-weight:500;
    }
    .pulse-dot {
      width:7px; height:7px; border-radius:50%;
      background:var(--danger); animation:pulse 1.6s ease-in-out infinite;
    }
    .reconnect-bar {
      background:var(--surface2); border-bottom:1px solid var(--border);
      padding:8px 24px; display:flex; align-items:center; gap:8px;
    }
    .reconnect-dot {
      width:7px; height:7px; border-radius:50%;
      background:var(--danger); animation:pulse 1.2s ease-in-out infinite;
    }
    .match-banner {
      background:var(--accent); color:#0f0f0f;
      padding:12px 24px; text-align:center; font-weight:500; cursor:pointer;
    }
    .session-bar {
      display:flex; gap:12px; align-items:center;
      padding:10px 0; border-bottom:1px solid var(--border); margin-bottom:20px;
    }
    .session-dot { width:8px; height:8px; border-radius:50%; }
    .card-wrapper {
      position: relative; width: 100%; max-width: 340px; margin: 0 auto;
      touch-action: none; user-select: none; -webkit-user-select: none;
    }
    .swipe-badge {
      position: absolute; top: 24px; z-index: 10;
      padding: 6px 16px; border-radius: 8px; border-width: 3px; border-style: solid;
      font-family: var(--font-disp); font-size: 26px; font-weight: 700;
      letter-spacing: 0.05em; pointer-events: none; opacity: 0;
    }
    .swipe-badge--like { left:20px;  color:var(--success); border-color:var(--success); transform:rotate(-15deg); }
    .swipe-badge--nope { right:20px; color:var(--danger);  border-color:var(--danger);  transform:rotate(15deg); }
    .swipe-card {
      background:var(--surface); border:1px solid var(--border);
      border-radius:var(--radius-lg); overflow:hidden; width:100%;
      cursor:grab; will-change:transform; box-shadow:var(--shadow);
    }
    .swipe-card:active { cursor:grabbing; }
    .swipe-card__img {
      width:100%; height:320px;
      background:linear-gradient(160deg, var(--surface2) 0%, #1e1e1e 100%);
      display:flex; align-items:flex-end; padding:20px; position:relative;
      background-size:cover; background-position:center;
    }
    .swipe-card__img::after {
      content:''; position:absolute; inset:0;
      background:linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%);
    }
    .swipe-card__title { font-family:var(--font-disp); font-size:22px; position:relative; z-index:1; }
    .swipe-card__body  { padding:16px 20px 20px; display:flex; flex-direction:column; gap:10px; }
    .swipe-card__meta  { display:flex; gap:8px; flex-wrap:wrap; }
    .swipe-actions { display:flex; gap:16px; justify-content:center; margin-top:24px; }
    .swipe-btn {
      width:60px; height:60px; border-radius:50%;
      border:2px solid var(--border); background:var(--surface);
      cursor:pointer; font-size:22px; display:flex; align-items:center; justify-content:center;
      transition:transform var(--transition), border-color var(--transition),
                 background var(--transition), opacity var(--transition);
    }
    .swipe-btn:hover:not(:disabled) { transform:scale(1.1); }
    .swipe-btn--reject:hover:not(:disabled)  { border-color:var(--danger);  background:rgba(224,85,85,.1); }
    .swipe-btn--approve:hover:not(:disabled) { border-color:var(--success); background:rgba(85,196,122,.1); }
    .swipe-btn--reject.active  { border-color:var(--danger);  background:rgba(224,85,85,.15); }
    .swipe-btn--approve.active { border-color:var(--success); background:rgba(85,196,122,.15); }
    .swipe-btn:disabled { opacity:.35; cursor:not-allowed; }
    .swipe-hint { text-align:center; font-size:12px; color:var(--text-sub); margin-top:14px; opacity:.7; }

    .skeleton {
      background:linear-gradient(90deg, var(--surface2) 25%, var(--border) 50%, var(--surface2) 75%);
      background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:var(--radius);
    }
    @keyframes shimmer { to { background-position:-200% 0; } }

    .waiting-card {
      background:var(--surface); border:1px solid var(--border);
      border-radius:var(--radius-lg); padding:32px 24px;
      display:flex; flex-direction:column; align-items:center; gap:16px; text-align:center;
    }
    .waiting-dots { display:flex; gap:8px; }
    .waiting-dot  {
      width:10px; height:10px; border-radius:50%; background:var(--accent);
      animation:dot-pulse 1.4s ease-in-out infinite;
    }
    .waiting-dot:nth-child(2) { animation-delay:.2s; }
    .waiting-dot:nth-child(3) { animation-delay:.4s; }
    @keyframes dot-pulse {
      0%,80%,100% { opacity:.25; transform:scale(.8); }
      40%         { opacity:1;   transform:scale(1); }
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
      @if (avisoCierre()) {
        <div style="background:var(--surface2); border-bottom:1px solid var(--danger);
              padding:12px 24px; display:flex; align-items:center;
              justify-content:space-between; gap:12px;">
          <div style="display:flex; align-items:center; gap:10px;">
      <span style="width:8px; height:8px; border-radius:50%;
                   background:var(--danger); display:inline-block;
                   animation: pulse 1s ease-in-out infinite;"></span>
            <span style="font-size:13px; color:var(--text);">
        La sesión se cerrará por inactividad en
        <strong style="color:var(--danger);">{{ cuentaAtras() }}s</strong>
      </span>
          </div>
          <button class="btn btn--ghost btn--sm" style="border-color:var(--danger); color:var(--danger);"
                  (click)="descartarAviso()">
            Seguir aquí
          </button>
        </div>
      }

      <!-- Content area -->
      <div style="flex:1; padding:24px; overflow-y:auto;">
        <div style="max-width:380px; margin:0 auto;">

          <!-- Session bar -->
          <div class="session-bar">
            <div class="session-dot"
                 [style.background]="chatSvc.companeroDesconectado()
                   ? 'var(--danger)' : 'var(--success)'"></div>
            <span style="font-size:13px; color:var(--text-sub);">
              Sala {{ state.sala()?.codigo ?? '...' }} -
              @if (chatSvc.companeroDesconectado()) {
                <span style="color:var(--danger);">{{ chatSvc.nombreCompanero() }} desconectado</span>
              } @else {
                2 participantes
              }
            </span>
          </div>

          <!-- ── Recuperando catálogo (skeleton) ── -->
          @if (recuperando()) {
            <div style="display:flex; flex-direction:column; gap:16px; align-items:center; padding:20px 0;">
              <div style="width:100%; max-width:340px;">
                <div class="skeleton" style="width:100%; height:320px; border-radius:var(--radius-lg) var(--radius-lg) 0 0;"></div>
                <div style="background:var(--surface); border:1px solid var(--border); border-top:none;
                            border-radius:0 0 var(--radius-lg) var(--radius-lg); padding:16px 20px 20px;
                            display:flex; flex-direction:column; gap:10px;">
                  <div class="skeleton" style="height:14px; width:60%; border-radius:4px;"></div>
                  <div class="skeleton" style="height:14px; width:40%; border-radius:4px;"></div>
                </div>
              </div>
              <p style="font-size:13px; color:var(--text-sub);">Cargando catalogo...</p>
            </div>
          }

          <!-- ── 204: creador aún no aplicó filtros ── -->
          @if (estadoCatalogo() === 'sin-filtros') {
            <div class="waiting-card">
              <div class="waiting-dots">
                <span class="waiting-dot"></span>
                <span class="waiting-dot"></span>
                <span class="waiting-dot"></span>
              </div>
              <p style="font-weight:500;">Esperando al creador de la sala...</p>
              <p style="font-size:13px; color:var(--text-sub); max-width:280px; line-height:1.6;">
                Tu compañero aún no ha aplicado los filtros.
                El catálogo cargará automáticamente cuando lo haga.
              </p>
              <button class="btn btn--ghost btn--sm" (click)="finalizar()">
                Cancelar y salir
              </button>
            </div>
          }

          <!-- ── 200 + []: filtros sin resultados ── -->
          @if (estadoCatalogo() === 'sin-resultados') {
            <div class="waiting-card">

              @if (state.esCreador()) {
                <!-- Creador: fue él quien aplicó los filtros sin resultados -->
                <p style="font-weight:500;">Sin resultados para estos filtros</p>
                <p style="font-size:13px; color:var(--text-sub); max-width:280px; line-height:1.6;">
                  La combinacion de filtros que elegiste no encontro contenido disponible.
                  Prueba con otra combinacion.
                </p>
                <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
                  <a routerLink="/filtros" class="btn btn--primary btn--sm">Cambiar filtros</a>
                  <button class="btn btn--ghost btn--sm" (click)="finalizar()">Finalizar sesion</button>
                </div>
              }

              @if (!state.esCreador()) {
                <!-- Invitado: espera que el creador cambie los filtros -->
                <div class="waiting-dots">
                  <span class="waiting-dot"></span>
                  <span class="waiting-dot"></span>
                  <span class="waiting-dot"></span>
                </div>
                <p style="font-weight:500;">Sin resultados para los filtros actuales</p>
                <p style="font-size:13px; color:var(--text-sub); max-width:280px; line-height:1.6;">
                  Los filtros aplicados no encontraron contenido disponible.
                  Esperando a que tu companero elija otra combinacion.
                </p>
                <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
                  <a routerLink="/matches" class="btn btn--ghost btn--sm">Ver matches</a>
                  <button class="btn btn--ghost btn--sm" (click)="finalizar()">Finalizar sesion</button>
                </div>
              }

            </div>
          }

          <!-- ── Error de red ── -->
          @if (estadoCatalogo() === 'error-red') {
            <div style="text-align:center; padding:40px 0;">
              <p style="color:var(--danger); font-weight:500; margin-bottom:8px;">
                No se pudo conectar con el servidor
              </p>
              <p style="font-size:13px; color:var(--text-sub); margin-bottom:24px;">
                Verifica tu conexion e intenta de nuevo.
              </p>
              <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
                <button class="btn btn--primary btn--sm" (click)="recuperarCatalogo()">Reintentar</button>
                <button class="btn btn--ghost btn--sm"   (click)="finalizar()">Finalizar sesion</button>
              </div>
            </div>
          }

          <!-- ── Catálogo agotado ── -->
          @if (!recuperando() && estadoCatalogo() === 'ok' && !state.hayMas()) {

            @if (state.esCreador()) {
              <div style="text-align:center; padding:40px 0; color:var(--text-sub);">
                <p style="font-weight:500; margin-bottom:8px;">Has evaluado todo el catalogo!</p>
                <p style="font-size:13px; margin-bottom:24px;">
                  Cambia los filtros para seguir descubriendo contenido juntos, o finaliza la sesion.
                </p>
                <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
                  <a routerLink="/filtros" class="btn btn--primary btn--sm">Cambiar filtros</a>
                  <a routerLink="/matches" class="btn btn--ghost btn--sm">Ver matches</a>
                  <button class="btn btn--ghost btn--sm" (click)="finalizar()">Finalizar</button>
                </div>
              </div>
            }

            @if (!state.esCreador()) {
              <div class="waiting-card">
                @if (!esperandoFiltros()) {
                  <p style="font-weight:500; font-size:16px;">Has evaluado todo el catalogo!</p>
                  <p style="font-size:13px; color:var(--text-sub); max-width:280px; line-height:1.6;">
                    Tu compañero puede cambiar los filtros para seguir.
                    ¿Quieres esperar a que lo haga?
                  </p>
                  <div style="display:flex; gap:12px; flex-wrap:wrap; justify-content:center;">
                    <button class="btn btn--primary btn--sm" (click)="iniciarEsperaFiltros()">
                      Esperar filtros nuevos
                    </button>
                    <a routerLink="/matches" class="btn btn--ghost btn--sm">Ver matches</a>
                    <button class="btn btn--ghost btn--sm" (click)="finalizar()">Finalizar</button>
                  </div>
                }
                @if (esperandoFiltros()) {
                  <div class="waiting-dots">
                    <span class="waiting-dot"></span>
                    <span class="waiting-dot"></span>
                    <span class="waiting-dot"></span>
                  </div>
                  <p style="font-weight:500;">Esperando filtros nuevos...</p>
                  <p style="font-size:13px; color:var(--text-sub); max-width:280px; line-height:1.6;">
                    Cuando tu compañero aplique nuevos filtros,
                    el catalogo se actualizara automaticamente.
                  </p>
                  <div style="display:flex; gap:12px; flex-wrap:wrap; justify-content:center;">
                    <a routerLink="/matches" class="btn btn--ghost btn--sm"
                       (click)="detenerEsperaFiltros()">
                      Ver matches
                    </a>
                    <button class="btn btn--ghost btn--sm" (click)="finalizar()">Finalizar</button>
                  </div>
                }
              </div>
            }
          }

          <!-- ── Swipe normal ── -->
          @if (!recuperando() && estadoCatalogo() === 'ok' && state.hayMas() && state.actual(); as c) {

            <div class="card-wrapper"
                 #cardWrapper
                 (pointerdown)="onPointerDown($event)"
                 (pointermove)="onPointerMove($event)"
                 (pointerup)="onPointerUp($event)"
                 (pointercancel)="onPointerCancel($event)">

              <div class="swipe-badge swipe-badge--like" #badgeLike>LIKE</div>
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

            <div class="swipe-actions">
              <button class="swipe-btn swipe-btn--reject"
                      [class.active]="dragDir() === -1"
                      title="Rechazar"
                      [disabled]="evaluando() || chatSvc.companeroDesconectado() || !chatSvc.conectado()"
                      (click)="evaluar(false)">&#10007;</button>
              <button class="swipe-btn swipe-btn--approve"
                      [class.active]="dragDir() === 1"
                      title="Aprobar"
                      [disabled]="evaluando() || chatSvc.companeroDesconectado() || !chatSvc.conectado()"
                      (click)="evaluar(true)">&#10003;</button>
            </div>

            <p class="swipe-hint">Arrastra la tarjeta o usa los botones</p>

            @if (chatSvc.companeroDesconectado()) {
              <p style="text-align:center; font-size:12px; color:var(--danger); margin-top:16px;
                        display:flex; align-items:center; justify-content:center; gap:6px;">
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
             style="display:inline-flex; align-items:center; gap:4px; color:var(--text-sub); text-decoration:none;">
            <img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb20f684adbe4ce1d0bf14f3bf3543b63.svg"
                 alt="TMDb" height="12" style="height:12px; opacity:.6; filter:grayscale(1);">
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

  evaluando        = signal(false);
  nuevoMatch       = signal('');
  recuperando      = signal(false);
  esperandoFiltros = signal(false);
  dragDir          = signal(0);
  avisoCierre  = signal(false);
  cuentaAtras  = signal(30);

  /**
   * Estado del catálogo:
   *  'idle'          → inicial, aún no se consultó
   *  'sin-filtros'   → 204: el creador no aplicó filtros (polling activo)
   *  'sin-resultados'→ 200 + []: filtros sin resultados
   *  'error-red'     → error HTTP
   *  'ok'            → catálogo cargado
   */
  estadoCatalogo = signal<'idle' | 'sin-filtros' | 'sin-resultados' | 'error-red' | 'ok'>('idle');

  private cuentaInterval: ReturnType<typeof setInterval> | null = null;
  private usuarioId         = 0;
  private matchesAnteriores = 0;

  private readonly stopPoll$  = new Subject<void>();
  private readonly evaluados  = new Set<string>();

  // - Drag state -
  private dragging  = false;
  private startX    = 0;
  private startY    = 0;
  private currentX  = 0;
  private cardWidth = 340;
  private rafId     = 0;
  private committed = false;

  constructor(
      public  state:   SalaStateService,
      public  chatSvc: ChatService,
      private evalSvc: EvaluacionesService,
      private salaSvc: SalaService,
      private auth:    AuthService,
      private router:  Router,
      private ngZone:  NgZone,
      private inactividad: InactividadService
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
    const salaId = this.state.salaId();
    this.usuarioId = u?.id ?? 0;

    if (!salaId) {
      this.router.navigate(['/home']);
      return;
    }

    this.chatSvc.conectar(salaId, token, this.usuarioId);
    this.matchesAnteriores = this.chatSvc.matches().length;

    if (this.state.contenido().length === 0) {
      this.recuperarCatalogo();
    } else {
      this.estadoCatalogo.set('ok');
    }

    this.inactividad.iniciar();

    this.inactividad.inactivo$.pipe(
        takeUntil(this.stopPoll$)
    ).subscribe(() => {
      this.limpiarCuenta();
      this.finalizar();
    });

    this.inactividad.aviso$.pipe(
        takeUntil(this.stopPoll$)
    ).subscribe((mostrar) => {
      this.avisoCierre.set(mostrar);
      if (mostrar) {
        this.cuentaAtras.set(30);
        this.cuentaInterval = setInterval(() => {
          const resto = this.cuentaAtras() - 1;
          if (resto <= 0) { this.limpiarCuenta(); return; }
          this.cuentaAtras.set(resto);
        }, 1000);
      } else {
        this.limpiarCuenta();
      }
    });
  }
  private limpiarCuenta(): void {
    if (this.cuentaInterval) {
      clearInterval(this.cuentaInterval);
      this.cuentaInterval = null;
    }
    this.avisoCierre.set(false);
  }

  descartarAviso(): void {
    this.inactividad.iniciar(); // reinicia todos los timers
  }

  ngOnDestroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.stopPoll$.next();
    this.stopPoll$.complete();
    this.inactividad.detener();
    this.limpiarCuenta();// ← nuevo
  }

  // ─────────────────────────────────────────────────────
  // Recuperación de catálogo
  // ─────────────────────────────────────────────────────

  recuperarCatalogo(): void {
    const salaId = this.state.salaId()!;
    this.recuperando.set(true);
    this.estadoCatalogo.set('idle');

    this.salaSvc.getFiltros(salaId).subscribe({
      next: (resultado) => {
        this.recuperando.set(false);

        if (resultado === 'sin-filtros') {
          // 204: el creador aún no aplicó filtros → mostrar espera con polling
          this.estadoCatalogo.set('sin-filtros');
          this.iniciarPollingFiltrosIniciales();

        } else if (resultado === 'sin-resultados') {
          // 200 + []: filtros aplicados pero sin contenido
          this.estadoCatalogo.set('sin-resultados');

        } else {
          // 200 + contenido: catálogo listo
          this.state.reanudarContenido(resultado);
          this.estadoCatalogo.set('ok');
        }
      },
      error: () => {
        this.recuperando.set(false);
        this.estadoCatalogo.set('error-red');
      }
    });
  }

  /**
   * Polling silencioso cuando el creador aún no aplicó filtros (204).
   * Consulta cada POLL_INTERVAL_MS hasta que llegue contenido.
   */
  private iniciarPollingFiltrosIniciales(): void {
    const salaId = this.state.salaId()!;

    interval(POLL_INTERVAL_MS).pipe(
        switchMap(() => this.salaSvc.getFiltros(salaId)),
        takeUntil(this.stopPoll$)
    ).subscribe({
      next: (resultado) => {
        if (resultado === 'sin-filtros' || resultado === 'sin-resultados') return;

        // Llegó contenido → detener polling y cargar
        this.stopPoll$.next();
        this.ngZone.run(() => {
          this.state.reanudarContenido(resultado);
          this.estadoCatalogo.set('ok');
        });
      }
    });
  }

  // ─────────────────────────────────────────────────────
  // Polling de filtros nuevos (catálogo agotado)
  // ─────────────────────────────────────────────────────

  iniciarEsperaFiltros(): void {
    const salaId     = this.state.salaId()!;
    const idsActuales = new Set(this.state.contenido().map(c => c.contenidoId));
    this.esperandoFiltros.set(true);

    interval(POLL_INTERVAL_MS).pipe(
        switchMap(() => this.salaSvc.getFiltros(salaId)),
        takeUntil(this.stopPoll$)
    ).subscribe({
      next: (resultado) => {
        if (resultado === 'sin-filtros' || resultado === 'sin-resultados') return;

        const hayNuevo = resultado.some(c => !idsActuales.has(c.contenidoId));
        if (!hayNuevo) return;

        this.stopPoll$.next();
        this.ngZone.run(() => {
          this.esperandoFiltros.set(false);
          this.evaluados.clear();
          this.state.setContenido(resultado);
          this.estadoCatalogo.set('ok');
        });
      }
    });
  }

  detenerEsperaFiltros(): void {
    this.stopPoll$.next();
    this.esperandoFiltros.set(false);
  }

  // ─────────────────────────────────────────────────────
  // Pointer event handlers
  // ─────────────────────────────────────────────────────

  onPointerDown(e: PointerEvent): void {
    if (this.evaluando() || this.committed) return;
    if (this.chatSvc.companeroDesconectado() || !this.chatSvc.conectado()) return;

    this.dragging  = true;
    this.startX    = e.clientX;
    this.startY    = e.clientY;
    this.currentX  = 0;
    this.cardWidth = this.wrapperEl?.nativeElement.offsetWidth || 340;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this.setCardTransition('none');
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.dragging) return;
    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;
    if (Math.abs(dy) > Math.abs(dx) * 1.5 && Math.abs(dx) < 12) { this.cancelDrag(); return; }

    this.currentX = dx;
    this.dragDir.set(dx > 0 ? 1 : -1);

    this.ngZone.runOutsideAngular(() => {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.rafId = requestAnimationFrame(() => this.applyDragTransform(dx));
    });
  }

  onPointerUp(_e: PointerEvent): void {
    if (!this.dragging) return;
    this.dragging = false;
    const ratio = this.currentX / this.cardWidth;
    if (Math.abs(ratio) >= THRESHOLD) { this.commitSwipe(this.currentX > 0); }
    else { this.snapBack(); }
  }

  onPointerCancel(_e: PointerEvent): void { this.cancelDrag(); }

  // ─────────────────────────────────────────────────────
  // Drag visuals
  // ─────────────────────────────────────────────────────

  private applyDragTransform(dx: number): void {
    const card      = this.cardEl?.nativeElement;
    const likeBadge = this.badgeLikeEl?.nativeElement;
    const nopeBadge = this.badgeNopeEl?.nativeElement;
    if (!card) return;

    const ratio   = dx / this.cardWidth;
    card.style.transform = `translateX(${dx}px) rotate(${ratio * MAX_ROTATE}deg)`;

    const opacity = Math.max(0, Math.min(1, (Math.abs(ratio) - BADGE_START) / (1 - BADGE_START)));
    if (dx > 0) {
      if (likeBadge) likeBadge.style.opacity = String(opacity);
      if (nopeBadge) nopeBadge.style.opacity = '0';
    } else {
      if (likeBadge) likeBadge.style.opacity = '0';
      if (nopeBadge) nopeBadge.style.opacity = String(opacity);
    }
  }

  private commitSwipe(approved: boolean): void {
    if (this.evaluando()) return;
    this.committed = true;
    const card = this.cardEl?.nativeElement;
    if (!card) { this.finishEval(approved); return; }

    this.setCardTransition('transform .35s cubic-bezier(.5,1.4,.5,1), opacity .3s ease');
    card.style.transform = `translateX(${approved ? FLY_DIST : -FLY_DIST}px) rotate(${approved ? MAX_ROTATE : -MAX_ROTATE}deg)`;
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
    this.setCardTransition('transform .4s cubic-bezier(.25,1.5,.5,1)');
    const card      = this.cardEl?.nativeElement;
    const likeBadge = this.badgeLikeEl?.nativeElement;
    const nopeBadge = this.badgeNopeEl?.nativeElement;
    if (card)      card.style.transform    = 'translateX(0) rotate(0deg)';
    if (likeBadge) likeBadge.style.opacity = '0';
    if (nopeBadge) nopeBadge.style.opacity = '0';
  }

  private cancelDrag(): void { this.dragging = false; this.snapBack(); }

  private setCardTransition(v: string): void {
    const card = this.cardEl?.nativeElement;
    if (card) card.style.transition = v;
  }

  private resetCard(): void {
    const card      = this.cardEl?.nativeElement;
    const likeBadge = this.badgeLikeEl?.nativeElement;
    const nopeBadge = this.badgeNopeEl?.nativeElement;
    if (card) { card.style.transform = ''; card.style.opacity = ''; card.style.transition = ''; }
    if (likeBadge) likeBadge.style.opacity = '0';
    if (nopeBadge) nopeBadge.style.opacity = '0';
  }

  // ─────────────────────────────────────────────────────
  // Business logic
  // ─────────────────────────────────────────────────────

  private finishEval(approved: boolean): void { this.evaluar(approved); }

  evaluar(decision: boolean): void {
    const contenido = this.state.actual();
    const salaId    = this.state.salaId();
    if (!contenido || !salaId) return;
    if (this.chatSvc.companeroDesconectado()) return;
    if (this.evaluando()) return;

    if (this.evaluados.has(contenido.contenidoId)) {
      this.state.avanzar();
      return;
    }

    this.evaluados.add(contenido.contenidoId);
    this.evaluando.set(true);

    this.evalSvc.evaluar({ salaId, usuarioId: this.usuarioId, contenidoId: contenido.contenidoId, decision })
        .subscribe({
          next: () => { this.state.avanzar(); this.evaluando.set(false); },
          error: (err) => {
            if (err.status !== 409) this.evaluados.delete(contenido.contenidoId);
            this.state.avanzar();
            this.evaluando.set(false);
          }
        });
  }

  finalizar(): void {
    this.stopPoll$.next();
    const salaId = this.state.salaId();
    if (!salaId) { this.router.navigate(['/home']); return; }
    this.salaSvc.finalizar(salaId).subscribe({
      next:  () => this.router.navigate(['/resultados']),
      error: () => this.router.navigate(['/resultados'])
    });
  }
}