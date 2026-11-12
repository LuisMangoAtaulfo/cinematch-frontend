*** Settings ***
Documentation     Pruebas de autenticación: login, registro, logout
Library           SeleniumLibrary
Resource          keywords.robot
Suite Setup       Abrir Navegador
Suite Teardown    Cerrar Navegador

*** Test Cases ***
# ══════════════════════════════════════════════
# LOGIN - CASOS EXITOSOS
# ══════════════════════════════════════════════

TC-AUTH-001: Login exitoso con credenciales válidas
    [Documentation]    Verifica que un usuario puede iniciar sesión con credenciales correctas
    [Tags]    auth    login    positivo
    Go To    ${LOGIN_URL}
    Wait Until Element Is Visible    ${INPUT_CORREO}    ${TIMEOUT}
    Input Text    ${INPUT_CORREO}    ${USER1_CORREO}
    Input Text    ${INPUT_PASSWORD}    ${USER1_PASSWORD}
    Click Button    ${BTN_LOGIN}
    Wait Until Page Contains Element    xpath=//*[contains(text(), 'Hola')]    ${TIMEOUT}
    Verificar URL Contiene    /home
    Verificar Elemento Visible    xpath=//*[contains(text(), 'Hola')]

TC-AUTH-002: Login redirige a home
    [Documentation]    Verifica que tras login exitoso se redirige a /home
    [Tags]    auth    login    positivo
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Verificar URL Contiene    /home

TC-AUTH-003: Logout exitoso
    [Documentation]    Verifica que el usuario puede cerrar sesión
    [Tags]    auth    logout    positivo
    Login Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    Logout Usuario
    Verificar URL Contiene    /login

# ══════════════════════════════════════════════
# LOGIN - CASOS DE ERROR
# ══════════════════════════════════════════════

TC-AUTH-004: Login con correo inexistente
    [Documentation]    Verifica que se muestra error al usar correo no registrado
    [Tags]    auth    login    negativo
    Go To    ${LOGIN_URL}
    Input Text    ${INPUT_CORREO}    noexiste@cinematch.com
    Input Text    ${INPUT_PASSWORD}    ${USER1_PASSWORD}
    Click Button    ${BTN_LOGIN}
    Verificar Mensaje Error    ${MSG_USUARIO_NO_ENCONTRADO}

TC-AUTH-005: Login con contraseña incorrecta
    [Documentation]    Verifica que se muestra error al usar contraseña incorrecta
    [Tags]    auth    login    negativo
    Go To    ${LOGIN_URL}
    Input Text    ${INPUT_CORREO}    ${USER1_CORREO}
    Input Text    ${INPUT_PASSWORD}    WrongPassword123
    Click Button    ${BTN_LOGIN}
    Verificar Mensaje Error    ${MSG_CRED_INCORRECTAS}

TC-AUTH-006: Login con campos vacíos
    [Documentation]    Verifica que se muestra error al dejar campos vacíos
    [Tags]    auth    login    validacion
    Go To    ${LOGIN_URL}
    Click Button    ${BTN_LOGIN}
    Verificar Mensaje Error    ${MSG_CAMPOS_VACIOS}

TC-AUTH-007: Login con correo vacío
    [Documentation]    Verifica validación cuando solo el correo está vacío
    [Tags]    auth    login    validacion
    Go To    ${LOGIN_URL}
    Input Text    ${INPUT_PASSWORD}    ${USER1_PASSWORD}
    Click Button    ${BTN_LOGIN}
    Verificar Mensaje Error    ${MSG_CAMPOS_VACIOS}

TC-AUTH-008: Login con contraseña vacía
    [Documentation]    Verifica validación cuando solo la contraseña está vacía
    [Tags]    auth    login    validacion
    Go To    ${LOGIN_URL}
    Input Text    ${INPUT_CORREO}    ${USER1_CORREO}
    Click Button    ${BTN_LOGIN}
    Verificar Mensaje Error    ${MSG_CAMPOS_VACIOS}

# ══════════════════════════════════════════════
# LOGIN - UI
# ══════════════════════════════════════════════

TC-AUTH-009: Toggle visibilidad de contraseña
    [Documentation]    Verifica que el botón de ojo muestra/oculta la contraseña
    [Tags]    auth    login    ui
    Go To    ${LOGIN_URL}
    Wait Until Element Is Visible    ${INPUT_PASSWORD}    ${TIMEOUT}
    Input Text    ${INPUT_PASSWORD}    TestPassword
    Click Button    ${BTN_TOGGLE_PASS}
    ${type}=    Get Element Attribute    ${INPUT_PASSWORD}    type
    Should Be Equal    ${type}    text
    Click Button    ${BTN_TOGGLE_PASS}
    ${type}=    Get Element Attribute    ${INPUT_PASSWORD}    type
    Should Be Equal    ${type}    password

TC-AUTH-010: Navegación login a registro
    [Documentation]    Verifica que el enlace a registro funciona
    [Tags]    auth    login    navegacion
    Go To    ${LOGIN_URL}
    Click Link    xpath=//a[contains(@href, 'registro')]
    Verificar URL Contiene    /registro

# ══════════════════════════════════════════════
# REGISTRO - CASOS EXITOSOS
# ══════════════════════════════════════════════

TC-AUTH-011: Registro exitoso
    [Documentation]    Verifica que un nuevo usuario puede registrarse
    [Tags]    auth    registro    positivo
    ${id_aleatorio}=    Generar ID Aleatorio
    ${correo_nuevo}=    Set Variable    nuevo_${id_aleatorio}@cinematch.com
    Registro Usuario    Nuevo Usuario    ${correo_nuevo}    Test1234
    Verificar URL Contiene    /home
    Verificar Elemento Visible    xpath=//*[contains(text(), 'Hola')]

# ══════════════════════════════════════════════
# REGISTRO - CASOS DE ERROR
# ══════════════════════════════════════════════

TC-AUTH-012: Registro con correo duplicado
    [Documentation]    Verifica que se muestra error al usar correo ya registrado
    [Tags]    auth    registro    negativo
    Go To    ${REGISTRO_URL}
    Input Text    ${INPUT_NOMBRE}    Usuario Duplicado
    Input Text    ${INPUT_CORREO}    ${USER1_CORREO}
    Input Text    ${INPUT_PASSWORD}    Test1234
    Input Text    ${INPUT_CONFIRM_PASS}    Test1234
    Click Button    ${BTN_REGISTRO}
    Verificar Mensaje Error    ${MSG_CORREO_DUPLICADO}

TC-AUTH-013: Registro con contraseñas que no coinciden
    [Documentation]    Verifica validación de contraseñas diferentes
    [Tags]    auth    registro    validacion
    Go To    ${REGISTRO_URL}
    Input Text    ${INPUT_NOMBRE}    Test User
    Input Text    ${INPUT_CORREO}    test@cinematch.com
    Input Text    ${INPUT_PASSWORD}    Test1234
    Input Text    ${INPUT_CONFIRM_PASS}    Test5678
    Click Button    ${BTN_REGISTRO}
    Verificar Mensaje Error    ${MSG_CONTRASENAS_NO_COINC}

TC-AUTH-014: Registro con contraseña menor a 8 caracteres
    [Documentation]    Verifica validación de longitud mínima de contraseña
    [Tags]    auth    registro    validacion
    Go To    ${REGISTRO_URL}
    Input Text    ${INPUT_NOMBRE}    Test User
    Input Text    ${INPUT_CORREO}    test@cinematch.com
    Input Text    ${INPUT_PASSWORD}    Test12
    Input Text    ${INPUT_CONFIRM_PASS}    Test12
    Click Button    ${BTN_REGISTRO}
    Verificar Mensaje Error    ${MSG_CONTRASENA_CORTA}

TC-AUTH-015: Registro con campos vacíos
    [Documentation]    Verifica validación de campos obligatorios
    [Tags]    auth    registro    validacion
    Go To    ${REGISTRO_URL}
    Click Button    ${BTN_REGISTRO}
    Verificar Mensaje Error    ${MSG_CAMPOS_VACIOS}

TC-AUTH-016: Navegación registro a login
    [Documentation]    Verifica que el enlace a login funciona
    [Tags]    auth    registro    navegacion
    Go To    ${REGISTRO_URL}
    Click Link    xpath=//a[contains(@href, 'login')]
    Verificar URL Contiene    /login
