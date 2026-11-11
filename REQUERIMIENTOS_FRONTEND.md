# Requerimientos Frontend — CineMatch

> Documento derivado del análisis de `robot/ESTADO_TESTS.md` y la suite de pruebas Robot Framework.
> Objetivo: que todos los tests automatizados pasen sin intervención manual, asegurando que la UI sea funcional, accesible y correcta para cada flujo.

---

## Resumen Ejecutivo

La suite de Robot Framework cubre **~100 tests** distribuidos en 10 suites. Actualmente ~45 tests están marcados como manuales porque el frontend no soporta completamente los flujos automatizables o los selectores/IDs no coinciden con lo esperado por los tests. Este documento detalla los cambios necesarios en el frontend.

---

## R-FE-01: IDs y Selectores de Elementos consistentes

### Contexto
Los tests de Robot Framework buscan elementos por `id`, `class`, `aria-label` y texto. Varios componentes no tienen los atributos esperados, lo que causa fallos.

### Requerimiento
Revisar y estandarizar los IDs, clases y atributos ARIA de todos los componentes interactivos para que coincidan con los selectores definidos en `variables.robot`.

### Criterios de Aceptación

| # | Componente | Atributo requerido | Selector del test | Estado actual |
|---|-----------|-------------------|-------------------|---------------|
| 1 | Input correo (login) | `id="correo"` | `${INPUT_CORREO}` | ✅ Correcto |
| 2 | Input contraseña (login) | `id="pass"` | `${INPUT_PASSWORD}` | ✅ Corregido |
| 3 | Input nombre (registro) | `id="nombre"` | `${INPUT_NOMBRE}` | ✅ Correcto |
| 4 | Input confirmar contraseña | `id="pass2"` | `${INPUT_CONFIRM_PASS}` | ✅ Corregido |
| 5 | Input código de sala | `id="codigo"` | `${INPUT_CODIGO}` | ✅ Corregido |
| 6 | Input descripción (perfil) | `id="desc"` | `${INPUT_DESCRIPCION}` | ✅ Corregido |
| 7 | Toggle visibilidad contraseña | `class` contiene `eye-btn` | `${BTN_TOGGLE_PASS}` | ⚠️ Verificar |
| 8 | Botón de like | `class` contiene `btn-like` o `aria-label="like"` | `${BTN_LIKE}` | ⚠️ Verificar |
| 9 | Botón de dislike | `class` contiene `btn-dislike` o `aria-label="dislike"` | `${BTN_DISLIKE}` | ⚠️ Verificar |
| 10 | Tarjeta de contenido swipe | `class` contiene `swipe-card` o `card` | `${CARD_CONTENIDO}` | ⚠️ Verificar |
| 11 | Input mensaje chat | `placeholder` contiene "mensaje" o `id="texto"` | `${INPUT_MENSAJE}` | ⚠️ Verificar |
| 12 | Selectores admin: `id="desde"`, `id="hasta"` | Inputs de fecha | `${INPUT_FECHA_DESDE}`, `${INPUT_FECHA_HASTA}` | ⚠️ Verificar |
| 13 | Código de sala visible | `class` contiene `sala-code` o estilo `letter-spacing` | Keyword `Crear Sala` | ⚠️ Verificar |
| 14 | Mensajes de error | `class="form-error"` o texto visible | `${ERROR_MESSAGE}` | ⚠️ Verificar |

### Selectores de texto a verificar

| Selector | Texto esperado | Verificar |
|----------|---------------|-----------|
| `//*[contains(text(), 'Hola')]` | "Hola" en home tras login | ✅ |
| `//*[contains(text(), 'Dashboard')]` | "Dashboard" en panel admin | ✅ Ya corregido |
| `//*[contains(text(), 'no tiene permisos')]` | Mensaje al usuario no-admin | ✅ Ya corregido |
| `//*[contains(text(), 'Completar todos los campos')]` | Validación campos vacíos | Verificar texto exacto |
| `//*[contains(text(), '¡Copiado!')]` | Feedback al copiar código | ⚠️ Verificar |
| `//*[contains(text(), 'Preparando la sesión')]` | Pantalla espera de filtros | ⚠️ Verificar |
| `//*[contains(text(), 'Aún no hay mensajes')]` | Chat vacío | ⚠️ Verificar |
| `//*[contains(text(), 'Aún no tienen matches')]` | Matches vacío | ⚠️ Verificar |
| `//*[contains(text(), 'Perfil actualizado correctamente')]` | Confirmación de perfil | ⚠️ Verificar |
| `//*[contains(text(), 'Filtro activo')]` | Indicador de filtro en métricas | ⚠️ Verificar |
| `//*[contains(text(), 'Cambios guardados')]` | Confirmación plataformas | ⚠️ Verificar |
| `//*[contains(text(), 'Selecciona una calificación')]` | Validación calificación vacía | ⚠️ Verificar |
| `//*[contains(text(), 'Código de sala inválido')]` | Error código inválido | ⚠️ Verificar |
| `//*[contains(text(), 'Ingresa un código')]` | Error campo vacío código | ⚠️ Verificar |

### Medida de éxito
- **100% de los selectores** en `variables.robot` coinciden con elementos reales en la UI
- Ejecutar `test_seguridad.robot` y `test_auth.robot` → 0 fallos por selector incorrecto

---

## R-FE-02: Flujo de Crear y Unirse a Sala

### Contexto
Los tests TC-SALA-001 a TC-SALA-012 verifican la creación de sala, visualización del código, copia al portapapeles, cancelación y unirse con código. El botón "Crear sala" es un enlace (`<a>`) y no un `<button>`.

### Requerimiento
Asegurar que el flujo de crear/unirse a sala sea completo y funcional, con los selectores correctos.

### Criterios de Aceptación
| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | El enlace "Crear sala" en home es un elemento `<a>` | `document.querySelectorAll('a')` contiene texto "Crear sala" |
| 2 | El enlace "Unirse a sala" en home es un elemento `<a>` | `document.querySelectorAll('a')` contiene texto "Unirse a sala" |
| 3 | Tras crear sala, se muestra un código de 6 caracteres alfanuméricos | El código visible cumple `^[A-Z0-9]{6}$` |
| 4 | El botón "Copiar código" muestra feedback "¡Copiado!" | El texto aparece durante ≥ 1 segundo |
| 5 | El botón "Cancelar sala" redirige a /home | URL cambia a `/home` tras click |
| 6 | El input de código convierte a mayúsculas automáticamente | Escribir "a7x3k9" muestra "A7X3K9" |
| 7 | Unirse con código inválido muestra "Código de sala inválido" | El mensaje es visible tras click en "Unirse" |
| 8 | Unirse con campo vacío muestra "Ingresa un código" | El mensaje es visible sin necesidad de enviar el formulario |
| 9 | El botón "Cerrar sesión" es un `<button>` con texto "Cerrar sesión" | `document.querySelector('button')` con texto exacto |

### Tests que desbloquea
- TC-SALA-001 a TC-SALA-004
- TC-SALA-006 a TC-SALA-009
- TC-SALA-011, TC-SALA-012

---

## R-FE-03: Pantalla de Espera de Filtros

### Contexto
El test TC-SALA-011 verifica que cuando un invitado se une a una sala, ve una pantalla de espera con el texto "Preparando la sesión" y un spinner hasta que el creador aplique los filtros.

### Requerimiento
Implementar la pantalla de espera de filtros que muestre un mensaje de estado y un indicador de carga.

### Criterios de Aceptación
| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | La pantalla muestra el texto "Preparando la sesión" | El texto es visible al unirse a una sala |
| 2 | Se muestra un spinner o indicador de carga | Un elemento animado es visible |
| 3 | El botón "Cancelar y salir" redirige a /home | URL cambia a `/home` tras click |
| 4 | La pantalla detecta cuando la sala pasa a ACTIVA y redirige automáticamente | Navegación automática a /filtros en < 5 segundos |

### Tests que desbloquea
- TC-SALA-011 (spinner visible)
- TC-SALA-012 (cancelar desde espera)

---

## R-FE-04: Cliente WebSocket para Chat en Tiempo Real

### Contexto
Los tests de chat requieren envío y recepción de mensajes en tiempo real. El frontend necesita un cliente WebSocket que se conecte al backend y maneje eventos de mensajes, matches y estado del compañero.

### Requerimiento
Implementar un servicio Angular que gestione la conexión WebSocket para el chat, incluyendo envío, recepción, historial y notificaciones de estado.

### Criterios de Aceptación
| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | Al entrar a /chat con sala activa, se establece conexión WebSocket | La conexión se abre en < 3 segundos |
| 2 | Los mensajes enviados aparecen instantáneamente en la UI del emisor | El input se limpia y el mensaje aparece en < 1 segundo |
| 3 | Los mensajes recibidos aparecen en tiempo real | Mensaje del compañero aparece en < 2 segundos |
| 4 | Los mensajes propios se alinean a la derecha | CSS/HTML muestra mensajes propios a la derecha |
| 5 | Los mensajes del compañero se alinean a la izquierda | CSS/HTML muestra mensajes recibidos a la izquierda |
| 6 | Enviar mensaje vacío no envía nada | Click en "Enviar" sin texto no agrega burbuja |
| 7 | Presionar Enter envía el mensaje | `keydown.enter` en el input envía el mensaje |
| 8 | El input se limpia después de enviar | `input.value === ''` tras enviar |
| 9 | Chat vacío muestra "Aún no hay mensajes" | El placeholder es visible cuando no hay mensajes |
| 10 | Se muestra banner cuando se detecta un match | Banner con texto de match aparece al recibir notificación |
| 11 | Se muestra banner de reconexión al perder conexión | Banner "Reconectando..." aparece al detectar desconexión |

### Tests que desbloquea
- TC-CHAT-001 a TC-CHAT-013

---

## R-FE-05: Filtros de Contenido Funcionales

### Contexto
Los tests TC-FILTRO-001 a TC-FILTRO-010 verifican que los filtros de tipo, género, plataforma y año funcionen. Los selects deben tener los datos correctos y la aplicación de filtros debe navegar a /swipe.

### Requerimiento
Implementar la página de filtros con dropdowns poblados dinámicamente y navegación al aplicar u omitir filtros.

### Criterios de Aceptación
| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | Dropdown de tipo tiene opciones "Película" y "Serie" | `select#tipo` tiene al menos 2 options con esos labels |
| 2 | Dropdown de género tiene al menos 5 géneros | `select#genero` tiene ≥ 5 options |
| 3 | Dropdown de plataforma muestra solo plataformas habilitadas | `select#plataforma` muestra solo plataformas `activa = true` |
| 4 | Dropdown de año va del año actual a 1980 | El primer option es el año actual, el último es 1980 |
| 5 | Botón "Aplicar filtros" navega a /swipe | URL cambia a `/swipe` tras click |
| 6 | Botón "Omitir filtros" navega a /swipe sin filtros | URL cambia a `/swipe` y se muestra todo el catálogo |
| 7 | Filtros combinados funcionan (tipo + género + plataforma + año) | El contenido mostrado en /swipe cumple todos los filtros |
| 8 | Si no hay resultados, se muestra mensaje apropiado | Mensaje visible cuando los filtros no retornan contenido |

### Tests que desbloquea
- TC-FILTRO-001 a TC-FILTRO-010 (excepto TC-FILTRO-009 que ya funciona)

---

## R-FE-06: Pantalla de Swipe con Interacción

### Contexto
Los tests TC-SWIPE-001 a TC-SWIPE-013 verifican la evaluación de contenido mediante botones (like/dislike) y gestos de arrastre. La tarjeta debe mostrar información completa del contenido.

### Requerimiento
Implementar la pantalla de swipe con tarjeta de contenido, botones de evaluación y soporte de drag.

### Criterios de Aceptación
| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | La tarjeta muestra título del contenido | Elemento con `class` conteniendo "titulo" es visible |
| 2 | La tarjeta muestra año del contenido | Elemento con `class` conteniendo "anio" es visible |
| 3 | La tarjeta muestra género del contenido | Elemento con `class` conteniendo "genero" es visible |
| 4 | Botón like tiene `class` con "btn-like" o `aria-label="like"` | El selector del test encuentra el botón |
| 5 | Botón dislike tiene `class` con "btn-dislike" o `aria-label="dislike"` | El selector del test encuentra el botón |
| 6 | Click en like avanza al siguiente contenido | Nueva tarjeta aparece tras click |
| 7 | Click en dislike avanza al siguiente contenido | Nueva tarjeta aparece tras click |
| 8 | Drag a la derecha simula like | Arrastrar 200px a la derecha registra like |
| 9 | Drag a la izquierda simula dislike | Arrastrar 200px a la izquierda registra dislike |
| 10 | La tarjeta tiene `class` conteniendo "swipe-card" o "card" | El selector `${CARD_CONTENIDO}` encuentra el elemento |
| 11 | Enlace "Matches" navega a /matches | Click en link "Matches" → URL contiene `/matches` |
| 12 | Enlace "Chat" navega a /chat | Click en link "Chat" → URL contiene `/chat` |
| 13 | Botón "Finalizar" navega a /resultados | Click en "Finalizar" → URL contiene `/resultados` |
| 14 | Cuando no hay más contenido, se muestran opciones | Mensaje de "catálogo agotado" o "sin resultados" es visible |

### Tests que desbloquea
- TC-SWIPE-001 a TC-SWIPE-013

---

## R-FE-07: Dashboard Admin Completo

### Contexto
Los tests TC-ADMIN-006 a TC-ADMIN-021 verifican el panel de administración: dashboard con KPIs, gráficos, métricas, plataformas y retroalimentación. Ya se corrigió el título a "Dashboard".

### Requerimiento
Completar las funcionalidades del dashboard admin que aún faltan.

### Criterios de Aceptación
| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | Dashboard muestra tarjetas KPI con "Salas" y "Matches" | Elementos con esos textos son visibles |
| 2 | Dashboard muestra gráfico gauge | Elemento con `class` conteniendo "gauge" es visible |
| 3 | Dashboard muestra gráfico de líneas/evolución | Elemento con `class` conteniendo "line-chart" o "evolucion" es visible |
| 4 | Dashboard tiene enlace a "análisis detallado" que navega a /tendencias | Click en link → URL contiene `/tendencias` |
| 5 | Métricas muestra "Salas activas", "Salas totales", "Matches generados", "Promedio" | Los 4 textos son visibles |
| 6 | Métricas permite filtrar por fecha (inputs `id="desde"` e `id="hasta"`) | Los inputs existen y tienen esos IDs exactos |
| 7 | Tras aplicar filtro de fechas, aparece texto "Filtro activo" | Texto visible tras seleccionar rango y esperar 2s |
| 8 | Botón "Limpiar" elimina el filtro | El texto "Filtro activo" desaparece |
| 9 | Plataformas muestra lista con `class` conteniendo "plataforma" | Al menos un elemento con esa clase es visible |
| 10 | Toggle de plataforma funciona y muestra "Cambios guardados" | El mensaje aparece tras guardar |
| 11 | Retroalimentación muestra promedio con `class` conteniendo "promedio" | Elemento visible |
| 12 | Retroalimentación muestra distribución con `class` conteniendo "distribucion" o "bar" | Elemento visible |
| 13 | Botón "Salir" cierra sesión y redirige a /login | URL contiene `/login` tras click |

### Tests que desbloquea
- TC-ADMIN-006 a TC-ADMIN-021

---

## R-FE-08: Perfil de Usuario

### Contexto
Los tests TC-PERF-001 a TC-PERF-006 y TC-E2E-007 verifican la visualización y actualización del perfil.

### Requerimiento
Asegurar que la página de perfil funcione correctamente con los IDs esperados.

### Criterios de Aceptación
| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | Input nombre tiene `id="nombre"` | El campo existe con ese ID |
| 2 | Input descripción tiene `id="desc"` | El campo existe con ese ID |
| 3 | Botón "Guardar cambios" actualiza el perfil | Click → aparece "Perfil actualizado correctamente" |
| 4 | Nombre vacío muestra error "El nombre es requerido" | El mensaje es visible tras intentar guardar |
| 5 | Botón "Cancelar" redirige a /home | URL cambia a `/home` |
| 6 | Enlace "Volver" redirige a /home | URL cambia a `/home` |
| 7 | Los datos del usuario se cargan al entrar | El input nombre no está vacío |

### Tests que desbloquea
- TC-PERF-001 a TC-PERF-006
- TC-E2E-007

---

## R-FE-09: Resultados y Calificación

### Contexto
Los tests TC-RES-001 a TC-RES-004 y TC-CAL-001 a TC-CAL-006 verifican la pantalla de resultados y el flujo de calificación.

### Requerimiento
Implementar las páginas de resultados y calificación con la interacción esperada.

### Criterios de Aceptación
| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | Resultados muestra matches si los hubo | Lista de matches visible |
| 2 | Resultados muestra mensaje si no hubo matches | Texto "No se encontraron matches" o similar visible |
| 3 | Botón "Calificar experiencia" navega a /calificacion | URL contiene `/calificacion` |
| 4 | Botón "Salir sin calificar" navega a /home | URL contiene `/home` |
| 5 | Página de calificación muestra botones del 1 al 10 | 10 botones numéricos son visibles |
| 6 | Botón seleccionado tiene `class` conteniendo "active" | El botón clickeado tiene esa clase |
| 7 | Botón "Enviar calificación" envía y redirige a /home | URL contiene `/home` tras enviar |
| 8 | Sin seleccionar valor, muestra "Selecciona una calificación" | Error visible tras click sin selección |
| 9 | Valores mínimos (1) y máximos (10) son aceptados | Redirige a /home correctamente |

### Tests que desbloquea
- TC-RES-001 a TC-RES-004
- TC-CAL-001 a TC-CAL-006

---

## R-FE-10: Matches (Lista)

### Contexto
Los tests TC-MATCH-001 a TC-MATCH-004 verifican la página de matches.

### Requerimiento
Asegurar que la página de matches muestre la lista de matches y los enlaces de navegación.

### Criterios de Aceptación
| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | Con matches, se muestran en lista | Al menos un elemento de match es visible |
| 2 | Sin matches, se muestra "Aún no tienen matches" | El texto es visible |
| 3 | Enlace "Volver" navega a /swipe | URL contiene `/swipe` |
| 4 | Enlace "Chat" navega a /chat | URL contiene `/chat` |

### Tests que desbloquea
- TC-MATCH-001 a TC-MATCH-004

---

## R-FE-11: Conversión de Input de Código a Mayúsculas

### Contexto
El test TC-SALA-009 verifica que el input de código de sala convierte automáticamente a mayúsculas.

### Requerimiento
Implementar conversión automática a mayúsculas en el campo de código de sala.

### Criterios de Aceptación
| # | Criterio | Medida de Éxito |
|---|----------|-----------------|
| 1 | Escribir "a7x3k9" en el input muestra "A7X3K9" | `input.value === 'A7X3K9'` tras escribir |
| 2 | La conversión ocurre en tiempo real (no solo al enviar) | El valor cambia mientras se escribe |

### Tests que desbloquea
- TC-SALA-009

---

## Priorización

| Prioridad | Requerimiento | Impacto en Tests |
|-----------|---------------|-----------------|
| 🔴 P0 | R-FE-01 (IDs y selectores) | Base para todos los demás tests |
| 🔴 P0 | R-FE-02 (Crear/Unirse sala) | 9 tests de salas |
| 🔴 P0 | R-FE-04 (WebSocket chat) | 13 tests de chat |
| 🟡 P1 | R-FE-05 (Filtros funcionales) | 9 tests de filtros |
| 🟡 P1 | R-FE-06 (Swipe interactivo) | 13 tests de swipe |
| 🟡 P1 | R-FE-03 (Espera de filtros) | 2 tests de salas |
| 🟢 P2 | R-FE-07 (Dashboard admin) | 16 tests de admin (parcialmente funcional) |
| 🟢 P2 | R-FE-08 (Perfil) | 6 tests de perfil |
| 🟢 P2 | R-FE-09 (Resultados/Calificación) | 10 tests de resultados/calificación |
| 🟢 P2 | R-FE-10 (Matches) | 4 tests de matches |
| 🟢 P2 | R-FE-11 (Mayúsculas en código) | 1 test de salas |

---

## Resumen de Tests por Estado

### Tests que ya deberían pasar ✅ (~50)
| Suite | Tests | Cantidad |
|-------|-------|----------|
| Autenticación | TC-AUTH-001 a TC-AUTH-016 | 16 |
| Admin Login | TC-ADMIN-001 a TC-ADMIN-005 | 5 |
| Admin Dashboard | TC-ADMIN-006 a TC-ADMIN-021 | 16 |
| Seguridad | TC-SEG-001 a TC-SEG-022 | 22 |
| Seguridad Filtros | TC-FILTRO-009 | 1 |
| Seguridad Salas | TC-SALA-005, TC-SALA-010 | 2 |

### Tests que requieren cambios en frontend/backend (~45)
| Suite | Tests | Cantidad | Dependencia principal |
|-------|-------|----------|---------------------|
| Salas | TC-SALA-001 a TC-SALA-012 | 10 | Backend (R-BE-02) + Frontend (R-FE-02) |
| Chat | TC-CHAT-001 a TC-CHAT-013 | 13 | WebSocket (R-BE-03 + R-FE-04) |
| Filtros | TC-FILTRO-001 a TC-FILTRO-010 | 9 | Backend catálogo (R-BE-04, R-BE-06) |
| Swipe | TC-SWIPE-001 a TC-SWIPE-013 | 13 | Contenido + match detection |
| Resultados/Calif. | TC-RES, TC-CAL | 10 | API de resultados (R-BE-08) |
| E2E | TC-E2E-001 a TC-E2E-013 | 13 | Flujo completo |

---

## Notas Técnicas

- **Framework**: Angular (TypeScript)
- **Puerto de desarrollo**: 4200 (`http://localhost:4200`)
- **API del backend**: GraphQL en `http://localhost:8080/graphql`
- **WebSocket**: Se necesitará configurar la conexión en el frontend
- **Componentes principales**: `dashboard-actividad.component.ts`, `admin-login.component.ts` ya tienen correcciones aplicadas

## Checklist de Verificación Rápida

Para validar que los cambios fueron correctos, ejecutar en orden:

```bash
# 1. Tests de autenticación (ya deberían pasar)
robot --test "TC-AUTH-*" test_auth.robot

# 2. Tests de seguridad (ya deberían pasar)
robot --test "TC-SEG-*" test_seguridad.robot

# 3. Tests de admin
robot --test "TC-ADMIN-*" test_admin.robot

# 4. Tests de salas (requiere backend R-BE-02)
robot --test "TC-SALA-*" test_salas.robot

# 5. Tests de filtros (requiere backend R-BE-04, R-BE-06)
robot --test "TC-FILTRO-*" test_filtros.robot

# 6. Tests de perfil y calificación
robot test_perfil_resultados.robot

# 7. Tests E2E (requiere todo implementado)
robot test_e2e.robot
```
