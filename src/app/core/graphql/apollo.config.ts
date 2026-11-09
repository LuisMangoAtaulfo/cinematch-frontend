import { APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache, split, ApolloLink, from } from '@apollo/client/core';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'cm_token';

/**
 * Configuración optimizada de Apollo Client para GraphQL.
 *
 * Optimizaciones:
 * - Type policies para mejor normalización del caché
 * - Split para enrutar queries/mutations por HTTP y subscriptions por WebSocket
 * - Fetch policies optimizadas para diferentes tipos de operaciones
 *
 * Nota: el token se lee directamente de localStorage (y no vía AuthService)
 * para evitar una dependencia circular entre Apollo ↔ AuthService.
 */
export function createApollo(httpLink: HttpLink): any {
  const http = httpLink.create({
    uri: `${environment.apiUrl}/graphql`,
  });

  const wsUrl = environment.apiUrl.replace(/^http/, 'ws');
  const ws = new GraphQLWsLink(
    createClient({
      url: `${wsUrl}/graphql`,
      connectionParams: () => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return {};
        return { authToken: token };
      },
      // Reconexión automática con backoff exponencial
      retryAttempts: 5,
      shouldRetry: () => true,
    }),
  );

  const link: ApolloLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    ws,
    http,
  );

  // Caché optimizado con type policies para mejor normalización
  const cache = new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Configurar cómo se cachean las queries específicas
          contenidoPorSala: {
            keyArgs: ['salaId'],
            merge(existing, incoming) {
              return incoming;
            },
          },
          buscarMatches: {
            keyArgs: ['salaId'],
            merge(existing, incoming) {
              return incoming;
            },
          },
          obtenerSala: {
            keyArgs: ['id'],
          },
          obtenerPerfil: {
            keyArgs: ['id'],
          },
        },
      },
      Sala: {
        keyFields: ['id'],
      },
      Usuario: {
        keyFields: ['id'],
      },
      Match: {
        keyFields: ['id'],
      },
      Mensaje: {
        keyFields: ['id'],
      },
      Contenido: {
        keyFields: ['contenidoId'],
      },
      Plataforma: {
        keyFields: ['id'],
      },
    },
  });

  return {
    link,
    cache,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first',
      },
      query: {
        fetchPolicy: 'cache-first',
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
  };
}

export const apolloProviders = [
  {
    provide: APOLLO_OPTIONS,
    useFactory: () => createApollo(inject(HttpLink)),
    deps: [HttpLink],
  },
];
