import {Component, computed, OnInit} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <nav class="navbar">
        <span class="navbar__logo">CineMatch</span>
        <div class="navbar__actions">
          @if (isAdmin()) {
            <a routerLink="/admin/dashboard" class="btn btn--ghost btn--sm">Dashboard</a>
          }
          <a routerLink="/perfil" class="btn btn--ghost btn--sm">Perfil</a>
          <button class="btn btn--secondary btn--sm" (click)="logout()">Cerrar sesión</button>
        </div>
      </nav>

      <div style="flex:1; display:flex; align-items:center; justify-content:center; padding:24px;">
        <div style="width:100%; max-width:380px; display:flex; flex-direction:column; gap:20px;">
          <div>
            <p class="section-title">Hola, {{ nombre() }}</p>
            <p class="section-sub">Elige una opción para comenzar</p>
          </div>

          <div class="card" style="display:flex; flex-direction:column; gap:12px;">
            <div>
              <p style="font-weight:500; margin-bottom:4px;">Crear sala</p>
              <p style="font-size:13px; color:var(--text-sub);">Genera un código y compártelo con tu compañero</p>
            </div>
            <a routerLink="/sala/crear" [queryParams]="{accion:'crear'}" class="btn btn--primary btn--full">Crear sala</a>
          </div>

          <div class="card" style="display:flex; flex-direction:column; gap:12px;">
            <div>
              <p style="font-weight:500; margin-bottom:4px;">Unirse a sala</p>
              <p style="font-size:13px; color:var(--text-sub);">Ingresa el código que te compartieron</p>
            </div>
            <a routerLink="/sala/unirse" [queryParams]="{accion:'unirse'}" class="btn btn--secondary btn--full">Unirse a sala</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class HomeComponent implements OnInit {
  nombre = computed(() => this.auth.usuario()?.nombre ?? 'Usuario');
  isAdmin = computed(() => this.auth.isAdmin());

  constructor(private auth: AuthService, private chatSvc: ChatService) {}

  ngOnInit(): void {
    // Desconectar ChatService al llegar a home para limpiar estado de sesiones anteriores
    this.chatSvc.desconectar();
  }

  logout(): void {
    this.auth.logout();
  }
}
