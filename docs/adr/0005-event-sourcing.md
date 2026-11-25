# ADR 0005: Event Sourcing y Replay bit a bit

## Estado
Aprobado

## Contexto
Las partidas deben ser 100% auditables, recuperables y reproducibles paso a paso para la funcionalidad de replay y análisis post-partida.

## Decisión
Cada transición de estado genera una lista inmutable de eventos (`GameEvent[]`). El estado se puede reconstruir en cualquier punto re-aplicando la secuencia de acciones o eventos desde la semilla inicial.

## Consecuencias
- Facilita el sistema de replay con navegación hacia adelante y atrás.
- Exportación e importación de partidas en formato JSON estándar.
