import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Apollo } from 'apollo-angular';
import { Subscription } from 'rxjs';
import {
  SUSCRIBIR_MENSAJE_RECIBIDO,
  SUSCRIBIR_MATCH_DETECTADO,
  SUSCRIBIR_SALA_FINALIZADA
} from '../core/graphql/subscriptions';

@Component({
  selector: 'app-subscription-test',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4">
      <h2 class="text-xl font-bold mb-4">Prueba de Subscriptions GraphQL</h2>

      <div class="mb-4">
        <label class="block mb-2">Sala ID:</label>
        <input
          type="number"
          [(ngModel)]="salaId"
          class="border px-2 py-1 rounded"
          placeholder="Ingrese el ID de la sala"
        />
        <button
          (click)="suscribirse()"
          class="ml-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Suscribirse
        </button>
        <button
          (click)="desuscribirse()"
          class="ml-2 px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Desuscribirse
        </button>
      </div>

      <div *ngIf="mensajes.length > 0" class="mb-4">
        <h3 class="font-bold">Mensajes recibidos:</h3>
        <ul class="list-disc pl-5">
          <li *ngFor="let msg of mensajes">
            Usuario {{ msg.usuarioId }}: {{ msg.texto }} ({{ msg.fechaEnvio }})
          </li>
        </ul>
      </div>

      <div *ngIf="matches.length > 0" class="mb-4">
        <h3 class="font-bold">Matches detectados:</h3>
        <ul class="list-disc pl-5">
          <li *ngFor="let match of matches">
            Match {{ match.id }} - {{ match.contenido?.titulo }}
          </li>
        </ul>
      </div>

      <div *ngIf="salaFinalizada" class="mb-4">
        <p class="text-red-500 font-bold">¡La sala ha sido finalizada!</p>
      </div>

      <div class="mt-4 p-4 bg-gray-100 rounded">
        <h3 class="font-bold mb-2">Estado:</h3>
        <p>Suscrito: {{ estaSuscrito ? 'Sí' : 'No' }}</p>
        <p>Mensajes: {{ mensajes.length }}</p>
        <p>Matches: {{ matches.length }}</p>
      </div>
    </div>
  `,
})
export class SubscriptionTestComponent implements OnInit, OnDestroy {
  salaId: number = 1;
  mensajes: any[] = [];
  matches: any[] = [];
  salaFinalizada: boolean = false;
  estaSuscrito: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(private apollo: Apollo) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.desuscribirse();
  }

  suscribirse(): void {
    if (!this.salaId) {
      alert('Ingrese un ID de sala válido');
      return;
    }

    this.desuscribirse(); // Limpiar suscripciones anteriores

    console.log(`Suscribiéndose a sala ${this.salaId}...`);

    // Suscribirse a mensajes
    const mensajeSub = this.apollo
      .subscribe({
        query: SUSCRIBIR_MENSAJE_RECIBIDO,
        variables: { salaId: this.salaId },
      })
      .subscribe({
        next: (result: any) => {
          console.log('Mensaje recibido:', result);
          this.mensajes.push(result.data.mensajeRecibido);
        },
        error: (err) => console.error('Error en suscripción de mensajes:', err),
      });

    // Suscribirse a matches
    const matchSub = this.apollo
      .subscribe({
        query: SUSCRIBIR_MATCH_DETECTADO,
        variables: { salaId: this.salaId },
      })
      .subscribe({
        next: (result: any) => {
          console.log('Match detectado:', result);
          this.matches.push(result.data.matchDetectado);
        },
        error: (err) => console.error('Error en suscripción de matches:', err),
      });

    // Suscribirse a sala finalizada
    const salaSub = this.apollo
      .subscribe({
        query: SUSCRIBIR_SALA_FINALIZADA,
        variables: { salaId: this.salaId },
      })
      .subscribe({
        next: (result: any) => {
          console.log('Sala finalizada:', result);
          this.salaFinalizada = result.data.salaFinalizada;
        },
        error: (err) => console.error('Error en suscripción de sala:', err),
      });

    this.subscriptions = [mensajeSub, matchSub, salaSub];
    this.estaSuscrito = true;
    console.log('Suscripciones activas');
  }

  desuscribirse(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
    this.estaSuscrito = false;
    this.mensajes = [];
    this.matches = [];
    this.salaFinalizada = false;
    console.log('Desuscrito de todas las suscripciones');
  }
}
