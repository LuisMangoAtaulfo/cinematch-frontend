# Requerimientos de Corrección — FRONTEND
## Basado en ejecución del 10 de noviembre de 2026, 13:36

**Estado:** 107 pasan ✅ | 36 fallan ❌  
**Tests a recuperar con frontend:** 36 (todos los restantes)

---

## Resumen de fallos actuales

| # | Problema | Error | Tests | Prioridad |
|---|----------|-------|-------|-----------|
| 1 | Selector "Crear sala" no existe | `xpath=//a[contains(text(), 'Crear sala')]` not found | 17 | 🔴 |
| 2 | Dashboard admin incompleto | Múltiples elementos faltantes | 7 | 🟡 |
| 3 | Guards no redirigen a /login | URL no contiene '/login' | 3 | 🟡 |
| 4 | Botones/enlaces de navegación faltantes | Botón/Link not found | 5 | 🟢 |
| 5 | Filtros no navegan a /swipe | URL home no contiene '/swipe' | 2 | 🟢 |
| 6 | Clase `active` no se aplica | Clase CSS faltante | 1 | 🟢 |
| 7 | Perfil no carga datos del usuario | '' should not be empty | 1 | 🟢 |

---

## R-FE-01: Corregir selector "Crear sala"

### Estado
🔴 **CRÍTICO** — 17 tests fallan

### Error
```
Button with locator 'xpath=//a[contains(text(), 'Crear sala')]' not found.
```

### Diagnóstico
El test busca un elemento `<a>` con texto "Crear sala" en la home, pero no lo encuentra. Posibles causas:
- El elemento es un `<button>` y no un `<a>`
- El texto es diferente (ej: "Crear Sala", "Crear una sala")
- El elemento no existe en la página

### Tests afectados

| Suite | Tests |
|-------|-------|
| Salas | TC-SALA-001, 002, 003, 004, 006, 011, 012 |
| Swipe | TC-SWIPE-001, 002, 003, 004, 005, 011, 012, 013 |
| E2E | TC-E2E-005, TC-E2E-011 |

### Solución

**Paso 1: Verificar qué existe realmente en la home**

Abrir `http://localhost:4200/home` en el navegador y ejecutar en consola:

```javascript
// Buscar todos los elementos con texto relacionado a "crear" o "sala"
document.querySelectorAll('a, button').forEach(el => {
  const text = el.textContent.trim();
  if (text.toLowerCase().includes('crear') || text.toLowerCase().includes('sala')) {
    console.log(`${el.tagName} | "${text}" | class="${el.className}" | id="${el.id}"`);
  }
});
```

**Paso 2A: Si el elemento existe pero con otro tag/texto → actualizar `variables.robot`**

```robot
# Ejemplo: si es un <button> en vez de <a>
${BTN_CREAR_SALA}      xpath=//button[contains(text(), 'Crear sala')]

# Ejemplo: si el texto es "Crear Sala" (con mayúscula)
${BTN_CREAR_SALA}      xpath=//a[contains(text(), 'Crear Sala')]
```

**Paso 2B: Si el elemento no existe → agregarlo en el componente home**

Archivo: `frontend/src/app/features/home/home.component.html`

```html
<!-- Los tests esperan elementos <a> con texto exacto -->
<a routerLink="/sala/crear" class="btn-crear">Crear sala</a>
<a routerLink="/sala/unirse" class="btn-unirse">Unirse a sala</a>
```

### Criterios de aceptación

| # | Criterio | Verificación |
|---|----------|-------------|
| 1 | `xpath=//a[contains(text(), 'Crear sala')]` encuentra un elemento | `document.evaluate()` retorna nodo |
| 2 | `xpath=//a[contains(text(), 'Unirse a sala')]` encuentra un elemento | `document.evaluate()` retorna nodo |
| 3 | Click en "Crear sala" navega a /sala/crear | URL cambia tras click |
| 4 | Click en "Unirse a sala" navega a /sala/unirse | URL cambia tras click |

### Archivos
- `frontend/src/app/features/home/home.component.html`
- `documentacion/robot/variables.robot` (si el selector necesita ajuste)

---

## R-FE-02: Completar Dashboard Admin

### Estado
🟡 **IMPORTANTE** — 7 tests fallan

### Tests afectados

| Test | Error | Solución |
|------|-------|----------|
| TC-ADMIN-009 | Link "análisis detallado" no existe | Agregar link |
| TC-ADMIN-011 | "Filtro activo" no aparece | Mostrar indicador tras aplicar filtro |
| TC-ADMIN-014 | Checkbox `input[@type='checkbox']` no existe | Agregar toggle switch |
| TC-ADMIN-016 | `class="promedio"` no existe | Agregar contenedor con esa clase |
| TC-ADMIN-018 | "Filtro activo" no aparece en retroalimentación | Mostrar indicador tras aplicar filtro |
| TC-ADMIN-021 | Botón "Salir" no encontrado | Agregar/renombrar botón |
| TC-E2E-004 | Hereda todos los fallos de admin | Se resuelve con los anteriores |

### Soluciones

**2.1: Link "análisis detallado" (TC-ADMIN-009)**

Archivo: `frontend/src/app/features/admin/dashboard/dashboard-actividad.component.html`

```html
<a routerLink="/admin/tendencias">Ver análisis detallado</a>
```

**2.2: Indicador "Filtro activo" (TC-ADMIN-011 y TC-ADMIN-018)**

Archivos: `metricas.component.html` y `retroalimentacion.component.html`

```html
<!-- Inputs de fecha -->
<input type="date" id="desde" [(ngModel)]="fechaDesde">
<input type="date" id="hasta" [(ngModel)]="fechaHasta">
<button (click)="aplicarFiltro()">Aplicar</button>
<button (click)="limpiarFiltro()">Limpiar</button>

<!-- Indicador que aparece solo cuando hay filtro -->
<span *ngIf="filtroActivo" class="filtro-activo-tag">Filtro activo</span>
```

```typescript
// component.ts
filtroActivo = false;

aplicarFiltro() {
  if (this.fechaDesde || this.fechaHasta) {
    this.filtroActivo = true;
    // llamar al backend con los filtros
  }
}

limpiarFiltro() {
  this.fechaDesde = '';
  this.fechaHasta = '';
  this.filtroActivo = false;
}
```

**2.3: Toggle checkbox para plataformas (TC-ADMIN-014)**

Archivo: `plataformas.component.html`

```html
<div class="plataforma" *ngFor="let plat of plataformas">
  <span>{{ plat.nombre }}</span>
  <input 
    type="checkbox" 
    [checked]="plat.activa"
    (change)="togglePlataforma(plat, $event)">
</div>
<button (click)="guardarCambios()">Guardar cambios</button>
```

**2.4: Elemento con class "promedio" (TC-ADMIN-016)**

Archivo: `retroalimentacion.component.html`

```html
<div class="promedio">
  <span class="valor">{{ promedio | number:'1.1-1' }}</span>
</div>
<div class="distribucion">
  <!-- gráfico de barras -->
</div>
```

**2.5: Botón "Salir" (TC-ADMIN-021)**

Archivo: `metricas.component.html` (o layout admin)

```html
<button (click)="logout()">Salir</button>
```

### Criterios de aceptación

| # | Criterio | Test |
|---|----------|------|
| 1 | Link con texto "análisis detallado" navega a /tendencias | TC-ADMIN-009 |
| 2 | Al aplicar filtro de fechas aparece "Filtro activo" | TC-ADMIN-011, 018 |
| 3 | `input[type='checkbox']` existe en plataformas | TC-ADMIN-014 |
| 4 | Elemento con `class="promedio"` visible en retroalimentación | TC-ADMIN-016 |
| 5 | Botón "Salir" cierra sesión y redirige a /login | TC-ADMIN-021 |

### Archivos
- `frontend/src/app/features/admin/dashboard/dashboard-actividad.component.html`
- `frontend/src/app/features/admin/metricas/metricas.component.html`
- `frontend/src/app/features/admin/metricas/metricas.component.ts`
- `frontend/src/app/features/admin/plataformas/plataformas.component.html`
- `frontend/src/app/features/admin/plataformas/plataformas.component.ts`
- `frontend/src/app/features/admin/retroalimentacion/retroalimentacion.component.html`
- `frontend/src/app/features/admin/retroalimentacion/retroalimentacion.component.ts`

---

## R-FE-03: Implementar Guards de Autenticación

### Estado
🟡 **IMPORTANTE** — 3 tests fallan

### Error
```
'http://localhost:4200/sala/crear'    → no contiene '/login'
'http://localhost:4200/sala/unirse'   → no contiene '/login'
'http://localhost:4200/admin/metricas' → no contiene '/login'
```

### Tests afectados
| Test | Descripción |
|------|-------------|
| TC-SALA-005 | /sala/crear sin auth debe redirigir a /login |
| TC-SALA-010 | /sala/unirse sin auth debe redirigir a /login |
| TC-ADMIN-019 | /admin/metricas sin auth debe redirigir a /login |

### Solución

Archivo: `frontend/src/app/core/guards/auth.guard.ts`

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  if (auth.isAuthenticated()) return true;
  
  router.navigate(['/login']);
  return false;
};
```

Archivo: `frontend/src/app/core/guards/admin.guard.ts`

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  if (auth.isAdmin()) return true;
  
  router.navigate(['/login']);
  return false;
};
```

Archivo: `frontend/src/app/app.routes.ts`

```typescript
// Aplicar guards a rutas protegidas
{ path: 'sala/crear', component: CrearSalaComponent, canActivate: [authGuard] },
{ path: 'sala/unirse', component: UnirseSalaComponent, canActivate: [authGuard] },
{ path: 'admin/metricas', component: MetricasComponent, canActivate: [authGuard, adminGuard] },
// ... todas las rutas protegidas
```

### Criterios de aceptación

| # | Criterio | Verificación |
|---|----------|-------------|
| 1 | /sala/crear sin token redirige a /login | URL cambia a `/login` |
| 2 | /sala/unirse sin token redirige a /login | URL cambia a `/login` |
| 3 | /admin/metricas sin token redirige a /login | URL cambia a `/login` |
| 4 | /admin/metricas con token USUARIO redirige a /login | URL cambia a `/login` |
| 5 | /admin/metricas con token ADMIN permite acceso | No hay redirección |

### Archivos
- `frontend/src/app/core/guards/auth.guard.ts` (crear o corregir)
- `frontend/src/app/core/guards/admin.guard.ts` (crear o corregir)
- `frontend/src/app/app.routes.ts` (aplicar guards)
- `frontend/src/app/core/services/auth.service.ts` (métodos isAuthenticated/isAdmin)

---

## R-FE-04: Corregir Botones y Enlaces de Navegación

### Estado
🟢 **MENOR** — 5 tests fallan

### Tests afectados

| Test | Error | Solución |
|------|-------|----------|
| TC-PERF-005 | Botón "Cancelar" no existe en perfil | Agregar botón |
| TC-E2E-013 | Botón "Cerrar sesión" no existe en home | Agregar/renombrar botón |
| TC-CHAT-012 | Link "Volver" en chat no navega a /swipe | Corregir ruta del link |
| TC-MATCH-003 | Link "Volver" en matches no navega a /swipe | Corregir ruta del link |
| TC-ADMIN-021 | *(ya cubierto en R-FE-02)* | |

### Soluciones

**4.1: Botón "Cancelar" en perfil (TC-PERF-005)**

Archivo: `frontend/src/app/features/perfil/perfil.component.html`

```html
<div class="form-actions">
  <button (click)="guardar()">Guardar cambios</button>
  <button (click)="cancelar()">Cancelar</button>
</div>
```

```typescript
// perfil.component.ts
cancelar() {
  this.router.navigate(['/home']);
}
```

**4.2: Botón "Cerrar sesión" en home (TC-E2E-013)**

Archivo: `frontend/src/app/features/home/home.component.html`

```html
<button (click)="logout()">Cerrar sesión</button>
```

**4.3: Link "Volver" en chat → /swipe (TC-CHAT-012)**

Archivo: `frontend/src/app/features/chat/chat.component.html`

```html
<a routerLink="/swipe">Volver</a>
```

**4.4: Link "Volver" en matches → /swipe (TC-MATCH-003)**

Archivo: `frontend/src/app/features/matches/matches.component.html`

```html
<a routerLink="/swipe">Volver</a>
```

### Criterios de aceptación

| # | Criterio | Test |
|---|----------|------|
| 1 | Botón "Cancelar" en perfil redirige a /home | TC-PERF-005 |
| 2 | Botón "Cerrar sesión" en home cierra sesión | TC-E2E-013 |
| 3 | Link "Volver" en chat navega a /swipe | TC-CHAT-012 |
| 4 | Link "Volver" en matches navega a /swipe | TC-MATCH-003 |

### Archivos
- `frontend/src/app/features/perfil/perfil.component.html`
- `frontend/src/app/features/perfil/perfil.component.ts`
- `frontend/src/app/features/home/home.component.html`
- `frontend/src/app/features/chat/chat.component.html`
- `frontend/src/app/features/matches/matches.component.html`

---

## R-FE-05: Filtros deben navegar a /swipe

### Estado
🟢 **MENOR** — 2 tests fallan

### Error
```
'http://localhost:4200/home' does not contain '/swipe'
```

### Tests afectados
| Test | Descripción |
|------|-------------|
| TC-E2E-008 | Flujo de filtros combinados |
| TC-E2E-007 | Flujo de perfil completo (navegación encadenada) |

### Solución

El componente de filtros debe navegar a `/swipe` tras aplicar u omitir filtros:

Archivo: `frontend/src/app/features/filtros/filtros.component.ts`

```typescript
aplicarFiltros() {
  // Guardar filtros en servicio
  this.filtrosService.setFiltros(this.filtros);
  // Navegar a swipe
  this.router.navigate(['/swipe']);
}

omitirFiltros() {
  this.filtrosService.limpiarFiltros();
  this.router.navigate(['/swipe']);
}
```

### Criterios de aceptación

| # | Criterio | Verificación |
|---|----------|-------------|
| 1 | Click en "Aplicar filtros" navega a /swipe | URL contiene `/swipe` |
| 2 | Click en "Omitir filtros" navega a /swipe | URL contiene `/swipe` |

### Archivos
- `frontend/src/app/features/filtros/filtros.component.ts`

---

## R-FE-06: Clase `active` en botones de calificación

### Estado
🟢 **MENOR** — 1 test falla

### Test afectado
| Test | Error |
|------|-------|
| TC-CAL-006 | El botón seleccionado no tiene `class` que contenga "active" |

### Solución

Archivo: `frontend/src/app/features/calificacion/calificacion.component.html`

```html
<button 
  *ngFor="let v of [1,2,3,4,5,6,7,8,9,10]"
  [class.active]="calificacion === v"
  (click)="calificacion = v">
  {{ v }}
</button>
```

### Criterios de aceptación

| # | Criterio | Verificación |
|---|----------|-------------|
| 1 | Botón clickeado tiene clase `active` | `classList.contains('active')` es true |
| 2 | Solo un botón tiene `active` a la vez | Los demás no tienen la clase |

### Archivos
- `frontend/src/app/features/calificacion/calificacion.component.html`
- `frontend/src/app/features/calificacion/calificacion.component.ts`

---

## R-FE-07: Perfil debe cargar datos del usuario

### Estado
🟢 **MENOR** — 1 test falla

### Error
```
'' should not be empty.
```

### Test afectado
| Test | Descripción |
|------|-------------|
| TC-E2E-007 | Flujo de perfil completo — al entrar a /perfil el campo nombre está vacío |

### Diagnóstico
Al hacer login y navegar a /perfil, el campo nombre retorna string vacío. El frontend no está cargando los datos del usuario desde el backend.

### Solución

Archivo: `frontend/src/app/features/perfil/perfil.component.ts`

```typescript
ngOnInit() {
  this.usuario$ = this.authService.getPerfil().pipe(
    tap(usuario => {
      this.nombreForm.setValue(usuario.nombre || '');
      this.descripcionForm.setValue(usuario.descripcion || '');
    })
  );
}
```

### Criterios de aceptación

| # | Criterio | Verificación |
|---|----------|-------------|
| 1 | Al entrar a /perfil, el campo nombre no está vacío | `input.value !== ''` |
| 2 | Los datos cargados coinciden con los del usuario | Nombre y descripción son correctos |

### Archivos
- `frontend/src/app/features/perfil/perfil.component.ts`
- `frontend/src/app/core/services/auth.service.ts` (verificar getPerfil)

---

## Resumen

| # | Requerimiento | Tests | Prioridad |
|---|---------------|-------|-----------|
| R-FE-01 | Selector "Crear sala" en home | 17 | 🔴 |
| R-FE-02 | Dashboard admin completo | 7 | 🟡 |
| R-FE-03 | Guards de autenticación | 3 | 🟡 |
| R-FE-04 | Botones y enlaces de navegación | 5 | 🟢 |
| R-FE-05 | Filtros navegan a /swipe | 2 | 🟢 |
| R-FE-06 | Clase active en calificación | 1 | 🟢 |
| R-FE-07 | Perfil carga datos del usuario | 1 | 🟢 |
| | **TOTAL** | **36** | |

### Orden de implementación

```
1. R-FE-01 (17 tests)  ← hace solo falta verificar el elemento real
2. R-FE-02 (7 tests)   ← elementos HTML + lógica de filtros
3. R-FE-03 (3 tests)   ← guards de Angular
4. R-FE-04 (5 tests)   ← botones y links
5. R-FE-05 (2 tests)   ← navegación tras filtros
6. R-FE-06 (1 test)    ← clase CSS
7. R-FE-07 (1 test)    ← carga de datos
```
