import { gql } from 'apollo-angular';

export const MENSAJE_FRAGMENT = gql`
  fragment MensajeFields on Mensaje {
    id
    texto
    fechaEnvio
    usuarioId
    nombreUsuario
  }
`;

export const HISTORIAL_CHAT = gql`
  ${MENSAJE_FRAGMENT}
  query HistorialChat($salaId: ID!) {
    historialChat(salaId: $salaId) {
      ...MensajeFields
    }
  }
`;
