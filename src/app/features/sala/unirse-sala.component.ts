import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { SalaService } from '../../core/services/sala.service';
import { SalaStateService } from '../../core/services/sala-state.service';
import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../core/models';

@Component({
    selector: 'app-unirse-sala',
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
        <div style="width:100%; max-width:380px;">

          <p class="section-title">Unirse a sala</p>
          <p class="section-sub">Ingresa el código que te compartieron</p>

          <div class="card" style="display:flex; flex-direction:column; gap:16px;">
            <div class="form-group">
              <label for="codigo">Código de sala</label>
              <input
                id="codigo"
                type="text"
                placeholder="Ej. A7X3"
                style="text-align:center; font-size:24px; letter-spacing:6px; text-transform:uppercase;"
                [(ngModel)]="codigoInput"
                name="codigo"
                (input)="codigoInput = codigoInput.toUpperCase()"
                (keyup.enter)="unirse()">
            </div>

            @if (error()) {
              <p style="color:var(--danger); font-size:13px;">{{ error() }}</p>
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
export class UnirseSalaComponent implements OnInit {
    codigoInput = '';
    uniendose   = signal(false);
    error       = signal('');

    private usuarioId = 0;

    constructor(
        private salaSvc: SalaService,
        private state:   SalaStateService,
        private auth:    AuthService,
        private router:  Router
    ) {}

    ngOnInit(): void {
        const u = this.auth.usuario() as Usuario;
        this.usuarioId = u?.id ?? 0;
    }

    unirse(): void {
        this.error.set('');
        if (!this.codigoInput.trim()) {
            this.error.set('Ingresa un código de sala');
            return;
        }
        this.uniendose.set(true);

        this.salaSvc.unirse({ codigo: this.codigoInput, usuarioId: this.usuarioId }).subscribe({
            next: (sala) => {
                this.state.setSala(sala);
                this.state.setEsCreador(false);
                this.router.navigate(['/espera-filtros']);
            },
            error: (e) => {
                this.error.set(
                    e.status === 400 ? 'Código de sala inválido' :
                        e.status === 409 ? 'La sala ya no está disponible' :
                            'Error al unirse a la sala'
                );
                this.uniendose.set(false);
            }
        });
    }
}