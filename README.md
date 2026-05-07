# CineMatch — Angular 19

Aplicación de matching de películas y series para parejas, migrada a Angular 19 con Standalone Components y Signals.

## Requisitos previos

- Node.js 18+
- Angular CLI 19: `npm install -g @angular/cli@19`
- Backend corriendo en `http://localhost:8080`
- API Key de TMDb: https://www.themoviedb.org/settings/api

## Setup

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar tu API Key de TMDb
# Edita src/environments/environment.ts y reemplaza 'TU_API_KEY_AQUI'

# 3. Iniciar en desarrollo
ng serve
# → http://localhost:4200
```

## Arquitectura

```
src/app/
├── core/
│   ├── models/          # Interfaces TypeScript (todos los tipos del API)
│   ├── services/
│   │   ├── auth.service.ts         # Login, registro, logout + signals
│   │   ├── sala.service.ts         # CRUD de salas
│   │   ├── sala-state.service.ts   # Estado reactivo compartido (signals)
│   │   ├── filtros.service.ts      # Filtros de contenido
│   │   ├── evaluaciones.service.ts # Swipe like/dislike
│   │   ├── matches.service.ts      # Matches por sala
│   │   ├── chat.service.ts         # REST + WebSocket STOMP
│   │   ├── calificacion.service.ts # Calificación final
│   │   ├── admin.service.ts        # Métricas, plataformas, retroalimentación
│   │   └── tmdb-facade.service.ts  # Facade TMDb (películas, series, géneros)
│   ├── guards/
│   │   └── auth.guard.ts           # authGuard + adminGuard
│   └── interceptors/
│       └── auth.interceptor.ts     # JWT Bearer automático
├── features/
│   ├── auth/login/                 # 02-login.html
│   ├── auth/registro/              # 01-registro.html
│   ├── home/                       # 03-home.html
│   ├── perfil/                     # 04-perfil.html
│   ├── sala/                       # 05-gestionar-sala.html
│   ├── filtros/                    # 06-filtros.html
│   ├── swipe/                      # 07-swipe.html
│   ├── matches/                    # 08-matches.html
│   ├── chat/                       # 09-chat.html (REST + WebSocket)
│   ├── resultados/                 # 10-resultados.html
│   ├── calificacion/               # 11-calificacion.html
│   └── admin/
│       ├── login/                  # 12-admin-login.html
│       ├── metricas/               # 13-admin-metricas.html
│       ├── plataformas/            # 14-admin-plataformas.html
│       └── retroalimentacion/      # 15-admin-retroalimentacion.html
├── app.routes.ts                   # Lazy loading + guards
├── app.config.ts                   # Providers (HttpClient + interceptors)
└── app.component.ts                # Root con <router-outlet>
```

## Rutas

| Ruta | Componente | Guard |
|------|-----------|-------|
| `/login` | LoginComponent | — |
| `/registro` | RegistroComponent | — |
| `/home` | HomeComponent | authGuard |
| `/perfil` | PerfilComponent | authGuard |
| `/sala` | SalaComponent | authGuard |
| `/filtros` | FiltrosComponent | authGuard |
| `/swipe` | SwipeComponent | authGuard |
| `/matches` | MatchesComponent | authGuard |
| `/chat` | ChatComponent | authGuard |
| `/resultados` | ResultadosComponent | authGuard |
| `/calificacion` | CalificacionComponent | authGuard |
| `/admin/login` | AdminLoginComponent | — |
| `/admin/metricas` | MetricasComponent | adminGuard |
| `/admin/plataformas` | PlataformasComponent | adminGuard |
| `/admin/retroalimentacion` | RetroalimentacionComponent | adminGuard |

## WebSocket (Chat)

El chat usa STOMP sobre WebSocket (`@stomp/stompjs`).

- **Conexión:** `ws://localhost:8080/ws`
- **Enviar:** `/app/chat.enviar`
- **Recibir mensajes:** `/topic/sala`
- **Recibir matches:** `/topic/sala/{salaId}/match`

## TMDb Facade

El frontend es responsable de consumir TMDb. El facade expone:

```typescript
TMDbFacadeService
  .peliculas.buscar(query)
  .peliculas.populares()
  .series.buscar(query)
  .series.populares()
  .generos.getPeliculas()
  .generos.getSeries()
  .getPosterUrl(path)   // → URL completa de imagen
```

## Variables de entorno

Edita `src/environments/environment.ts`:

```typescript
export const environment = {
  apiUrl:     'http://localhost:8080',   // Backend
  wsUrl:      'ws://localhost:8080/ws',  // WebSocket
  tmdbApiUrl: 'https://api.themoviedb.org/3',
  tmdbApiKey: 'TU_API_KEY_AQUI'          // ← Reemplazar
};
```
