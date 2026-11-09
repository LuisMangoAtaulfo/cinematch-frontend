import { gql } from 'apollo-angular';
import { MENSAJE_FRAGMENT } from '../queries/chat.queries';
import { MATCH_FRAGMENT } from '../queries/match.queries';

export const SUSCRIBIR_MENSAJE_RECIBIDO = gql`
  ${MENSAJE_FRAGMENT}
  subscription MensajeRecibido($salaId: ID!) {
    mensajeRecibido(salaId: $salaId) {
      ...MensajeFields
    }
  }
`;

export const SUSCRIBIR_MATCH_DETECTADO = gql`
  ${MATCH_FRAGMENT}
  subscription MatchDetectado($salaId: ID!) {
    matchDetectado(salaId: $salaId) {
      ...MatchFields
    }
  }
`;

export const SUSCRIBIR_SALA_FINALIZADA = gql`
  subscription SalaFinalizada($salaId: ID!) {
    salaFinalizada(salaId: $salaId)
  }
`;
