# ADR 0001: Monorepo con Turborepo y pnpm workspaces

## Estado
Aprobado

## Contexto
El proyecto Las Cuatro Casas requiere compartir de forma rigurosa el motor de reglas de juego (`packages/engine`) entre el cliente de navegador web (`apps/web`), el backend authoritative (`apps/api`) y los bots de prueba (`apps/bot`). 

## Decisión
Usar pnpm workspaces con Turborepo para orquestar la compilación, pruebas y análisis estático en TypeScript con cero duplicación de lógica.

## Consecuencias
- Compilación incremental y caching con Turbo.
- Dependencias estrictas entre paquetes sin publicación externa prematura.
