#!/bin/bash
# Script para ejecutar las pruebas de Robot Framework para CineMatch
# Uso: ./run_tests.sh [suite] [tag]

set -e

ROBOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="${ROBOT_DIR}/results"
# Repos clonados lado a lado: <carpeta>/frontend/e2e/robot y <carpeta>/backend
BACKEND_DIR="$(cd "${ROBOT_DIR}/../../.." && pwd)/backend"
SEED_DIR="${BACKEND_DIR}/misc/scripts"
# Conexión a PostgreSQL (se puede sobrescribir con variables de entorno)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5433}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-cinematch}"
export PGPASSWORD="${PGPASSWORD:-1234}"
mkdir -p "${RESULTS_DIR}"

echo "╔══════════════════════════════════════════╗"
echo "║    CineMatch - Robot Framework Tests     ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Parsear argumentos
SUITE=""
TAG=""
DRY_RUN=false
HEADLESS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --suite|-s)
            SUITE="$2"
            shift 2
            ;;
        --tag|-t)
            TAG="$2"
            shift 2
            ;;
        --dry-run|-d)
            DRY_RUN=true
            shift
            ;;
        --headless)
            HEADLESS=true
            shift
            ;;
        --help|-h)
            echo "Uso: ./run_tests.sh [opciones]"
            echo ""
            echo "Opciones:"
            echo "  --suite, -s <nombre>   Ejecutar solo una suite específica"
            echo "                         Opciones: auth, salas, filtros, swipe, chat, admin, perfil_resultados, seguridad, e2e"
            echo "  --tag, -t <tag>        Ejecutar solo tests con el tag especificado"
            echo "                         Tags: positivo, negativo, validacion, ui, seguridad, e2e, manual, diagnostico"
            echo "  --dry-run, -d          Mostrar qué tests se ejecutarían sin ejecutarlos"
            echo "  --headless             Ejecutar navegador en modo headless (sin ventana)"
            echo "  --help, -h             Mostrar esta ayuda"
            echo ""
            echo "Ejemplos:"
            echo "  ./run_tests.sh                              # Ejecutar todos los tests"
            echo "  ./run_tests.sh --suite auth                 # Solo tests de autenticación"
            echo "  ./run_tests.sh --tag positivo               # Solo tests con tag 'positivo'"
            echo "  ./run_tests.sh --suite e2e --tag crítico    # Tests E2E críticos"
            echo "  ./run_tests.sh --headless                   # Ejecutar en modo headless"
            echo "  ./run_tests.sh --dry-run                    # Ver qué se ejecutaría"
            exit 0
            ;;
        *)
            echo "Opción desconocida: $1"
            exit 1
            ;;
    esac
done

# ══════════════════════════════════════════════
# VERIFICACIONES PREVIAS
# ══════════════════════════════════════════════

echo "Verificando servicios..."

# Verificar backend (puerto 8080)
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/v3/api-docs 2>/dev/null | grep -q "200"; then
    echo "  ✓ Backend (puerto 8080): OK"
else
    echo "  ✗ Backend (puerto 8080): NO DISPONIBLE"
    echo "    Inicia el backend con: cd ${BACKEND_DIR} && ./mvnw spring-boot:run"
    if [ "${DRY_RUN}" != true ]; then
        echo ""
        echo "¿Continuar sin backend? Los tests de login fallarán. (Ctrl+C para cancelar)"
        sleep 3
    fi
fi

# Verificar frontend (puerto 4200)
if curl -s -o /dev/null -w "%{http_code}" http://localhost:4200 2>/dev/null | grep -q "200"; then
    echo "  ✓ Frontend (puerto 4200): OK"
else
    echo "  ✗ Frontend (puerto 4200): NO DISPONIBLE"
    echo "    Inicia el frontend con: cd $(cd "${ROBOT_DIR}/../.." && pwd) && npm start"
    if [ "${DRY_RUN}" != true ]; then
        echo ""
        echo "Error: El frontend es requerido para ejecutar los tests."
        exit 1
    fi
fi

# Verificar base de datos (puerto 5433)
if pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -q 2>/dev/null; then
    echo "  ✓ PostgreSQL (puerto 5433): OK"
    
    # Verificar usuarios de prueba
    USERS_COUNT=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c \
        "SELECT COUNT(*) FROM usuarios WHERE correo IN ('test1@cinematch.com', 'test2@cinematch.com');" 2>/dev/null | tr -d ' ')
    ADMIN_COUNT=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c \
        "SELECT COUNT(*) FROM administradores WHERE correo = 'admin@cinematch.com';" 2>/dev/null | tr -d ' ')
    
    if [ "$USERS_COUNT" = "2" ] && [ "$ADMIN_COUNT" = "1" ]; then
        echo "  ✓ Usuarios de prueba en BD: OK (test1, test2, admin)"
    else
        echo "  ✗ Usuarios de prueba en BD: FALTAN"
        echo "    Ejecuta: psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f ${SEED_DIR}/seed_usuarios_robot.sql"
        if [ "${DRY_RUN}" != true ]; then
            echo ""
            read -p "¿Crear usuarios automáticamente? [S/n] " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Nn]$ ]]; then
                echo "Continuando sin usuarios de prueba..."
            else
                psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f "${SEED_DIR}/seed_usuarios_robot.sql" >/dev/null 2>&1
                echo "  ✓ Usuarios de prueba creados"
            fi
        fi
    fi
else
    echo "  ✗ PostgreSQL (puerto 5433): NO DISPONIBLE"
    echo "    Inicia PostgreSQL"
fi

echo ""

# ══════════════════════════════════════════════
# CONSTRUIR COMANDO
# ══════════════════════════════════════════════

CMD="robot"
CMD+=" --outputdir ${RESULTS_DIR}"
CMD+=" --timestampoutputs"

# Las pruebas de diagnóstico (diagnostico/) no forman parte del Plan de Pruebas:
# se excluyen salvo que se pidan explícitamente con --tag diagnostico
if [ "${TAG}" != "diagnostico" ]; then
    CMD+=" --exclude diagnostico"
fi

# Variable de headless
if [ "${HEADLESS}" = true ]; then
    CMD+=" --variable HEADLESS:true"
fi

if [ -n "${SUITE}" ]; then
    SUITE_FILE="${ROBOT_DIR}/test_${SUITE}.robot"
    if [ ! -f "${SUITE_FILE}" ]; then
        echo "Error: No se encontró la suite '${SUITE_FILE}'"
        echo "Suites disponibles:"
        ls -1 ${ROBOT_DIR}/test_*.robot | sed 's|.*/test_||' | sed 's|.robot||'
        exit 1
    fi
    CMD+=" ${SUITE_FILE}"
else
    CMD+=" ${ROBOT_DIR}"
fi

if [ -n "${TAG}" ]; then
    CMD+=" --include ${TAG}"
fi

if [ "${DRY_RUN}" = true ]; then
    CMD+=" --dryrun"
fi

echo "Ejecutando: ${CMD}"
echo ""

# ══════════════════════════════════════════════
# EJECUTAR
# ══════════════════════════════════════════════

EXIT_CODE=0
${CMD} || EXIT_CODE=$?

# ══════════════════════════════════════════════
# RESULTADOS
# ══════════════════════════════════════════════


echo ""
echo "╔══════════════════════════════════════════╗"
echo "║            Resultados                    ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Reporte: ${RESULTS_DIR}/report*.html"
echo "Log: ${RESULTS_DIR}/log*.html"
echo "Output: ${RESULTS_DIR}/output*.xml"
echo ""

exit ${EXIT_CODE}
