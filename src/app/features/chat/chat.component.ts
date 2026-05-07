import { Component, signal, OnInit, OnDestroy, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChatService } from '../../core/services/chat.service';
import { SalaStateService } from '../../core/services/sala-state.service';
import { AuthService } from '../../core/services/auth.service';
import { Mensaje, Usuario } from '../../core/models';

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

      @if (nuevoMatch()) {
        <div style="background:var(--accent); color:#0f0f0f; padding:12px 24px;
                    text-align:center; font-weight:500;">
          🎉 ¡Match! Encontraron: {{ nuevoMatch() }}
        </div>
      }

      <div class="chat-area" #chatArea>
        @if (cargando()) {
          <p style="color:var(--text-sub); text-align:center;">Cargando mensajes...</p>
        }
        @for (msg of chatSvc.mensajes(); track msg.id) {
          <div class="chat-msg" [class]="msg.usuarioId === usuarioId ? 'chat-msg--out' : 'chat-msg--in'">
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
      </div>

      <div class="chat-input-bar">
        <input type="text" placeholder="Escribe un mensaje..." style="flex:1;"
               [(ngModel)]="texto"
               (keydown.enter)="enviar()">
        <button class="btn btn--primary" style="padding:11px 18px;" (click)="enviar()">
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
  nuevoMatch = signal('');
  usuarioId  = 0;

  constructor(
    public chatSvc: ChatService,
    public state: SalaStateService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const u     = this.auth.usuario() as Usuario;
    const token = this.auth.token()!;
    const salaId = this.state.salaId()!;
    this.usuarioId = u?.id ?? 0;

    // Cargar historial REST
    this.chatSvc.getHistorial(salaId).subscribe({
      next: (msgs) => {
        this.chatSvc.mensajes.set(msgs);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });

    // Conectar WebSocket
    this.chatSvc.conectar(salaId, token);

    // Notificaciones de match nuevas
    // (las recibe el signal chatSvc.matches — podemos mostrarlo)
  }

  ngAfterViewChecked(): void {
    this.scrollAbajo();
  }

  ngOnDestroy(): void {
    // No desconectamos aquí para no interrumpir al navegar a Matches
    // Llamar desconectar() en Resultados
  }

  enviar(): void {
    if (!this.texto.trim()) return;
    const salaId = this.state.salaId()!;
    this.chatSvc.enviarMensaje({
      salaId,
      usuarioId: this.usuarioId,
      texto: this.texto.trim()
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
