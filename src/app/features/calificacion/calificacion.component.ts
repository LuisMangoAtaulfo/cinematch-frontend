import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CalificacionService } from '../../core/services/calificacion.service';
import { SalaStateService }    from '../../core/services/sala-state.service';
import { AuthService }         from '../../core/services/auth.service';
import { Usuario }             from '../../core/models';

@Component({
  selector: 'app-calificacion',
  standalone: true,
  imports: [],
  styles: [`
    .rating-row {
      display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;
    }
    .rating-btn {
      width: 44px; height: 44px; border-radius: 50%;
      border: 2px solid var(--border); background: var(--surface);
      color: var(--text); font-size: 15px; font-weight: 600; cursor: pointer;
      transition: border-color var(--transition), background var(--transition),
                  transform var(--transition);
    }
    .rating-btn:hover  { border-color: var(--accent); transform: scale(1.08); }
    .rating-btn.active {
      border-color: var(--accent); background: var(--accent);
      color: #0f0f0f; transform: scale(1.08);
    }
  `],
  template: `
    <div class="page">
      <nav class="navbar">
        <span class="navbar__logo">CineMatch</span>
      </nav>

      <div style="flex:1; display:flex; align-items:center; justify-content:center; padding:24px;">
        <div style="width:100%; max-width:380px;">

          <div style="text-align:center; margin-bottom:28px;">
            <p class="section-title">Califica la sesión</p>
            <p class="section-sub">Tu opinión es anónima y nos ayuda a mejorar</p>
          </div>

          <div class="card">
            <div style="display:flex; flex-direction:column; gap:20px;">
              <p style="font-size:14px; color:var(--text-sub); text-align:center;">
                ¿Qué tan buena fue tu experiencia?
              </p>

              <div class="rating-row">
                @for (n of valores; track n) {
                  <button class="rating-btn"
                          [class.active]="seleccion() === n"
                          (click)="seleccion.set(n)">{{ n }}</button>
                }
              </div>

              <div style="display:flex; justify-content:space-between;">
                <span style="font-size:12px; color:var(--text-sub);">Mala</span>
                <span style="font-size:12px; color:var(--text-sub);">Excelente</span>
              </div>

              @if (error()) {
                <p style="color:var(--danger); font-size:13px; text-align:center; margin:0;">
                  {{ error() }}
                </p>
              }

              <button class="btn btn--primary btn--full"
                      [disabled]="enviando()"
                      (click)="enviar()">
                {{ enviando() ? 'Enviando...' : 'Enviar calificación' }}
              </button>

              <button class="btn btn--ghost btn--full" (click)="salir()">
                Omitir
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  `
})
export class CalificacionComponent {
  readonly valores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  seleccion = signal(0);
  enviando  = signal(false);
  error     = signal('');

  constructor(
      private calSvc: CalificacionService,
      private state:  SalaStateService,
      private auth:   AuthService,
      private router: Router
  ) {}

  enviar(): void {
    if (!this.seleccion()) {
      this.error.set('Selecciona una calificación del 1 al 10');
      return;
    }

    const salaId    = this.state.salaId();
    const usuarioId = (this.auth.usuario() as Usuario)?.id ?? 0;

    if (!salaId) {
      this.salir();
      return;
    }

    this.enviando.set(true);
    this.error.set('');

    // El método correcto del servicio es "registrar", no "calificar"
    this.calSvc.registrar({ salaId, usuarioId, valor: this.seleccion() }).subscribe({
      next: () => {
        this.state.reset(); // limpia memoria + localStorage
        this.router.navigate(['/home']);
      },
      error: () => {
        this.error.set('No se pudo enviar la calificación. Intenta de nuevo.');
        this.enviando.set(false);
      }
    });
  }

  salir(): void {
    this.state.reset(); // limpia memoria + localStorage
    this.router.navigate(['/home']);
  }
}