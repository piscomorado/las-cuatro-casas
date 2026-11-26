# Savage Gods

Juego de estrategia abstracta digital para 2 a 4 jugadores sobre un tablero hexagonal.

Cada jugador dirige una casa (Roja, Azul, Verde, Ámbar) con 13 fichas hexagonales con habilidades tácticas únicas. El objetivo es conquistar los Soberanos rivales rodeando sus 6 casillas adyacentes (cerco multicolor).

## Arquitectura del Proyecto

Monorepo basado en pnpm workspaces y Turborepo:
- `packages/engine`: Motor de reglas puro, server-authoritative, determinista e inmutable en TypeScript estricto.
- `packages/shared`: Modelos y DTOs comunes entre motor, API y cliente web.
- `apps/web`: Cliente frontend interactivo (React + Vite + SVG/Canvas).
- `apps/api`: Servidor NestJS con WebSockets, persistencia PostgreSQL y cache Redis.
- `apps/bot`: Agentes heurísticos y calibrados contra el motor de simulación.

## Requisitos y Comandos

- Node.js >= 20
- pnpm >= 9

```bash
# Instalar dependencias
pnpm install

# Compilar todos los paquetes
pnpm build

# Ejecutar pruebas unitarias
pnpm test

# Verificación de tipos estricta
pnpm typecheck

# Simulación de partidas
pnpm --filter=@lcch/engine simulate --games 50 --seed 1001
```

## Despliegue en Vercel (Juego Online en Producción)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpiscomorado%2Flas-cuatro-casas)

### Pasos para desplegar en tu cuenta de Vercel:

1. **Opción A (Desde el panel de Vercel en 1 minuto):**
   - Inicia sesión en [vercel.com](https://vercel.com/) con tu cuenta de GitHub.
   - Pulsa en **"Add New Project"** e importa el repositorio `piscomorado/las-cuatro-casas`.
   - Vercel leerá automáticamente el archivo `vercel.json` incluido en el proyecto:
     - **Framework Preset:** Vite
     - **Build Command:** `pnpm --filter=@lcch/engine build && pnpm --filter=@lcch/web build`
     - **Output Directory:** `apps/web/dist`
   - Pulsa en **"Deploy"**. En ~1 minuto tendrás tu URL pública (ej. `https://las-cuatro-casas.vercel.app`).

2. **Opción B (Desde la terminal con Vercel CLI):**
   ```bash
   npx vercel
   ```

### Cómo invitar y jugar online:
1. Abre tu juego desplegado en Vercel.
2. Abre el **Menú ⚙️** y selecciona **"🌐 Partida Online"**.
3. Elige el número de casas (2, 3 o 4) y haz clic en **"Crear Sala y Generar Link"**.
4. Haz clic en **"📋 Copiar Link de Invitación"** o pulsa en **"📲 Compartir por WhatsApp"**.
5. Cuando tu rival abra ese enlace en su navegador o móvil, la conexión P2P se establecerá de inmediato y podrán jugar en tiempo real.
