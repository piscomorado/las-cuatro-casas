# ADR 0002: Motor de reglas puro en TypeScript estricto

## Estado
Aprobado

## Contexto
El motor de reglas debe ser server-authoritative, determinista bit a bit e independiente de cualquier framework de renderizado (DOM, Node APIs, Canvas).

## Decisión
Implementar `packages/engine` como una biblioteca pura sin dependencias de I/O, DOM o APIs de servidor. Todo el estado se maneja mediante estructuras de datos inmutables y funciones puras:
`applyAction(state: GameState, action: Action): Result<{ state: GameState, events: GameEvent[] }>`

## Consecuencias
- Facilita testeo unitario exhaustivo.
- Permite ejecutar el motor idénticamente en cliente (predicción de movimientos/validación UI), servidor y simulaciones en CLI.
