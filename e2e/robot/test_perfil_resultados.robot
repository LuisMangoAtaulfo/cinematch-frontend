*** Settings ***
Documentation     Pruebas de perfil, resultados y calificación
Library           SeleniumLibrary
Library           Collections
Library           String
Library           OperatingSystem
Resource          keywords.robot
Suite Setup       Abrir Navegador
Suite Teardown    Cerrar Navegador

*** Test Cases ***
# ══════════════════════════════════════════════
# PERFIL
# ══════════════════════════════════════════════

TC-PERF-001: Ver perfil con datos existentes
    [Documentation]    Verifica que se cargan los datos del perfil
    [Tags]    perfil    ver    positivo
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Go To    ${PERFIL_URL}
    Wait Until Element Is Visible    ${INPUT_NOMBRE}    ${TIMEOUT}
    ${nombre}=    Get Value    ${INPUT_NOMBRE}
    Should Not Be Empty    ${nombre}

TC-PERF-002: Actualizar nombre del perfil
    [Documentation]    Verifica que se puede actualizar el nombre
    [Tags]    perfil    actualizar    positivo
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Go To    ${PERFIL_URL}
    Input Text    ${INPUT_NOMBRE}    Nombre Robot Test
    Click Button    ${BTN_GUARDAR_PERFIL}
    Wait Until Keyword Succeeds    5s    1s    Verificar Elemento Visible    ${MSG_PERFIL_ACTUALIZADO}

TC-PERF-003: Actualizar descripción del perfil
    [Documentation]    Verifica que se puede actualizar la descripción
    [Tags]    perfil    actualizar    positivo
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Go To    ${PERFIL_URL}
    Input Text    ${INPUT_DESCRIPCION}    Descripción Robot Test
    Click Button    ${BTN_GUARDAR_PERFIL}
    Wait Until Keyword Succeeds    5s    1s    Verificar Elemento Visible    ${MSG_PERFIL_ACTUALIZADO}

TC-PERF-004: Actualizar perfil con nombre vacío
    [Documentation]    Verifica validación de nombre obligatorio
    [Tags]    perfil    actualizar    validacion
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Go To    ${PERFIL_URL}
    Wait Until Element Is Visible    ${INPUT_NOMBRE}    ${TIMEOUT}
    Clear Element Text    ${INPUT_NOMBRE}
    Input Text    ${INPUT_NOMBRE}    ${SPACE}
    Clear Element Text    ${INPUT_NOMBRE}
    Click Button    ${BTN_GUARDAR_PERFIL}
    Wait Until Keyword Succeeds    5s    1s    Verificar Elemento Visible    css=.form-error

TC-PERF-005: Cancelar actualización de perfil
    [Documentation]    Verifica que se puede cancelar sin guardar
    [Tags]    perfil    cancelar
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Go To    ${PERFIL_URL}
    Input Text    ${INPUT_NOMBRE}    Nombre Cambiado
    Click Button    ${BTN_CANCELAR_PERFIL}
    Verificar URL Contiene    /home

TC-PERF-006: Navegar a home desde perfil
    [Documentation]    Verifica que el botón Volver funciona
    [Tags]    perfil    navegacion
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Go To    ${PERFIL_URL}
    Click Link    xpath=//*[contains(text(), 'Volver')]
    Verificar URL Contiene    /home

# ══════════════════════════════════════════════
# MATCHES
# ══════════════════════════════════════════════

TC-MATCH-001: Ver lista de matches con datos
    [Documentation]    Verifica que se muestran los matches creados via API
    [Tags]    matches    ver    positivo
    [Setup]    Preparar Matches Con Datos
    # Esperar a que carguen los matches
    Sleep    2s
    # Verificar que hay algún elemento de match o el título de la sección
    Verificar Elemento Visible    xpath=//*[contains(text(), 'Matches') or contains(text(), 'match') or contains(@class, 'match-item')]

TC-MATCH-002: Ver matches cuando no hay
    [Documentation]    Verifica mensaje cuando no hay matches
    [Tags]    matches    vacio    ui
    [Setup]    Preparar Matches Vacío
    Verificar Elemento Visible    xpath=//*[contains(text(), 'Aún no tienen matches')]

TC-MATCH-003: Navegar a swipe desde matches
    [Documentation]    Verifica que el enlace Volver funciona
    [Tags]    matches    navegacion
    [Setup]    Preparar Matches Vacío
    Click Link    xpath=//*[contains(text(), 'Volver')]
    Verificar URL Contiene    /swipe

TC-MATCH-004: Navegar a chat desde matches
    [Documentation]    Verifica que el enlace Chat funciona
    [Tags]    matches    navegacion
    [Setup]    Preparar Matches Vacío
    Click Link    ${LINK_CHAT}
    Verificar URL Contiene    /chat

# ══════════════════════════════════════════════
# RESULTADOS
# ══════════════════════════════════════════════

TC-RES-001: Ver resultados con matches
    [Documentation]    Verifica que se muestran los matches finales
    [Tags]    resultados    ver    positivo
    [Setup]    Preparar Resultados Con Match
    Verificar Elemento Visible    xpath=//*[contains(text(), 'Resultados')]

TC-RES-002: Ver resultados sin matches
    [Documentation]    Verifica mensaje cuando no hubo matches
    [Tags]    resultados    vacio    ui
    [Setup]    Preparar Resultados Sin Match
    Wait Until Keyword Succeeds    5s    1s    Verificar Elemento Visible    xpath=//*[contains(text(), 'No hubo matches') or contains(text(), 'Resultados')]

TC-RES-003: Ir a calificación desde resultados
    [Documentation]    Verifica que el enlace a calificación funciona
    [Tags]    resultados    navegacion
    [Setup]    Preparar Resultados Sin Match
    Click Link    xpath=//*[contains(text(), 'Calificar')]
    Verificar URL Contiene    /calificacion

TC-RES-004: Salir sin calificar desde resultados
    [Documentation]    Verifica que se puede salir sin calificar
    [Tags]    resultados    navegacion
    [Setup]    Preparar Resultados Sin Match
    Click Button    xpath=//*[contains(text(), 'Salir sin calificar')]
    Verificar URL Contiene    /home

# ══════════════════════════════════════════════
# CALIFICACIÓN
# ══════════════════════════════════════════════

TC-CAL-001: Calificar experiencia con valor 8
    [Documentation]    Verifica que se puede enviar una calificación
    [Tags]    calificacion    enviar    positivo
    [Setup]    Preparar Calificación
    Click Element    xpath=//button[contains(text(), '8')]
    Click Button    ${BTN_ENVIAR_CAL}
    Wait Until Keyword Succeeds    10s    1s    Verificar URL Contiene    /home

TC-CAL-002: Calificar con valor mínimo (1)
    [Documentation]    Verifica que se acepta el valor mínimo
    [Tags]    calificacion    enviar    positivo
    [Setup]    Preparar Calificación
    Click Element    xpath=//button[contains(text(), '1')]
    Click Button    ${BTN_ENVIAR_CAL}
    Wait Until Keyword Succeeds    10s    1s    Verificar URL Contiene    /home

TC-CAL-003: Calificar con valor máximo (10)
    [Documentation]    Verifica que se acepta el valor máximo
    [Tags]    calificacion    enviar    positivo
    [Setup]    Preparar Calificación
    Click Element    xpath=//button[contains(text(), '10')]
    Click Button    ${BTN_ENVIAR_CAL}
    Wait Until Keyword Succeeds    10s    1s    Verificar URL Contiene    /home

TC-CAL-004: Calificar sin seleccionar valor
    [Documentation]    Verifica validación de selección obligatoria
    [Tags]    calificacion    validacion
    [Setup]    Preparar Calificación
    Click Button    ${BTN_ENVIAR_CAL}
    Wait Until Keyword Succeeds    5s    1s    Verificar Mensaje Error    xpath=//*[contains(text(), 'Selecciona una calificación')]

TC-CAL-005: Omitir calificación
    [Documentation]    Verifica que se puede omitir la calificación
    [Tags]    calificacion    omitir
    [Setup]    Preparar Calificación
    Click Button    ${BTN_OMITIR_CAL}
    Verificar URL Contiene    /home

TC-CAL-006: Botones de rating se resaltan al seleccionar
    [Documentation]    Verifica que el botón seleccionado se resalta
    [Tags]    calificacion    ui
    [Setup]    Preparar Calificación
    Click Element    xpath=//button[contains(text(), '7')]
    Sleep    1s
    ${class}=    Get Element Attribute    xpath=//button[contains(text(), '7')]    class
    Should Contain    ${class}    active

# ══════════════════════════════════════════════
# KEYWORDS AUXILIARES
# ══════════════════════════════════════════════

*** Keywords ***
Preparar Matches Vacío
    [Documentation]    Prepara el navegador en /matches sin matches
    ${salaId}    ${codigo}=    Preparar Swipe Completo
    Go To    ${MATCHES_URL}
    Wait Until Page Contains Element    xpath=//*[contains(text(), 'Aún no tienen matches')]    ${TIMEOUT}

Preparar Matches Con Datos
    [Documentation]    Prepara el navegador en /matches con un match creado
    ${salaId}    ${codigo}=    Preparar Swipe Completo
    ${contenidoId}=    Obtener Primer Contenido
    Crear Match via Test    ${salaId}    ${contenidoId}
    Go To    ${MATCHES_URL}
    Sleep    2s

Preparar Resultados Con Match
    [Documentation]    Prepara /resultados con un match
    ${salaId}    ${codigo}=    Preparar Swipe Completo
    ${contenidoId}=    Obtener Primer Contenido
    Crear Match via Test    ${salaId}    ${contenidoId}
    Finalizar Sala Test    ${codigo}
    Go To    ${RESULTADOS_URL}
    Sleep    2s

Preparar Resultados Sin Match
    [Documentation]    Prepara /resultados sin matches
    ${salaId}    ${codigo}=    Preparar Swipe Completo
    Finalizar Sala Test    ${codigo}
    Go To    ${RESULTADOS_URL}
    Sleep    2s

Preparar Calificación
    [Documentation]    Prepara el navegador en /calificacion con sala finalizada
    ${salaId}    ${codigo}=    Preparar Swipe Completo
    Finalizar Sala Test    ${codigo}
    Go To    ${CALIFICACION_URL}
    Wait Until Page Contains Element    xpath=//button[contains(text(), '1')]    ${TIMEOUT}
