*** Settings ***
Documentation     Test mínimo para crear sala
Library           SeleniumLibrary
Resource          ../keywords.robot
Test Tags         diagnostico
Suite Setup       Abrir Navegador
Suite Teardown    Cerrar Navegador

*** Test Cases ***
TC-MIN: Crear sala mínimo
    [Documentation]    Test mínimo de crear sala
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Sleep    2s
    Go To    ${HOME_URL}
    Wait Until Page Contains Element    xpath=//*[contains(text(), 'Hola')]    10s
    Sleep    1s
    ${link}=    Get WebElement    ${BTN_CREAR_SALA}
    Click Element    ${link}
    Sleep    2s
    ${url_after_click}=    Get Location
    Log    URL after click: ${url_after_click}
    Capture Page Screenshot    /tmp/min_after_click.png
    # Esperar más tiempo para que se cargue la sala
    FOR    ${i}    IN RANGE    10
        ${exists}=    Run Keyword And Return Status    Page Should Contain Element    xpath=//*[contains(@class, 'sala-code')]
        IF    ${exists}
            ${codigo}=    Get Text    xpath=//*[contains(@class, 'sala-code')]
            Log    Código encontrado en intento ${i}: ${codigo}
            BREAK
        END
        Sleep    1s
        Capture Page Screenshot    /tmp/min_attempt_${i}.png
    END
    ${url_final}=    Get Location
    Log    URL final: ${url_final}
    Log    sala-code exists: ${exists}
