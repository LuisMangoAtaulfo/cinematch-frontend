import { Component, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CalificacionService } from '../../core/services/calificacion.service';
import { SalaStateService } from '../../core/services/sala-state.service';
import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../core/models';

@Component({
  selector: 'app-calificacion',
  standalone: true,
  imports: [RouterLink],
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
              <div class="rating-row" style="justify-content:center; flex-wrap:wrap;">
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
                <p class="form-error">{{ error() }}</p>
              }
              <button class="btn btn--primary btn--full"
                      [disabled]="enviando()"
                      (click)="enviar()">
                {{ enviando() ? 'Enviando...' : 'Enviar calificación' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CalificacionComponent {
  readonly valores = [1,2,3,4,5,6,7,8,9,10];
  seleccion = signal(0);
  enviando  = signal(false);
  error     = signal('');

  constructor(
    private calSvc: CalificacionService,
    private state: SalaStateService,
    private auth: AuthService,
    private router: Router
  ) {}

  enviar(): void {
    if (!this.seleccion()) {
      this.error.set('Selecciona una calificación');
      return;
    }
    const salaId    = this.state.salaId();
    const usuarioId = (this.auth.usuario() as Usuario)?.id ?? 0;

    if (!salaId) { this.router.navigate(['/home']); return; }

    this.enviando.set(true);
    this.calSvc.registrar({ salaId, usuarioId, valor: this.seleccion() }).subscribe({
      next: () => {
        this.state.reset();
        this.router.navigate(['/home']);
      },
      error: () => {
        this.error.set('Error al enviar la calificación');
        this.enviando.set(false);
      }
    });
  }
}
