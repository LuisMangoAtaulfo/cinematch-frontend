import { gql } from 'apollo-angular';

export const CAMBIAR_ESTADO_PLATAFORMA = gql`
  mutation CambiarEstadoPlataforma($input: PlataformaEstadoInput!) {
    cambiarEstadoPlataforma(input: $input)
  }
`;
