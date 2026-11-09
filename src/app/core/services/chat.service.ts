import { Injectable, signal } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EnviarMensajeRequest, Match, Mensaje } from '../models';
import { HISTORIAL_CHAT } from '../graphql/queries';
import { ENVIAR_MENSAJE } from '../graphql/mutations';
import {
  SUSCRIBIR_MENSAJE_RECIBIDO,
  SUSCRIBIR_MATCH_DETECTADO,
  SUSCRIBIR_SALA_FINALIZADA
} from '../graphql/subscriptions';

@Injectable({ providedIn: 'root' })
export class ChatService {
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

  // Subscriptions activas
  private subscriptions: any[] = [];
  private salaIdActual: number | null = null;

  constructor(private apollo: Apollo) {}

  // ── GraphQL Queries ──────────────────────────────────

  getHistorial(salaId: number): Observable<Mensaje[]> {
    return this.apollo
      .watchQuery<{ historialChat: Mensaje[] }>({
        query: HISTORIAL_CHAT,
        variables: { salaId }
      })
      .valueChanges.pipe(map(result => result.data?.historialChat as Mensaje[] ?? []));
  }

  cargarHistorial(salaId: number): void {
    this.apollo
      .watchQuery<{ historialChat: Mensaje[] }>({
        query: HISTORIAL_CHAT,
        variables: { salaId }
      })
      .valueChanges.subscribe({
        next: (result) => {
          const msgs = result.data?.historialChat as Mensaje[] ?? [];
          const idsHistorial = new Set(msgs.map(m => m.id));
          const extras = this._mensajes().filter(m => !idsHistorial.has(m.id));
          this._mensajes.set([...msgs, ...extras]);
        },
        error: () => {}
      });
  }

  enviarMensaje(body: EnviarMensajeRequest): void {
    this.apollo
      .mutate<{ enviarMensaje: Mensaje }>({
        mutation: ENVIAR_MENSAJE,
        variables: { input: body }
      })
      .subscribe({
        error: (err) => console.error('Error enviando mensaje:', err)
      });
  }

  // ── GraphQL Subscriptions (reemplaza STOMP) ──────────

  /**
   * Conecta a las suscripciones GraphQL para la sala.
   * Reemplaza la conexión STOMP anterior.
   */
  conectar(salaId: number, token: string, usuarioId?: number): void {
    if (this._conectado() && this.salaIdActual === salaId) return;

    // Desconectar suscripciones anteriores si las hay
    this.desconectar();

    this.salaIdActual = salaId;
    this._conectado.set(true);

    // Suscribirse a mensajes de chat
    const mensajeSub = this.apollo
      .subscribe<{ mensajeRecibido: Mensaje }>({
        query: SUSCRIBIR_MENSAJE_RECIBIDO,
        variables: { salaId }
      })
      .subscribe({
        next: (result) => {
          const mensaje = result.data!.mensajeRecibido as Mensaje;
          this._mensajes.update(prev => [...prev, mensaje]);
        },
        error: (err) => console.error('Error en suscripción de mensajes:', err)
      });

    // Suscribirse a matches detectados
    const matchSub = this.apollo
      .subscribe<{ matchDetectado: Match }>({
        query: SUSCRIBIR_MATCH_DETECTADO,
        variables: { salaId }
      })
      .subscribe({
        next: (result) => {
          const match = result.data!.matchDetectado as Match;
          this._matches.update(prev => [...prev, match]);
        },
        error: (err) => console.error('Error en suscripción de matches:', err)
      });

    // Suscribirse a sala finalizada
    const salaSub = this.apollo
      .subscribe<{ salaFinalizada: boolean }>({
        query: SUSCRIBIR_SALA_FINALIZADA,
        variables: { salaId }
      })
      .subscribe({
        next: (result) => {
          this._finalizada.set(result.data!.salaFinalizada);
        },
        error: (err) => console.error('Error en suscripción de sala:', err)
      });

    this.subscriptions = [mensajeSub, matchSub, salaSub];
  }

  /**
   * Desconecta el WebSocket y resetea TODO el estado del servicio.
   *
   * CRÍTICO: _finalizada debe quedar en false. Si queda en true y el usuario
   * inicia una nueva sala, el effect() en SwipeComponent la detecta al arrancar
   * y navega solo a /resultados sin que el usuario haga nada.
   */
  desconectar(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
    this.salaIdActual = null;
    this._mensajes.set([]);
    this._matches.set([]);
    this._finalizada.set(false);            // ← causa raíz del bug "no finaliza"
    this._conectado.set(false);
    this._companeroDesconectado.set(false);
    this._nombreCompanero.set('');
  }
}
