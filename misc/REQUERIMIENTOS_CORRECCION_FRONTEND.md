# Requerimientos de Corrección — FRONTEND
## Basado en fallos de ejecución del 10 de noviembre de 2026

**Estado actual:** 103 tests pasan, 40 fallan  
**Objetivo:** Corregir los 40 tests fallidos  
**Tests a recuperar:** 40 tests (28% del total)

---

## Índice

1. [Selector "Crear sala" no funciona](#r-fe-01-corregir-selector-crear-sala)
2. [Mensajes de error no coinciden](#r-fe-02-alinear-mensajes-de-error)
3. [Guards de autenticación no funcionan](#r-fe-03-implementar-guards-de-autenticación)
4. [Dashboard admin incompleto](#r-fe-04-completar-dashboard-admin)
5. [Botones de navegación faltantes](#r-fe-05-corregir-botones-de-navegación)
6. [Chat: navegación y enlaces](#r-fe-06-corregir-navegación-en-chat)
7. [Calificación: clase active](#r-fe-07-agregar-clase-active-en-calificación)

---

## R-FE-01: Corregir Selector "Crear sala"

### Estado
🔴 **CRÍTICO** — 17 tests fallan por este problema

### Problema
El selector `xpath=//a[contains(text(), 'Crear sala')]` no encuentra ningún elemento en la página home.

### Tests Afectados

| Test ID | Descripción | Impacto |
|---------|-------------|---------|
| TC-SALA-001 | Crear sala exitosamente | ❌ Setup falla |
| TC-SALA-002 | Código de sala tiene formato correcto | ❌ Setup falla |
| TC-SALA-003 | Copiar código de sala | ❌ Setup falla |
| TC-SALA-004 | Cancelar sala en espera | ❌ Setup falla |
| TC-SALA-006 | Unirse a sala con código válido | ❌ Setup falla |
| TC-SALA-011 | Espera de filtros muestra spinner | ❌ Setup falla |
| TC-SALA-012 | Cancelar desde espera de filtros | ❌ Setup falla |
| TC-SWIPE-001 | Evaluar Like con botón | ❌ Setup falla |
| TC-SWIPE-002 | Evaluar Dislike con botón | ❌ Setup falla |
| TC-SWIPE-003 | Evaluar Like arrastrando derecha | ❌ Setup falla |
| TC-SWIPE-004 | Evaluar Dislike arrastrando izquierda | ❌ Setup falla |
| TC-SWIPE-005 | Tarjeta muestra información completa | ❌ Setup falla |
| TC-SWIPE-011 | Navegar a matches desde swipe | ❌ Setup falla |
| TC-SWIPE-012 | Navegar a chat desde swipe | ❌ Setup falla |
| TC-SWIPE-013 | Finalizar sesión desde swipe | ❌ Setup falla |
| TC-E2E-005 | Flujo de cancelación de sala | ❌ Setup falla |
| TC-E2E-011 | Usuario se registra, crea sala y cancela | ❌ Setup falla |

### Requerimiento

**Opción A: Corregir el selector en `variables.robot`**

Verificar el elemento real en la home:

```javascript
// En consola del navegador en http://localhost:4200/home
document.querySelectorAll('a, button').forEach(el => {
  if (el.textContent.toLowerCase().includes('crear')) {
    console.log({
      tag: el.tagName,
      text: el.textContent.trim(),
      class: el.className,
      id: el.id
    });
  }
});
```

Luego actualizar `variables.robot`:

```robot
# Si es un botón:
${BTN_CREAR_SALA}      xpath=//button[contains(text(), 'Crear sala')]

# Si el texto es diferente:
${BTN_CREAR_SALA}      xpath=//a[contains(text(), 'Crear una sala')]
${BTN_CREAR_SALA}      xpath=//button[contains(., 'Crear')]
```

**Opción B: Corregir el componente home**

Archivo: `frontend/src/app/features/home/home.component.html`

```html
<!-- Opción 1: Enlace -->
<a routerLink="/sala/crear" class="btn-primary">Crear sala</a>
<a routerLink="/sala/unirse" class="btn-secondary">Unirse a sala</a>

<!-- Opción 2: Botón -->
<button (click)="crearSala()" class="btn-primary">Crear sala</button>
<button (click)="unirseSala()" class="btn-secondary">Unirse a sala</button>
```

### Criterios de Aceptación

| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | El elemento "Crear sala" existe en home | `document.querySelectorAll('a, button')` encuentra el elemento |
| 2 | El texto es exactamente "Crear sala" | `element.textContent.trim() === 'Crear sala'` |
| 3 | El selector de `variables.robot` funciona | Robot Framework encuentra el elemento |
| 4 | El elemento "Unirse a sala" también existe | Selector `${BTN_UNIRSE_SALA}` funciona |

### Archivos a Modificar

- `frontend/src/app/features/home/home.component.html`
- `frontend/src/app/features/home/home.component.ts` (si es necesario)
- `documentacion/robot/variables.robot` (si se cambia el selector)

---

## R-FE-02: Alinear Mensajes de Error

### Estado
🟡 **IMPORTANTE** — 8 tests fallan por este problema

### Problema
Los mensajes de error mostrados por el frontend no coinciden con los textos esperados por los tests.

### Tests Afectados

| Test ID | Descripción | Mensaje Esperado | Problema |
|---------|-------------|------------------|----------|
| TC-AUTH-006 | Login con campos vacíos | "Completa todos los campos" | No se muestra o texto diferente |
| TC-AUTH-007 | Login con correo vacío | "Completa todos los campos" | No se muestra o texto diferente |
| TC-AUTH-008 | Login con contraseña vacía | "Completa todos los campos" | No se muestra o texto diferente |
| TC-AUTH-015 | Registro con campos vacíos | "Completa todos los campos" | No se muestra o texto diferente |
| TC-ADMIN-002 | Login admin credenciales incorrectas | "Credenciales incorrectas" | No se muestra o texto diferente |
| TC-ADMIN-004 | Login admin campos vacíos | "Completa todos los campos" | No se muestra o texto diferente |
| TC-SALA-007 | Unirse con código inválido | "Código de sala inválido" | No se muestra o texto diferente |
| TC-PERF-004 | Perfil nombre vacío | "El nombre es requerido" | No se muestra o texto diferente |

### Requerimiento

**Paso 1: Verificar mensajes reales**

Ejecutar manualmente cada test y anotar el mensaje real mostrado:

```bash
# Test 1: Login con campos vacíos
1. Ir a http://localhost:4200/login
2. Click en "Iniciar sesión" sin llenar campos
3. Anotar el mensaje exacto mostrado

# Test 2: Login con correo inexistente
1. Ir a http://localhost:4200/login
2. Ingresar correo: noexiste@cinematch.com
3. Ingresar contraseña: Test1234
4. Click en "Iniciar sesión"
5. Anotar el mensaje exacto mostrado

# Repetir para cada test afectado
```

**Paso 2: Actualizar `variables.robot`**

Opción A: Cambiar los mensajes en el frontend para que coincidan con los tests

```typescript
// frontend/src/app/features/auth/login/login.component.ts
if (!correo || !password) {
  this.errorMessage = 'Completa todos los campos';
}

// frontend/src/app/features/auth/registro/registro.component.ts
if (!nombre || !correo || !password || !confirmPassword) {
  this.errorMessage = 'Completa todos los campos';
}
```

Opción B: Actualizar `variables.robot` con los mensajes reales

```robot
# Si el frontend muestra "Todos los campos son obligatorios":
${MSG_CAMPOS_VACIOS}        xpath=//*[contains(text(), 'Todos los campos son obligatorios')]

# Si el frontend muestra "Correo o contraseña incorrectos":
${MSG_CRED_INCORRECTAS}     xpath=//*[contains(text(), 'Correo o contraseña incorrectos')]

# Si el frontend muestra "El código no es válido":
${MSG_CODIGO_INVALIDO}      xpath=//*[contains(text(), 'El código no es válido')]

# Si el frontend muestra "El nombre es obligatorio":
${MSG_NOMBRE_REQUERIDO}     xpath=//*[contains(text(), 'El nombre es obligatorio')]
```

### Criterios de Aceptación

| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | Campos vacíos en login muestra mensaje correcto | Al dejar campos vacíos y hacer click, aparece el mensaje esperado |
| 2 | Credenciales incorrectas muestra mensaje correcto | Al usar credenciales erróneas, aparece el mensaje esperado |
| 3 | Código inválido muestra mensaje correcto | Al usar código inexistente, aparece el mensaje esperado |
| 4 | Nombre vacío en perfil muestra mensaje correcto | Al dejar nombre vacío y guardar, aparece el mensaje esperado |
| 5 | Los mensajes coinciden exactamente con `variables.robot` | Robot Framework encuentra los elementos |

### Archivos a Modificar

**Opción A (recomendada): Frontend**
- `frontend/src/app/features/auth/login/login.component.ts`
- `frontend/src/app/features/auth/registro/registro.component.ts`
- `frontend/src/app/features/admin/login/admin-login.component.ts`
- `frontend/src/app/features/sala/unirse/unirse.component.ts`
- `frontend/src/app/features/perfil/perfil.component.ts`

**Opción B: Robot Framework**
- `documentacion/robot/variables.robot`

---

## R-FE-03: Implementar Guards de Autenticación

### Estado
🟡 **IMPORTANTE** — 3 tests fallan por este problema

### Problema
Las rutas protegidas no redirigen a `/login` cuando el usuario no está autenticado o no tiene permisos.

### Tests Afectados

| Test ID | Descripción | URL Probada | Error |
|---------|-------------|-------------|-------|
| TC-SALA-005 | Sala requiere autenticación | `/sala/crear` | No redirige a `/login` |
| TC-SALA-010 | Unirse requiere autenticación | `/sala/unirse` | No redirige a `/login` |
| TC-ADMIN-019 | Rutas admin requieren autenticación | `/admin/metricas` | No redirige a `/login` |

### Requerimiento

**Paso 1: Crear/corregir `authGuard`**

Archivo: `frontend/src/app/core/guards/auth.guard.ts`

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  router.navigate(['/login']);
  return false;
};
```

**Paso 2: Crear/corregir `adminGuard`**

Archivo: `frontend/src/app/core/guards/admin.guard.ts`

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAdmin()) {
    return true;
  }
  
  router.navigate(['/login']);
  return false;
};
```

**Paso 3: Aplicar guards en rutas**

Archivo: `frontend/src/app/app.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Rutas públicas
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'admin/login', component: AdminLoginComponent },
  
  // Rutas protegidas para usuarios autenticados
  { 
    path: 'home', 
    component: HomeComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'sala/crear', 
    component: CrearSalaComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'sala/unirse', 
    component: UnirseSalaComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'perfil', 
    component: PerfilComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'filtros', 
    component: FiltrosComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'swipe', 
    component: SwipeComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'chat', 
    component: ChatComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'matches', 
    component: MatchesComponent,
    canActivate: [authGuard]
  },
  
  // Rutas protegidas para administradores
  { 
    path: 'admin/dashboard', 
    component: AdminDashboardComponent,
    canActivate: [authGuard, adminGuard]
  },
  { 
    path: 'admin/metricas', 
    component: AdminMetricasComponent,
    canActivate: [authGuard, adminGuard]
  },
  { 
    path: 'admin/plataformas', 
    component: AdminPlataformasComponent,
    canActivate: [authGuard, adminGuard]
  },
  { 
    path: 'admin/retroalimentacion', 
    component: AdminRetroalimentacionComponent,
    canActivate: [authGuard, adminGuard]
  },
  
  // Ruta wildcard
  { path: '**', redirectTo: '/home' }
];
```

**Paso 4: Implementar métodos en AuthService**

Archivo: `frontend/src/app/core/services/auth.service.ts`

```typescript
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'auth_token';
  private userKey = 'user_data';

  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    return !!token && !this.isTokenExpired(token);
  }

  isAdmin(): boolean {
    if (!this.isAuthenticated()) return false;
    
    const userData = JSON.parse(localStorage.getItem(this.userKey) || '{}');
    return userData.rol === 'ADMINISTRADOR';
  }

  private isTokenExpired(token: string): boolean {
    // Implementar validación de expiración JWT
    return false; // Placeholder
  }

  // ... otros métodos
}
```

### Criterios de Aceptación

| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | Usuario no autenticado es redirigido a /login al acceder a /sala/crear | URL cambia a `/login` |
| 2 | Usuario no autenticado es redirigido a /login al acceder a /sala/unirse | URL cambia a `/login` |
| 3 | Usuario normal es redirigido a /login al acceder a /admin/metricas | URL cambia a `/login` |
| 4 | Usuario autenticado puede acceder a rutas protegidas | No hay redirección |
| 5 | Admin puede acceder a rutas de admin | No hay redirección |

### Archivos a Modificar

- `frontend/src/app/core/guards/auth.guard.ts` (crear)
- `frontend/src/app/core/guards/admin.guard.ts` (crear)
- `frontend/src/app/core/services/auth.service.ts` (agregar métodos)
- `frontend/src/app/app.routes.ts` (aplicar guards)

---

## R-FE-04: Completar Dashboard Admin

### Estado
🟡 **IMPORTANTE** — 5 tests fallan por este problema

### Problema
El dashboard admin está incompleto: faltan enlaces, filtros, checkboxes y elementos con clases específicas.

### Tests Afectados

| Test ID | Descripción | Elemento Faltante |
|---------|-------------|-------------------|
| TC-ADMIN-009 | Dashboard navega a tendencias | Link "análisis detallado" |
| TC-ADMIN-011 | Filtrar métricas por fecha | Input `id="desde"` y texto "Filtro activo" |
| TC-ADMIN-014 | Deshabilitar plataforma | Checkbox `input[@type='checkbox']` |
| TC-ADMIN-016 | Retroalimentación muestra promedio | Elemento con `class="promedio"` |
| TC-ADMIN-018 | Filtrar retroalimentación por fecha | Input `id="desde"` |

### Requerimiento

**4.1: Agregar enlace "análisis detallado"**

Archivo: `frontend/src/app/features/admin/dashboard/dashboard-actividad.component.html`

```html
<div class="dashboard-card">
  <h3>Dashboard de Actividad</h3>
  <!-- ... contenido existente ... -->
  <a routerLink="/admin/tendencias" class="link-detallado">
    Ver análisis detallado
  </a>
</div>
```

**4.2: Implementar filtros de fecha en métricas**

Archivo: `frontend/src/app/features/admin/metricas/metricas.component.html`

```html
<div class="filtros">
  <label>
    Desde:
    <input type="date" id="desde" [(ngModel)]="fechaDesde" (change)="aplicarFiltro()">
  </label>
  <label>
    Hasta:
    <input type="date" id="hasta" [(ngModel)]="fechaHasta" (change)="aplicarFiltro()">
  </label>
  <button (click)="limpiarFiltro()">Limpiar</button>
</div>

<div *ngIf="filtroActivo" class="filtro-activo">
  Filtro activo
</div>
```

Archivo: `frontend/src/app/features/admin/metricas/metricas.component.ts`

```typescript
export class MetricasComponent {
  fechaDesde: string = '';
  fechaHasta: string = '';
  filtroActivo: boolean = false;

  aplicarFiltro() {
    if (this.fechaDesde && this.fechaHasta) {
      this.filtroActivo = true;
      // Llamar al backend con los filtros
    }
  }

  limpiarFiltro() {
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.filtroActivo = false;
    // Recargar datos sin filtros
  }
}
```

**4.3: Implementar toggle de plataformas**

Archivo: `frontend/src/app/features/admin/plataformas/plataformas.component.html`

```html
<div class="plataforma" *ngFor="let plataforma of plataformas">
  <span>{{ plataforma.nombre }}</span>
  <label class="switch">
    <input 
      type="checkbox" 
      [(ngModel)]="plataforma.activa"
      (change)="togglePlataforma(plataforma)">
    <span class="slider"></span>
  </label>
</div>

<button (click)="guardarCambios()">Guardar cambios</button>
```

**4.4: Agregar clase "promedio" en retroalimentación**

Archivo: `frontend/src/app/features/admin/retroalimentacion/retroalimentacion.component.html`

```html
<div class="retroalimentacion-container">
  <div class="promedio">
    <h3>Promedio de Calificación</h3>
    <span class="valor">{{ promedio | number:'1.1-1' }}</span>
  </div>
  
  <div class="distribucion">
    <h3>Distribución</h3>
    <!-- gráfico de distribución -->
  </div>
</div>
```

### Criterios de Aceptación

| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | Link "análisis detallado" existe y navega a /tendencias | Click en link → URL contiene `/tendencias` |
| 2 | Input `id="desde"` existe en métricas | `document.getElementById('desde')` retorna elemento |
| 3 | Input `id="hasta"` existe en métricas | `document.getElementById('hasta')` retorna elemento |
| 4 | Texto "Filtro activo" aparece tras aplicar filtro | Texto visible después de seleccionar fechas |
| 5 | Checkbox de plataforma existe y funciona | `input[type='checkbox']` encontrado |
| 6 | Elemento con `class="promedio"` existe en retroalimentación | Elemento visible con esa clase |
| 7 | Elemento con `class="distribucion"` existe en retroalimentación | Elemento visible con esa clase |

### Archivos a Modificar

- `frontend/src/app/features/admin/dashboard/dashboard-actividad.component.html`
- `frontend/src/app/features/admin/metricas/metricas.component.html`
- `frontend/src/app/features/admin/metricas/metricas.component.ts`
- `frontend/src/app/features/admin/plataformas/plataformas.component.html`
- `frontend/src/app/features/admin/plataformas/plataformas.component.ts`
- `frontend/src/app/features/admin/retroalimentacion/retroalimentacion.component.html`
- `frontend/src/app/features/admin/retroalimentacion/retroalimentacion.component.ts`

---

## R-FE-05: Corregir Botones de Navegación

### Estado
🟢 **MENOR** — 3 tests fallan por este problema

### Problema
Botones de navegación faltantes o con texto incorrecto.

### Tests Afectados

| Test ID | Descripción | Problema |
|---------|-------------|----------|
| TC-PERF-005 | Cancelar actualización de perfil | Botón "Cancelar" no encontrado |
| TC-MATCH-003 | Navegar a swipe desde matches | Link "Volver" no encontrado |
| TC-E2E-013 | Usuario actualiza perfil y cierra sesión | Botón "Cerrar sesión" no encontrado |

### Requerimiento

**5.1: Agregar botón "Cancelar" en perfil**

Archivo: `frontend/src/app/features/perfil/perfil.component.html`

```html
<div class="perfil-form">
  <!-- ... campos ... -->
  <div class="actions">
    <button (click)="guardar()" class="btn-primary">Guardar cambios</button>
    <button (click)="cancelar()" class="btn-secondary">Cancelar</button>
  </div>
</div>
```

**5.2: Agregar link "Volver" en matches**

Archivo: `frontend/src/app/features/matches/matches.component.html`

```html
<div class="matches-container">
  <div class="header">
    <a routerLink="/swipe" class="link-volver">Volver</a>
    <h2>Mis Matches</h2>
  </div>
  <!-- ... contenido ... -->
</div>
```

**5.3: Agregar botón "Cerrar sesión" en home**

Archivo: `frontend/src/app/features/home/home.component.html`

```html
<header class="home-header">
  <h1>Hola, {{ usuario.nombre }}</h1>
  <button (click)="cerrarSesion()" class="btn-logout">Cerrar sesión</button>
</header>
```

### Criterios de Aceptación

| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | Botón "Cancelar" existe en perfil | Selector XPath encuentra el botón |
| 2 | Link "Volver" existe en matches | Selector XPath encuentra el link |
| 3 | Botón "Cerrar sesión" existe en home | Selector XPath encuentra el botón |

### Archivos a Modificar

- `frontend/src/app/features/perfil/perfil.component.html`
- `frontend/src/app/features/matches/matches.component.html`
- `frontend/src/app/features/home/home.component.html`

---

## R-FE-06: Corregir Navegación en Chat

### Estado
🟢 **MENOR** — 2 tests fallan por este problema

### Problema
Los enlaces de navegación en chat no funcionan o están en página incorrecta.

### Tests Afectados

| Test ID | Descripción | Problema |
|---------|-------------|----------|
| TC-CHAT-012 | Navegar a swipe desde chat | URL no contiene `/swipe` |
| TC-CHAT-013 | Navegar a matches desde chat | Link "Matches" no encontrado |

### Requerimiento

Archivo: `frontend/src/app/features/chat/chat.component.html`

```html
<div class="chat-container">
  <header class="chat-header">
    <a routerLink="/swipe" class="link-volver">Volver</a>
    <h2>Chat</h2>
    <a routerLink="/matches" class="link-matches">Matches</a>
  </header>
  
  <!-- ... resto del chat ... -->
</div>
```

### Criterios de Aceptación

| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | Link "Volver" navega a /swipe | Click → URL contiene `/swipe` |
| 2 | Link "Matches" navega a /matches | Click → URL contiene `/matches` |

### Archivos a Modificar

- `frontend/src/app/features/chat/chat.component.html`

---

## R-FE-07: Agregar Clase "active" en Calificación

### Estado
🟢 **MENOR** — 1 test falla por este problema

### Problema
Los botones de calificación no agregan clase `active` al ser seleccionados.

### Tests Afectados

| Test ID | Descripción | Problema |
|---------|-------------|----------|
| TC-CAL-006 | Botones de rating se resaltan al seleccionar | Clase `active` no se agrega |

### Requerimiento

Archivo: `frontend/src/app/features/calificacion/calificacion.component.html`

```html
<div class="calificacion-container">
  <h3>Califica tu experiencia</h3>
  <div class="rating-buttons">
    <button 
      *ngFor="let valor of [1,2,3,4,5,6,7,8,9,10]"
      [class.active]="calificacionSeleccionada === valor"
      (click)="seleccionar(valor)">
      {{ valor }}
    </button>
  </div>
  <button (click)="enviar()">Enviar calificación</button>
</div>
```

Archivo: `frontend/src/app/features/calificacion/calificacion.component.ts`

```typescript
export class CalificacionComponent {
  calificacionSeleccionada: number | null = null;

  seleccionar(valor: number) {
    this.calificacionSeleccionada = valor;
  }

  enviar() {
    if (!this.calificacionSeleccionada) {
      // Mostrar error
      return;
    }
    // Enviar calificación
  }
}
```

### Criterios de Aceptación

| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | Botón seleccionado tiene clase `active` | `element.classList.contains('active') === true` |
| 2 | Solo un botón tiene clase `active` a la vez | Al seleccionar otro, el anterior pierde la clase |

### Archivos a Modificar

- `frontend/src/app/features/calificacion/calificacion.component.html`
- `frontend/src/app/features/calificacion/calificacion.component.ts`

---

## Resumen de Impacto

| Requerimiento | Tests Recuperados | Prioridad |
|---------------|-------------------|-----------|
| R-FE-01: Selector "Crear sala" | 17 | 🔴 CRÍTICO |
| R-FE-02: Mensajes de error | 8 | 🟡 IMPORTANTE |
| R-FE-03: Guards de autenticación | 3 | 🟡 IMPORTANTE |
| R-FE-04: Dashboard admin completo | 5 | 🟡 IMPORTANTE |
| R-FE-05: Botones de navegación | 3 | 🟢 MENOR |
| R-FE-06: Navegación en chat | 2 | 🟢 MENOR |
| R-FE-07: Clase active en calificación | 1 | 🟢 MENOR |
| **TOTAL** | **39 tests** | |

**Nota:** 1 test adicional (TC-ADMIN-021) requiere corrección de selector del botón "Salir" que probablemente se resuelva al completar R-FE-04.

---

## Orden de Implementación Sugerido

1. **R-FE-01** (17 tests) — Mayor impacto, desbloquea muchos otros tests
2. **R-FE-02** (8 tests) — Segundo mayor impacto
3. **R-FE-03** (3 tests) — Importante para seguridad
4. **R-FE-04** (5 tests) — Dashboard admin completo
5. **R-FE-05** (3 tests) — Navegación básica
6. **R-FE-06** (2 tests) — Chat
7. **R-FE-07** (1 test) — Detalle menor

---

## Verificación Final

Después de implementar todas las correcciones:

```bash
cd documentacion/robot
./run_tests.sh

# Resultado esperado:
# 143 tests, 143 passed, 0 failed
```
