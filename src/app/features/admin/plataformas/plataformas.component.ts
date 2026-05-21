import { Component, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlataformasService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { Plataforma } from '../../../core/models';
import {forkJoin} from "rxjs";
import {map} from "rxjs/operators";

@Component({
  selector: 'app-plataformas',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="page">
      <nav class="navbar">
        <span class="navbar__logo">CineMatch</span>
        <div class="navbar__actions">
          <a routerLink="/admin/metricas"          class="btn btn--ghost btn--sm">Métricas</a>
          <a routerLink="/admin/retroalimentacion" class="btn btn--ghost btn--sm">Retroalimentación</a>
          <button class="btn btn--secondary btn--sm" (click)="logout()">Salir</button>
        </div>
      </nav>

      <div style="flex:1; padding:28px 24px;">
        <div style="max-width:520px; margin:0 auto;">
          <p class="section-title">Plataformas</p>
          <p class="section-sub">Habilita o deshabilita las plataformas disponibles como filtro</p>

          @if (cargando()) {
            <p style="color:var(--text-sub);">Cargando...</p>
          } @else {
            <div class="card">
              <div style="display:flex; flex-direction:column; gap:0;">
                @for (p of plataformas(); track p.id; let last = $last) {
                  <div style="display:flex; align-items:center; justify-content:space-between;
                               padding:14px 0;"
                       [style.border-bottom]="!last ? '1px solid var(--border)' : ''">
                    <div>
                      <p style="font-weight:500;">{{ p.nombre }}</p>
                      <p style="font-size:12px; color:var(--text-sub);">
                        {{ p.habilitada ? 'Disponible como filtro' : 'Deshabilitada' }}
                      </p>
                    </div>
                    <label class="toggle">
                      <input type="checkbox" [checked]="p.habilitada"
                             (change)="togglePlataforma(p)">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                }
              </div>
            </div>
        
            @if (guardado()) {
              <p style="color:var(--success); margin-top:12px; text-align:center;">
                Cambios guardados correctamente
              </p>
            }
            @if (confirmando()) {
              <div style="background:var(--surface2); border:1px solid var(--danger);
              border-radius:var(--radius); padding:16px; margin-top:16px;">
                <p style="font-weight:500; color:var(--danger); margin-bottom:8px;">
                  ¡Plataforma en uso!
                </p>
                <p style="font-size:13px; color:var(--text); margin-bottom:8px;">
                  Las siguientes plataformas tienen salas activas filtrando por ellas:
                </p>
                <ul style="margin:0 0 12px 16px; padding:0;">
                  @for (nombre of advertencias(); track nombre) {
                    <li style="font-size:13px; color:var(--danger); font-weight:500;">
                      {{ nombre }}
                    </li>
                  }
                </ul>
                <p style="font-size:12px; color:var(--text-sub); margin-bottom:16px;">
                  Si las desactivas, esas salas seguirán con el catálogo actual
                  pero no podrán aplicar ese filtro en nuevas sesiones.
                </p>
                <div style="display:flex; gap:10px;">
                  <button class="btn btn--danger" style="flex:1;" (click)="confirmarGuardado()">
                    Desactivar de todas formas
                  </button>
                  <button class="btn btn--ghost" style="flex:1;" (click)="cancelarGuardado()">
                    Cancelar
                  </button>
                </div>
              </div>
            }
            <button class="btn btn--primary btn--full" style="margin-top:16px;"
                    [disabled]="guardando()"
                    (click)="guardar()">
              {{ guardando() ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          }
        </div>
      </div>
    </div>
  `
})
export class PlataformasComponent implements OnInit {
  plataformas = signal<Plataforma[]>([]);
  cargando    = signal(true);
  guardando   = signal(false);
  guardado    = signal(false);
  advertencias = signal<string[]>([]);   // nombres de plataformas en uso que se van a desactivar
  confirmando  = signal(false);          // muestra el panel de confirmación

  constructor(private plataformasSvc: PlataformasService, private auth: AuthService) {}

  ngOnInit(): void {
    this.plataformasSvc.getAll().subscribe({
      next: (data) => { this.plataformas.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false)
    });
  }

  togglePlataforma(p: Plataforma): void {
    this.plataformas.update(lista =>
      lista.map(x => x.id === p.id ? { ...x, habilitada: !x.habilitada } : x)
    );
  }

  guardar(): void {
    // Plataformas que estaban habilitadas y ahora se van a desactivar
    const aDesactivar = this.plataformas().filter(p => !p.habilitada);

    if (!aDesactivar.length) {
      this.ejecutarGuardado();
      return;
    }

    // Consultar cuáles están en uso
    this.guardando.set(true);
    const checks = aDesactivar.map(p =>
        this.plataformasSvc.estaEnUso(p.id).pipe(
            map(enUso => ({ nombre: p.nombre, enUso }))
        )
    );

    forkJoin(checks).subscribe({
      next: (resultados) => {
        const enUso = resultados
            .filter(r => r.enUso)
            .map(r => r.nombre);

        this.guardando.set(false);

        if (enUso.length) {
          this.advertencias.set(enUso);
          this.confirmando.set(true);   // muestra el panel de confirmación
        } else {
          this.ejecutarGuardado();
        }
      },
      error: () => {
        // Si falla la consulta, dejamos pasar y guardamos igual
        this.guardando.set(false);
        this.ejecutarGuardado();
      }
    });
  }

  confirmarGuardado(): void {
    this.confirmando.set(false);
    this.advertencias.set([]);
    this.ejecutarGuardado();
  }

  cancelarGuardado(): void {
    this.confirmando.set(false);
    this.advertencias.set([]);
  }

  private ejecutarGuardado(): void {
    this.guardando.set(true);
    const updates = this.plataformas().map(p =>
        this.plataformasSvc.actualizarEstado({ id: p.id, habilitada: p.habilitada })
    );
    let pendientes = updates.length;
    updates.forEach(obs => obs.subscribe({
      next: () => {
        if (--pendientes === 0) {
          this.guardando.set(false);
          this.guardado.set(true);
        }
      },
      error: () => {
        if (--pendientes === 0) this.guardando.set(false);
      }
    }));
  }

  logout(): void { this.auth.logout(); }
}
