// ── Auth ──────────────────────────────────────────────
export interface LoginRequest {
  correo: string;
  password: string;
}

export interface RegistroRequest {
  nombre: string;
  correo: string;
  password: string;
}

export interface AuthResponse {
  id: number;
  token: string;
  nombre: string | null;
  correo: string;
}

// ── Usuario ───────────────────────────────────────────
export type Rol = 'USUARIO' | 'ADMINISTRADOR';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  descripcion: string;
  rol: Rol;
}

export interface PerfilUpdateRequest {
  nombre: string;
  descripcion: string;
}

// ── Sala ──────────────────────────────────────────────
export type EstadoSala = 'ESPERANDO' | 'ACTIVA' | 'FINALIZADA';

export interface Sala {
  id: number;
  codigo: string;
  estado: EstadoSala;
  fechaCreacion: string;
  usuario1: Usuario;
  usuario2: Usuario | null;
}

export interface CrearSalaRequest {
  usuarioId: number;
}

export interface UnirseRequest {
  codigo: string;
  usuarioId: number;
}

// ── Contenido ─────────────────────────────────────────
export type TipoContenido = 'PELICULA' | 'SERIE';

export type GeneroContenido =
  | 'ACCION' | 'AVENTURA' | 'ANIMACION' | 'COMEDIA'
  | 'CRIMEN' | 'DOCUMENTAL' | 'DRAMA' | 'FANTASIA'
  | 'HORROR' | 'MISTERIO' | 'ROMANCE' | 'CIENCIA_FICCION'
  | 'THRILLER' | 'WESTERN';

export interface Contenido {
  contenidoId: string;
  titulo: string;
  anio: number;
  tipo: TipoContenido;
  genero: GeneroContenido;
  imagen: string;
}

// ── Filtros ───────────────────────────────────────────
export interface FiltrosRequest {
  salaId: number;
  tipo?: TipoContenido;
  genero?: GeneroContenido;
  plataforma?: string;
}

// ── Evaluaciones ──────────────────────────────────────
export interface EvaluacionRequest {
  salaId: number;
  usuarioId: number;
  contenidoId: string;
  decision: boolean;
}

// ── Matches ───────────────────────────────────────────
export interface Match {
  id: number;
  fechaDeteccion: string;
  contenido: Contenido | null;
}

// ── Chat ──────────────────────────────────────────────
export interface Mensaje {
  id: number;
  texto: string;
  fechaEnvio: string;
  usuarioId: number;
  nombreUsuario: string;
}

export interface EnviarMensajeRequest {
  salaId: number;
  usuarioId: number;
  texto: string;
}

// ── Calificaciones ────────────────────────────────────
export interface CalificacionRequest {
  salaId: number;
  usuarioId: number;
  valor: number;
}

export interface CalificacionResponse {
  id: number;
  valor: number;
  fecha: string;
  usuarioId: number;
  salaId: number;
}

// ── Métricas ──────────────────────────────────────────
export interface Metricas {
  totalSalas: number;
  salasActivas: number;
  totalMatches: number;
  promedioCalificacion: number;
}

// ── Plataformas ───────────────────────────────────────
export interface Plataforma {
  id: number;
  nombre: string;
  habilitada: boolean;
}

export interface PlataformaEstadoRequest {
  id: number;
  habilitada: boolean;
}

// ── TMDb (Facade) ─────────────────────────────────────
export interface TMDbMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  genre_ids: number[];
  vote_average: number;
}

export interface TMDbSerie {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  poster_path: string | null;
  genre_ids: number[];
  vote_average: number;
}

export interface TMDbGenero {
  id: number;
  name: string;
}

export interface TMDbResponse<T> {
  results: T[];
  total_results: number;
  total_pages: number;
  page: number;
}
