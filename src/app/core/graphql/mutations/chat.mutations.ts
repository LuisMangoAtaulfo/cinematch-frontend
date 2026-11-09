import { gql } from 'apollo-angular';
import { MENSAJE_FRAGMENT } from '../queries/chat.queries';

export const ENVIAR_MENSAJE = gql`
  ${MENSAJE_FRAGMENT}
  mutation EnviarMensaje($input: MensajeInput!) {
    enviarMensaje(input: $input) {
      ...MensajeFields
    }
  }
`;
