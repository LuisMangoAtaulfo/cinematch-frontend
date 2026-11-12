# 🎬 CineMatch — Frontend

Aplicación web de CineMatch: plataforma para que dos personas encuentren, en tiempo real y por consenso, qué película o serie ver.

**Stack:** Angular 20 · Apollo Client 4 (GraphQL) · GraphQL WS · Cloudflare Workers (despliegue)

> Este repositorio trabaja junto con [`cinematch-backend`](https://github.com/LuisMangoAtaulfo/cinematch-backend).
> Las pruebas E2E con **Robot Framework** viven en este repositorio, en [`e2e/robot/`](e2e/robot).

---

## 📑 Contenido

1. [Requisitos](#-requisitos)
2. [Clonar el proyecto (WSL recomendado)](#-clonar-el-proyecto-wsl-recomendado)
3. [Configuración](#-configuración)
4. [Ejecutar en desarrollo](#-ejecutar-en-desarrollo)
5. [Pruebas automatizadas (Robot Framework)](#-pruebas-automatizadas-robot-framework)
6. [Build y despliegue](#-build-y-despliegue)
7. [Estructura del proyecto](#-estructura-del-proyecto)
8. [Solución de problemas](#-solución-de-problemas)

---

## ✅ Requisitos

| Herramienta | Versión | Para qué |
|---|---|---|
| Git | cualquiera reciente | Clonar |
| Node.js | **≥ 20.19** (recomendado 22 LTS) | Angular 20 |
| npm | incluido con Node | Dependencias |
| Python | ≥ 3.10 | Robot Framework |
| Firefox + geckodriver | recientes | Robot Framework |
| Backend corriendo | — | Ver README del backend |

---

## 📥 Clonar el proyecto (WSL recomendado)

### 1. Instalar WSL2 con Ubuntu (solo la primera vez)

En **PowerShell como administrador**:

```powershell
wsl --install -d Ubuntu
```

Reinicia, abre "Ubuntu" desde el menú inicio y crea tu usuario Linux.

### 2. Configurar Git dentro de WSL

```bash
sudo apt update && sudo apt install -y git
git config --global user.name  "Tu Nombre"
git config --global user.email "tu@correo.com"
# Evita que los scripts .sh se guarden con finales de línea de Windows (CRLF)
git config --global core.autocrlf input
```

### 3. Clonar ambos repositorios lado a lado

> [!WARNING]
> Clona **dentro del sistema de archivos de Linux** (`~/…`), **no** en `/mnt/c/…`.
> En `/mnt/c` la instalación de dependencias es muy lenta, `ng serve` no detecta los cambios y los scripts pierden el permiso de ejecución.

```bash
mkdir -p ~/cinematch && cd ~/cinematch
git clone https://github.com/LuisMangoAtaulfo/cinematch-backend.git  backend
git clone https://github.com/LuisMangoAtaulfo/cinematch-frontend.git frontend
```

Estructura resultante (la usa `e2e/robot/run_tests.sh` para encontrar los seeds del backend):

```
~/cinematch/
├── backend/    ← cinematch-backend
└── frontend/   ← cinematch-frontend (este repo)
```

### 4. Abrir en VS Code (opcional)

Instala la extensión **WSL** en VS Code (Windows) y luego:

```bash
cd ~/cinematch/frontend && code .
```

### 5. Instalar Node.js con nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
node -v   # debe ser ≥ 20.19
```

---

## ⚙️ Configuración

La configuración vive en `src/environments/`. Si `environment.ts` no existe, créalo desde la plantilla:

```bash
cp src/environments/environment.example.ts src/environments/environment.ts
```

Valores relevantes para desarrollo local:

```ts
apiUrl: 'http://localhost:8080',   // backend (GraphQL en /graphql)
wsUrl:  'ws://localhost:8080/ws',  // WebSocket
testMode: true,                    // requerido por las pruebas de Robot
```

---

## ▶️ Ejecutar en desarrollo

```bash
cd ~/cinematch/frontend
npm ci          # instala dependencias exactas de package-lock.json
npm start       # ng serve → http://localhost:4200
```

WSL reenvía `localhost` a Windows, así que puedes abrir http://localhost:4200 desde tu navegador de Windows.

---

## 🤖 Pruebas automatizadas (Robot Framework)

La suite E2E (143 casos) controla Firefox para recorrer la aplicación real.
Documentación detallada (arquitectura, catálogo, cómo agregar pruebas): **[misc/docs/PRUEBAS_ROBOT.md](misc/docs/PRUEBAS_ROBOT.md)**.

### 1. Preparar Python y Robot (una vez)

```bash
sudo apt install -y python3 python3-venv python3-pip postgresql-client curl
cd ~/cinematch/frontend/e2e/robot
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
robot --version
```

> Activa el entorno (`source .venv/bin/activate`) cada vez que abras una terminal nueva para correr pruebas.

### 2. Firefox y geckodriver en WSL (una vez)

El Firefox de Ubuntu se instala como **snap**, que suele fallar con geckodriver en WSL. Instala la versión `.deb` de Mozilla:

```bash
sudo snap remove firefox 2>/dev/null || true
sudo add-apt-repository -y ppa:mozillateam/ppa
echo 'Package: *
Pin: release o=LP-PPA-mozillateam
Pin-Priority: 1001' | sudo tee /etc/apt/preferences.d/mozilla-firefox
sudo apt update && sudo apt install -y firefox

# geckodriver
GECKO=v0.35.0
curl -L https://github.com/mozilla/geckodriver/releases/download/$GECKO/geckodriver-$GECKO-linux64.tar.gz | tar xz
sudo mv geckodriver /usr/local/bin/
geckodriver --version
```

- **Windows 11 (WSLg):** verás la ventana de Firefox durante las pruebas.
- **Windows 10 / sin interfaz gráfica:** usa siempre `--headless`.

### 3. Checklist antes de ejecutar

| # | Servicio | Cómo verificar |
|---|---|---|
| 1 | PostgreSQL en **5433** con BD `cinematch` | `pg_isready -h localhost -p 5433` |
| 2 | Usuarios y plataformas de prueba | Seeds en `../backend/misc/scripts/` (ver abajo) |
| 3 | Backend en **8080** con `app.test-mode=true` | http://localhost:8080/graphiql |
| 4 | Frontend en **4200** | http://localhost:4200 |

Cargar los datos de prueba (desde `~/cinematch`):

```bash
export PGPASSWORD=<contraseña_postgres>
psql -h localhost -p 5433 -U postgres -d cinematch -f backend/misc/scripts/seed_usuarios_robot.sql
psql -h localhost -p 5433 -U postgres -d cinematch -f backend/misc/scripts/seed_plataformas_robot.sql
```

> `run_tests.sh` verifica los servicios y ofrece crear los usuarios de prueba si faltan.
> Variables opcionales: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_NAME`, `PGPASSWORD`.

### 4. Ejecutar

```bash
cd ~/cinematch/frontend/e2e/robot
source .venv/bin/activate

./run_tests.sh                       # Todas (143)
./run_tests.sh --headless            # Sin ventana del navegador
./run_tests.sh --suite auth          # Una suite: auth, salas, filtros, swipe, chat,
                                     #   admin, perfil_resultados, seguridad, e2e
./run_tests.sh --tag negativo        # Por tag: positivo, negativo, seguridad, ui, e2e…
./run_tests.sh --dry-run             # Lista lo que se ejecutaría, sin abrir el navegador
./run_tests.sh --tag diagnostico     # Pruebas auxiliares de depuración (excluidas por defecto)
./run_tests.sh --help
```

### 5. Ver resultados

Los reportes quedan en `e2e/robot/results/` (ignorado por git):

```bash
explorer.exe "$(wslpath -w results)"   # abre la carpeta en Windows
```

Abre `report-<fecha>.html` para el resumen y `log-<fecha>.html` para el detalle paso a paso.

### 6. Buenas prácticas

- Corre la suite completa con la **BD recién sembrada**; las pruebas de swipe/filtros dependen de que haya contenido sin evaluar.
- Selectores y textos esperados se cambian **solo** en `variables.robot`.
- Las pruebas nuevas siguen el formato `TC-<MÓDULO>-NNN` y deben agregarse al Plan de Pruebas.
- No subas `results/` ni `.venv/` (ya están en `.gitignore`).

---

## 📦 Build y despliegue

```bash
npm run build      # genera dist/
npm run preview    # build + wrangler dev (prueba local del worker)
npm run deploy     # build + wrangler deploy (Cloudflare)
```

---

## 🗂️ Estructura del proyecto

```
src/app/
├── core/          # graphql (queries/mutations), guards, interceptors, models, services
├── features/      # admin, auth, sala, filtros, swipe, chat, matches, resultados, calificacion, perfil…
├── app.routes.ts
└── app.config.ts
e2e/robot/         # Pruebas E2E con Robot Framework
misc/              # Documentación adicional (requerimientos, correcciones, docs/)
```

---

## 🛠️ Solución de problemas

| Problema | Solución |
|---|---|
| `Http failure response … 0 Unknown Error` | El backend no está corriendo o no es accesible en `localhost:8080` |
| `ng serve` no recarga al guardar | El proyecto está en `/mnt/c`; clónalo en `~/` |
| `./run_tests.sh: Permission denied` | `chmod +x e2e/robot/run_tests.sh` |
| `/bin/bash^M: bad interpreter` | Finales CRLF: `sed -i 's/\r$//' e2e/robot/run_tests.sh` y configura `core.autocrlf input` |
| Robot no encuentra geckodriver / Firefox no abre | Revisa la sección *Firefox y geckodriver en WSL* o usa `--headless` |
| Las pruebas reportan 145 en vez de 143 | Se incluyeron las de `diagnostico/`; usa `run_tests.sh` |
| Más detalles | [misc/docs/PRUEBAS_ROBOT.md](misc/docs/PRUEBAS_ROBOT.md#7-problemas-conocidos-y-solución) |
