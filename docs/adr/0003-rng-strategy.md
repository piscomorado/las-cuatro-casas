# ADR 0003: Estrategia de RNG y Validación del Golden Master

## Estado
Aprobado

## Contexto
El motor Python de referencia utiliza `random.Random` (Mersenne Twister). Se evaluó portar MT19937 a TypeScript o utilizar validación mediante métricas y distribución estadística agregada alineada con el manual v0.4 (48/50 partidas decididas, distribución equilibrada entre casas).

## Decisión
Usar un generador pseudoaleatorio con semilla determinista (SplitMix32/PCG) para reproducibilidad de tests y simulaciones en TypeScript, y validar el Golden Master comparando las métricas agregadas documentadas en el manual v0.4 página 5.

## Consecuencias
- Código de simulación ligero, rápido y desacoplado de especificidades internas de CPython.
- Convalidación estadística rigurosa de las reglas del juego.
