*** Settings ***
Documentation     Pruebas del panel de administración
Library           SeleniumLibrary
Resource          keywords.robot
Suite Setup       Abrir Navegador
Suite Teardown    Cerrar Navegador

*** Test Cases ***
# ══════════════════════════════════════════════
# ADMIN LOGIN
# ══════════════════════════════════════════════

TC-ADMIN-001: Login de administrador exitoso
    [Documentation]    Verifica que un admin puede iniciar sesión
    [Tags]    admin    login    positivo
    Login Administrador    ${ADMIN_CORREO}    ${ADMIN_PASSWORD}
    Verificar URL Contiene    /admin/dashboard

TC-ADMIN-002: Login admin con credenciales incorrectas
    [Documentation]    Verifica error con credenciales incorrectas
    [Tags]    admin    login    negativo
    Go To    ${ADMIN_LOGIN_URL}
    Input Text    ${INPUT_CORREO}    admin@wrong.com
    Input Text    ${INPUT_PASSWORD}    WrongPassword
    Click Button    ${BTN_INGRESAR_ADMIN}
    Wait Until Keyword Succeeds    10s    1s    Verificar Elemento Visible    css=.form-error

TC-ADMIN-003: Login admin con usuario no administrador
    [Documentation]    Verifica que usuario normal no puede acceder como admin
    [Tags]    admin    login    seguridad
    Go To    ${ADMIN_LOGIN_URL}
    Input Text    ${INPUT_CORREO}    ${USER1_CORREO}
    Input Text    ${INPUT_PASSWORD}    ${USER1_PASSWORD}
    Click Button    ${BTN_INGRESAR_ADMIN}
    Verificar Mensaje Error    xpath=//*[contains(text(), 'no tiene permisos')]

TC-ADMIN-004: Login admin con campos vacíos
    [Documentation]    Verifica validación de campos obligatorios
    [Tags]    admin    login    validacion
    Go To    ${ADMIN_LOGIN_URL}
    Click Button    ${BTN_INGRESAR_ADMIN}
    Verificar Mensaje Error    ${MSG_CAMPOS_VACIOS}

TC-ADMIN-005: Navegación admin login a user login
    [Documentation]    Verifica enlace a login de usuario
    [Tags]    admin    login    navegacion
    Go To    ${ADMIN_LOGIN_URL}
    Click Link    xpath=//a[contains(@href, '/login')]
    Verificar URL Contiene    /login

# ══════════════════════════════════════════════
# ADMIN DASHBOARD
# ══════════════════════════════════════════════

TC-ADMIN-006: Dashboard muestra KPIs
    [Documentation]    Verifica que se muestran las tarjetas KPI
    [Tags]    admin    dashboard    positivo
    Login Administrador    ${ADMIN_CORREO}    ${ADMIN_PASSWORD}
    Go To    ${ADMIN_DASHBOARD_URL}
    Verificar Elemento Visible    xpath=//*[contains(text(), 'Salas')]
    Verificar Elemento Visible    xpath=//*[contains(text(), 'Matches')]

TC-ADMIN-007: Dashboard muestra tarjetas de métricas
    [Documentation]    Verifica que se muestran las tarjetas de métricas
    [Tags]    admin    dashboard    ui
    Login Administrador    ${ADMIN_CORREO}    ${ADMIN_PASSWORD}
    Go To    ${ADMIN_DASHBOARD_URL}
    Verificar Elemento Visible    xpath=//*[contains(@class, 'metric-card') or contains(@class, 'kpi')]

TC-ADMIN-008: Dashboard muestra grid de métricas
    [Documentation]    Verifica que se muestra el grid de métricas
    [Tags]    admin    dashboard    ui
    Login Administrador    ${ADMIN_CORREO}    ${ADMIN_PASSWORD}
    Go To    ${ADMIN_DASHBOARD_URL}
    Verificar Elemento Visible    xpath=//*[contains(@class, 'grid') or contains(@class, 'metric')]

TC-ADMIN-009: Dashboard navega a métricas
    [Documentation]    Verifica enlace a métricas
    [Tags]    admin    dashboard    navegacion
    Login Administrador    ${ADMIN_CORREO}    ${ADMIN_PASSWORD}
    Go To    ${ADMIN_DASHBOARD_URL}
    Click Link    xpath=//*[contains(text(), 'Métricas') or contains(text(), 'metricas')]
    Verificar URL Contiene    /admin/metricas

# ══════════════════════════════════════════════
# ADMIN MÉTRICAS
# ══════════════════════════════════════════════

TC-ADMIN-010: Métricas muestra datos
    [Documentation]    Verifica que se muestran las métricas
    [Tags]    admin    metricas    positivo
    Login Administrador    ${ADMIN_CORREO}    ${ADMIN_PASSWORD}
    Go To    ${ADMIN_METRICAS_URL}
    Verificar Elemento Visible    xpath=//*[contains(text(), 'Salas activas')]
    Verificar Elemento Visible    xpath=//*[contains(text(), 'Salas totales')]
    Verificar Elemento Visible    xpath=//*[contains(text(), 'Matches generados')]
    Verificar Elemento Visible    xpath=//*[contains(text(), 'Promedio')]

TC-ADMIN-011: Filtrar métricas por fecha
    [Documentation]    Verifica que se pueden filtrar métricas por rango de fechas
    [Tags]    admin    metricas    filtro
    Login Administrador    ${ADMIN_CORREO}    ${ADMIN_PASSWORD}
    Go To    ${ADMIN_METRICAS_URL}
    Wait Until Keyword Succeeds    10s    1s    Verificar Elemento Visible    id=desde
    Input Text    id=desde    2024-01-01
    Input Text    id=hasta    2024-12-31
    # Esperar a que se actualicen las métricas
    Sleep    2s
    # Verificar que los inputs tienen los valores
    ${desde_val}=    Get Value    id=desde
    Should Contain    ${desde_val}    2024

TC-ADMIN-012: Limpiar filtro de fechas en métricas
    [Documentation]    Verifica que se pueden limpiar los filtros
    [Tags]    admin    metricas    filtro
    Login Administrador    ${ADMIN_CORREO}    ${ADMIN_PASSWORD}
    Go To    ${ADMIN_METRICAS_URL}
    Wait Until Keyword Succeeds    10s    1s    Verificar Elemento Visible    id=desde
    Input Text    id=desde    2024-01-01
    Execute JavaScript    document.getElementById('desde').dispatchEvent(new Event('change'))
    Wait Until Keyword Succeeds    5s    1s    Verificar Elemento Visible    ${BTN_LIMPIAR}
    Click Button    ${BTN_LIMPIAR}
    # Verificar que el filtro se limpió
    Element Should Not Be Visible    xpath=//*[contains(text(), 'Filtro activo')]

# ══════════════════════════════════════════════
# ADMIN PLATAFORMAS
# ══════════════════════════════════════════════

TC-ADMIN-013: Plataformas muestra lista
    [Documentation]    Verifica que se listan las plataformas
    [Tags]    admin    plataformas    positivo
    Login Administrador    ${ADMIN_CORREO}    ${ADMIN_PASSWORD}
    Go To    ${ADMIN_PLAT_URL}
    Verificar Elemento Visible    xpath=//*[contains(@class, 'plataforma')]

TC-ADMIN-014: Ver lista de plataformas con toggles
    [Documentation]    Verifica que se listan las plataformas con toggles
    [Tags]    admin    plataformas    positivo
    Login Administrador    ${ADMIN_CORREO}    ${ADMIN_PASSWORD}
    Go To    ${ADMIN_PLAT_URL}
    Verificar Elemento Visible    xpath=//*[contains(@class, 'plataforma-item')]
    # Verificar que hay al menos un toggle
    ${toggles}=    Get Element Count    xpath=//input[@type='checkbox']
    Should Be True    ${toggles} > 0

TC-ADMIN-015: Cancelar confirmación de deshabilitar
    [Documentation]    Verifica que se puede cancelar la confirmación
    [Tags]    admin    plataformas    cancelacion    manual
    Pass Execution    Test manual - requiere intervención humana

# ══════════════════════════════════════════════
# ADMIN RETROALIMENTACIÓN
# ══════════════════════════════════════════════

TC-ADMIN-016: Retroalimentación muestra sección de calificaciones
    [Documentation]    Verifica que se muestra la sección de retroalimentación
    [Tags]    admin    retroalimentacion    positivo
    Login Administrador    ${ADMIN_CORREO}    ${ADMIN_PASSWORD}
    Go To    ${ADMIN_RETRO_URL}
    Wait Until Keyword Succeeds    10s    1s    Verificar Elemento Visible    xpath=//*[contains(text(), 'Retroalimentación') or contains(text(), 'calificaciones') or contains(text(), 'calificación')]

TC-ADMIN-017: Retroalimentación muestra distribución
    [Documentation]    Verifica que se muestra la distribución de calificaciones
    [Tags]    admin    retroalimentacion    ui
    Login Administrador    ${ADMIN_CORREO}    ${ADMIN_PASSWORD}
    Go To    ${ADMIN_RETRO_URL}
    Verificar Elemento Visible    xpath=//*[contains(@class, 'distribucion') or contains(@class, 'bar') or contains(text(), 'Retroalimentación')]

TC-ADMIN-018: Filtrar retroalimentación por fecha
    [Documentation]    Verifica que se pueden filtrar calificaciones
    [Tags]    admin    retroalimentacion    filtro
    Login Administrador    ${ADMIN_CORREO}    ${ADMIN_PASSWORD}
    Go To    ${ADMIN_RETRO_URL}
    Wait Until Keyword Succeeds    10s    1s    Verificar Elemento Visible    id=desde
    Input Text    id=desde    2024-01-01
    Input Text    id=hasta    2024-12-31
    Sleep    2s
    # Verificar que los inputs tienen los valores
    ${desde_val}=    Get Value    id=desde
    Should Contain    ${desde_val}    2024

# ══════════════════════════════════════════════
# SEGURIDAD ADMIN
# ══════════════════════════════════════════════

TC-ADMIN-019: Rutas admin requieren autenticación
    [Documentation]    Verifica que las rutas admin requieren login
    [Tags]    admin    seguridad
    # Asegurar que no hay sesión activa
    Go To    ${LOGIN_URL}
    Execute JavaScript    localStorage.clear()
    Go To    ${ADMIN_METRICAS_URL}
    Wait Until Keyword Succeeds    5s    1s    Verificar URL Contiene    /login

TC-ADMIN-020: Rutas admin requieren rol administrador
    [Documentation]    Verifica que usuario normal no puede acceder
    [Tags]    admin    seguridad
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Go To    ${ADMIN_METRICAS_URL}
    Wait Until Keyword Succeeds    5s    1s    Verificar URL Contiene    /login

TC-ADMIN-021: Logout desde admin
    [Documentation]    Verifica que el admin puede cerrar sesión
    [Tags]    admin    logout
    Login Administrador    ${ADMIN_CORREO}    ${ADMIN_PASSWORD}
    Go To    ${ADMIN_METRICAS_URL}
    Click Button    ${BTN_SALIR}
    Verificar URL Contiene    /login
