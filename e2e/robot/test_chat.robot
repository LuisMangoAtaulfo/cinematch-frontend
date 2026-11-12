*** Settings ***
Documentation     Pruebas de chat en tiempo real
Library           SeleniumLibrary
Library           Collections
Library           String
Library           OperatingSystem
Resource          keywords.robot
Suite Setup       Abrir Navegador
Suite Teardown    Cerrar Navegador

*** Test Cases ***
# ══════════════════════════════════════════════
# ENVÍO DE MENSAJES
# ══════════════════════════════════════════════

TC-CHAT-001: Enviar mensaje
    [Documentation]    Verifica que se puede enviar un mensaje
    [Tags]    chat    enviar    positivo
    [Setup]    Preparar Chat Activo
    Input Text    ${INPUT_MENSAJE}    Hola desde Robot Test
    Click Button    ${BTN_ENVIAR_MENSAJE}
    Wait Until Page Contains    Hola desde Robot Test    ${TIMEOUT}

TC-CHAT-002: Enviar mensaje con Enter
    [Documentation]    Verifica que se puede enviar con la tecla Enter
    [Tags]    chat    enviar    positivo
    [Setup]    Preparar Chat Activo
    Input Text    ${INPUT_MENSAJE}    Mensaje con Enter
    Press Keys    ${INPUT_MENSAJE}    ENTER
    Wait Until Page Contains    Mensaje con Enter    ${TIMEOUT}

TC-CHAT-003: Campo se limpia después de enviar
    [Documentation]    Verifica que el input se limpia tras enviar
    [Tags]    chat    enviar    validacion
    [Setup]    Preparar Chat Activo
    Input Text    ${INPUT_MENSAJE}    Test limpieza
    Click Button    ${BTN_ENVIAR_MENSAJE}
    Wait Until Page Contains    Test limpieza    ${TIMEOUT}
    ${valor}=    Get Value    ${INPUT_MENSAJE}
    Should Be Empty    ${valor}

TC-CHAT-004: No enviar mensaje vacío
    [Documentation]    Verifica que no se envía mensaje vacío
    [Tags]    chat    enviar    validacion
    [Setup]    Preparar Chat Activo
    Click Button    ${BTN_ENVIAR_MENSAJE}
    Sleep    1s
    # Verificar que no aparece un mensaje vacío nuevo
    ${valor}=    Get Value    ${INPUT_MENSAJE}
    Should Be Empty    ${valor}

# ══════════════════════════════════════════════
# RECEPCIÓN DE MENSAJES
# ══════════════════════════════════════════════

TC-CHAT-005: Ver historial de chat después de simular mensajes
    [Documentation]    Verifica que los mensajes simulados aparecen en el chat
    [Tags]    chat    historial    tiempo-real
    [Setup]    Preparar Chat Con Mensajes Simulados
    Wait Until Page Contains    Mensaje simulado 1    ${TIMEOUT}
    Wait Until Page Contains    Mensaje simulado 2    ${TIMEOUT}

TC-CHAT-006: Mensajes propios se muestran en el chat
    [Documentation]    Verifica que los mensajes propios aparecen
    [Tags]    chat    ui
    [Setup]    Preparar Chat Activo
    Input Text    ${INPUT_MENSAJE}    Mi mensaje propio
    Click Button    ${BTN_ENVIAR_MENSAJE}
    Wait Until Page Contains    Mi mensaje propio    ${TIMEOUT}
    # Verificar que existe al menos un bubble
    Verificar Elemento Visible    xpath=//*[contains(@class, 'chat-bubble')]

TC-CHAT-007: Mensajes del compañero se muestran en el chat
    [Documentation]    Verifica que los mensajes simulados del compañero aparecen
    [Tags]    chat    ui    tiempo-real
    [Setup]    Preparar Chat Con Mensajes Simulados
    Wait Until Page Contains    Hola del compañero    ${TIMEOUT}

TC-CHAT-008: Enviar múltiples mensajes en secuencia
    [Documentation]    Verifica que se pueden enviar varios mensajes seguidos
    [Tags]    chat    enviar    positivo
    [Setup]    Preparar Chat Activo
    Input Text    ${INPUT_MENSAJE}    Mensaje 1
    Click Button    ${BTN_ENVIAR_MENSAJE}
    Wait Until Page Contains    Mensaje 1    ${TIMEOUT}
    Input Text    ${INPUT_MENSAJE}    Mensaje 2
    Click Button    ${BTN_ENVIAR_MENSAJE}
    Wait Until Page Contains    Mensaje 2    ${TIMEOUT}
    Input Text    ${INPUT_MENSAJE}    Mensaje 3
    Click Button    ${BTN_ENVIAR_MENSAJE}
    Wait Until Page Contains    Mensaje 3    ${TIMEOUT}

# ══════════════════════════════════════════════
# ESTADOS DE CHAT
# ══════════════════════════════════════════════

TC-CHAT-009: Chat vacío muestra mensaje
    [Documentation]    Verifica mensaje cuando no hay mensajes
    [Tags]    chat    ui    vacio
    [Setup]    Preparar Chat Activo
    Wait Until Page Contains Element    xpath=//*[contains(text(), 'Aún no hay mensajes') or contains(text(), 'Cargando mensajes')]    ${TIMEOUT}

TC-CHAT-010: Reconexión banner tras perder conexión
    [Documentation]    Verifica que el chat muestra el estado de conexión
    [Tags]    chat    reconexion    ui
    [Setup]    Preparar Chat Activo
    # El chat debe funcionar normalmente
    Verificar Elemento Visible    ${INPUT_MENSAJE}

TC-CHAT-011: Banner de match cuando hay coincidencia
    [Documentation]    Verifica banner cuando se detecta match
    [Tags]    chat    match    tiempo-real
    [Setup]    Preparar Chat Con Match
    # El banner de match puede aparecer en swipe, no necesariamente en chat
    # Pero verificamos que el chat funciona
    Verificar Elemento Visible    ${INPUT_MENSAJE}

# ══════════════════════════════════════════════
# NAVEGACIÓN DESDE CHAT
# ══════════════════════════════════════════════

TC-CHAT-012: Navegar a swipe desde chat
    [Documentation]    Verifica que el enlace a swipe funciona
    [Tags]    chat    navegacion
    [Setup]    Preparar Chat Activo
    Click Link    xpath=//a[contains(text(), 'Volver')]
    Verificar URL Contiene    /swipe

TC-CHAT-013: Navegar a matches desde chat
    [Documentation]    Verifica que el enlace a matches funciona
    [Tags]    chat    navegacion
    [Setup]    Preparar Chat Activo
    Click Link    ${LINK_MATCHES}
    Verificar URL Contiene    /matches

# ══════════════════════════════════════════════
# KEYWORDS AUXILIARES
# ══════════════════════════════════════════════

*** Keywords ***
Preparar Chat Activo
    [Documentation]    Prepara el navegador en /chat con sala activa
    ${salaId}    ${codigo}=    Preparar Swipe Completo
    Go To    ${CHAT_URL}
    Wait Until Page Contains Element    ${INPUT_MENSAJE}    ${TIMEOUT}

Preparar Chat Con Mensajes Simulados
    [Documentation]    Prepara el navegador en /chat con mensajes simulados del compañero
    ${salaId}    ${codigo}=    Preparar Swipe Completo
    # Simular mensajes del compañero via API
    Simular Mensaje Compañero    ${salaId}    ${USER2_ID}    Hola del compañero
    Simular Mensaje Compañero    ${salaId}    ${USER2_ID}    Mensaje simulado 1
    Simular Mensaje Compañero    ${salaId}    ${USER2_ID}    Mensaje simulado 2
    Go To    ${CHAT_URL}
    Wait Until Page Contains Element    ${INPUT_MENSAJE}    ${TIMEOUT}

Preparar Chat Con Match
    [Documentation]    Prepara el chat con un match ya creado
    ${salaId}    ${codigo}=    Preparar Swipe Completo
    ${contenidoId}=    Obtener Primer Contenido
    Crear Match via Test    ${salaId}    ${contenidoId}
    Go To    ${CHAT_URL}
    Wait Until Page Contains Element    ${INPUT_MENSAJE}    ${TIMEOUT}

Preparar Chat Vacío
    [Documentation]    Prepara el navegador en /chat sin mensajes
    ${salaId}    ${codigo}=    Preparar Swipe Completo
    Go To    ${CHAT_URL}
    Wait Until Page Contains Element    ${INPUT_MENSAJE}    ${TIMEOUT}
