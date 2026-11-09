import { gql } from 'apollo-angular';

export const EVALUAR_CONTENIDO = gql`
  mutation EvaluarContenido($input: EvaluacionInput!) {
    evaluarContenido(input: $input)
  }
`;
