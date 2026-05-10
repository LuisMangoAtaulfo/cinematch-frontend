import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subject, switchMap, takeUntil } from 'rxjs';
import { SalaService } from '../../core/services/sala.service';
import { SalaStateService } from '../../core/services/sala-state.service';

@Component({
    selector: 'app-espera-filtros',
    standalone: true,
    template: `
    <div class="page">
      <nav class="navbar">
        <span class="navbar__logo">CineMatch</span>
      </nav>

      <div style="flex:1; display:flex; align-items:center;
                  justify-content:center; padding:24px;">
        <div style="width:100%; max-width:380px; text-align:center;
                    display:flex; flex-direction:column; align-items:center; gap:28px;">

          <!-- Código de sala -->
          <div class="tag" style="font-size:14px; padding:6px 16px;">
            Sala {{ state.sala()?.codigo }}
          </div>

          <!-- Spinner -->
          <div style="position:relative; width:72px; height:72px;">
            <svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg"
                 style="width:72px; height:72px; animation: spin 1.2s linear infinite;">
              <circle cx="36" cy="36" r="30"
                      stroke="var(--border)" stroke-width="5"/>
              <path d="M36 6 a30 30 0 0 1 30 30"
                    stroke="var(--accent)" stroke-width="5"
                    stroke-linecap="round"/>
            </svg>
          </div>

          <!-- Texto -->
          <div style="display:flex; flex-direction:column; gap:8px;">
            <p class="section-title" style="margin-bottom:0;">Preparando la sesión</p>
            <p style="font-size:14px; color:var(--text-sub); line-height:1.6;">
              Tu compañero está eligiendo los filtros del catálogo.<br>
              En un momento comenzarás el swipe.
            </p>
          </div>

          <!-- Dots animados -->
          <div style="display:flex; gap:8px; justify-content:center;">
            <span class="dot" style="animation-delay: 0s;"></span>
            <span class="dot" style="animation-delay: 0.2s;"></span>
            <span class="dot" style="animation-delay: 0.4s;"></span>
          </div>

          @if (error()) {
            <p style="font-size:13px; color:var(--danger);">{{ error() }}</p>
          }

          <!-- Salir -->
          <button class="btn btn--ghost"
                  style="margin-top:8px;"
                  (click)="salir()">
            Cancelar y salir
          </button>
        </div>
      </div>
    </div>

    <style>
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @keyframes pulse {
        0%, 80%, 100% { opacity: 0.25; transform: scale(0.8); }
        40%           { opacity: 1;    transform: scale(1);   }
      }
      .dot {
        width: 10px; height: 10px;
        border-radius: 50%;
        background: var(--accent);
        display: inline-block;
        animation: pulse 1.4s ease-in-out infinite;
      }
    </style>
  `
})
export class EsperaFiltrosComponent implements OnInit, OnDestroy {
    error    = signal('');
    private destroy$ = new Subject<void>();

    constructor(
        private salaSvc: SalaService,
        public  state: SalaStateService,
        private router: Router
    ) {}

    ngOnInit(): void {
        const salaId = this.state.salaId();

        if (!salaId) {
            this.router.navigate(['/home']);
            return;
        }

        this.iniciarPollingFiltros(salaId);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Consulta GET /api/filtros/{salaId} cada 3 segundos.
     * Cuando el backend responde 200 con contenido (filtros aplicados),
     * guarda el catálogo en el estado compartido y navega a /swipe.
     * Mientras responda 204, sigue esperando.
     */
    private iniciarPollingFiltros(salaId: number): void {
        interval(3000).pipe(
            switchMap(() => this.salaSvc.getFiltros(salaId)),
            takeUntil(this.destroy$)
        ).subscribe({
            next: (contenido) => {
                if (contenido && contenido.length > 0) {
                    this.destroy$.next(); // detiene el polling
                    this.state.setContenido(contenido);
                    this.router.navigate(['/swipe']);
                }
                // Si viene vacío (204 mapeado a []), sigue esperando
            },
            error: () => {
                // Errores de red no detienen el polling, reintenta en el próximo tick
            }
        });
    }

    salir(): void {
        this.destroy$.next();
        this.state.reset();
        this.router.navigate(['/home']);
    }
}