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

export const METRICAS_USUARIO_FRAGMENT = gql`
  fragment MetricasUsuarioFields on MetricasUsuario {
    totalSalas
    salasActivas
    totalMatches
    promedioCalificacion
    totalEvaluaciones
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

export const OBTENER_METRICAS_USUARIO = gql`
  ${METRICAS_USUARIO_FRAGMENT}
  query ObtenerMetricasUsuario($id: ID!) {
    metricasUsuario(id: $id) {
      ...MetricasUsuarioFields
    }
  }
`;

export const HISTORIAL_METRICAS_USUARIO = gql`
  ${METRICAS_DIA_FRAGMENT}
  query HistorialMetricasUsuario($id: ID!) {
    historialMetricasUsuario(id: $id) {
      ...MetricasDiaFields
    }
  }
`;

