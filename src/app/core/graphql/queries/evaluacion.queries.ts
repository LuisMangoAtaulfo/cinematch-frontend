import { gql } from 'apollo-angular';

export const COMPARAR_EVALUACIONES = gql`
  query CompararEvaluaciones($salaId: ID!, $contenidoId: String!) {
    compararEvaluaciones(salaId: $salaId, contenidoId: $contenidoId)
  }
`;
