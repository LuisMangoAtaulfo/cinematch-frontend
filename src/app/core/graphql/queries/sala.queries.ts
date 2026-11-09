import { gql } from 'apollo-angular';

export const SALA_FRAGMENT = gql`
  fragment SalaFields on Sala {
    id
    codigo
    estado
    fechaCreacion
    usuario1 {
      id
      nombre
      correo
    }
    usuario2 {
      id
      nombre
      correo
    }
  }
`;

export const OBTENER_SALA = gql`
  ${SALA_FRAGMENT}
  query ObtenerSala($id: ID!) {
    obtenerSala(id: $id) {
      ...SalaFields
    }
  }
`;
