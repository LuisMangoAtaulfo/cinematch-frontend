import { gql } from 'apollo-angular';

export const AUTH_PAYLOAD_FRAGMENT = gql`
  fragment AuthPayloadFields on AuthPayload {
    token
    nombre
    correo
  }
`;

export const LOGIN = gql`
  ${AUTH_PAYLOAD_FRAGMENT}
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      ...AuthPayloadFields
    }
  }
`;

export const REGISTRAR = gql`
  ${AUTH_PAYLOAD_FRAGMENT}
  mutation Registrar($input: RegistroInput!) {
    registrar(input: $input) {
      ...AuthPayloadFields
    }
  }
`;

export const LOGIN_ADMIN = gql`
  ${AUTH_PAYLOAD_FRAGMENT}
  mutation LoginAdmin($input: LoginInput!) {
    loginAdmin(input: $input) {
      ...AuthPayloadFields
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

export const LOGOUT_ADMIN = gql`
  mutation LogoutAdmin {
    logoutAdmin
  }
`;
