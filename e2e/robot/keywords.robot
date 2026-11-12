*** Settings ***
Documentation     Keywords comunes reutilizables para las pruebas de CineMatch
Library           SeleniumLibrary
Library           Collections
Library           String
Library           OperatingSystem
Resource          variables.robot

*** Keywords ***
# ══════════════════════════════════════════════
# SETUP Y TEARDOWN
# ══════════════════════════════════════════════

Abrir Navegador
    [Documentation]    Abre el navegador y maximiza la ventana
    IF    ${HEADLESS}
        IF    '${BROWSER}' == 'firefox'
            ${options}=    Evaluate    sys.modules['selenium.webdriver'].FirefoxOptions()
            Evaluate    $options.add_argument('--headless')
        ELSE IF    '${BROWSER}' == 'chrome'
            ${options}=    Evaluate    sys.modules['selenium.webdriver'].ChromeOptions()
            Evaluate    $options.add_argument('--headless')
            Evaluate    $options.add_argument('--no-sandbox')
            Evaluate    $options.add_argument('--disable-dev-shm-usage')
        END
        Open Browser    ${BASE_URL}    ${BROWSER}    options=${options}
    ELSE
        Open Browser    ${BASE_URL}    ${BROWSER}
    END
    Maximize Browser Window
    Set Selenium Timeout    ${TIMEOUT}

Generar ID Aleatorio
    [Documentation]    Genera un identificador aleatorio para correos únicos en tests
    ${timestamp}=    Evaluate    int(__import__('time').time() * 1000)
    ${random_suffix}=    Evaluate    __import__('random').randint(1000, 9999)
    ${id}=    Set Variable    ${timestamp}${random_suffix}
    RETURN    ${id}

Cerrar Navegador
    [Documentation]    Cierra el navegador
    Close All Browsers

# ══════════════════════════════════════════════
# AUTENTICACIÓN DE USUARIO
# ══════════════════════════════════════════════

Login Usuario
    [Documentation]    Inicia sesión con un usuario existente
    [Arguments]    ${correo}    ${password}
    Go To    ${LOGIN_URL}
    Wait Until Element Is Visible    ${INPUT_CORREO}    ${TIMEOUT}
    Input Text    ${INPUT_CORREO}    ${correo}
    Input Text    ${INPUT_PASSWORD}    ${password}
    Click Button    ${BTN_LOGIN}
    Wait Until Page Contains Element    xpath=//*[contains(text(), 'Hola')]    ${TIMEOUT}

Logout Usuario
    [Documentation]    Cierra la sesión del usuario actual
    Click Button    ${BTN_LOGOUT}
    Wait Until Page Contains Element    ${BTN_LOGIN}    ${TIMEOUT}

Registro Usuario
    [Documentation]    Registra un nuevo usuario
    [Arguments]    ${nombre}    ${correo}    ${password}
    Go To    ${REGISTRO_URL}
    Wait Until Element Is Visible    ${INPUT_NOMBRE}    ${TIMEOUT}
    Input Text    ${INPUT_NOMBRE}    ${nombre}
    Input Text    ${INPUT_CORREO}    ${correo}
    Input Text    ${INPUT_PASSWORD}    ${password}
    Input Text    ${INPUT_CONFIRM_PASS}    ${password}
    Click Button    ${BTN_REGISTRO}
    Wait Until Page Contains Element    xpath=//*[contains(text(), 'Hola')]    ${TIMEOUT}

# ══════════════════════════════════════════════
# AUTENTICACIÓN DE ADMINISTRADOR
# ══════════════════════════════════════════════

Login Administrador
    [Documentation]    Inicia sesión como administrador
    [Arguments]    ${correo}    ${password}
    Go To    ${ADMIN_LOGIN_URL}
    Wait Until Element Is Visible    ${INPUT_CORREO}    ${TIMEOUT}
    Input Text    ${INPUT_CORREO}    ${correo}
    Input Text    ${INPUT_PASSWORD}    ${password}
    Click Button    ${BTN_INGRESAR_ADMIN}
    Wait Until Page Contains Element    xpath=//*[contains(text(), 'Dashboard')]    ${TIMEOUT}

# ══════════════════════════════════════════════
# GESTIÓN DE SALAS
# ══════════════════════════════════════════════

Crear Sala
    [Documentation]    Crea una nueva sala y retorna el código
    Go To    ${HOME_URL}
    Wait Until Page Contains Element    xpath=//*[contains(text(), 'Hola')]    15s
    Sleep    2s
    Click Link    ${BTN_CREAR_SALA}
    Sleep    3s
    Wait Until Page Contains Element    xpath=//*[contains(@class, 'sala-code')]    10s
    ${codigo}=    Get Text    xpath=//*[contains(@class, 'sala-code')]
    RETURN    ${codigo}

Unirse A Sala
    [Documentation]    Se une a una sala existente con el código proporcionado
    [Arguments]    ${codigo}
    Go To    ${UNIRSE_URL}
    Wait Until Element Is Visible    ${INPUT_CODIGO}    ${TIMEOUT}
    Input Text    ${INPUT_CODIGO}    ${codigo}
    Click Button    ${BTN_UNIRSE}

Cancelar Sala
    [Documentation]    Cancela una sala en estado de espera
    Click Button    ${BTN_CANCELAR_SALA}
    Wait Until Page Contains Element    ${BTN_CREAR_SALA}    ${TIMEOUT}

# ══════════════════════════════════════════════
# FILTROS
# ══════════════════════════════════════════════

Aplicar Filtros
    [Documentation]    Aplica filtros de contenido
    [Arguments]    ${tipo}=${EMPTY}    ${genero}=${EMPTY}    ${plataforma}=${EMPTY}    ${anio}=${EMPTY}
    Wait Until Element Is Visible    ${SELECT_TIPO}    ${TIMEOUT}
    
    Run Keyword If    '${tipo}' != '${EMPTY}'    Select From List By Label    ${SELECT_TIPO}    ${tipo}
    Run Keyword If    '${genero}' != '${EMPTY}'    Select From List By Label    ${SELECT_GENERO}    ${genero}
    Run Keyword If    '${plataforma}' != '${EMPTY}'    Select From List By Label    ${SELECT_PLATAFORMA}    ${plataforma}
    Run Keyword If    '${anio}' != '${EMPTY}'    Select From List By Label    ${SELECT_ANIO}    ${anio}
    
    Click Button    ${BTN_APLICAR_FILTROS}
    Wait Until Page Contains Element    ${CARD_CONTENIDO}    ${TIMEOUT}

Omitir Filtros
    [Documentation]    Omite los filtros y carga todo el catálogo
    Wait Until Element Is Visible    ${BTN_OMITIR_FILTROS}    ${TIMEOUT}
    Click Button    ${BTN_OMITIR_FILTROS}
    Wait Until Page Contains Element    ${CARD_CONTENIDO}    ${TIMEOUT}

# ══════════════════════════════════════════════
# SWIPE Y EVALUACIÓN
# ══════════════════════════════════════════════

Evaluar Like
    [Documentation]    Evalúa el contenido actual con Like
    Wait Until Element Is Visible    ${CARD_CONTENIDO}    ${TIMEOUT}
    Click Button    ${BTN_LIKE}

Evaluar Dislike
    [Documentation]    Evalúa el contenido actual con Dislike
    Wait Until Element Is Visible    ${CARD_CONTENIDO}    ${TIMEOUT}
    Click Button    ${BTN_DISLIKE}

Finalizar Sesión Swipe
    [Documentation]    Finaliza la sesión desde la pantalla de swipe
    Click Button    ${BTN_FINALIZAR}
    Wait Until Page Contains Element    xpath=//*[contains(text(), 'Resultados')]    ${TIMEOUT}

# ══════════════════════════════════════════════
# CHAT
# ══════════════════════════════════════════════

Enviar Mensaje
    [Documentation]    Envía un mensaje de chat
    [Arguments]    ${mensaje}
    Wait Until Element Is Visible    ${INPUT_MENSAJE}    ${TIMEOUT}
    Input Text    ${INPUT_MENSAJE}    ${mensaje}
    Click Button    ${BTN_ENVIAR_MENSAJE}

Verificar Mensaje Recibido
    [Documentation]    Verifica que un mensaje está visible en el chat
    [Arguments]    ${mensaje}
    Wait Until Page Contains    ${mensaje}    ${TIMEOUT}

# ══════════════════════════════════════════════
# PERFIL
# ══════════════════════════════════════════════

Actualizar Perfil
    [Documentation]    Actualiza el perfil del usuario
    [Arguments]    ${nombre}=${EMPTY}    ${descripcion}=${EMPTY}
    Go To    ${PERFIL_URL}
    Wait Until Element Is Visible    ${INPUT_NOMBRE}    ${TIMEOUT}
    
    Run Keyword If    '${nombre}' != '${EMPTY}'    Input Text    ${INPUT_NOMBRE}    ${nombre}
    Run Keyword If    '${descripcion}' != '${EMPTY}'    Input Text    ${INPUT_DESCRIPCION}    ${descripcion}
    
    Click Button    ${BTN_GUARDAR_PERFIL}
    Wait Until Page Contains Element    ${MSG_PERFIL_ACTUALIZADO}    ${TIMEOUT}

# ══════════════════════════════════════════════
# CALIFICACIÓN
# ══════════════════════════════════════════════

Calificar Experiencia
    [Documentation]    Califica la experiencia con un valor del 1 al 10
    [Arguments]    ${valor}
    Wait Until Element Is Visible    xpath=//button[contains(text(), '${valor}')]    ${TIMEOUT}
    Click Element    xpath=//button[contains(text(), '${valor}')]
    Click Button    ${BTN_ENVIAR_CAL}
    Wait Until Page Contains Element    ${BTN_CREAR_SALA}    ${TIMEOUT}

# ══════════════════════════════════════════════
# VERIFICACIONES
# ══════════════════════════════════════════════

Verificar URL Contiene
    [Documentation]    Verifica que la URL actual contiene el texto esperado
    [Arguments]    ${texto}
    ${url}=    Get Location
    Should Contain    ${url}    ${texto}

Verificar Elemento Visible
    [Documentation]    Verifica que un elemento está visible
    [Arguments]    ${locator}
    Wait Until Element Is Visible    ${locator}    ${TIMEOUT}

Verificar Mensaje Error
    [Documentation]    Verifica que se muestra un mensaje de error específico
    [Arguments]    ${mensaje_locator}
    Wait Until Element Is Visible    ${mensaje_locator}    ${TIMEOUT}

Verificar Redirección A
    [Documentation]    Verifica que se redirigió a la URL esperada
    [Arguments]    ${url_esperada}
    Wait Until Page Contains Element    ${url_esperada}    ${TIMEOUT}

# ══════════════════════════════════════════════
# ESPERA Y SYNCHRONIZATION
# ══════════════════════════════════════════════

Esperar Cambios De Sala
    [Documentation]    Espera a que la sala cambie de estado (polling)
    [Arguments]    ${segundos}=10
    Sleep    ${segundos}s

Esperar Contenido En Swipe
    [Documentation]    Espera a que aparezca contenido en la pantalla de swipe
    [Arguments]    ${timeout}=15s
    Wait Until Element Is Visible    ${CARD_CONTENIDO}    ${timeout}

Esperar Mensaje En Chat
    [Documentation]    Espera a que aparezca un mensaje en el chat
    [Arguments]    ${timeout}=10s
    Sleep    ${timeout}

# ══════════════════════════════════════════════
# SETUP AUTOMATIZADO VIA GRAPHQL TEST API
# ══════════════════════════════════════════════

GraphQL Request
    [Documentation]    Hace una petición GraphQL al backend usando requests
    [Arguments]    ${query}    ${token}=${NONE}
    ${response}=    Evaluate
    ...    requests.post('${GRAPHQL_URL}', json={'query': '''${query}'''}, headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ${token}'} if '${token}' != '${NONE}' else {'Content-Type': 'application/json'})
    ...    modules=requests
    ${json}=    Evaluate    $response.json()
    RETURN    ${json}

Obtener Token Usuario
    [Documentation]    Obtiene el token JWT de un usuario
    [Arguments]    ${correo}    ${password}
    ${query}=    Set Variable    mutation { login(input: {correo: "${correo}", password: "${password}"}) { token } }
    ${result}=    GraphQL Request    ${query}
    ${token}=    Get From Dictionary    ${result['data']['login']}    token
    RETURN    ${token}

Obtener Token Admin
    [Documentation]    Obtiene el token JWT de un administrador
    [Arguments]    ${correo}    ${password}
    ${query}=    Set Variable    mutation { loginAdmin(input: {correo: "${correo}", password: "${password}"}) { token } }
    ${result}=    GraphQL Request    ${query}
    ${token}=    Get From Dictionary    ${result['data']['loginAdmin']}    token
    RETURN    ${token}

Preparar Sala Activa
    [Documentation]    Crea una sala activa con dos usuarios via test API
    [Arguments]    ${usuario1Id}=${USER1_ID}    ${usuario2Id}=${USER2_ID}
    ${token}=    Obtener Token Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    ${query}=    Set Variable    mutation { crearSalaTest(usuario1Id: ${usuario1Id}, usuario2Id: ${usuario2Id}, estado: "ACTIVA") { codigo salaId } }
    ${result}=    GraphQL Request    ${query}    ${token}
    ${codigo}=    Get From Dictionary    ${result['data']['crearSalaTest']}    codigo
    ${salaId}=    Get From Dictionary    ${result['data']['crearSalaTest']}    salaId
    RETURN    ${codigo}    ${salaId}

Simular Evaluación Compañero
    [Documentation]    Simula que el compañero evaluó un contenido
    [Arguments]    ${salaId}    ${usuarioId}    ${contenidoId}    ${decision}
    ${token}=    Obtener Token Usuario    ${USER2_CORREO}    ${USER2_PASSWORD}
    ${decision_str}=    Convert To String    ${decision}
    ${query}=    Set Variable    mutation { simularEvaluacion(salaId: ${salaId}, usuarioId: ${usuarioId}, contenidoId: "${contenidoId}", evaluacion: ${decision_str}) }
    ${result}=    GraphQL Request    ${query}    ${token}
    RETURN    ${result}

Simular Mensaje Compañero
    [Documentation]    Simula que el compañero envió un mensaje
    [Arguments]    ${salaId}    ${usuarioId}    ${texto}
    ${token}=    Obtener Token Usuario    ${USER2_CORREO}    ${USER2_PASSWORD}
    ${query}=    Set Variable    mutation { simularMensaje(salaId: ${salaId}, usuarioId: ${usuarioId}, texto: "${texto}") }
    ${result}=    GraphQL Request    ${query}    ${token}
    RETURN    ${result}

Simular Unión a Sala
    [Documentation]    Simula que un usuario se une a una sala
    [Arguments]    ${codigo}    ${usuarioId}
    ${token}=    Obtener Token Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    ${query}=    Set Variable    mutation { simularUnion(salaCodigo: "${codigo}", usuarioId: ${usuarioId}) }
    ${result}=    GraphQL Request    ${query}    ${token}
    RETURN    ${result}

Finalizar Sala Test
    [Documentation]    Finaliza una sala de prueba
    [Arguments]    ${codigo}
    ${token}=    Obtener Token Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    ${query}=    Set Variable    mutation { finalizarSalaTest(codigo: "${codigo}") }
    ${result}=    GraphQL Request    ${query}    ${token}
    RETURN    ${result}

Aplicar Filtros Test
    [Documentation]    Aplica filtros a una sala via test API
    [Arguments]    ${salaId}    ${tipo}=${NONE}    ${genero}=${NONE}    ${plataforma}=${NONE}    ${anio}=${NONE}
    ${token}=    Obtener Token Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    ${input_dict}=    Create Dictionary    salaId=${salaId}
    IF    '${tipo}' != '${NONE}'
        Set To Dictionary    ${input_dict}    tipo=${tipo}
    END
    IF    '${genero}' != '${NONE}'
        Set To Dictionary    ${input_dict}    genero=${genero}
    END
    IF    '${plataforma}' != '${NONE}'
        Set To Dictionary    ${input_dict}    plataforma=${plataforma}
    END
    IF    '${anio}' != '${NONE}'
        Set To Dictionary    ${input_dict}    anio=${anio}
    END
    ${query}=    Set Variable    mutation { aplicarFiltros(input: ${input_dict}) { contenidoId titulo anio tipo genero imagen plataformas } }
    ${result}=    GraphQL Request    ${query}    ${token}
    RETURN    ${result}

Obtener Contenido Sala
    [Documentation]    Obtiene el contenido filtrado de una sala
    [Arguments]    ${salaId}
    ${query}=    Set Variable    query { contenidoPorSala(salaId: ${salaId}) { contenidoId titulo anio tipo genero imagen plataformas } }
    ${result}=    GraphQL Request    ${query}
    RETURN    ${result}

Crear Match via Test
    [Documentation]    Crea un match haciendo que ambos usuarios evalúen el mismo contenido con like
    [Arguments]    ${salaId}    ${contenidoId}
    ${token1}=    Obtener Token Usuario    ${USER1_CORREO}    ${USER1_PASSWORD}
    ${token2}=    Obtener Token Usuario    ${USER2_CORREO}    ${USER2_PASSWORD}
    # Usuario 1 da like
    ${query1}=    Set Variable    mutation { simularEvaluacion(salaId: ${salaId}, usuarioId: ${USER1_ID}, contenidoId: "${contenidoId}", evaluacion: true) }
    ${result1}=    GraphQL Request    ${query1}    ${token1}
    # Usuario 2 da like
    ${query2}=    Set Variable    mutation { simularEvaluacion(salaId: ${salaId}, usuarioId: ${USER2_ID}, contenidoId: "${contenidoId}", evaluacion: true) }
    ${result2}=    GraphQL Request    ${query2}    ${token2}
    RETURN    ${result1}    ${result2}

Obtener Primer Contenido
    [Documentation]    Obtiene el primer contenido disponible de la base de datos
    ${query}=    Set Variable    query { contenidosFiltrados(input: {limit: 1}) { contenidos { contenidoId titulo anio tipo genero imagen plataformas } totalResultados } }
    ${result}=    GraphQL Request    ${query}
    ${contenido}=    Get From Dictionary    ${result['data']['contenidosFiltrados']['contenidos'][0]}    contenidoId
    RETURN    ${contenido}

Preparar Swipe Completo
    [Documentation]    Prepara todo para tests de swipe: login, sala activa, filtros, localStorage
    [Arguments]    ${correo}=${USER1_CORREO}    ${password}=${USER1_PASSWORD}
    # 1. Login via API para obtener token y usuario
    ${token}=    Obtener Token Usuario    ${correo}    ${password}
    ${query_user}=    Set Variable    query { miPerfil { id nombre correo descripcion rol } }
    ${result_user}=    GraphQL Request    ${query_user}    ${token}
    ${usuario}=    Evaluate    $result_user['data']['miPerfil']
    # 2. Crear sala activa con user1 y user2
    ${codigo}    ${salaId}=    Preparar Sala Activa    ${usuario['id']}    ${USER2_ID}
    # 3. Aplicar filtros para tener contenido
    ${query_filtro}=    Set Variable    mutation { aplicarFiltros(input: {salaId: ${salaId}}) { contenidoId titulo anio tipo genero imagen plataformas } }
    ${result_filtro}=    GraphQL Request    ${query_filtro}    ${token}
    # 4. Construir objeto Sala para localStorage (usar json.dumps para serialización correcta)
    ${sala_json_str}=    Evaluate
    ...    json.dumps({'id': ${salaId}, 'codigo': '${codigo}', 'estado': 'ACTIVA', 'fechaCreacion': '2024-01-01T00:00:00Z', 'usuario1': $usuario, 'usuario2': {'id': ${USER2_ID}, 'nombre': 'Usuario Test 2', 'correo': '${USER2_CORREO}', 'descripcion': None, 'rol': 'USUARIO'}})
    ...    modules=json
    # 5. Guardar en localStorage
    Execute JavaScript    localStorage.setItem('cm_sala', '${sala_json_str}')
    Execute JavaScript    localStorage.setItem('cm_token', '${token}')
    ${user_json_str}=    Evaluate    json.dumps($usuario)    modules=json
    Execute JavaScript    localStorage.setItem('cm_user', '${user_json_str}')
    Execute JavaScript    localStorage.setItem('cm_indice', '0')
    Log    Swipe preparado: salaId=${salaId} codigo=${codigo}
    RETURN    ${salaId}    ${codigo}
