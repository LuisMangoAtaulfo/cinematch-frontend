export const environment = {
  production: true,
  apiUrl:     'https://api.mango-ataulfo.com',
  wsUrl:      'wss://api.mango-ataulfo.com/ws',
  tmdbApiUrl: 'https://api.themoviedb.org/3',
  tmdbApiKey: 'tu_api_key_de_tmdb',

  // ── Test mode ──────────────────────────────────────────
  testMode: false,

  // ── WebSocket reconnection ─────────────────────────────
  wsReconnectAttempts: 5,
  wsReconnectInterval: 3000,

  // ── Heartbeat ──────────────────────────────────────────
  heartbeatInterval: 5000,
};
