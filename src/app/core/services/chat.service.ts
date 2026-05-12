import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import { EnviarMensajeRequest, Match, Mensaje } from '../models';
import { environment } from '../../../environments/environment';

/** Presence event emitted by the backend via WebSocket */
interface PresenciaEvento {
  usuarioId: number;
  estado: 'CONECTADO' | 'DESCONECTADO';
  nombreUsuario?: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly base = `${environment.apiUrl}/api/chat`;
  private stompClient: Client | null = null;
  private miUsuarioId = 0;

  // -- Signals --
  private readonly _mensajes              = signal<Mensaje[]>([]);
  private readonly _matches               = signal<Match[]>([]);
  private readonly _conectado             = signal(false);
  private readonly _finalizada            = signal(false);
  private readonly _companeroDesconectado = signal(false);
  private readonly _nombreCompanero       = signal<string>('Tu companero');

  // Public readonly
  readonly mensajes              = this._mensajes.asReadonly();
  readonly matches               = this._matches.asReadonly();
  readonly conectado             = this._conectado.asReadonly();
  readonly finalizada            = this._finalizada.asReadonly();
  readonly companeroDesconectado = this._companeroDesconectado.asReadonly();
  readonly nombreCompanero       = this._nombreCompanero.asReadonly();

  constructor(private http: HttpClient) {}

  // -- REST --
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

  // -- WebSocket --
  conectar(salaId: number, token: string, usuarioId?: number): void {
    if (this.stompClient?.active) return;

    if (usuarioId !== undefined) {
      this.miUsuarioId = usuarioId;
    }

    this.stompClient = new Client({
      brokerURL: environment.wsUrl,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,

      onConnect: () => {
        this._conectado.set(true);

        // Header required by the backend to identify the subscriber
        const headers = { 'usuario-id': String(this.miUsuarioId) };

        // -- Chat messages --
        this.stompClient!.subscribe(
            `/topic/sala/${salaId}`,
            (msg: IMessage) => {
              const mensaje: Mensaje = JSON.parse(msg.body);
              this._mensajes.update(prev => [...prev, mensaje]);
            },
            headers
        );

        // -- Matches --
        this.stompClient!.subscribe(
            `/topic/sala/${salaId}/match`,
            (msg: IMessage) => {
              const match: Match = JSON.parse(msg.body);
              this._matches.update(prev => [...prev, match]);
            },
            headers
        );

        // -- Session ended --
        this.stompClient!.subscribe(
            `/topic/sala/${salaId}/finalizar`,
            () => {
              this._finalizada.set(true);
            },
            headers
        );

        // -- Partner presence --
        // Payload: { usuarioId, estado: 'CONECTADO' | 'DESCONECTADO', nombreUsuario }
        this.stompClient!.subscribe(
            `/topic/sala/${salaId}/presencia`,
            (msg: IMessage) => {
              const evento: PresenciaEvento = JSON.parse(msg.body);

              // Only react to events from the OTHER user
              if (evento.usuarioId === this.miUsuarioId) return;

              if (evento.estado === 'DESCONECTADO') {
                if (evento.nombreUsuario) {
                  this._nombreCompanero.set(evento.nombreUsuario);
                }
                this._companeroDesconectado.set(true);
              } else if (evento.estado === 'CONECTADO') {
                this._companeroDesconectado.set(false);
              }
            }
            // No usuario-id header here -- this topic only receives, does not identify
        );
      },

      onDisconnect: () => {
        this._conectado.set(false);
      },

      onWebSocketClose: () => {
        this._conectado.set(false);
      },

      onStompError: () => {
        this._conectado.set(false);
      }
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
    this._mensajes.set([]);
    this._matches.set([]);
    this._finalizada.set(false);
    this._conectado.set(false);
    this._companeroDesconectado.set(false);
    this._nombreCompanero.set('Tu companero');
  }
}