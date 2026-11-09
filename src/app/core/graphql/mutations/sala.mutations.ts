import { gql } from 'apollo-angular';
import { SALA_FRAGMENT } from '../queries/sala.queries';

export const CREAR_SALA = gql`
  ${SALA_FRAGMENT}
  mutation CrearSala($input: CrearSalaInput!) {
    crearSala(input: $input) {
      ...SalaFields
    }
  }
`;

export const UNIRSE_A_SALA = gql`
  ${SALA_FRAGMENT}
  mutation UnirseASala($input: UnirseSalaInput!) {
    unirseASala(input: $input) {
      ...SalaFields
    }
  }
`;

export const FINALIZAR_SALA = gql`
  mutation FinalizarSala($id: ID!) {
    finalizarSala(id: $id)
  }
`;
