import { gql } from 'apollo-angular';

export const CALIFICACION_FRAGMENT = gql`
  fragment CalificacionFields on Calificacion {
    id
    valor
    fecha
    usuarioId
    salaId
  }
`;

export const OBTENER_RETROALIMENTACION = gql`
  ${CALIFICACION_FRAGMENT}
  query ObtenerRetroalimentacion {
    retroalimentacion {
      ...CalificacionFields
    }
  }
`;

export const PROMEDIO_CALIFICACION = gql`
  query PromedioCalificacion {
    promedioCalificacion
  }
`;
