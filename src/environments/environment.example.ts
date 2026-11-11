export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  wsUrl: 'ws://localhost:8080/ws',
  tmdbApiUrl: 'https://api.themoviedb.org/3',
  tmdbApiKey: 'TU_API_KEY_AQUI',

  // ── Test mode ──────────────────────────────────────────
  testMode: true,

  // ── WebSocket reconnection ─────────────────────────────
  wsReconnectAttempts: 5,
  wsReconnectInterval: 3000,

  // ── Heartbeat ──────────────────────────────────────────
  heartbeatInterval: 5000,
};
