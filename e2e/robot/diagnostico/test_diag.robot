*** Settings ***
Documentation     Test de diagnóstico para crear sala
Library           SeleniumLibrary
Resource          ../keywords.robot
Test Tags         diagnostico
Suite Setup       Abrir Navegador
Suite Teardown    Cerrar Navegador

*** Test Cases ***
TC-DIAG: Diagnosticar crear sala
    [Documentation]    Diagnóstico del flujo de crear sala
    Go To    ${HOME_URL}
    Sleep    2s
    Capture Page Screenshot    /tmp/diag_home.png
    # Login
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Sleep    2s
    Capture Page Screenshot    /tmp/diag_loggedin.png
    # Verificar que estamos en home
    Wait Until Page Contains Element    xpath=//*[contains(text(), 'Hola')]    10s
    Capture Page Screenshot    /tmp/diag_home_ok.png
    # Click en crear sala
    Click Link    ${BTN_CREAR_SALA}
    Sleep    3s
    Capture Page Screenshot    /tmp/diag_crear_sala.png
    # Verificar URL
    ${url}=    Get Location
    Log    URL actual: ${url}
    # Verificar elementos
    ${btn_cancelar}=    Run Keyword And Return Status    Wait Until Page Contains Element    ${BTN_CANCELAR_SALA}    5s
    Log    Botón cancelar visible: ${btn_cancelar}
    Capture Page Screenshot    /tmp/diag_final.png
