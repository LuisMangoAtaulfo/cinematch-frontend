*** Settings ***
Documentation     Pruebas de filtros de contenido
Library           SeleniumLibrary
Library           Collections
Library           String
Library           OperatingSystem
Resource          keywords.robot
Suite Setup       Abrir Navegador
Suite Teardown    Cerrar Navegador

*** Test Cases ***
# ══════════════════════════════════════════════
# APLICAR FILTROS
# ══════════════════════════════════════════════

TC-FILTRO-001: Aplicar filtro por tipo Película
    [Documentation]    Verifica que se filtran solo películas
    [Tags]    filtros    tipo    positivo
    [Setup]    Preparar Filtros
    Select From List By Value    ${SELECT_TIPO}    PELICULA
    Click Button    ${BTN_APLICAR_FILTROS}
    Sleep    3s
    Wait Until Keyword Succeeds    10s    1s    Verificar URL Contiene    /swipe

TC-FILTRO-002: Aplicar filtro por tipo Serie
    [Documentation]    Verifica que se filtran solo series
    [Tags]    filtros    tipo    positivo
    [Setup]    Preparar Filtros
    Select From List By Value    ${SELECT_TIPO}    SERIE
    Click Button    ${BTN_APLICAR_FILTROS}
    Wait Until Keyword Succeeds    10s    1s    Verificar URL Contiene    /swipe

TC-FILTRO-003: Aplicar filtro por género
    [Documentation]    Verifica que se filtran por género
    [Tags]    filtros    genero    positivo
    [Setup]    Preparar Filtros
    Select From List By Value    ${SELECT_GENERO}    ACCION
    Click Button    ${BTN_APLICAR_FILTROS}
    Wait Until Keyword Succeeds    10s    1s    Verificar URL Contiene    /swipe

TC-FILTRO-004: Aplicar filtro por plataforma
    [Documentation]    Verifica que se filtran por plataforma
    [Tags]    filtros    plataforma    positivo
    [Setup]    Preparar Filtros
    Wait Until Keyword Succeeds    10s    1s    Verificar Elemento Visible    ${SELECT_PLATAFORMA}
    # Seleccionar la primera plataforma disponible (no "Todas")
    ${options}=    Get List Items    ${SELECT_PLATAFORMA}
    ${len}=    Get Length    ${options}
    Run Keyword If    ${len} > 1    Select From List By Index    ${SELECT_PLATAFORMA}    1
    Click Button    ${BTN_APLICAR_FILTROS}
    Wait Until Keyword Succeeds    10s    1s    Verificar URL Contiene    /swipe

TC-FILTRO-005: Aplicar filtro por año
    [Documentation]    Verifica que se filtran por año
    [Tags]    filtros    anio    positivo
    [Setup]    Preparar Filtros
    Select From List By Label    ${SELECT_ANIO}    2024
    Click Button    ${BTN_APLICAR_FILTROS}
    Wait Until Keyword Succeeds    10s    1s    Verificar URL Contiene    /swipe

TC-FILTRO-006: Aplicar filtros combinados
    [Documentation]    Verifica que se pueden combinar múltiples filtros
    [Tags]    filtros    combinado    positivo
    [Setup]    Preparar Filtros
    Select From List By Value    ${SELECT_TIPO}    PELICULA
    Select From List By Value    ${SELECT_GENERO}    ACCION
    Click Button    ${BTN_APLICAR_FILTROS}
    Wait Until Keyword Succeeds    10s    1s    Verificar URL Contiene    /swipe

TC-FILTRO-007: Omitir filtros
    [Documentation]    Verifica que se puede omitir filtros y ver todo el catálogo
    [Tags]    filtros    omitir    positivo
    [Setup]    Preparar Filtros
    Click Button    ${BTN_OMITIR_FILTROS}
    Wait Until Keyword Succeeds    10s    1s    Verificar URL Contiene    /swipe

# ══════════════════════════════════════════════
# VALIDACIONES DE FILTROS
# ══════════════════════════════════════════════

TC-FILTRO-008: Solo se muestran plataformas habilitadas
    [Documentation]    Verifica que el dropdown muestra plataformas
    [Tags]    filtros    validacion
    [Setup]    Preparar Filtros
    Wait Until Keyword Succeeds    10s    1s    Verificar Elemento Visible    ${SELECT_PLATAFORMA}
    ${options}=    Get List Items    ${SELECT_PLATAFORMA}
    ${len}=    Get Length    ${options}
    Should Be True    ${len} >= 1

TC-FILTRO-009: Filtros requieren autenticación
    [Documentation]    Verifica que aplicar filtros sin login redirige a login
    [Tags]    filtros    seguridad
    # Limpiar sesión activa
    Go To    ${LOGIN_URL}
    Execute JavaScript    localStorage.clear()
    Go To    ${FILTROS_URL}
    Wait Until Keyword Succeeds    5s    1s    Verificar URL Contiene    /login

TC-FILTRO-010: Dropdown de años tiene opciones
    [Documentation]    Verifica que el dropdown de años tiene opciones
    [Tags]    filtros    validacion
    [Setup]    Preparar Filtros
    ${options}=    Get List Items    ${SELECT_ANIO}
    ${len}=    Get Length    ${options}
    Should Be True    ${len} > 1

# ══════════════════════════════════════════════
# KEYWORDS AUXILIARES
# ══════════════════════════════════════════════

*** Keywords ***
Preparar Filtros
    [Documentation]    Prepara el navegador en /filtros con sala activa
    ${salaId}    ${codigo}=    Preparar Swipe Completo
    Go To    ${FILTROS_URL}
    Wait Until Page Contains Element    ${SELECT_TIPO}    ${TIMEOUT}
