*** Settings ***
Documentation     Variables globales para las pruebas de CineMatch
Library           SeleniumLibrary
Library           Collections
Library           String

*** Variables ***
# URLs
${BASE_URL}            http://localhost:4200
${LOGIN_URL}           ${BASE_URL}/login
${REGISTRO_URL}        ${BASE_URL}/registro
${HOME_URL}            ${BASE_URL}/home
${PERFIL_URL}          ${BASE_URL}/perfil
${CREAR_SALA_URL}      ${BASE_URL}/sala/crear
${UNIRSE_URL}          ${BASE_URL}/sala/unirse
${FILTROS_URL}         ${BASE_URL}/filtros
${SWIPE_URL}           ${BASE_URL}/swipe
${MATCHES_URL}         ${BASE_URL}/matches
${CHAT_URL}            ${BASE_URL}/chat
${RESULTADOS_URL}      ${BASE_URL}/resultados
${CALIFICACION_URL}    ${BASE_URL}/calificacion
${ADMIN_LOGIN_URL}     ${BASE_URL}/admin/login
${ADMIN_DASHBOARD_URL}    ${BASE_URL}/admin/dashboard
${ADMIN_METRICAS_URL}  ${BASE_URL}/admin/metricas
${ADMIN_PLAT_URL}      ${BASE_URL}/admin/plataformas
${ADMIN_RETRO_URL}     ${BASE_URL}/admin/retroalimentacion

# Backend GraphQL
${BACKEND_URL}         http://localhost:8080
${GRAPHQL_URL}         ${BACKEND_URL}/graphql

# IDs de usuarios de prueba
${USER1_ID}            5
${USER2_ID}            6

# Browser
${BROWSER}             firefox
${HEADLESS}            ${FALSE}
${TIMEOUT}             10s

# Test Users
${USER1_CORREO}        test1@cinematch.com
${USER1_PASSWORD}      Test1234
${USER1_NOMBRE}        Usuario Test 1

${USER2_CORREO}        test2@cinematch.com
${USER2_PASSWORD}      Test1234
${USER2_NOMBRE}        Usuario Test 2

${ADMIN_CORREO}        admin@cinematch.com
${ADMIN_PASSWORD}      Admin1234

# Selectors - Auth
${INPUT_CORREO}        id=correo
${INPUT_PASSWORD}      id=pass
${INPUT_NOMBRE}        id=nombre
${INPUT_CONFIRM_PASS}  id=pass2
${BTN_LOGIN}           xpath=//button[contains(text(), 'Iniciar sesión')]
${BTN_REGISTRO}        xpath=//button[contains(text(), 'Registrarse')]
${BTN_LOGOUT}          xpath=//button[contains(text(), 'Cerrar sesión')]
${BTN_TOGGLE_PASS}     xpath=//button[contains(@class, 'eye-btn')]
${ERROR_MESSAGE}       css=.form-error

# Selectors - Home
${BTN_CREAR_SALA}      xpath=//a[contains(text(), 'Crear sala')]
${BTN_UNIRSE_SALA}     xpath=//a[contains(text(), 'Unirse a sala')]
${LINK_PERFIL}         xpath=//a[contains(text(), 'Perfil')]
${LINK_DASHBOARD}      xpath=//a[contains(text(), 'Dashboard')]
${BTN_CERRAR_SESION}   xpath=//button[contains(text(), 'Cerrar sesión')]

# Selectors - Sala
${INPUT_CODIGO}        id=codigo
${BTN_UNIRSE}          xpath=//button[contains(text(), 'Unirse')]
${BTN_CANCELAR_SALA}   xpath=//button[contains(text(), 'Cancelar sala')]
${BTN_COPIAR_CODIGO}   xpath=//button[contains(text(), 'Copiar código')]
${BTN_CANCELAR_ESPERA}    xpath=//button[contains(text(), 'Cancelar y salir')]

# Selectors - Filtros
${SELECT_PLATAFORMA}   id=plataforma
${SELECT_TIPO}         id=tipo
${SELECT_GENERO}       id=genero
${SELECT_ANIO}         id=anio
${BTN_APLICAR_FILTROS}    xpath=//button[contains(text(), 'Aplicar filtros')]
${BTN_OMITIR_FILTROS}  xpath=//button[contains(text(), 'Omitir filtros')]

# Selectors - Swipe
${BTN_LIKE}            xpath=//button[contains(@class, 'btn-like') or contains(@aria-label, 'like')]
${BTN_DISLIKE}         xpath=//button[contains(@class, 'btn-dislike') or contains(@aria-label, 'dislike')]
${BTN_FINALIZAR}       xpath=//button[contains(text(), 'Finalizar')]
${LINK_MATCHES}        xpath=//a[contains(text(), 'Matches')]
${LINK_CHAT}           xpath=//a[contains(text(), 'Chat')]
${CARD_CONTENIDO}      xpath=//div[contains(@class, 'swipe-card') or contains(@class, 'card')]

# Selectors - Chat
${INPUT_MENSAJE}       xpath=//input[contains(@placeholder, 'mensaje') or @id='texto']
${BTN_ENVIAR_MENSAJE}  xpath=//button[contains(text(), 'Enviar')]

# Selectors - Calificación
${BTN_ENVIAR_CAL}      xpath=//button[contains(text(), 'Enviar calificación')]
${BTN_OMITIR_CAL}      xpath=//button[contains(text(), 'Omitir')]

# Selectors - Perfil
${INPUT_DESCRIPCION}   id=desc
${BTN_GUARDAR_PERFIL}  xpath=//button[contains(text(), 'Guardar cambios')]
${BTN_CANCELAR_PERFIL}    xpath=//button[contains(text(), 'Cancelar')]

# Selectors - Admin
${BTN_INGRESAR_ADMIN}  xpath=//button[contains(text(), 'Ingresar')]
${INPUT_FECHA_DESDE}   id=desde
${INPUT_FECHA_HASTA}   id=hasta
${BTN_LIMPIAR}         xpath=//button[contains(text(), 'Limpiar')]
${BTN_SALIR}           xpath=//button[contains(text(), 'Salir')]

# Selectors - Resultados
${BTN_CALIFICAR_EXP}   xpath=//button[contains(text(), 'Calificar experiencia')]
${BTN_SALIR_SIN_CAL}   xpath=//button[contains(text(), 'Salir sin calificar')]

# Messages
${MSG_CAMPOS_VACIOS}        xpath=//*[contains(text(), 'Completa todos los campos')]
${MSG_CONTRASENA_CORTA}     xpath=//*[contains(text(), 'La contraseña debe tener al menos 8 caracteres')]
${MSG_CONTRASENAS_NO_COINC}    xpath=//*[contains(text(), 'Las contraseñas no coinciden')]
${MSG_CORREO_DUPLICADO}     xpath=//*[contains(text(), 'El correo ya está en uso')]
${MSG_CRED_INCORRECTAS}     xpath=//*[contains(text(), 'Credenciales incorrectas')]
${MSG_USUARIO_NO_ENCONTRADO}    xpath=//*[contains(text(), 'Usuario no encontrado')]
${MSG_CODIGO_INVALIDO}      xpath=//*[contains(text(), 'Código de sala inválido')]
${MSG_SALA_NO_DISPONIBLE}   xpath=//*[contains(text(), 'La sala ya no está disponible')]
${MSG_PERFIL_ACTUALIZADO}   xpath=//*[contains(text(), 'Perfil actualizado correctamente')]
${MSG_NOMBRE_REQUERIDO}     xpath=//*[contains(text(), 'El nombre es requerido')]
