# Pruebas automatizadas con Robot Framework — CineMatch

Documentación detallada de la suite E2E ubicada en [`e2e/robot/`](../../e2e/robot).
Para la guía rápida de instalación y ejecución consulta el [README](../../README.md#-pruebas-automatizadas-robot-framework).

- **Herramientas:** Robot Framework 7.5.1 · SeleniumLibrary 6.9.0 · Firefox + geckodriver
- **Alcance:** 143 casos de prueba que cubren los casos de uso CU-01 … CU-12
- **Tipo:** pruebas de caja negra sobre la UI (Angular) contra el backend real (Spring Boot + PostgreSQL)

---

## 1. Arquitectura de la suite

```
e2e/robot/
├── variables.robot              # URLs, selectores, usuarios y mensajes esperados
├── keywords.robot               # Keywords reutilizables (login, crear sala, llamadas GraphQL de prueba…)
├── test_auth.robot              # 16 casos
├── test_salas.robot             # 15 casos
├── test_filtros.robot           # 10 casos
├── test_swipe.robot             # 13 casos
├── test_chat.robot              # 13 casos
├── test_perfil_resultados.robot # 20 casos
├── test_admin.robot             # 21 casos
├── test_seguridad.robot         # 22 casos
├── test_e2e.robot               # 13 casos
├── diagnostico/                 # Pruebas auxiliares de depuración (NO forman parte del plan)
│   ├── test_diag.robot
│   └── test_min.robot
├── run_tests.sh                 # Script de ejecución con verificaciones previas
├── requirements.txt             # Dependencias de Python
└── results/                     # Reportes generados (ignorado por git)
```

Las capas se usan así:

```
test_*.robot  ──usa──▶  keywords.robot  ──usa──▶  variables.robot
```

- **`variables.robot`**: única fuente de verdad para URLs, selectores CSS/XPath, credenciales y mensajes esperados. Si cambia un selector en el HTML, se corrige **solo aquí**.
- **`keywords.robot`**: acciones de alto nivel (`Login Usuario`, `Abrir Navegador`, `Preparar Sala Activa`…). Algunas llaman directamente a la API GraphQL usando las *mutations* de prueba del backend (`crearSalaTest`, `simularEvaluacion`, …), que solo existen con `app.test-mode=true`.
- **`test_*.robot`**: casos de prueba; deben leerse como especificación.

---

## 2. Catálogo de suites

| Suite | Casos | Prefijo | Casos de uso | Clasificación en el Plan de Pruebas |
|---|---:|---|---|---|
| `test_auth.robot` | 16 | `TC-AUTH-` | CU-01, CU-02 | Unitarias |
| `test_perfil_resultados.robot` | 20 | `TC-PERF-` · `TC-MATCH-` · `TC-RES-` · `TC-CAL-` | CU-03, CU-07, CU-09 | Unitarias (PERF, CAL) · Integrales (MATCH, RES) |
| `test_salas.robot` | 15 | `TC-SALA-` | CU-04 | Integrales |
| `test_filtros.robot` | 10 | `TC-FILTRO-` | CU-05 | Integrales |
| `test_swipe.robot` | 13 | `TC-SWIPE-` | CU-06, CU-07 | Integrales |
| `test_chat.robot` | 13 | `TC-CHAT-` | CU-08 | Integrales |
| `test_admin.robot` | 21 | `TC-ADMIN-` | CU-10, CU-11, CU-12 | Sistema |
| `test_seguridad.robot` | 22 | `TC-SEG-` | Transversal (guards, roles) | Sistema |
| `test_e2e.robot` | 13 | `TC-E2E-` | Flujos completos | Regresión |
| **Total** | **143** | | | Unitarias 28 · Integrales 59 · Sistema 43 · Regresión 13 |

> La carpeta `diagnostico/` contiene 2 pruebas extra (`TC-DIAG`, `TC-MIN`) con el tag `diagnostico`.
> `run_tests.sh` las **excluye por defecto**, por lo que una corrida completa reporta 143 pruebas.

---

## 3. Tags

Cada caso tiene `[Tags]` que permiten filtrar con `./run_tests.sh --tag <tag>`:

| Tag | Uso |
|---|---|
| `positivo` / `negativo` | Camino feliz / casos de error |
| `validacion` | Validaciones de formularios |
| `seguridad`, `guard`, `authGuard` | Rutas protegidas y permisos |
| `ui`, `navegacion` | Comportamiento visual y navegación |
| `e2e` | Flujos completos |
| `manual`, `requiere-dos-navegadores`, `tiempo-real` | Casos que dependen de dos sesiones simultáneas o WebSocket |
| Por módulo | `auth`, `login`, `registro`, `sala`, `filtros`, `swipe`, `chat`, `admin`, `perfil`, `matches`, `resultados`, `calificacion`… |
| `diagnostico` | Pruebas auxiliares de depuración (excluidas por defecto) |

---

## 4. Datos de prueba

Los seeds viven en el **repositorio del backend** (`cinematch-backend/misc/scripts/`):

| Script | Crea |
|---|---|
| `seed_usuarios_robot.sql` | `test1@cinematch.com` / `Test1234`, `test2@cinematch.com` / `Test1234`, `admin@cinematch.com` / `Admin1234` |
| `seed_plataformas_robot.sql` | Netflix, Disney+, HBO Max, Amazon Prime Video, Apple TV+, Paramount+, Hulu, Crunchyroll (habilitadas) |

Alternativa sin `psql`: desde el backend ejecutar `./mvnw test -Dtest=CargaUsuariosRobotTest`, que crea los mismos usuarios con el `PasswordEncoder` de la aplicación.

> [!IMPORTANT]
> **IDs fijos.** `variables.robot` define `USER1_ID=5` y `USER2_ID=6`, que se usan en las *mutations* de prueba (crear sala, simular evaluaciones).
> En una base de datos nueva verifica los IDs reales:
>
> ```sql
> SELECT id, correo FROM usuarios WHERE correo IN ('test1@cinematch.com','test2@cinematch.com');
> ```
>
> Si no son 5 y 6, ejecuta Robot sobrescribiendo las variables:
>
> ```bash
> robot --outputdir results --exclude diagnostico \
>       --variable USER1_ID:<id_test1> --variable USER2_ID:<id_test2> .
> ```

---

## 5. Cómo agregar una prueba nueva

1. **Elegir la suite** según el módulo (o crear `test_<modulo>.robot` copiando la sección `*** Settings ***` de otra suite).
2. **Nombrar el caso** con el siguiente consecutivo del prefijo: `TC-<MÓDULO>-NNN: Descripción en español`.
3. **Documentar y etiquetar:**
   ```robot
   TC-AUTH-017: Login bloqueado tras varios intentos
       [Documentation]    Verifica que …
       [Tags]    auth    login    negativo
       Go To    ${LOGIN_URL}
       …
   ```
4. **Selectores y mensajes** nuevos → `variables.robot`. **Acciones repetidas** → nueva keyword en `keywords.robot`.
5. Verificar sin ejecutar: `./run_tests.sh --suite <modulo> --dry-run`.
6. Ejecutar la suite y, si pasa, **reflejar el caso en el Plan de Pruebas** (sección correspondiente: Unitarias / Integrales / Sistema / Regresión).
7. Las pruebas temporales de depuración van en `diagnostico/` con `Test Tags    diagnostico`.

---

## 6. Resultados y Plan de Pruebas

Cada corrida genera en `e2e/robot/results/` (con marca de tiempo):

| Archivo | Contenido |
|---|---|
| `report-<fecha>.html` | Resumen visual: totales, estadísticas por suite y por tag |
| `log-<fecha>.html` | Detalle paso a paso de cada keyword, con capturas en los fallos |
| `output-<fecha>.xml` | Resultado en XML, insumo para generar documentos |
| `selenium-screenshot-*.png` | Capturas automáticas al fallar |

Desde WSL se pueden abrir en el navegador de Windows con:

```bash
explorer.exe "$(wslpath -w results)"
```

Para combinar varias corridas (por ejemplo, reintentos de suites fallidas) en un solo reporte:

```bash
rebot --outputdir results --output combinado.xml results/output-A.xml results/output-B.xml
```

El documento *Plan de Pruebas* se generó a partir de un `output-*.xml` con los scripts `generar_plan_pruebas_robot.py` / `generar_guia_pruebas_robot.py` (carpeta de documentación del proyecto).

---

## 7. Problemas conocidos y solución

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Http failure response … 0 Unknown Error` en la UI | Backend apagado | Levantar el backend (`./mvnw spring-boot:run`) |
| Muchas pruebas van a `/resultados` en lugar de `/swipe` (TC-FILTRO-001, TC-SWIPE-001, TC-E2E-008) | La BD ya tiene evaluaciones previas y el catálogo quedó "agotado" | Limpiar salas con la mutation `limpiarDatosTest` ([ver backend](https://github.com/LuisMangoAtaulfo/cinematch-backend/blob/master/misc/docs/PRUEBAS.md#23-reiniciar-el-estado-entre-corridas)) y volver a correr |
| Fallan pruebas que crean salas de prueba | `USER1_ID`/`USER2_ID` no coinciden con la BD | Ver sección 4 |
| `TestModeNotEnabledException` | Backend con `app.test-mode=false` | Activar `app.test-mode=true` en `application.properties` |
| `WebDriverException: … geckodriver` | geckodriver no está en el `PATH` o Firefox es snap | Ver README → Firefox y geckodriver en WSL |
| `Error: no DISPLAY environment variable` | WSL sin interfaz gráfica | Usar `./run_tests.sh --headless` |
| La terminal reporta 145 pruebas | Se ejecutó `robot` directamente sin excluir `diagnostico` | Usar `run_tests.sh` o añadir `--exclude diagnostico` |
| TC-E2E-001 y TC-E2E-008 fallan de forma intermitente | Flujos largos sensibles a tiempos/estado | Reintentar con BD limpia; documentado en el Plan de Pruebas |
