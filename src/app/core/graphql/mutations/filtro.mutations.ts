import { gql } from 'apollo-angular';
import { CONTENIDO_FRAGMENT } from '../queries/match.queries';

export const APLICAR_FILTROS = gql`
  ${CONTENIDO_FRAGMENT}
  mutation AplicarFiltros($input: FiltroInput!) {
    aplicarFiltros(input: $input) {
      ...ContenidoFields
    }
  }
`;
