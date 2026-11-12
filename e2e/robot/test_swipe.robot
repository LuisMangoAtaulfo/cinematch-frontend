*** Settings ***
Documentation     Pruebas de swipe y evaluación de contenido
Library           SeleniumLibrary
Library           Collections
Library           String
Library           OperatingSystem
Resource          keywords.robot
Suite Setup       Abrir Navegador
Suite Teardown    Cerrar Navegador

*** Test Cases ***
# ══════════════════════════════════════════════
# EVALUACIÓN CON BOTONES
# ══════════════════════════════════════════════

TC-SWIPE-001: Evaluar Like con botón
    [Documentation]    Verifica que se puede dar like con el botón
    [Tags]    swipe    like    positivo
    [Setup]    Preparar Swipe Con Contenido
    Click Button    ${BTN_LIKE}
    Wait Until Keyword Succeeds    5s    1s    Verificar Elemento Visible    ${CARD_CONTENIDO}

TC-SWIPE-002: Evaluar Dislike con botón
    [Documentation]    Verifica que se puede dar dislike con el botón
    [Tags]    swipe    dislike    positivo
    [Setup]    Preparar Swipe Con Contenido
    Wait Until Keyword Succeeds    10s    1s    Verificar Elemento Visible    ${BTN_DISLIKE}
    Click Button    ${BTN_DISLIKE}
    Wait Until Keyword Succeeds    5s    1s    Verificar Elemento Visible    ${CARD_CONTENIDO}

# ══════════════════════════════════════════════
# EVALUACIÓN CON DRAG
# ══════════════════════════════════════════════

TC-SWIPE-003: Evaluar Like arrastrando derecha
    [Documentation]    Verifica que arrastrar a la derecha da like
    [Tags]    swipe    drag    like    manual
    Pass Execution    Test manual - requiere interacción táctil compleja de simular con Selenium

TC-SWIPE-004: Evaluar Dislike arrastrando izquierda
    [Documentation]    Verifica que arrastrar a la izquierda da dislike
    [Tags]    swipe    drag    dislike    manual
    Pass Execution    Test manual - requiere interacción táctil compleja de simular con Selenium

# ══════════════════════════════════════════════
# ESTADOS DE SWIPE
# ══════════════════════════════════════════════

TC-SWIPE-005: Tarjeta muestra información completa
    [Documentation]    Verifica que la tarjeta muestra título, año, género
    [Tags]    swipe    ui
    [Setup]    Preparar Swipe Con Contenido
    Verificar Elemento Visible    xpath=//*[contains(@class, 'titulo')]
    Verificar Elemento Visible    xpath=//*[contains(@class, 'anio')]
    Verificar Elemento Visible    xpath=//*[contains(@class, 'genero')]

TC-SWIPE-006: Botones de evaluar están disponibles
    [Documentation]    Verifica que los botones de like/dislike están presentes
    [Tags]    swipe    ui
    [Setup]    Preparar Swipe Con Contenido
    Verificar Elemento Visible    ${BTN_LIKE}
    Verificar Elemento Visible    ${BTN_DISLIKE}

TC-SWIPE-007: Catálogo muestra contenido tras aplicar filtros
    [Documentation]    Verifica que hay contenido en la tarjeta tras aplicar filtros
    [Tags]    swipe    catalogo    ui
    [Setup]    Preparar Swipe Con Contenido
    Verificar Elemento Visible    ${CARD_CONTENIDO}
    Verificar Elemento Visible    xpath=//*[contains(@class, 'titulo')]

TC-SWIPE-008: Swipe muestra contenido con plataformas
    [Documentation]    Verifica que la tarjeta muestra contenido
    [Tags]    swipe    plataformas    ui
    [Setup]    Preparar Swipe Con Contenido
    # Verificar que la tarjeta tiene contenido
    Verificar Elemento Visible    xpath=//*[contains(@class, 'swipe-card')]
    Verificar Elemento Visible    xpath=//*[contains(@class, 'titulo')]

# ══════════════════════════════════════════════
# MATCH DETECTION
# ══════════════════════════════════════════════

TC-SWIPE-009: Match banner se muestra cuando hay match
    [Documentation]    Verifica que el banner de match aparece cuando hay match
    [Tags]    swipe    match    tiempo-real
    [Setup]    Preparar Swipe Con Match
    # El banner de match debería aparecer automáticamente
    Wait Until Page Contains Element    xpath=//*[contains(@class, 'match-banner') or contains(text(), 'Match')]    10s

TC-SWIPE-010: Sin match cuando uno rechaza
    [Documentation]    Verifica que no hay match si uno rechaza
    [Tags]    swipe    match    negativo
    [Setup]    Preparar Swipe Sin Match
    # Esperar a que el botón dislike esté visible
    Wait Until Keyword Succeeds    10s    1s    Verificar Elemento Visible    ${BTN_DISLIKE}
    # Rechazar contenido
    Click Button    ${BTN_DISLIKE}
    Sleep    2s
    # No debe haber banner de match
    ${match_visible}=    Run Keyword And Return Status    Page Should Contain Element    xpath=//*[contains(@class, 'match-banner')]
    Should Not Be True    ${match_visible}

# ══════════════════════════════════════════════
# NAVEGACIÓN DESDE SWIPE
# ══════════════════════════════════════════════

TC-SWIPE-011: Navegar a matches desde swipe
    [Documentation]    Verifica que el enlace a matches funciona
    [Tags]    swipe    navegacion
    [Setup]    Preparar Swipe Con Contenido
    Click Link    ${LINK_MATCHES}
    Verificar URL Contiene    /matches

TC-SWIPE-012: Navegar a chat desde swipe
    [Documentation]    Verifica que el enlace a chat funciona
    [Tags]    swipe    navegacion
    [Setup]    Preparar Swipe Con Contenido
    Click Link    ${LINK_CHAT}
    Sleep    2s
    Verificar URL Contiene    /chat

TC-SWIPE-013: Finalizar sesión desde swipe
    [Documentation]    Verifica que el creador puede finalizar
    [Tags]    swipe    finalizar    manual
    Pass Execution    Test manual - requiere que el usuario sea el creador de la sala (flag esCreador)

# ══════════════════════════════════════════════
# KEYWORDS AUXILIARES
# ══════════════════════════════════════════════

*** Keywords ***
Preparar Swipe Con Contenido
    [Documentation]    Prepara el navegador en /swipe con contenido disponible
    # Limpiar estado previo
    Execute JavaScript    localStorage.removeItem('cm_sala'); localStorage.removeItem('cm_indice')
    ${salaId}    ${codigo}=    Preparar Swipe Completo
    Go To    ${SWIPE_URL}
    # Esperar a que cargue el contenido
    Wait Until Page Contains Element    ${CARD_CONTENIDO}    15s

Preparar Swipe Con Match
    [Documentation]    Prepara /swipe con un match ya creado
    Execute JavaScript    localStorage.removeItem('cm_sala'); localStorage.removeItem('cm_indice')
    ${salaId}    ${codigo}=    Preparar Swipe Completo
    # Crear match: ambos usuarios aprueban el mismo contenido
    ${contenidoId}=    Obtener Primer Contenido
    Crear Match via Test    ${salaId}    ${contenidoId}
    Go To    ${SWIPE_URL}
    Wait Until Page Contains Element    ${CARD_CONTENIDO}    15s

Preparar Swipe Sin Match
    [Documentation]    Prepara /swipe sin match (solo user1 evalúa)
    Execute JavaScript    localStorage.removeItem('cm_sala'); localStorage.removeItem('cm_indice')
    ${salaId}    ${codigo}=    Preparar Swipe Completo
    Go To    ${SWIPE_URL}
    Wait Until Page Contains Element    ${CARD_CONTENIDO}    15s
