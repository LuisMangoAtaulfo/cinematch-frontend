import { gql } from 'apollo-angular';

export const USUARIO_FRAGMENT = gql`
  fragment UsuarioFields on Usuario {
    id
    nombre
    correo
    descripcion
    rol
  }
`;

export const OBTENER_PERFIL = gql`
  ${USUARIO_FRAGMENT}
  query ObtenerPerfil($id: ID!) {
    obtenerPerfil(id: $id) {
      ...UsuarioFields
    }
  }
`;
