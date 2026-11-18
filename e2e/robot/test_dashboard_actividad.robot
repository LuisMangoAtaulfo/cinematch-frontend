*** Settings ***
Documentation     Dashboard A: actividad y conversión (operación)
...               Valida KPIs, visualizaciones, filtros y exportación a XLSX.
Library           SeleniumLibrary
Resource          keywords.robot
Suite Setup       Abrir Navegador
Suite Teardown    Cerrar Navegador

*** Variables ***
${DASH_A_KPI_SALAS}        css=[data-testid=kpi-salas]
${DASH_A_KPI_MATCHES}      css=[data-testid=kpi-matches]
${DASH_A_KPI_CONVERSION}   css=[data-testid=kpi-conversion]
${DASH_A_KPI_ACTIVAS}      css=[data-testid=kpi-activas]
${DASH_A_TENDENCIA}        css=[data-testid=chart-tendencia]
${DASH_A_SLOPEGRAPH}       css=[data-testid=chart-slopegraph]
${DASH_A_BARRAS}           css=[data-testid=chart-barras-semana]

*** Test Cases ***
TC-DASH-A-001: Acceso al dashboard de actividad con KPIs
    [Documentation]    El administrador accede y ve los cuatro indicadores principales
    [Tags]    dashboard    positivo    ui
    Ir A Dashboard Actividad
    Verificar Elemento Visible    ${DASH_A_KPI_SALAS}
    Verificar Elemento Visible    ${DASH_A_KPI_MATCHES}
    Verificar Elemento Visible    ${DASH_A_KPI_CONVERSION}
    Verificar Elemento Visible    ${DASH_A_KPI_ACTIVAS}
    Verificar Elemento Visible    xpath=//*[contains(text(), 'Dashboard de actividad y conversión')]

TC-DASH-A-002: Tarjetas KPI con sparklines
    [Documentation]    Cada indicador se acompaña de una minigráfica de tendencia
    [Tags]    dashboard    positivo    ui
    Ir A Dashboard Actividad
    Page Should Contain Element    css=.sparkline
    Verificar Elemento Visible    xpath=//*[contains(@class, 'metric-card')]
    Verificar Elemento Visible    xpath=//*[contains(text(), 'Salas creadas')]

TC-DASH-A-003: Gráfica de línea de salas y matches
    [Documentation]    Se muestra la evolución diaria con una sola escala y leyenda
    [Tags]    dashboard    positivo    ui
    Ir A Dashboard Actividad
    Verificar Elemento Visible    ${DASH_A_TENDENCIA}
    Verificar Elemento Visible    css=[data-testid=chart-tendencia] svg
    Verificar Elemento Visible    xpath=//*[contains(text(), 'Salas y matches por día')]
    Page Should Contain Element    xpath=//*[contains(text(), 'Salas')]
    Page Should Contain Element    xpath=//*[contains(text(), 'Matches')]

TC-DASH-A-004: Gráfica de barras por día de la semana
    [Documentation]    Se compara el promedio de salas entre los días de la semana
    [Tags]    dashboard    positivo    ui
    Ir A Dashboard Actividad
    Verificar Elemento Visible    ${DASH_A_BARRAS}
    Verificar Elemento Visible    css=[data-testid=chart-barras-semana] svg
    Verificar Elemento Visible    xpath=//*[contains(text(), 'Promedio de salas por día de la semana')]
    Page Should Contain Element    xpath=//*[contains(text(), 'Lun')]
    Page Should Contain Element    xpath=//*[contains(text(), 'Dom')]

TC-DASH-A-005: Slopegraph de primera y segunda mitad
    [Documentation]    Se compara el antes y después del periodo seleccionado
    [Tags]    dashboard    positivo    ui
    Ir A Dashboard Actividad
    ${solo_un_dia}=    Get Element Count    xpath=//*[contains(text(), 'Se necesitan al menos dos días')]
    Skip If    ${solo_un_dia} > 0    El periodo tiene un solo día con actividad
    Verificar Elemento Visible    ${DASH_A_SLOPEGRAPH}
    Verificar Elemento Visible    css=[data-testid=chart-slopegraph] svg
    Verificar Elemento Visible    xpath=//*[contains(text(), 'Segunda mitad')]

TC-DASH-A-006: Exportar dashboard a XLSX
    [Documentation]    El botón descarga un archivo XLSX con datos y muestra confirmación
    [Tags]    dashboard    positivo    export
    [Teardown]    Limpiar Descargas
    Ir A Dashboard Actividad
    Limpiar Descargas
    Click Button    ${BTN_EXPORTAR_XLSX}
    Esperar Descarga XLSX    cinematch-dashboard-actividad
    Verificar Elemento Visible    ${MSG_EXPORT_OK}

TC-DASH-A-007: Rango sin datos muestra estado vacío
    [Documentation]    Un rango futuro no tiene actividad y deshabilita la exportación
    [Tags]    dashboard    negativo    ui
    Ir A Dashboard Actividad
    Establecer Rango De Fechas    2099-01-01    2099-12-31
    Verificar Elemento Visible    ${DASHBOARD_VACIO}
    Element Should Be Disabled    ${BTN_EXPORTAR_XLSX}
    Page Should Contain Element    xpath=//*[contains(text(), 'No hay actividad en el periodo seleccionado')]

TC-DASH-A-008: Limpiar filtro recupera los datos
    [Documentation]    Después de un rango vacío, limpiar el filtro vuelve a mostrar los KPIs
    [Tags]    dashboard    positivo    filtro
    Ir A Dashboard Actividad
    Establecer Rango De Fechas    2099-01-01    2099-12-31
    Verificar Elemento Visible    ${DASHBOARD_VACIO}
    Click Button    xpath=//button[contains(text(), 'Limpiar')]
    Verificar Elemento Visible    ${DASH_A_KPI_SALAS}

TC-DASH-A-009: Periodo rápido de siete días
    [Documentation]    El selector de periodo actualiza las fechas desde/hasta
    [Tags]    dashboard    positivo    filtro
    Ir A Dashboard Actividad
    Select From List By Value    id=periodo-rapido    7
    ${desde}=    Get Value    id=desde
    ${hasta}=    Get Value    id=hasta
    Should Not Be Empty    ${desde}
    Should Not Be Empty    ${hasta}
    Verificar Elemento Visible    ${DASH_A_KPI_CONVERSION}

TC-DASH-A-010: Usuario normal no accede al dashboard
    [Documentation]    adminGuard redirige al login cuando el usuario no es administrador
    [Tags]    dashboard    negativo    seguridad
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Go To    ${ADMIN_DASHBOARD_URL}
    Wait Until Keyword Succeeds    10s    1s    Verificar URL Contiene    /login

TC-DASH-A-011: Reporte XLSX con hojas del reporte
    [Documentation]    El archivo descargado incluye portada, resumen y hojas de detalle
    [Tags]    dashboard    positivo    export
    [Teardown]    Limpiar Descargas
    Ir A Dashboard Actividad
    Limpiar Descargas
    Click Button    ${BTN_EXPORTAR_XLSX}
    Esperar Descarga XLSX    cinematch-dashboard-actividad
    Verificar Hojas XLSX    cinematch-dashboard-actividad
    ...    Portada    Resumen    Serie diaria    Día de semana

*** Keywords ***
Ir A Dashboard Actividad
    [Documentation]    Inicia sesión como administrador y abre el dashboard de actividad
    Login Administrador    ${ADMIN_CORREO}    ${ADMIN_PASSWORD}
    Go To    ${ADMIN_DASHBOARD_URL}
    Wait Until Keyword Succeeds    ${TIMEOUT}    1s    Verificar Elemento Visible    ${DASH_A_KPI_SALAS}
