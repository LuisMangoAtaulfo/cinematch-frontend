*** Settings ***
Documentation     Pruebas de seguridad: guards, autorización, rutas protegidas
Library           SeleniumLibrary
Library           Collections
Library           String
Library           OperatingSystem
Resource          keywords.robot
Suite Setup       Abrir Navegador
Suite Teardown    Cerrar Navegador

*** Test Cases ***
# ══════════════════════════════════════════════
# GUARDS DE AUTENTICACIÓN (authGuard)
# ══════════════════════════════════════════════

TC-SEG-001: Home requiere autenticación
    [Documentation]    Verifica que /home redirige a /login sin autenticación
    [Tags]    seguridad    guard    authGuard
    Go To    ${HOME_URL}
    Verificar URL Contiene    /login

TC-SEG-002: Perfil requiere autenticación
    [Documentation]    Verifica que /perfil redirige a /login
    [Tags]    seguridad    guard    authGuard
    Go To    ${PERFIL_URL}
    Verificar URL Contiene    /login

TC-SEG-003: Crear sala requiere autenticación
    [Documentation]    Verifica que /sala/crear redirige a /login
    [Tags]    seguridad    guard    authGuard
    Go To    ${CREAR_SALA_URL}
    Verificar URL Contiene    /login

TC-SEG-004: Unirse a sala requiere autenticación
    [Documentation]    Verifica que /sala/unirse redirige a /login
    [Tags]    seguridad    guard    authGuard
    Go To    ${UNIRSE_URL}
    Verificar URL Contiene    /login

TC-SEG-005: Filtros requiere autenticación
    [Documentation]    Verifica que /filtros redirige a /login
    [Tags]    seguridad    guard    authGuard
    Go To    ${FILTROS_URL}
    Verificar URL Contiene    /login

TC-SEG-006: Swipe requiere autenticación
    [Documentation]    Verifica que /swipe redirige a /login
    [Tags]    seguridad    guard    authGuard
    Go To    ${SWIPE_URL}
    Verificar URL Contiene    /login

TC-SEG-007: Matches requiere autenticación
    [Documentation]    Verifica que /matches redirige a /login
    [Tags]    seguridad    guard    authGuard
    Go To    ${MATCHES_URL}
    Verificar URL Contiene    /login

TC-SEG-008: Chat requiere autenticación
    [Documentation]    Verifica que /chat redirige a /login
    [Tags]    seguridad    guard    authGuard
    Go To    ${CHAT_URL}
    Verificar URL Contiene    /login

TC-SEG-009: Resultados requiere autenticación
    [Documentation]    Verifica que /resultados redirige a /login
    [Tags]    seguridad    guard    authGuard
    Go To    ${RESULTADOS_URL}
    Verificar URL Contiene    /login

TC-SEG-010: Calificación requiere autenticación
    [Documentation]    Verifica que /calificacion redirige a /login
    [Tags]    seguridad    guard    authGuard
    Go To    ${CALIFICACION_URL}
    Verificar URL Contiene    /login

# ══════════════════════════════════════════════
# GUARDS DE ADMINISTRADOR (adminGuard)
# ══════════════════════════════════════════════

TC-SEG-011: Dashboard admin requiere rol administrador
    [Documentation]    Verifica que usuario normal no puede acceder
    [Tags]    seguridad    guard    adminGuard
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Go To    ${ADMIN_DASHBOARD_URL}
    Verificar URL Contiene    /login

TC-SEG-012: Métricas requiere rol administrador
    [Documentation]    Verifica que usuario normal no puede acceder
    [Tags]    seguridad    guard    adminGuard
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Go To    ${ADMIN_METRICAS_URL}
    Verificar URL Contiene    /login

TC-SEG-013: Plataformas requiere rol administrador
    [Documentation]    Verifica que usuario normal no puede acceder
    [Tags]    seguridad    guard    adminGuard
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Go To    ${ADMIN_PLAT_URL}
    Verificar URL Contiene    /login

TC-SEG-014: Retroalimentación requiere rol administrador
    [Documentation]    Verifica que usuario normal no puede acceder
    [Tags]    seguridad    guard    adminGuard
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Go To    ${ADMIN_RETRO_URL}
    Verificar URL Contiene    /login

# ══════════════════════════════════════════════
# RUTAS PÚBLICAS
# ══════════════════════════════════════════════

TC-SEG-015: Login es ruta pública
    [Documentation]    Verifica que /login es accesible sin autenticación
    [Tags]    seguridad    publico
    Go To    ${LOGIN_URL}
    Verificar URL Contiene    /login
    Verificar Elemento Visible    ${BTN_LOGIN}

TC-SEG-016: Registro es ruta pública
    [Documentation]    Verifica que /registro es accesible sin autenticación
    [Tags]    seguridad    publico
    Go To    ${REGISTRO_URL}
    Verificar URL Contiene    /registro
    Verificar Elemento Visible    ${BTN_REGISTRO}

TC-SEG-017: Admin login es ruta pública
    [Documentation]    Verifica que /admin/login es accesible sin autenticación
    [Tags]    seguridad    publico
    Go To    ${ADMIN_LOGIN_URL}
    Verificar URL Contiene    /admin/login
    Verificar Elemento Visible    ${BTN_INGRESAR_ADMIN}

# ══════════════════════════════════════════════
# RUTAS INEXISTENTES
# ══════════════════════════════════════════════

TC-SEG-018: Ruta inexistente redirige a home
    [Documentation]    Verifica que rutas inválidas redirigen a /home
    [Tags]    seguridad    wildcard
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Go To    ${BASE_URL}/ruta-que-no-existe
    Verificar URL Contiene    /home

TC-SEG-019: Ruta vacía redirige a home
    [Documentation]    Verifica que / redirige a /home
    [Tags]    seguridad    redirect
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Go To    ${BASE_URL}/
    Verificar URL Contiene    /home

# ══════════════════════════════════════════════
# PROTECCIÓN DE OPERACIONES GRAPHQL
# ══════════════════════════════════════════════

TC-SEG-020: Operaciones GraphQL requieren autenticación
    [Documentation]    Verifica que las mutations GraphQL requieren token
    [Tags]    seguridad    graphql    autenticacion
    # Intentar crear sala sin token
    ${query}=    Set Variable    mutation { crearSala(input: {usuarioId: ${USER1_ID}}) { id codigo } }
    ${result}=    GraphQL Request    ${query}
    # Debe haber error de autenticación
    ${has_error}=    Run Keyword And Return Status    Dictionary Should Contain Key    ${result}    errors
    Should Be True    ${has_error}

TC-SEG-021: Cambiar estado plataforma requiere rol administrador
    [Documentation]    Verifica que mutation cambiarEstadoPlataforma requiere ADMINISTRADOR
    [Tags]    seguridad    graphql    autorizacion
    # Intentar cambiar plataforma con token de usuario normal
    ${token}=    Obtener Token Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    ${query}=    Set Variable    mutation { cambiarEstadoPlataforma(input: {id: 1, habilitada: false}) }
    ${result}=    GraphQL Request    ${query}    ${token}
    # Debe haber error de autorización
    ${has_error}=    Run Keyword And Return Status    Dictionary Should Contain Key    ${result}    errors
    Should Be True    ${has_error}

TC-SEG-022: Test API requiere autenticación
    [Documentation]    Verifica que los endpoints de test requieren token
    [Tags]    seguridad    graphql    test-api
    # Intentar usar test API sin token
    ${query}=    Set Variable    mutation { crearSalaTest(usuario1Id: ${USER1_ID}, estado: "ACTIVA") { codigo salaId } }
    ${result}=    GraphQL Request    ${query}
    # Debe haber error de autenticación
    ${has_error}=    Run Keyword And Return Status    Dictionary Should Contain Key    ${result}    errors
    Should Be True    ${has_error}
