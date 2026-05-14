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
  private readonly _mensajes              = signal<Mensaje[]>([]);
  private readonly _matches               = signal<Match[]>([]);
  private readonly _conectado             = signal(false);
  private readonly _finalizada            = signal(false);
  private readonly _companeroDesconectado = signal(false);
  private readonly _nombreCompanero       = signal('');

  readonly mensajes              = this._mensajes.asReadonly();
  readonly matches               = this._matches.asReadonly();
  readonly conectado             = this._conectado.asReadonly();
  readonly finalizada            = this._finalizada.asReadonly();
  readonly companeroDesconectado = this._companeroDesconectado.asReadonly();
  readonly nombreCompanero       = this._nombreCompanero.asReadonly();

  constructor(private http: HttpClient) {}

  // ── REST ──────────────────────────────────────────────

  getHistorial(salaId: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.base}/${salaId}`);
  }

  cargarHistorial(salaId: number): void {
    this.getHistorial(salaId).subscribe({
      next: (msgs) => {
        const idsHistorial = new Set(msgs.map(m => m.id));
        const extras = this._mensajes().filter(m => !idsHistorial.has(m.id));
        this._mensajes.set([...msgs, ...extras]);
      },
      error: () => {}
    });
  }

  // ── WebSocket ─────────────────────────────────────────

  conectar(salaId: number, token: string, usuarioId?: number): void {
    if (this.stompClient?.active) return;

    this.stompClient = new Client({
      brokerURL: environment.wsUrl,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        this._conectado.set(true);

        // Mensajes de chat
        this.stompClient!.subscribe(
            `/topic/sala/${salaId}`,
            (msg: IMessage) => {
              const mensaje: Mensaje = JSON.parse(msg.body);
              this._mensajes.update(prev => [...prev, mensaje]);
            }
        );

        // Notificaciones de match
        this.stompClient!.subscribe(
            `/topic/sala/${salaId}/match`,
            (msg: IMessage) => {
              const match: Match = JSON.parse(msg.body);
              this._matches.update(prev => [...prev, match]);
            }
        );

        // Notificación de sala finalizada
        this.stompClient!.subscribe(
            `/topic/sala/${salaId}/finalizar`,
            () => {
              this._finalizada.set(true);
            }
        );
      },
      onDisconnect: () => this._conectado.set(false)
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

  /**
   * Desconecta el WebSocket y resetea TODO el estado del servicio.
   *
   * CRÍTICO: _finalizada debe quedar en false. Si queda en true y el usuario
   * inicia una nueva sala, el effect() en SwipeComponent la detecta al arrancar
   * y navega solo a /resultados sin que el usuario haga nada.
   */
  desconectar(): void {
    this.stompClient?.deactivate();
    this.stompClient = null;
    this._mensajes.set([]);
    this._matches.set([]);
    this._finalizada.set(false);            // ← causa raíz del bug "no finaliza"
    this._conectado.set(false);
    this._companeroDesconectado.set(false);
    this._nombreCompanero.set('');
  }
}