import { gql } from 'apollo-angular';

export const CONTENIDO_FRAGMENT = gql`
  fragment ContenidoFields on Contenido {
    contenidoId
    titulo
    anio
    tipo
    genero
    imagen
    plataformas
  }
`;

export const MATCH_FRAGMENT = gql`
  fragment MatchFields on Match {
    id
    fechaDeteccion
    contenido {
      contenidoId
      titulo
      anio
      tipo
      genero
      imagen
      plataformas
    }
  }
`;

export const BUSCAR_MATCHES = gql`
  ${MATCH_FRAGMENT}
  query BuscarMatches($salaId: ID!) {
    buscarMatches(salaId: $salaId) {
      ...MatchFields
    }
  }
`;

export const OBTENER_MATCHES_SALA = gql`
  ${MATCH_FRAGMENT}
  query ObtenerMatchesSala($id: ID!) {
    obtenerMatchesSala(id: $id) {
      ...MatchFields
    }
  }
`;
