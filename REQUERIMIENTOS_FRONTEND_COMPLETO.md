# Requerimientos Frontend Completos — CineMatch
## Automatización Total de Tests

> **Objetivo:** Implementar todo lo necesario en el frontend para que el 100% de los tests de Robot Framework se ejecuten automáticamente sin intervención manual.
> 
> **Tests actualmente manuales:** ~45 tests
> **Tests objetivo automatizados:** 100%

---

## Índice

1. [Infraestructura de Selectores](#r-fe-01-infraestructura-de-selectores)
2. [Gestión de Salas](#r-fe-02-gestión-de-salas)
3. [Chat en Tiempo Real](#r-fe-03-chat-en-tiempo-real)
4. [Filtros Funcionales](#r-fe-04-filtros-funcionales)
5. [Swipe Interactivo](#r-fe-05-swipe-interactivo)
6. [Dashboard Admin Completo](#r-fe-06-dashboard-admin-completo)
7. [Perfil de Usuario](#r-fe-07-perfil-de-usuario)
8. [Resultados y Calificación](#r-fe-08-resultados-y-calificación)
9. [Matches (Lista)](#r-fe-09-matches-lista)
10. [Manejo de Estados de Conexión](#r-fe-10-manejo-de-estados-de-conexión)
11. [Flujos E2E Automatizables](#r-fe-11-flujos-e2e-automatizables)

---

## R-FE-01: Infraestructura de Selectores

### Contexto
Los tests de Robot Framework buscan elementos por `id`, `class`, `aria-label` y texto. Si los selectores no coinciden exactamente, los tests fallan.

### Requerimiento
Revisar y estandarizar TODOS los IDs, clases y atributos ARIA para que coincidan con `variables.robot`.

### Checklist de Selectores Críticos

| # | Componente | Atributo | Selector del Test | Verificar |
|---|-----------|----------|-------------------|-----------|
| 1 | Input correo (login) | `id="correo"` | `${INPUT_CORREO}` | ✅ |
| 2 | Input contraseña (login) | `id="pass"` | `${INPUT_PASSWORD}` | ✅ |
| 3 | Input nombre (registro) | `id="nombre"` | `${INPUT_NOMBRE}` | ✅ |
| 4 | Input confirmar contraseña | `id="pass2"` | `${INPUT_CONFIRM_PASS}` | ✅ |
| 5 | Input código de sala | `id="codigo"` | `${INPUT_CODIGO}` | ✅ |
| 6 | Input descripción (perfil) | `id="desc"` | `${INPUT_DESCRIPCION}` | ✅ |
| 7 | Toggle contraseña | `class` contiene `eye-btn` | `${BTN_TOGGLE_PASS}` | ⚠️ |
| 8 | Botón like | `class` contiene `btn-like` O `aria-label="like"` | `${BTN_LIKE}` | ⚠️ |
| 9 | Botón dislike | `class` contiene `btn-dislike` O `aria-label="dislike"` | `${BTN_DISLIKE}` | ⚠️ |
| 10 | Tarjeta swipe | `class` contiene `swipe-card` O `card` | `${CARD_CONTENIDO}` | ⚠️ |
| 11 | Input mensaje chat | `placeholder` contiene "mensaje" O `id="texto"` | `${INPUT_MENSAJE}` | ⚠️ |
| 12 | Input fecha desde (admin) | `id="desde"` | `${INPUT_FECHA_DESDE}` | ⚠️ |
| 13 | Input fecha hasta (admin) | `id="hasta"` | `${INPUT_FECHA_HASTA}` | ⚠️ |
| 14 | Código de sala visible | `class` contiene `sala-code` O `letter-spacing` | Keyword `Crear Sala` | ⚠️ |
| 15 | Mensajes error | `class="form-error"` O texto visible | `${ERROR_MESSAGE}` | ⚠️ |

### Selectores de Texto a Verificar

| Texto Esperado | Contexto | Verificar |
|----------------|----------|-----------|
| "Hola" | En home tras login | ✅ |
| "Dashboard" | En panel admin | ✅ (ya corregido) |
| "no tiene permisos" | Login admin con usuario normal | ✅ (ya corregido) |
| "Completa todos los campos" | Validación campos vacíos | ⚠️ Verificar texto exacto |
| "¡Copiado!" | Feedback al copiar código | ⚠️ |
| "Preparando la sesión" | Pantalla espera de filtros | ⚠️ |
| "Aún no hay mensajes" | Chat vacío | ⚠️ |
| "Aún no tienen matches" | Matches vacío | ⚠️ |
| "Perfil actualizado correctamente" | Confirmación perfil | ⚠️ |
| "Filtro activo" | Indicador filtro en métricas | ⚠️ |
| "Cambios guardados" | Confirmación plataformas | ⚠️ |
| "Selecciona una calificación" | Validación calificación vacía | ⚠️ |
| "Código de sala inválido" | Error código inválido | ⚠️ |
| "Ingresa un código" | Error campo vacío código | ⚠️ |
| "La contraseña debe tener al menos 8 caracteres" | Validación longitud | ⚠️ |
| "Las contraseñas no coinciden" | Validación contraseñas | ⚠️ |
| "El correo ya está en uso" | Error correo duplicado | ⚠️ |
| "Credenciales incorrectas" | Error login incorrecto | ⚠️ |
| "Usuario no encontrado" | Error correo no registrado | ⚠️ |

### Criterios de Aceptación

| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | Todos los inputs tienen los IDs especificados | `document.getElementById()` retorna elementos para todos los IDs |
| 2 | Todos los botones tienen las clases o aria-labels correctos | Selectores XPath encuentran los elementos |
| 3 | Todos los textos de error/mensaje coinciden exactamente | Los tests de verificación de mensajes pasan |
| 4 | Los selectores en `variables.robot` funcionan | 0 fallos por selector incorrecto |

### Tests que desbloquea
- **TODOS** los tests dependen de selectores correctos

---

## R-FE-02: Gestión de Salas

### Contexto
Los tests TC-SALA-001 a TC-SALA-015 requieren flujo completo de crear, unirse, esperar, cancelar y finalizar salas. Los tests TC-SALA-013, TC-SALA-014, TC-SALA-015 están marcados como manuales.

### Requerimiento
Implementar flujo completo de gestión de salas con detección de cambios en tiempo real.

### Criterios de Aceptación

| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | Enlace "Crear sala" es `<a>` con texto exacto | `document.querySelector('a')` con texto "Crear sala" |
| 2 | Enlace "Unirse a sala" es `<a>` con texto exacto | `document.querySelector('a')` con texto "Unirse a sala" |
| 3 | Botón "Cerrar sesión" es `<button>` con texto "Cerrar sesión" | Selector exacto funciona |
| 4 | Tras crear sala, código visible cumple `^[A-Z0-9]{6}$` | El código mostrado es alfanumérico de 6 caracteres |
| 5 | Botón "Copiar código" muestra "¡Copiado!" | Tooltip o toast aparece con ese texto |
| 6 | Botón "Cancelar sala" redirige a /home | URL cambia tras click |
| 7 | Input código convierte a mayúsculas automáticamente | Escribir "a7x3k9" muestra "A7X3K9" en tiempo real |
| 8 | Pantalla de espera muestra "Preparando la sesión" | Texto visible al unirse a sala |
| 9 | Pantalla de espera tiene spinner visible | Elemento animado visible |
| 10 | Botón "Cancelar y salir" en espera redirige a /home | URL cambia tras click |
| 11 | **Polling/WebSocket detecta cuando sala pasa a ACTIVA** | Navegación automática a /filtros en < 5 segundos |
| 12 | Botón "Finalizar" visible solo para creador en swipe | Invitado no ve el botón o está deshabilitado |
| 13 | Click en "Finalizar" navega a /resultados | URL cambia a `/resultados` |

### Tests que desbloquea
- **TC-SALA-001 a TC-SALA-012** (automatizables)
- **TC-SALA-013**: Creador navega a filtros cuando compañero se une ⭐
- **TC-SALA-014**: Solo el creador puede finalizar sala ⭐
- **TC-SALA-015**: Finalizar sala desde swipe ⭐

---

## R-FE-03: Chat en Tiempo Real

### Contexto
Los tests TC-CHAT-001 a TC-CHAT-013 requieren comunicación WebSocket bidireccional. Los tests TC-CHAT-001, 002, 005, 006, 007, 008, 010, 011 están marcados como manuales.

### Requerimiento
Implementar cliente WebSocket completo para chat con envío, recepción, historial y notificaciones.

### Criterios de Aceptación

| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | Conexión WebSocket se establece al entrar a /chat | Conexión abierta en < 3 segundos |
| 2 | Input mensaje tiene `placeholder` con "mensaje" O `id="texto"` | Selector del test funciona |
| 3 | Botón "Enviar" tiene texto "Enviar" | Selector XPath funciona |
| 4 | Click en "Enviar" envía mensaje | Mensaje aparece en UI en < 1 segundo |
| 5 | Presionar Enter envía mensaje | `keydown.enter` dispara envío |
| 6 | Input se limpia después de enviar | `input.value === ''` tras enviar |
| 7 | Mensaje vacío no se envía | Click sin texto no agrega burbuja |
| 8 | **Mensajes propios alineados a la derecha** | CSS/HTML muestra burbuja propia a la derecha |
| 9 | **Mensajes recibidos alineados a la izquierda** | CSS/HTML muestra burbuja recibida a la izquierda |
| 10 | **Mensajes se reciben en tiempo real** | Mensaje del compañero aparece en < 2 segundos |
| 11 | **Historial de mensajes se carga al entrar** | Mensajes previos visibles al cargar página |
| 12 | **Chat vacío muestra "Aún no hay mensajes"** | Placeholder visible cuando no hay mensajes |
| 13 | **Banner de reconexión aparece al perder conexión** | Banner "Reconectando..." visible tras desconexión |
| 14 | **Banner de match aparece al detectar match** | Banner con texto de match visible tras notificación |
| 15 | Enlace "Volver" navega a /swipe | URL contiene `/swipe` |
| 16 | Enlace "Matches" navega a /matches | URL contiene `/matches` |

### Tests que desbloquea
- **TC-CHAT-001**: Enviar mensaje ⭐
- **TC-CHAT-002**: Enviar mensaje con Enter ⭐
- **TC-CHAT-003**: Campo se limpia después de enviar
- **TC-CHAT-004**: No enviar mensaje vacío
- **TC-CHAT-005**: Recibir mensaje en tiempo real ⭐
- **TC-CHAT-006**: Ver historial de chat ⭐
- **TC-CHAT-007**: Mensajes propios alineados a la derecha ⭐
- **TC-CHAT-008**: Mensajes del compañero alineados a la izquierda ⭐
- **TC-CHAT-009**: Chat vacío muestra mensaje
- **TC-CHAT-010**: Banner de reconexión ⭐
- **TC-CHAT-011**: Banner de match notificado ⭐
- **TC-CHAT-012**: Navegar a swipe desde chat
- **TC-CHAT-013**: Navegar a matches desde chat

---

## R-FE-04: Filtros Funcionales

### Contexto
Los tests TC-FILTRO-001 a TC-FILTRO-010 requieren filtros funcionales con dropdowns poblados dinámicamente. Todos excepto TC-FILTRO-009 están marcados como manuales.

### Requerimiento
Implementar página de filtros con dropdowns poblados desde API y navegación al aplicar.

### Criterios de Aceptación

| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | Select tipo tiene `id="tipo"` | Selector XPath funciona |
| 2 | Select tipo tiene opciones "Película" y "Serie" | `<option>` con esos labels existen |
| 3 | Select género tiene `id="genero"` | Selector XPath funciona |
| 4 | Select género tiene ≥ 5 géneros | Al menos 5 opciones disponibles |
| 5 | Select plataforma tiene `id="plataforma"` | Selector XPath funciona |
| 6 | Select plataforma muestra solo plataformas habilitadas | Solo plataformas con `activa = true` |
| 7 | Select año tiene `id="anio"` | Selector XPath funciona |
| 8 | Select año va del año actual a 1980 | Primera opción es año actual, última es 1980 |
| 9 | Botón "Aplicar filtros" navega a /swipe | URL cambia a `/swipe` tras click |
| 10 | Botón "Omitir filtros" navega a /swipe | URL cambia a `/swipe` sin filtros |
| 11 | Filtros combinados funcionan | Contenido en /swipe cumple todos los filtros |
| 12 | Sin resultados muestra mensaje apropiado | Mensaje visible cuando filtros no retornan contenido |
| 13 | Solo plataformas habilitadas aparecen en dropdown | Plataformas deshabilitadas no aparecen |

### Tests que desbloquea
- **TC-FILTRO-001**: Aplicar filtro por tipo Película ⭐
- **TC-FILTRO-002**: Aplicar filtro por tipo Serie ⭐
- **TC-FILTRO-003**: Aplicar filtro por género ⭐
- **TC-FILTRO-004**: Aplicar filtro por plataforma ⭐
- **TC-FILTRO-005**: Aplicar filtro por año ⭐
- **TC-FILTRO-006**: Aplicar filtros combinados ⭐
- **TC-FILTRO-007**: Omitir filtros ⭐
- **TC-FILTRO-008**: Solo se muestran plataformas habilitadas ⭐
- **TC-FILTRO-009**: Filtros requieren autenticación (ya funciona)
- **TC-FILTRO-010**: Rango de años es correcto ⭐

---

## R-FE-05: Swipe Interactivo

### Contexto
Los tests TC-SWIPE-001 a TC-SWIPE-013 requieren tarjeta de contenido con botones, drag y detección de match. Los tests TC-SWIPE-006, 007, 008, 009, 010 están marcados como manuales.

### Requerimiento
Implementar pantalla de swipe con tarjeta, botones, drag y notificaciones de match.

### Criterios de Aceptación

| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | Tarjeta tiene `class` con "swipe-card" o "card" | Selector XPath funciona |
| 2 | Tarjeta muestra título con `class` "titulo" | Elemento visible |
| 3 | Tarjeta muestra año con `class` "anio" | Elemento visible |
| 4 | Tarjeta muestra género con `class` "genero" | Elemento visible |
| 5 | Botón like tiene `class` "btn-like" O `aria-label="like"` | Selector XPath funciona |
| 6 | Botón dislike tiene `class` "btn-dislike" O `aria-label="dislike"` | Selector XPath funciona |
| 7 | Click en like avanza al siguiente contenido | Nueva tarjeta aparece |
| 8 | Click en dislike avanza al siguiente contenido | Nueva tarjeta aparece |
| 9 | Drag a la derecha simula like | Arrastrar 200px derecha registra like |
| 10 | Drag a la izquierda simula dislike | Arrastrar 200px izquierda registra dislike |
| 11 | **Botones deshabilitados cuando compañero desconectado** | Botones tienen `disabled` o `opacity: 0.5` tras desconexión |
| 12 | **Catálogo agotado muestra mensaje** | Texto "No hay más contenido" visible |
| 13 | **Sin resultados muestra mensaje** | Texto "No hay contenido para estos filtros" visible |
| 14 | **Banner de match aparece al detectar match** | Banner con título del match visible |
| 15 | Enlace "Matches" navega a /matches | URL contiene `/matches` |
| 16 | Enlace "Chat" navega a /chat | URL contiene `/chat` |
| 17 | Botón "Finalizar" navega a /resultados | URL contiene `/resultados` |

### Tests que desbloquea
- **TC-SWIPE-001**: Evaluar Like con botón
- **TC-SWIPE-002**: Evaluar Dislike con botón
- **TC-SWIPE-003**: Evaluar Like arrastrando derecha
- **TC-SWIPE-004**: Evaluar Dislike arrastrando izquierda
- **TC-SWIPE-005**: Tarjeta muestra información completa
- **TC-SWIPE-006**: Botones deshabilitados cuando compañero desconectado ⭐
- **TC-SWIPE-007**: Catálogo agotado muestra opciones ⭐
- **TC-SWIPE-008**: Sin resultados muestra opciones ⭐
- **TC-SWIPE-009**: Match detectado muestra banner ⭐
- **TC-SWIPE-010**: No hay match cuando uno da dislike ⭐
- **TC-SWIPE-011**: Navegar a matches desde swipe
- **TC-SWIPE-012**: Navegar a chat desde swipe
- **TC-SWIPE-013**: Finalizar sesión desde swipe

---

## R-FE-06: Dashboard Admin Completo

### Contexto
Los tests TC-ADMIN-006 a TC-ADMIN-021 verifican el panel de administración. TC-ADMIN-015 está marcado como manual.

### Requerimiento
Completar todas las funcionalidades del dashboard admin.

### Criterios de Aceptación

| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | Dashboard muestra "Salas" en KPIs | Texto visible |
| 2 | Dashboard muestra "Matches" en KPIs | Texto visible |
| 3 | Dashboard muestra gráfico gauge | Elemento con `class` "gauge" visible |
| 4 | Dashboard muestra gráfico de líneas | Elemento con `class` "line-chart" o "evolucion" visible |
| 5 | Dashboard tiene enlace "análisis detallado" | Link navega a /tendencias |
| 6 | Métricas muestra "Salas activas" | Texto visible |
| 7 | Métricas muestra "Salas totales" | Texto visible |
| 8 | Métricas muestra "Matches generados" | Texto visible |
| 9 | Métricas muestra "Promedio" | Texto visible |
| 10 | Inputs de fecha tienen `id="desde"` e `id="hasta"` | Selectores funcionan |
| 11 | Tras aplicar filtro, aparece "Filtro activo" | Texto visible tras seleccionar rango |
| 12 | Botón "Limpiar" tiene texto "Limpiar" | Selector XPath funciona |
| 13 | Click en "Limpiar" elimina filtro | "Filtro activo" desaparece |
| 14 | Plataformas muestra elementos con `class` "plataforma" | Al menos un elemento visible |
| 15 | Toggle de plataforma funciona | Checkbox cambia de estado |
| 16 | Botón "Guardar cambios" muestra "Cambios guardados" | Mensaje aparece tras guardar |
| 17 | **Modal de confirmación se puede cancelar** | Click en "Cancelar" cierra modal sin aplicar cambios ⭐ |
| 18 | Retroalimentación muestra `class` "promedio" | Elemento visible |
| 19 | Retroalimentación muestra `class` "distribucion" o "bar" | Elemento visible |
| 20 | Botón "Salir" navega a /login | URL contiene `/login` |

### Tests que desbloquea
- **TC-ADMIN-006 a TC-ADMIN-014** (ya funcionan)
- **TC-ADMIN-015**: Cancelar confirmación de deshabilitar ⭐
- **TC-ADMIN-016 a TC-ADMIN-021** (ya funcionan)

---

## R-FE-07: Perfil de Usuario

### Contexto
Los tests TC-PERF-001 a TC-PERF-006 verifican la página de perfil.

### Requerimiento
Asegurar que la página de perfil funcione correctamente con los IDs esperados.

### Criterios de Aceptación

| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | Input nombre tiene `id="nombre"` | Selector funciona |
| 2 | Input descripción tiene `id="desc"` | Selector funciona |
| 3 | Botón "Guardar cambios" tiene texto exacto | Selector XPath funciona |
| 4 | Tras guardar, aparece "Perfil actualizado correctamente" | Mensaje visible |
| 5 | Nombre vacío muestra "El nombre es requerido" | Error visible |
| 6 | Botón "Cancelar" navega a /home | URL cambia |
| 7 | Enlace "Volver" navega a /home | URL cambia |
| 8 | Datos del usuario se cargan al entrar | Input nombre no está vacío |

### Tests que desbloquea
- **TC-PERF-001 a TC-PERF-006** (todos automatizables)

---

## R-FE-08: Resultados y Calificación

### Contexto
Los tests TC-RES-001 a TC-RES-004 y TC-CAL-001 a TC-CAL-006 están marcados como manuales.

### Requerimiento
Implementar páginas de resultados y calificación completas.

### Criterios de Aceptación

| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | Resultados muestra lista de matches | Elementos de match visibles |
| 2 | Sin matches muestra mensaje apropiado | Texto "No se encontraron matches" visible |
| 3 | Botón "Calificar experiencia" navega a /calificacion | URL cambia |
| 4 | Botón "Salir sin calificar" navega a /home | URL cambia |
| 5 | Página calificación muestra botones del 1 al 10 | 10 botones numéricos visibles |
| 6 | Botón seleccionado tiene `class` "active" | Clase se agrega al click |
| 7 | Botón "Enviar calificación" navega a /home | URL cambia tras enviar |
| 8 | Sin seleccionar muestra "Selecciona una calificación" | Error visible |
| 9 | Valor 1 es aceptado | Navega a /home |
| 10 | Valor 10 es aceptado | Navega a /home |

### Tests que desbloquea
- **TC-RES-001**: Ver resultados con matches ⭐
- **TC-RES-002**: Ver resultados sin matches ⭐
- **TC-RES-003**: Ir a calificación desde resultados ⭐
- **TC-RES-004**: Salir sin calificar desde resultados ⭐
- **TC-CAL-001 a TC-CAL-006** (todos ⭐)

---

## R-FE-09: Matches (Lista)

### Contexto
Los tests TC-MATCH-001 a TC-MATCH-004 verifican la página de matches. TC-MATCH-001 está marcado como manual.

### Requerimiento
Implementar página de matches con lista y navegación.

### Criterios de Aceptación

| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | Con matches, lista es visible | Al menos un elemento de match visible |
| 2 | Sin matches muestra "Aún no tienen matches" | Texto visible |
| 3 | Enlace "Volver" navega a /swipe | URL contiene `/swipe` |
| 4 | Enlace "Chat" navega a /chat | URL contiene `/chat` |

### Tests que desbloquea
- **TC-MATCH-001**: Ver lista de matches con datos ⭐
- **TC-MATCH-002**: Ver matches cuando no hay
- **TC-MATCH-003**: Navegar a swipe desde matches
- **TC-MATCH-004**: Navegar a chat desde matches

---

## R-FE-10: Manejo de Estados de Conexión

### Contexto
Los tests TC-SWIPE-006, TC-CHAT-010, TC-E2E-010 verifican comportamiento ante desconexión/reconexión.

### Requerimiento
Implementar detección y notificación de estado de conexión del compañero.

### Criterios de Aceptación

| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | Cliente WebSocket envía heartbeat cada 5 segundos | Ping automático configurado |
| 2 | Desconexión detectada en < 15 segundos | Timeout de heartbeat |
| 3 | Banner "Reconectando..." aparece al perder conexión | Banner visible en chat y swipe |
| 4 | Botones de swipe se deshabilitan al perder conexión | `disabled` o `opacity: 0.5` |
| 5 | Reconexión restaura sesión automáticamente | Estado de sala se recupera |
| 6 | Banner de reconexión desaparece al reconectar | Banner se oculta |
| 7 | Botones de swipe se habilitan al reconectar | `disabled` se remueve |

### Tests que desbloquea
- **TC-SWIPE-006**: Botones deshabilitados cuando compañero desconectado ⭐
- **TC-CHAT-010**: Banner de reconexión ⭐
- **TC-E2E-010**: Flujo de desconexión y reconexión ⭐

---

## R-FE-11: Flujos E2E Automatizables

### Contexto
Los tests TC-E2E-001, 002, 003, 009, 010 están marcados como manuales porque requieren dos navegadores o intervención humana.

### Requerimiento
Asegurar que todos los flujos E2E sean automatizables con la infraestructura de tests de backend.

### Criterios de Aceptación

| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | Flujo completo registro → calificación funciona | TC-E2E-001 pasa sin intervención manual |
| 2 | Flujo con match funciona | TC-E2E-002 pasa usando endpoints de simulación |
| 3 | Flujo sin matches funciona | TC-E2E-003 pasa sin matches |
| 4 | Flujo de chat en tiempo real funciona | TC-E2E-009 pasa con WebSocket funcional |
| 5 | Flujo de desconexión/reconexión funciona | TC-E2E-010 pasa con manejo de estados |

### Tests que desbloquea
- **TC-E2E-001**: Flujo completo de usuario ⭐
- **TC-E2E-002**: Flujo con match ⭐
- **TC-E2E-003**: Flujo sin matches ⭐
- **TC-E2E-009**: Flujo de chat en tiempo real ⭐
- **TC-E2E-010**: Flujo de desconexión y reconexión ⭐

---

## Resumen de Tests Desbloqueados

### Tests actualmente manuales → automatizables

| Suite | Tests Manuales | Requerimiento Frontend Principal |
|-------|----------------|----------------------------------|
| test_salas.robot | TC-SALA-013, 014, 015 | R-FE-02 |
| test_chat.robot | TC-CHAT-001, 002, 005, 006, 007, 008, 010, 011 | R-FE-03, R-FE-10 |
| test_filtros.robot | TC-FILTRO-001 a 008, 010 | R-FE-04 |
| test_swipe.robot | TC-SWIPE-006, 007, 008, 009, 010 | R-FE-05, R-FE-10 |
| test_e2e.robot | TC-E2E-001, 002, 003, 009, 010 | R-FE-11 |
| test_admin.robot | TC-ADMIN-015 | R-FE-06 |
| test_perfil_resultados.robot | TC-MATCH-001, TC-RES-001 a 004 | R-FE-08, R-FE-09 |

**Total: 45 tests manuales → 100% automatizables**

---

## Priorización de Implementación

### Fase 1: Selectores y Salas (Sprint 1-2)
- **R-FE-01**: Infraestructura de selectores
- **R-FE-02**: Gestión de salas (incluye polling/WebSocket)
- **R-FE-07**: Perfil de usuario

### Fase 2: Filtros y Swipe (Sprint 3-4)
- **R-FE-04**: Filtros funcionales
- **R-FE-05**: Swipe interactivo
- **R-FE-09**: Matches (lista)

### Fase 3: Tiempo Real (Sprint 5-6)
- **R-FE-03**: Chat en tiempo real
- **R-FE-10**: Manejo de estados de conexión

### Fase 4: Completar Flujo (Sprint 7-8)
- **R-FE-06**: Dashboard admin completo
- **R-FE-08**: Resultados y calificación
- **R-FE-11**: Flujos E2E automatizables

---

## Dependencias Técnicas

| Componente | Versión Mínima | Propósito |
|------------|----------------|-----------|
| Angular | 16+ | Framework frontend |
| TypeScript | 5+ | Lenguaje |
| Apollo Angular | 6+ | Cliente GraphQL |
| graphql-ws | 5+ | Cliente WebSocket para GraphQL |
| RxJS | 7+ | Programación reactiva |
| Angular CDK | 16+ | Drag and drop |

---

## Variables de Entorno Requeridas

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/graphql',
  wsUrl: 'ws://localhost:8080/graphql',
  testMode: true,  // Habilita endpoints de test
  wsReconnectAttempts: 5,
  wsReconnectInterval: 3000,
  heartbeatInterval: 5000,
};
```

---

## Checklist de Verificación

Para validar que todos los requerimientos están implementados:

```bash
# 1. Verificar selectores
# Abrir DevTools en cada página y verificar que todos los selectores de variables.robot funcionan

# 2. Ejecutar todos los tests de Robot Framework
cd documentacion/robot
./run_tests.sh

# Esperado: 
# - 100% de tests pasan
# - 0 tests manuales
# - 0 fallos

# 3. Verificar flujos E2E manualmente
# - Registrar usuario nuevo
# - Crear sala
# - Otro usuario se une
# - Aplicar filtros
# - Evaluar contenido (like/dislike)
# - Ver matches
# - Usar chat
# - Finalizar sesión
# - Calificar experiencia
```

---

## Notas Finales

- **Eliminar marcas `[Tags] manual`** de todos los tests que se automatizan
- **Eliminar `Pass Execution`** de todos los tests que se automatizan
- **Mantener compatibilidad** con tests que ya funcionan
- **Documentar** todos los componentes y servicios
- **Tests unitarios** para cada componente crítico
- **Tests de integración** para flujos completos

---

## Matriz de Trazabilidad Tests ↔ Requerimientos

| Test ID | Requerimiento Frontend | Requerimiento Backend |
|---------|------------------------|----------------------|
| TC-SALA-013 | R-FE-02 | R-BE-02, R-BE-09 |
| TC-SALA-014 | R-FE-02 | R-BE-02 |
| TC-SALA-015 | R-FE-02 | R-BE-02 |
| TC-CHAT-001 | R-FE-03 | R-BE-03 |
| TC-CHAT-002 | R-FE-03 | R-BE-03 |
| TC-CHAT-005 | R-FE-03 | R-BE-03, R-BE-09 |
| TC-CHAT-006 | R-FE-03 | R-BE-03 |
| TC-CHAT-007 | R-FE-03 | R-BE-03 |
| TC-CHAT-008 | R-FE-03 | R-BE-03, R-BE-09 |
| TC-CHAT-010 | R-FE-03, R-FE-10 | R-BE-03, R-BE-10 |
| TC-CHAT-011 | R-FE-03 | R-BE-03, R-BE-05 |
| TC-FILTRO-001 a 008 | R-FE-04 | R-BE-04, R-BE-06 |
| TC-FILTRO-010 | R-FE-04 | R-BE-04, R-BE-06 |
| TC-SWIPE-006 | R-FE-05, R-FE-10 | R-BE-10 |
| TC-SWIPE-007 | R-FE-05 | R-BE-04 |
| TC-SWIPE-008 | R-FE-05 | R-BE-04, R-BE-06 |
| TC-SWIPE-009 | R-FE-05 | R-BE-05, R-BE-09 |
| TC-SWIPE-010 | R-FE-05 | R-BE-05, R-BE-09 |
| TC-E2E-001 | R-FE-11 | Todos |
| TC-E2E-002 | R-FE-11 | R-BE-03, R-BE-05, R-BE-09 |
| TC-E2E-003 | R-FE-11 | R-BE-03, R-BE-09 |
| TC-E2E-009 | R-FE-11 | R-BE-03, R-BE-09 |
| TC-E2E-010 | R-FE-11 | R-BE-10 |
| TC-ADMIN-015 | R-FE-06 | N/A |
| TC-MATCH-001 | R-FE-09 | R-BE-05 |
| TC-RES-001 a 004 | R-FE-08 | R-BE-08 |
| TC-CAL-001 a 006 | R-FE-08 | R-BE-08 |
