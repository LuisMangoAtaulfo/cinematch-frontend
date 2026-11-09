import { gql } from 'apollo-angular';

export const CONTENIDO_POR_SALA = gql`
  query ContenidoPorSala($salaId: ID!) {
    contenidoPorSala(salaId: $salaId) {
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
