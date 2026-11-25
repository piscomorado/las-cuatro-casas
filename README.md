# Las Cuatro Casas

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
