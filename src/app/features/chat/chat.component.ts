import { Component, signal, OnInit, OnDestroy, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChatService } from '../../core/services/chat.service';
import { SalaStateService } from '../../core/services/sala-state.service';
import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../core/models';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, RouterLink],
  styles: [`
    .chat-area {
      flex: 1; display: flex; flex-direction: column;
      gap: 12px; padding: 20px 24px; overflow-y: auto;
    }
    .chat-input-bar {
      padding: 16px 24px; border-top: 1px solid var(--border);
      display: flex; gap: 10px; align-items: center; background: var(--bg);
    }
    .chat-msg { display: flex; flex-direction: column; }
    .chat-msg--out { align-items: flex-end; }
    .chat-msg--in  { align-items: flex-start; }
    .chat-name { font-size: 11px; color: var(--text-sub); margin-bottom: 3px; }
    .ws-status {
      font-size: 11px; padding: 4px 10px;
      border-radius: 20px; display: inline-flex; align-items: center; gap: 5px;
    }
    .ws-dot { width: 6px; height: 6px; border-radius: 50%; }
  `],
  template: `
    <div class="page">
      <nav class="navbar">
        <span class="navbar__logo">CineMatch</span>
        <div class="navbar__actions">
          <a routerLink="/swipe"   class="btn btn--ghost btn--sm">Volver</a>
          <a routerLink="/matches" class="btn btn--ghost btn--sm">Matches</a>
        </div>
      </nav>

      <!-- Banner de nuevo match recibido por WS -->
      @if (ultimoMatch()) {
        <div style="background:var(--accent); color:#0f0f0f; padding:12px 24px;
                    text-align:center; font-weight:500; cursor:pointer;"
             (click)="ultimoMatch.set('')">
          🎉 ¡Match! {{ ultimoMatch() }}
        </div>
      }

      <!-- Estado conexión WS (solo si desconectado) -->
      @if (!chatSvc.conectado()) {
        <div style="background:var(--surface2); border-bottom:1px solid var(--border);
                    padding:8px 24px; display:flex; align-items:center; gap:8px;">
          <span class="ws-dot" style="background:var(--danger);"></span>
          <span style="font-size:12px; color:var(--text-sub);">Reconectando chat...</span>
        </div>
      }

      <div class="chat-area" #chatArea>
        @if (cargando()) {
          <p style="color:var(--text-sub); text-align:center; margin-top:20px;">
            Cargando mensajes...
          </p>
        }

        @for (msg of chatSvc.mensajes(); track msg.id) {
          <div class="chat-msg"
               [class]="msg.usuarioId === usuarioId ? 'chat-msg--out' : 'chat-msg--in'">
            @if (msg.usuarioId !== usuarioId) {
              <span class="chat-name">{{ msg.nombreUsuario }}</span>
            }
            <div class="chat-bubble"
                 [class]="msg.usuarioId === usuarioId ? 'chat-bubble--out' : 'chat-bubble--in'">
              {{ msg.texto }}
            </div>
            <span class="chat-time">{{ formatHora(msg.fechaEnvio) }}</span>
          </div>
        }

        @if (!cargando() && chatSvc.mensajes().length === 0) {
          <p style="color:var(--text-sub); text-align:center; margin-top:40px; font-size:14px;">
            Aún no hay mensajes. ¡Di algo!
          </p>
        }
      </div>

      <div class="chat-input-bar">
        <input type="text" placeholder="Escribe un mensaje..." style="flex:1;"
               [(ngModel)]="texto"
               (keydown.enter)="enviar()">
        <button class="btn btn--primary" style="padding:11px 18px;"
                [disabled]="!chatSvc.conectado()"
                (click)="enviar()">
          Enviar
        </button>
      </div>
    </div>
  `
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatArea') chatArea!: ElementRef<HTMLDivElement>;

  texto      = '';
  cargando   = signal(true);
  ultimoMatch = signal('');
  usuarioId  = 0;

  private matchesYaVistos = 0;

  constructor(
      public chatSvc: ChatService,
      public state: SalaStateService,
      private auth: AuthService
  ) {}

  ngOnInit(): void {
    const u      = this.auth.usuario() as Usuario;
    const token  = this.auth.token()!;
    const salaId = this.state.salaId()!;
    this.usuarioId = u?.id ?? 0;

    // 1. Cargar historial — el servicio escribe en el signal directamente
    this.chatSvc.cargarHistorial(salaId);
    this.cargando.set(false);

    // 2. Conectar WebSocket (si ya está conectado, el servicio lo ignora)
    this.chatSvc.conectar(salaId, token);

    // 3. Guardar cuántos matches había antes de entrar al chat
    //    para mostrar solo los nuevos que lleguen por WS
    this.matchesYaVistos = this.chatSvc.matches().length;
  }

  ngAfterViewChecked(): void {
    // Mostrar banner si llegó un match nuevo por WS mientras se chatea
    const matchesActuales = this.chatSvc.matches();
    if (matchesActuales.length > this.matchesYaVistos) {
      const ultimo = matchesActuales[matchesActuales.length - 1];
      this.ultimoMatch.set(ultimo.contenido?.titulo ?? 'Nuevo match');
      this.matchesYaVistos = matchesActuales.length;
    }

    this.scrollAbajo();
  }

  ngOnDestroy(): void {
    // No desconectamos aquí — el WS sigue activo para recibir matches en swipe.
    // Llamar chatSvc.desconectar() solo desde ResultadosComponent.
  }

  enviar(): void {
    const texto = this.texto.trim();
    if (!texto || !this.chatSvc.conectado()) return;

    const salaId = this.state.salaId()!;
    this.chatSvc.enviarMensaje({
      salaId,
      usuarioId: this.usuarioId,
      texto
    });
    this.texto = '';
  }

  formatHora(fecha: string): string {
    return new Date(fecha).toLocaleTimeString('es-MX', {
      hour: '2-digit', minute: '2-digit'
    });
  }

  private scrollAbajo(): void {
    if (this.chatArea?.nativeElement) {
      const el = this.chatArea.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}