import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import { EnviarMensajeRequest, Match, Mensaje } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly base = `${environment.apiUrl}/api/chat`;
  private stompClient: Client | null = null;

  // ── Signals reactivos ─────────────────────────────────
  readonly mensajes = signal<Mensaje[]>([]);
  readonly matches  = signal<Match[]>([]);
  readonly conectado = signal(false);

  constructor(private http: HttpClient) {}

  // ── REST ──────────────────────────────────────────────
  getHistorial(salaId: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.base}/${salaId}`);
  }

  // ── WebSocket ─────────────────────────────────────────
  conectar(salaId: number, token: string): void {
    this.stompClient = new Client({
      brokerURL: environment.wsUrl,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        this.conectado.set(true);

        // Recibir mensajes de chat
        this.stompClient!.subscribe('/topic/sala', (msg: IMessage) => {
          const mensaje: Mensaje = JSON.parse(msg.body);
          this.mensajes.update(prev => [...prev, mensaje]);
        });

        // Recibir notificaciones de match
        this.stompClient!.subscribe(
          `/topic/sala/${salaId}/match`,
          (msg: IMessage) => {
            const match: Match = JSON.parse(msg.body);
            this.matches.update(prev => [...prev, match]);
          }
        );
      },
      onDisconnect: () => this.conectado.set(false)
    });

    this.stompClient.activate();
  }

  enviarMensaje(body: EnviarMensajeRequest): void {
    if (!this.stompClient?.connected) return;
    this.stompClient.publish({
      destination: '/app/chat.enviar',
      body: JSON.stringify(body)
    });
  }

  desconectar(): void {
    this.stompClient?.deactivate();
    this.stompClient = null;
    this.mensajes.set([]);
    this.matches.set([]);
    this.conectado.set(false);
  }
}
