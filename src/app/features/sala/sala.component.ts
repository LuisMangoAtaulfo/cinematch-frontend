import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { interval, Subject, switchMap, takeUntil } from 'rxjs';
import { SalaService } from '../../core/services/sala.service';
import { SalaStateService } from '../../core/services/sala-state.service';
import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../core/models';

@Component({
  selector: 'app-sala',
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
        <div style="width:100%; max-width:380px; display:flex; flex-direction:column; gap:20px;">

          <!-- Crear sala -->
          <div class="card" style="display:flex; flex-direction:column; gap:16px;">
            <div>
              <p style="font-weight:500; margin-bottom:4px;">Tu código de sala</p>
              <p style="font-size:13px; color:var(--text-sub);">Comparte este código con tu compañero</p>
            </div>

            @if (codigoSala()) {
              <div style="background:var(--surface2); border:1px solid var(--border);
                          border-radius:var(--radius); padding:16px; text-align:center;">
                <p style="font-family:var(--font-disp); font-size:36px;
                           letter-spacing:8px; color:var(--accent);">{{ codigoSala() }}</p>
              </div>
              <button class="btn btn--secondary btn--full" (click)="copiarCodigo()">
                {{ copiado() ? '¡Copiado!' : 'Copiar código' }}
              </button>
              <div style="display:flex; align-items:center; gap:8px;">
                <hr class="divider" style="flex:1">
                <span style="font-size:13px; color:var(--text-sub);">
                  esperando compañero...
                </span>
                <hr class="divider" style="flex:1">
              </div>
            } @else {
              <button class="btn btn--primary btn--full"
                      [disabled]="creando()"
                      (click)="crearSala()">
                {{ creando() ? 'Creando...' : 'Crear sala' }}
              </button>
            }

            @if (errorCrear()) {
              <p class="form-error">{{ errorCrear() }}</p>
            }
          </div>

          <!-- Unirse a sala -->
          <div class="card" style="display:flex; flex-direction:column; gap:16px;">
            <div>
              <p style="font-weight:500; margin-bottom:4px;">Unirse a una sala</p>
              <p style="font-size:13px; color:var(--text-sub);">Ingresa el código que te compartieron</p>
            </div>
            <div class="form-group">
              <label for="codigo">Código de sala</label>
              <input id="codigo" type="text" placeholder="Ej. A7X3"
                     style="text-align:center; font-size:20px; letter-spacing:4px; text-transform:uppercase;"
                     [(ngModel)]="codigoInput" name="codigo"
                     (input)="codigoInput = codigoInput.toUpperCase()">
            </div>
            @if (errorUnirse()) {
              <p class="form-error">{{ errorUnirse() }}</p>
            }
            <button class="btn btn--primary btn--full"
                    [disabled]="uniendose()"
                    (click)="unirse()">
              {{ uniendose() ? 'Uniéndose...' : 'Unirse' }}
            </button>
          </div>

        </div>
      </div>
    </div>
  `
})
export class SalaComponent implements OnInit, OnDestroy {
  codigoSala  = signal('');
  codigoInput = '';
  creando     = signal(false);
  uniendose   = signal(false);
  copiado     = signal(false);
  errorCrear  = signal('');
  errorUnirse = signal('');

  private usuarioId = 0;
  private destroy$  = new Subject<void>();

  constructor(
      private salaSvc: SalaService,
      private state: SalaStateService,
      private auth: AuthService,
      private router: Router
  ) {}

  ngOnInit(): void {
    const u = this.auth.usuario() as Usuario;
    this.usuarioId = u?.id ?? 0;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  crearSala(): void {
    this.errorCrear.set('');
    this.creando.set(true);

    this.salaSvc.crear({ usuarioId: this.usuarioId }).subscribe({
      next: (sala) => {
        this.state.setSala(sala);
        this.state.setEsCreador(true);
        this.codigoSala.set(sala.codigo);
        this.creando.set(false);
        this.iniciarPollingCreador(sala.id);
      },
      error: () => {
        this.errorCrear.set('No se pudo crear la sala');
        this.creando.set(false);
      }
    });
  }

  /**
   * Consulta el estado de la sala cada 3 segundos.
   * Cuando detecta estado ACTIVA (el invitado se unió),
   * detiene el polling y navega a /filtros.
   */
  private iniciarPollingCreador(salaId: number): void {
    interval(3000).pipe(
        switchMap(() => this.salaSvc.getById(salaId)),
        takeUntil(this.destroy$)
    ).subscribe({
      next: (sala) => {
        if (sala.estado === 'ACTIVA') {
          this.destroy$.next(); // detiene el polling
          this.router.navigate(['/filtros']);
        }
      },
      error: () => {
        // Si falla una consulta, el interval reintenta solo en el próximo tick
      }
    });
  }

  copiarCodigo(): void {
    navigator.clipboard.writeText(this.codigoSala()).then(() => {
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2000);
    });
  }

  unirse(): void {
    this.errorUnirse.set('');
    if (!this.codigoInput.trim()) {
      this.errorUnirse.set('Ingresa un código de sala');
      return;
    }
    this.uniendose.set(true);

    this.salaSvc.unirse({ codigo: this.codigoInput, usuarioId: this.usuarioId }).subscribe({
      next: (sala) => {
        this.state.setSala(sala);
        this.state.setEsCreador(false);
        // El invitado espera a que el creador elija filtros
        this.router.navigate(['/espera-filtros']);
      },
      error: (e) => {
        this.errorUnirse.set(
            e.status === 400 ? 'Código de sala inválido' :
                e.status === 409 ? 'La sala ya no está disponible' :
                    'Error al unirse a la sala'
        );
        this.uniendose.set(false);
      }
    });
  }
}