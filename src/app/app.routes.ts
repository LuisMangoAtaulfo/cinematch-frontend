import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ── Auth pública ──────────────────────────────────────
  {
    path: 'registro',
    loadComponent: () =>
        import('./features/auth/registro/registro.component').then(m => m.RegistroComponent)
  },
  {
    path: 'login',
    loadComponent: () =>
        import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },

  // ── App protegida ─────────────────────────────────────
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
        import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () =>
        import('./features/perfil/perfil.component').then(m => m.PerfilComponent)
  },
  {
    path: 'sala',
    canActivate: [authGuard],
    loadComponent: () =>
        import('./features/sala/sala.component').then(m => m.SalaComponent)
  },
  {
    path: 'filtros',
    canActivate: [authGuard],
    loadComponent: () =>
        import('./features/filtros/filtros.component').then(m => m.FiltrosComponent)
  },
  {
    path: 'espera-filtros',
    canActivate: [authGuard],
    loadComponent: () =>
        import('./features/sala/espera-filtros.component')
            .then(m => m.EsperaFiltrosComponent)
  },
  {
    path: 'swipe',
    canActivate: [authGuard],
    loadComponent: () =>
        import('./features/swipe/swipe.component').then(m => m.SwipeComponent)
  },
  {
    path: 'matches',
    canActivate: [authGuard],
    loadComponent: () =>
        import('./features/matches/matches.component').then(m => m.MatchesComponent)
  },
  {
    path: 'chat',
    canActivate: [authGuard],
    loadComponent: () =>
        import('./features/chat/chat.component').then(m => m.ChatComponent)
  },
  {
    path: 'resultados',
    canActivate: [authGuard],
    loadComponent: () =>
        import('./features/resultados/resultados.component').then(m => m.ResultadosComponent)
  },
  {
    path: 'calificacion',
    canActivate: [authGuard],
    loadComponent: () =>
        import('./features/calificacion/calificacion.component').then(m => m.CalificacionComponent)
  },

  // ── Admin ─────────────────────────────────────────────
  {
    path: 'admin/login',
    loadComponent: () =>
        import('./features/admin/login/admin-login.component').then(m => m.AdminLoginComponent)
  },
  {
    path: 'admin/metricas',
    canActivate: [adminGuard],
    loadComponent: () =>
        import('./features/admin/metricas/metricas.component').then(m => m.MetricasComponent)
  },
  {
    path: 'admin/plataformas',
    canActivate: [adminGuard],
    loadComponent: () =>
        import('./features/admin/plataformas/plataformas.component').then(m => m.PlataformasComponent)
  },
  {
    path: 'admin/retroalimentacion',
    canActivate: [adminGuard],
    loadComponent: () =>
        import('./features/admin/retroalimentacion/retroalimentacion.component')
            .then(m => m.RetroalimentacionComponent)
  },

  // ── Redirects ─────────────────────────────────────────
  { path: '',   redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' }
];