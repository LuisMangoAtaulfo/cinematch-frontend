import { gql } from 'apollo-angular';
import { USUARIO_FRAGMENT } from '../queries/usuario.queries';

export const ACTUALIZAR_PERFIL = gql`
  ${USUARIO_FRAGMENT}
  mutation ActualizarPerfil($id: ID!, $input: PerfilInput!) {
    actualizarPerfil(id: $id, input: $input) {
      ...UsuarioFields
    }
  }
`;
