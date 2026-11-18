*** Settings ***
Documentation     Dashboard B: satisfacción y calidad (producto)
...               Valida KPIs, distribución, tendencia, mapa de calor, tabla y exportación XLSX.
Library           SeleniumLibrary
Resource          keywords.robot
Suite Setup       Abrir Navegador
Suite Teardown    Cerrar Navegador

*** Variables ***
${DASH_B_KPI_PROMEDIO}      css=[data-testid=kpi-promedio]
${DASH_B_KPI_TOTAL}         css=[data-testid=kpi-total]
${DASH_B_KPI_SATISFACCION}  css=[data-testid=kpi-satisfaccion]
${DASH_B_KPI_RIESGO}        css=[data-testid=kpi-riesgo]
${DASH_B_DISTRIBUCION}      css=[data-testid=chart-distribucion]
${DASH_B_PROMEDIO_DIARIO}   css=[data-testid=chart-promedio-diario]
${DASH_B_HEATMAP}           css=[data-testid=heatmap]
${DASH_B_TABLA}             css=[data-testid=tabla-detalle]

*** Test Cases ***
TC-DASH-B-001: Acceso al dashboard de satisfacción con KPIs
    [Documentation]    El administrador accede y ve los cuatro indicadores de calidad
    [Tags]    dashboard    positivo    ui
    Ir A Dashboard Satisfaccion
    Verificar Elemento Visible    ${DASH_B_KPI_PROMEDIO}
    Verificar Elemento Visible    ${DASH_B_KPI_TOTAL}
    Verificar Elemento Visible    ${DASH_B_KPI_SATISFACCION}
    Verificar Elemento Visible    ${DASH_B_KPI_RIESGO}
    Verificar Elemento Visible    xpath=//*[contains(text(), 'Satisfacción y calidad')]

TC-DASH-B-002: Distribución de calificaciones en barras
    [Documentation]    Se muestran las diez categorías de nota sin usar gráficos circulares
    [Tags]    dashboard    positivo    ui
    Ir A Dashboard Satisfaccion
    Verificar Elemento Visible    ${DASH_B_DISTRIBUCION}
    Verificar Elemento Visible    css=[data-testid=chart-distribucion] svg
    Verificar Elemento Visible    xpath=//*[contains(text(), 'Distribución de calificaciones')]
    Page Should Contain Element    xpath=//*[contains(text(), 'Verde: 8–10')]

TC-DASH-B-003: Línea de promedio diario con meta
    [Documentation]    La tendencia diaria se compara contra la meta de 7 puntos
    [Tags]    dashboard    positivo    ui
    Ir A Dashboard Satisfaccion
    Verificar Elemento Visible    ${DASH_B_PROMEDIO_DIARIO}
    Verificar Elemento Visible    css=[data-testid=chart-promedio-diario] svg
    Verificar Elemento Visible    xpath=//*[contains(text(), 'Promedio diario y meta')]
    Verificar Elemento Visible    xpath=//*[contains(text(), 'Meta 7')]

TC-DASH-B-004: Mapa de calor por día y rango de nota
    [Documentation]    Se cruzan los días de la semana con los rangos de calificación
    [Tags]    dashboard    positivo    ui
    Ir A Dashboard Satisfaccion
    Verificar Elemento Visible    ${DASH_B_HEATMAP}
    Verificar Elemento Visible    xpath=//*[contains(text(), 'Concentración de notas por día')]
    Page Should Contain Element    xpath=//*[contains(text(), 'Lun')]
    Page Should Contain Element    xpath=//*[contains(text(), 'Dom')]
    Page Should Contain Element    xpath=//*[contains(text(), '8–9')]

TC-DASH-B-005: Tabla de últimas calificaciones
    [Documentation]    El detalle muestra fecha, nota, usuario y sala
    [Tags]    dashboard    positivo    ui
    Ir A Dashboard Satisfaccion
    Verificar Elemento Visible    ${DASH_B_TABLA}
    Verificar Elemento Visible    xpath=//*[contains(text(), 'Últimas calificaciones')]
    Verificar Elemento Visible    xpath=//th[contains(text(), 'Fecha')]
    Verificar Elemento Visible    xpath=//th[contains(text(), 'Nota')]
    Verificar Elemento Visible    xpath=//th[contains(text(), 'Usuario')]
    Verificar Elemento Visible    xpath=//th[contains(text(), 'Sala')]

TC-DASH-B-006: Rango sin datos muestra estado vacío
    [Documentation]    Un rango futuro no tiene calificaciones y deshabilita la exportación
    [Tags]    dashboard    negativo    ui
    Ir A Dashboard Satisfaccion
    Establecer Rango De Fechas    2099-01-01    2099-12-31
    Verificar Elemento Visible    ${DASHBOARD_VACIO}
    Element Should Be Disabled    ${BTN_EXPORTAR_XLSX}
    Page Should Contain Element    xpath=//*[contains(text(), 'No hay calificaciones en el periodo seleccionado')]

TC-DASH-B-007: Limpiar filtro recupera los datos
    [Documentation]    Después de un rango vacío, limpiar el filtro vuelve a mostrar los KPIs
    [Tags]    dashboard    positivo    filtro
    Ir A Dashboard Satisfaccion
    Establecer Rango De Fechas    2099-01-01    2099-12-31
    Verificar Elemento Visible    ${DASHBOARD_VACIO}
    Click Button    xpath=//button[contains(text(), 'Limpiar')]
    Verificar Elemento Visible    ${DASH_B_KPI_PROMEDIO}

TC-DASH-B-008: Exportar dashboard a XLSX
    [Documentation]    El botón descarga un archivo XLSX con datos y muestra confirmación
    [Tags]    dashboard    positivo    export
    [Teardown]    Limpiar Descargas
    Ir A Dashboard Satisfaccion
    Limpiar Descargas
    Click Button    ${BTN_EXPORTAR_XLSX}
    Esperar Descarga XLSX    cinematch-dashboard-satisfaccion
    Verificar Elemento Visible    ${MSG_EXPORT_OK}

TC-DASH-B-009: Filtrar por una fecha específica
    [Documentation]    El filtro de fechas actualiza el resumen del periodo
    [Tags]    dashboard    positivo    filtro
    Ir A Dashboard Satisfaccion
    ${fecha_min}=    Get Element Attribute    id=desde    min
    Establecer Rango De Fechas    ${fecha_min}    ${fecha_min}
    Verificar Elemento Visible    ${DASH_B_KPI_PROMEDIO}
    Verificar Elemento Visible    xpath=//*[contains(text(), 'calificaciones en el periodo')]

TC-DASH-B-010: Usuario normal no accede al dashboard
    [Documentation]    adminGuard redirige al login cuando el usuario no es administrador
    [Tags]    dashboard    negativo    seguridad
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Go To    ${ADMIN_TENDENCIAS_URL}
    Wait Until Keyword Succeeds    10s    1s    Verificar URL Contiene    /login

TC-DASH-B-011: Reporte XLSX con hojas del reporte
    [Documentation]    El archivo descargado incluye portada, resumen y hojas de detalle
    [Tags]    dashboard    positivo    export
    [Teardown]    Limpiar Descargas
    Ir A Dashboard Satisfaccion
    Limpiar Descargas
    Click Button    ${BTN_EXPORTAR_XLSX}
    Esperar Descarga XLSX    cinematch-dashboard-satisfaccion
    Verificar Hojas XLSX    cinematch-dashboard-satisfaccion
    ...    Portada    Resumen    Serie diaria    Calificaciones    Metodología

*** Keywords ***
Ir A Dashboard Satisfaccion
    [Documentation]    Inicia sesión como administrador y abre el dashboard de satisfacción
    Login Administrador    ${ADMIN_CORREO}    ${ADMIN_PASSWORD}
    Go To    ${ADMIN_TENDENCIAS_URL}
    Wait Until Keyword Succeeds    ${TIMEOUT}    1s    Verificar Elemento Visible    ${DASH_B_KPI_PROMEDIO}
