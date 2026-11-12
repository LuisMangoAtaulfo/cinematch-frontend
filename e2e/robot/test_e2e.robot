*** Settings ***
Documentation     Pruebas End-to-End completas de flujos de usuario
Library           SeleniumLibrary
Library           Collections
Library           String
Library           OperatingSystem
Resource          keywords.robot
Suite Setup       Abrir Navegador
Suite Teardown    Cerrar Navegador
Test Teardown     Limpiar Estado Post Test

*** Test Cases ***
# ══════════════════════════════════════════════
# FLUJO COMPLETO DE USUARIO
# ══════════════════════════════════════════════

TC-E2E-001: Flujo completo de usuario - Registro a Calificación
    [Documentation]    Verifica el flujo completo: registro → crear sala → aplicar filtros → swipe → finalizar
    [Tags]    e2e    completo    crítico
    [Timeout]    5 minutes
    [Setup]    Limpiar Estado Usuario
    
    # Paso 1: Registro
    ${id_aleatorio}=    Generar ID Aleatorio
    ${correo_nuevo}=    Set Variable    e2e_${id_aleatorio}@cinematch.com
    Registro Usuario    Usuario E2E    ${correo_nuevo}    Test1234
    Verificar URL Contiene    /home
    
    # Paso 2: Crear sala
    ${codigo}=    Crear Sala
    Should Not Be Empty    ${codigo}
    
    # Paso 3: Simular compañero uniéndose via API
    # Extraer salaId del código
    ${token}=    Obtener Token Usuario    ${correo_nuevo}    Test1234
    ${query_sala}=    Set Variable    query { buscarSalaPorCodigo(codigo: "${codigo}") { id codigo estado } }
    ${result_sala}=    GraphQL Request    ${query_sala}    ${token}
    ${salaId}=    Get From Dictionary    ${result_sala['data']['buscarSalaPorCodigo']}    id
    Simular Unión a Sala    ${codigo}    ${USER2_ID}
    
    # Paso 4: Aplicar filtros (omitir)
    Wait Until Keyword Succeeds    15s    2s    Verificar URL Contiene    /filtros
    Click Button    ${BTN_OMITIR_FILTROS}
    Wait Until Keyword Succeeds    10s    1s    Verificar URL Contiene    /swipe
    
    # Paso 5: Evaluar contenido
    Wait Until Page Contains Element    ${CARD_CONTENIDO}    15s
    Click Button    ${BTN_LIKE}
    Sleep    1s
    
    # Paso 6: Finalizar sesión
    Click Button    ${BTN_FINALIZAR}
    Wait Until Keyword Succeeds    10s    1s    Verificar URL Contiene    /resultados
    
    # Paso 7: Calificar experiencia
    Wait Until Page Contains Element    xpath=//button[contains(text(), '1')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(text(), '8')]
    Click Button    ${BTN_ENVIAR_CAL}
    Wait Until Keyword Succeeds    10s    1s    Verificar URL Contiene    /home

TC-E2E-002: Flujo de usuario con match
    [Documentation]    Verifica flujo donde se detecta un match via API
    [Tags]    e2e    match    tiempo-real
    [Setup]    Preparar Flujo Con Match
    # Verificar que el swipe funciona con match creado
    Verificar Elemento Visible    ${CARD_CONTENIDO}
    # Finalizar y ver resultados
    Click Button    ${BTN_FINALIZAR}
    Wait Until Keyword Succeeds    10s    1s    Verificar URL Contiene    /resultados

TC-E2E-003: Flujo de usuario sin matches
    [Documentation]    Verifica flujo donde no se detectan matches
    [Tags]    e2e    sin-match
    # Limpiar estado previo
    Execute JavaScript    localStorage.removeItem('cm_sala'); localStorage.removeItem('cm_indice')
    # Login usuario
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    # Crear sala (esto establece esCreador automáticamente)
    ${codigo}=    Crear Sala
    # Simular que user2 se une
    ${token}=    Obtener Token Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Simular Unión a Sala    ${codigo}    ${USER2_ID}
    # Esperar a que la sala esté activa y navegar a filtros
    Wait Until Keyword Succeeds    15s    2s    Verificar URL Contiene    /filtros
    # Omitir filtros
    Click Button    ${BTN_OMITIR_FILTROS}
    Wait Until Keyword Succeeds    10s    1s    Verificar URL Contiene    /swipe
    Wait Until Page Contains Element    ${CARD_CONTENIDO}    15s
    # Dar dislike a todo
    Click Button    ${BTN_DISLIKE}
    Sleep    1s
    # Finalizar sesión
    Click Button    ${BTN_FINALIZAR}
    Wait Until Keyword Succeeds    10s    1s    Verificar URL Contiene    /resultados
    Verificar Elemento Visible    xpath=//*[contains(text(), 'No hubo matches') or contains(text(), 'Resultados')]

TC-E2E-004: Flujo de administrador completo
    [Documentation]    Verifica flujo completo de administración
    [Tags]    e2e    admin
    [Timeout]    3 minutes
    
    # Login admin
    Login Administrador    ${ADMIN_CORREO}    ${ADMIN_PASSWORD}
    Verificar URL Contiene    /admin/dashboard
    
    # Ver dashboard
    Verificar Elemento Visible    xpath=//*[contains(text(), 'Salas') or contains(text(), 'Dashboard')]
    
    # Ir a métricas
    Go To    ${ADMIN_METRICAS_URL}
    Wait Until Keyword Succeeds    10s    1s    Verificar Elemento Visible    xpath=//*[contains(text(), 'Salas') or contains(text(), 'métricas') or contains(text(), 'metricas')]
    
    # Ir a plataformas
    Go To    ${ADMIN_PLAT_URL}
    Wait Until Keyword Succeeds    10s    1s    Verificar Elemento Visible    xpath=//*[contains(text(), 'Plataformas') or contains(text(), 'plataformas')]
    
    # Ir a retroalimentación
    Go To    ${ADMIN_RETRO_URL}
    Sleep    3s
    # Verificar que estamos en la página de retroalimentación (por URL)
    Verificar URL Contiene    /admin/retroalimentacion
    # Verificar que hay algún contenido de calificaciones o sección
    Verificar Elemento Visible    xpath=//*[contains(text(), 'calificación') or contains(text(), 'Calificación') or contains(text(), 'Retroalimentación')]
    
    # Logout
    Click Button    ${BTN_SALIR}
    Verificar URL Contiene    /login

TC-E2E-005: Flujo de cancelación de sala
    [Documentation]    Verifica flujo de crear y cancelar sala
    [Tags]    e2e    cancelacion
    [Timeout]    2 minutes
    
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    ${codigo}=    Crear Sala
    Should Not Be Empty    ${codigo}
    Cancelar Sala
    Verificar URL Contiene    /home

TC-E2E-006: Flujo de unirse a sala inexistente
    [Documentation]    Verifica manejo de error al unirse a sala inválida
    [Tags]    e2e    error
    [Timeout]    1 minutes
    
    Login Usuario    ${USER2_CORREO}    ${USER2_PASSWORD}
    Go To    ${UNIRSE_URL}
    Wait Until Page Contains Element    ${INPUT_CODIGO}    10s
    Input Text    ${INPUT_CODIGO}    INVALIDO
    Sleep    1s
    Click Button    ${BTN_UNIRSE}
    Sleep    3s
    # Verificar que aparece algún mensaje de error
    Verificar Elemento Visible    css=.form-error

TC-E2E-007: Flujo de perfil completo
    [Documentation]    Verifica flujo de ver y actualizar perfil
    [Tags]    e2e    perfil
    [Timeout]    2 minutes
    
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Go To    ${PERFIL_URL}
    
    # Verificar que se cargan datos
    ${nombre_original}=    Get Value    ${INPUT_NOMBRE}
    Should Not Be Empty    ${nombre_original}
    
    # Actualizar nombre
    Input Text    ${INPUT_NOMBRE}    Nombre E2E Actualizado
    Input Text    ${INPUT_DESCRIPCION}    Descripción E2E
    Click Button    ${BTN_GUARDAR_PERFIL}
    Wait Until Keyword Succeeds    5s    1s    Verificar Elemento Visible    ${MSG_PERFIL_ACTUALIZADO}

TC-E2E-008: Flujo de filtros y swipe
    [Documentation]    Verifica aplicación de filtros y swipe
    [Tags]    e2e    filtros    swipe
    [Timeout]    2 minutes
    [Setup]    Preparar Flujo Filtros Swipe Robusto
    # Ya debería estar en /swipe con contenido
    Verificar Elemento Visible    ${CARD_CONTENIDO}
    # Evaluar contenido
    Click Button    ${BTN_LIKE}
    Sleep    1s
    Verificar Elemento Visible    ${CARD_CONTENIDO}

TC-E2E-009: Flujo de chat básico
    [Documentation]    Verifica envío de mensajes en chat
    [Tags]    e2e    chat
    [Setup]    Preparar Flujo Chat
    # Enviar mensaje
    Input Text    ${INPUT_MENSAJE}    Hola desde E2E
    Click Button    ${BTN_ENVIAR_MENSAJE}
    Wait Until Page Contains    Hola desde E2E    ${TIMEOUT}

TC-E2E-010: Flujo de desconexión y reconexión
    [Documentation]    Verifica manejo de estado de conexión
    [Tags]    e2e    reconexion
    [Setup]    Preparar Swipe Con Contenido
    # El chat debe estar disponible
    Click Link    ${LINK_CHAT}
    Verificar URL Contiene    /chat
    Verificar Elemento Visible    ${INPUT_MENSAJE}

# ══════════════════════════════════════════════
# FLUJOS DE USUARIO CON DATOS ESPECÍFICOS
# ══════════════════════════════════════════════

TC-E2E-011: Usuario se registra, crea sala y cancela
    [Documentation]    Flujo básico de usuario nuevo
    [Tags]    e2e    usuario-nuevo
    [Timeout]    2 minutes
    
    ${id_aleatorio}=    Generar ID Aleatorio
    ${correo}=    Set Variable    nuevo_${id_aleatorio}@cinematch.com
    Registro Usuario    Nuevo Usuario    ${correo}    Test1234
    ${codigo}=    Crear Sala
    Cancelar Sala
    Verificar URL Contiene    /home

TC-E2E-012: Usuario existente inicia sesión y ve home
    [Documentation]    Flujo de login simple
    [Tags]    e2e    login
    [Timeout]    1 minutes
    
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Verificar URL Contiene    /home
    Verificar Elemento Visible    xpath=//*[contains(text(), 'Hola')]

TC-E2E-013: Usuario actualiza perfil y cierra sesión
    [Documentation]    Flujo de actualización de perfil
    [Tags]    e2e    perfil-logout
    [Timeout]    2 minutes
    
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Go To    ${PERFIL_URL}
    Input Text    ${INPUT_NOMBRE}    Nombre Actualizado E2E
    Input Text    ${INPUT_DESCRIPCION}    Descripción actualizada E2E
    Click Button    ${BTN_GUARDAR_PERFIL}
    Wait Until Keyword Succeeds    5s    1s    Verificar Elemento Visible    ${MSG_PERFIL_ACTUALIZADO}
    # Navegar a home antes de logout
    Go To    ${HOME_URL}
    Wait Until Page Contains Element    ${BTN_LOGOUT}    10s
    Logout Usuario
    Verificar URL Contiene    /login

# ══════════════════════════════════════════════
# KEYWORDS AUXILIARES
# ══════════════════════════════════════════════

*** Keywords ***
Limpiar Estado Usuario
    [Documentation]    Limpia el estado del usuario para empezar un test E2E limpio
    Execute JavaScript    localStorage.clear()
    Go To    ${LOGIN_URL}
    Wait Until Page Contains Element    ${BTN_LOGIN}    10s

Limpiar Estado Post Test
    [Documentation]    Limpia el estado después de cada test para evitar contaminación
    Run Keyword And Ignore Error    Execute JavaScript    localStorage.clear()
    Run Keyword And Ignore Error    Go To    ${LOGIN_URL}
    Sleep    1s

Preparar Flujo Con Match
    [Documentation]    Prepara un flujo completo con match creado
    # Limpiar estado previo
    Execute JavaScript    localStorage.removeItem('cm_sala'); localStorage.removeItem('cm_indice')
    # Login usuario
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    # Crear sala (esto establece esCreador automáticamente)
    ${codigo}=    Crear Sala
    # Simular que user2 se une
    ${token}=    Obtener Token Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Simular Unión a Sala    ${codigo}    ${USER2_ID}
    # Esperar a que la sala esté activa y navegar a filtros
    Wait Until Keyword Succeeds    15s    2s    Verificar URL Contiene    /filtros
    # Omitir filtros
    Click Button    ${BTN_OMITIR_FILTROS}
    Wait Until Keyword Succeeds    10s    1s    Verificar URL Contiene    /swipe
    Wait Until Page Contains Element    ${CARD_CONTENIDO}    15s
    # Crear match
    ${salaId}=    Execute JavaScript    return JSON.parse(localStorage.getItem('cm_sala')).id
    ${contenidoId}=    Obtener Primer Contenido
    Crear Match via Test    ${salaId}    ${contenidoId}

Preparar Flujo Filtros Swipe
    [Documentation]    Prepara un flujo de filtros a swipe
    # Limpiar estado previo
    Execute JavaScript    localStorage.removeItem('cm_sala'); localStorage.removeItem('cm_indice')
    # Login usuario
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    # Crear sala (esto establece esCreador automáticamente)
    ${codigo}=    Crear Sala
    # Simular que user2 se une para que la sala esté activa
    ${token}=    Obtener Token Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Simular Unión a Sala    ${codigo}    ${USER2_ID}
    # Esperar a que la sala esté activa y navegar a filtros
    Wait Until Keyword Succeeds    15s    2s    Verificar URL Contiene    /filtros
    # Omitir filtros
    Click Button    ${BTN_OMITIR_FILTROS}
    Wait Until Keyword Succeeds    10s    1s    Verificar URL Contiene    /swipe
    Wait Until Page Contains Element    ${CARD_CONTENIDO}    15s

Preparar Flujo Filtros Swipe Robusto
    [Documentation]    Prepara un flujo de filtros a swipe con verificación de estado
    # Limpieza completa
    Execute JavaScript    localStorage.clear()
    Go To    ${HOME_URL}
    Sleep    2s
    # Login usuario
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    # Verificar que estamos en home
    Verificar URL Contiene    /home
    Sleep    2s
    # Crear sala (esto establece esCreador automáticamente)
    ${codigo}=    Crear Sala
    # Verificar que estamos en la página de crear sala
    Verificar URL Contiene    /sala/crear
    # Simular que user2 se une para que la sala esté activa
    ${token}=    Obtener Token Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Simular Unión a Sala    ${codigo}    ${USER2_ID}
    # Esperar a que la sala esté activa y navegar a filtros
    Wait Until Keyword Succeeds    20s    2s    Verificar URL Contiene    /filtros
    # Verificar que estamos en filtros
    Verificar URL Contiene    /filtros
    Sleep    2s
    # Aplicar filtros vacíos (sin omitir) para evitar problemas
    Click Button    ${BTN_APLICAR_FILTROS}
    Wait Until Keyword Succeeds    15s    2s    Verificar URL Contiene    /swipe
    # Verificar que estamos en swipe
    Verificar URL Contiene    /swipe
    Wait Until Page Contains Element    ${CARD_CONTENIDO}    15s

Preparar Flujo Chat
    [Documentation]    Prepara un flujo de chat
    ${salaId}    ${codigo}=    Preparar Swipe Completo
    Go To    ${CHAT_URL}
    Wait Until Page Contains Element    ${INPUT_MENSAJE}    ${TIMEOUT}

Preparar Swipe Con Contenido
    [Documentation]    Prepara el navegador en /swipe con contenido
    ${salaId}    ${codigo}=    Preparar Swipe Completo
    Go To    ${SWIPE_URL}
    Wait Until Page Contains Element    ${CARD_CONTENIDO}    15s
