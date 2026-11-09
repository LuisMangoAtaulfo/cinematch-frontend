import { APOLLO_OPTIONS, ApolloModule } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { ApolloClientOptions, InMemoryCache, ApolloLink, split } from '@apollo/client/core';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Configuración de Apollo Client para GraphQL.
 *
 * En Fase 0 solo se configura el HTTP link.
 * En Fase 3 se agregará el WebSocket link para subscriptions.
 */
export function createApollo(httpLink: HttpLink): ApolloClientOptions<any> {
  // Link base: todas las queries y mutations van por HTTP
  const http = httpLink.create({
    uri: `${environment.apiUrl}/graphql`,
  });

  return {
    link: http,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
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
