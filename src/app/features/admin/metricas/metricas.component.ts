import { Component, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MetricasService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { Metricas } from '../../../core/models';
import {DecimalPipe} from "@angular/common";

@Component({
  selector: 'app-metricas',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="page">
      <nav class="navbar">
        <span class="navbar__logo">CineMatch</span>
        <div class="navbar__actions">
          <a routerLink="/admin/plataformas"       class="btn btn--ghost btn--sm">Plataformas</a>
          <a routerLink="/admin/retroalimentacion" class="btn btn--ghost btn--sm">Retroalimentación</a>
          <button class="btn btn--secondary btn--sm" (click)="logout()">Salir</button>
        </div>
      </nav>

      <div style="flex:1; padding:28px 24px;">
        <div class="container container--wide" style="margin:0 auto;">
          <p class="section-title">Panel de métricas</p>
          <p class="section-sub">Resumen de actividad de la plataforma</p>

          @if (cargando()) {
            <p style="color:var(--text-sub);">Cargando...</p>
          } @else if (metricas(); as m) {
            <div class="grid-3" style="margin-bottom:24px;">
              <div class="metric-card">
                <p class="metric-value">{{ m.salasActivas }}</p>
                <p class="metric-label">Salas activas ahora</p>
              </div>
              <div class="metric-card">
                <p class="metric-value">{{ m.totalSalas }}</p>
                <p class="metric-label">Salas totales</p>
              </div>
              <div class="metric-card">
                <p class="metric-value">{{ m.totalMatches }}</p>
                <p class="metric-label">Matches generados</p>
              </div>
            </div>
            <div class="card" style="margin-bottom:24px;">
              <div class="metric-card" style="border:none; padding:0;">
                <p class="metric-value">{{ m.promedioCalificacion | number:'1.1-1' }}</p>
                <p class="metric-label">Promedio de calificación</p>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class MetricasComponent implements OnInit {
  metricas = signal<Metricas | null>(null);
  cargando = signal(true);

  constructor(private metricasSvc: MetricasService, private auth: AuthService) {}

  ngOnInit(): void {
    this.metricasSvc.get().subscribe({
      next: (data) => { this.metricas.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false)
    });
  }

  logout(): void { this.auth.logout(); }
}
