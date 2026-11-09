import { gql } from 'apollo-angular';

export const REGISTRAR_CALIFICACION = gql`
  mutation RegistrarCalificacion($input: CalificacionInput!) {
    registrarCalificacion(input: $input)
  }
`;
