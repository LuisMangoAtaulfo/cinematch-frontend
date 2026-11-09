import { gql } from 'apollo-angular';

export const METRICAS_FRAGMENT = gql`
  fragment MetricasFields on Metricas {
    totalSalas
    salasActivas
    totalMatches
    promedioCalificacion
  }
`;

export const METRICAS_DIA_FRAGMENT = gql`
  fragment MetricasDiaFields on MetricasDia {
    fecha
    totalSalas
    salasActivas
    totalMatches
    promedioCalificacion
  }
`;

export const OBTENER_METRICAS = gql`
  ${METRICAS_FRAGMENT}
  query ObtenerMetricas {
    metricas {
      ...MetricasFields
    }
  }
`;

export const HISTORIAL_METRICAS = gql`
  ${METRICAS_DIA_FRAGMENT}
  query HistorialMetricas {
    historialMetricas {
      ...MetricasDiaFields
    }
  }
`;
