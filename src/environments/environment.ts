export const environment = {
  production: false,
  apiUrl:     'http://localhost:8080',
  wsUrl:      'ws://localhost:8080/ws',
  tmdbApiUrl: 'https://api.themoviedb.org/3',
  tmdbApiKey: '',   // ← reemplaza con tu API Key de TMDb

  // ── Test mode ──────────────────────────────────────────
  testMode: true,  // Habilita endpoints de test

  // ── WebSocket reconnection ─────────────────────────────
  wsReconnectAttempts: 5,
  wsReconnectInterval: 3000,

  // ── Heartbeat ──────────────────────────────────────────
  heartbeatInterval: 5000,
};
