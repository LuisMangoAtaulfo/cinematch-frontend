import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { interval, Subject, switchMap, takeUntil } from 'rxjs';
import { SalaService } from '../../core/services/sala.service';
import { SalaStateService } from '../../core/services/sala-state.service';
import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../core/models';

@Component({
    selector: 'app-crear-sala',
    standalone: true,
    imports: [RouterLink],
    template: `
    <div class="page">
      <nav class="navbar">
        <span class="navbar__logo">CineMatch</span>
      </nav>

      <div style="flex:1; display:flex; align-items:center; justify-content:center; padding:24px;">
        <div style="width:100%; max-width:380px; display:flex; flex-direction:column; gap:20px;">

          @if (creando()) {
            <div class="card" style="text-align:center; padding:32px;">
              <p style="color:var(--text-sub);">Creando sala...</p>
            </div>
          }

          @if (error()) {
            <div class="card" style="text-align:center; padding:32px;">
              <p style="color:var(--danger); margin-bottom:16px;">{{ error() }}</p>
              <a routerLink="/home" class="btn btn--ghost btn--full">Volver al inicio</a>
            </div>
          }

          @if (codigoSala()) {
            <div class="card" style="display:flex; flex-direction:column; gap:16px;">
              <div>
                <p style="font-weight:500; margin-bottom:4px;">Tu código de sala</p>
                <p style="font-size:13px; color:var(--text-sub);">
                  Comparte este código con tu compañero
                </p>
              </div>

              <div style="background:var(--surface2); border:1px solid var(--border);
                          border-radius:var(--radius); padding:24px; text-align:center;">
                <p style="font-family:var(--font-disp); font-size:42px;
                           letter-spacing:10px; color:var(--accent);">
                  {{ codigoSala() }}
                </p>
              </div>

              <button class="btn btn--secondary btn--full" (click)="copiarCodigo()">
                {{ copiado() ? '¡Copiado!' : 'Copiar código' }}
              </button>

              <div style="display:flex; align-items:center; gap:8px;">
                <hr class="divider" style="flex:1">
                <span style="font-size:13px; color:var(--text-sub);">esperando compañero...</span>
                <hr class="divider" style="flex:1">
              </div>

              <button class="btn btn--danger btn--full" (click)="cancelar()">
                Cancelar sala
              </button>
            </div>
          }

        </div>
      </div>
    </div>
  `
})
export class CrearSalaComponent implements OnInit, OnDestroy {
    codigoSala = signal('');
    creando    = signal(true);
    copiado    = signal(false);
    error      = signal('');

    private usuarioId = 0;
    private salaId    = 0;
    private destroy$  = new Subject<void>();

    constructor(
        private salaSvc:  SalaService,
        private state:    SalaStateService,
        private auth:     AuthService,
        private router:   Router
    ) {}

    ngOnInit(): void {
        const u = this.auth.usuario() as Usuario;
        this.usuarioId = u?.id ?? 0;
        this.crearSala();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private crearSala(): void {
        this.salaSvc.crear({ usuarioId: this.usuarioId }).subscribe({
            next: (sala) => {
                this.state.setSala(sala);
                this.state.setEsCreador(true);
                this.codigoSala.set(sala.codigo);
                this.salaId = sala.id;
                this.creando.set(false);
                this.iniciarPolling();
            },
            error: () => {
                this.error.set('No se pudo crear la sala');
                this.creando.set(false);
            }
        });
    }

    private iniciarPolling(): void {
        interval(3000).pipe(
            switchMap(() => this.salaSvc.getById(this.salaId)),
            takeUntil(this.destroy$)
        ).subscribe({
            next: (sala) => {
                if (sala.estado === 'ACTIVA') {
                    this.destroy$.next();
                    this.router.navigate(['/filtros']);
                }
            }
        });
    }

    copiarCodigo(): void {
        navigator.clipboard.writeText(this.codigoSala()).then(() => {
            this.copiado.set(true);
            setTimeout(() => this.copiado.set(false), 2000);
        });
    }

    cancelar(): void {
        this.destroy$.next(); // detiene el polling primero
        this.salaSvc.finalizar(this.salaId).subscribe({
            complete: () => this.router.navigate(['/home']),
            error:    () => this.router.navigate(['/home']) // navega igual aunque falle
        });
    }
}