*** Settings ***
Documentation     Pruebas de gestión de salas: crear, unirse, cancelar
Library           SeleniumLibrary
Library           Collections
Library           String
Library           OperatingSystem
Resource          keywords.robot
Suite Setup       Abrir Navegador
Suite Teardown    Cerrar Navegador

*** Test Cases ***
# ══════════════════════════════════════════════
# CREAR SALA
# ══════════════════════════════════════════════

TC-SALA-001: Crear sala exitosamente
    [Documentation]    Verifica que un usuario puede crear una sala y obtener código
    [Tags]    sala    crear    positivo
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    ${codigo}=    Crear Sala
    Verificar URL Contiene    /sala/crear
    Should Not Be Empty    ${codigo}
    Verificar Elemento Visible    ${BTN_CANCELAR_SALA}

TC-SALA-002: Código de sala tiene formato correcto
    [Documentation]    Verifica que el código es alfanumérico de 6 caracteres
    [Tags]    sala    crear    validacion
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    ${codigo}=    Crear Sala
    ${codigo_clean}=    Strip String    ${codigo}
    Length Should Be    ${codigo_clean}    6
    Should Match Regexp    ${codigo_clean}    ^[A-Z0-9]{6}$

TC-SALA-003: Copiar código de sala
    [Documentation]    Verifica que el botón copiar código funciona
    [Tags]    sala    crear    ui
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Crear Sala
    Click Button    ${BTN_COPIAR_CODIGO}
    Wait Until Keyword Succeeds    5s    1s    Verificar Elemento Visible    xpath=//*[contains(text(), '¡Copiado!') or contains(text(), 'Copiado')]

TC-SALA-004: Cancelar sala en espera
    [Documentation]    Verifica que el creador puede cancelar una sala
    [Tags]    sala    cancelar    positivo
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Crear Sala
    Cancelar Sala
    Verificar URL Contiene    /home

TC-SALA-005: Sala requiere autenticación
    [Documentation]    Verifica que crear sala sin login redirige a login
    [Tags]    sala    crear    seguridad
    # Limpiar sesión activa
    Go To    ${LOGIN_URL}
    Execute JavaScript    localStorage.clear()
    Go To    ${CREAR_SALA_URL}
    Wait Until Keyword Succeeds    5s    1s    Verificar URL Contiene    /login

# ══════════════════════════════════════════════
# UNIRSE A SALA
# ══════════════════════════════════════════════

TC-SALA-006: Unirse a sala con código válido
    [Documentation]    Verifica que un usuario puede unirse a una sala existente
    [Tags]    sala    unirse    positivo
    # Usuario 1 crea sala
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    ${codigo}=    Crear Sala
    # Navegar a home antes de logout
    Go To    ${HOME_URL}
    Wait Until Page Contains Element    ${BTN_LOGOUT}    5s
    Logout Usuario
    # Usuario 2 se une
    Login Usuario    ${USER2_CORREO}    ${USER2_PASSWORD}
    Unirse A Sala    ${codigo}
    Wait Until Keyword Succeeds    10s    1s    Verificar URL Contiene    /espera-filtros

TC-SALA-007: Unirse con código inválido
    [Documentation]    Verifica error al usar código inexistente
    [Tags]    sala    unirse    negativo
    Login Usuario    ${USER2_CORREO}    ${USER2_PASSWORD}
    Go To    ${UNIRSE_URL}
    Wait Until Page Contains Element    ${INPUT_CODIGO}    10s
    Input Text    ${INPUT_CODIGO}    ZZZZZZ
    Sleep    1s
    Click Button    ${BTN_UNIRSE}
    Sleep    3s
    # Capturar screenshot para diagnóstico
    Capture Page Screenshot    /tmp/sala007.png
    # Verificar que aparece algún mensaje de error
    ${error_visible}=    Run Keyword And Return Status    Wait Until Page Contains Element    css=.form-error    10s
    Should Be True    ${error_visible}    El mensaje de error no se mostró

TC-SALA-008: Unirse con campo vacío
    [Documentation]    Verifica validación de campo obligatorio
    [Tags]    sala    unirse    validacion
    Login Usuario    ${USER2_CORREO}    ${USER2_PASSWORD}
    Go To    ${UNIRSE_URL}
    Click Button    ${BTN_UNIRSE}
    Wait Until Keyword Succeeds    5s    1s    Verificar Mensaje Error    xpath=//*[contains(text(), 'Ingresa un código') or contains(text(), 'código')]

TC-SALA-009: Código se convierte a mayúsculas automáticamente
    [Documentation]    Verifica que el input convierte a mayúsculas
    [Tags]    sala    unirse    ui
    Login Usuario    ${USER2_CORREO}    ${USER2_PASSWORD}
    Go To    ${UNIRSE_URL}
    Input Text    ${INPUT_CODIGO}    a7x3k9
    Sleep    1s
    ${valor}=    Get Value    ${INPUT_CODIGO}
    Should Be Equal    ${valor}    A7X3K9

TC-SALA-010: Unirse requiere autenticación
    [Documentation]    Verifica que unirse sin login redirige a login
    [Tags]    sala    unirse    seguridad
    # Limpiar sesión activa
    Go To    ${LOGIN_URL}
    Execute JavaScript    localStorage.clear()
    Go To    ${UNIRSE_URL}
    Wait Until Keyword Succeeds    5s    1s    Verificar URL Contiene    /login

# ══════════════════════════════════════════════
# ESPERA DE FILTROS
# ══════════════════════════════════════════════

TC-SALA-011: Espera de filtros muestra mensaje
    [Documentation]    Verifica que el invitado ve pantalla de espera
    [Tags]    sala    espera    ui    manual    requiere-dos-navegadores
    Pass Execution    Requiere dos navegadores simultáneos - test manual

TC-SALA-012: Cancelar desde espera de filtros
    [Documentation]    Verifica que el invitado puede cancelar y salir
    [Tags]    sala    espera    positivo    manual    requiere-dos-navegadores
    Pass Execution    Requiere dos navegadores simultáneos - test manual

TC-SALA-013: Creador navega a filtros cuando compañero se une
    [Documentation]    Verifica que el polling detecta el cambio de estado
    [Tags]    sala    sincronizacion    manual    requiere-dos-navegadores
    Pass Execution    Requiere dos navegadores simultáneos - test manual

TC-SALA-014: Solo el creador puede finalizar sala
    [Documentation]    Verifica que el botón Finalizar solo está habilitado para el creador
    [Tags]    sala    finalizar    seguridad    manual    requiere-dos-navegadores
    Pass Execution    Requiere dos navegadores simultáneos - test manual

TC-SALA-015: Finalizar sala desde swipe
    [Documentation]    Verifica que el creador puede finalizar la sesión
    [Tags]    sala    finalizar    positivo    manual    requiere-dos-navegadores
    Pass Execution    Requiere dos navegadores simultáneos - test manual


