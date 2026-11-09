import { gql } from 'apollo-angular';

export const PLATAFORMA_FRAGMENT = gql`
  fragment PlataformaFields on Plataforma {
    id
    nombre
    habilitada
  }
`;

export const LISTAR_PLATAFORMAS = gql`
  ${PLATAFORMA_FRAGMENT}
  query ListarPlataformas {
    plataformas {
      ...PlataformaFields
    }
  }
`;

export const PLATAFORMA_EN_USO = gql`
  query PlataformaEnUso($id: ID!) {
    plataformaEnUso(id: $id)
  }
`;
