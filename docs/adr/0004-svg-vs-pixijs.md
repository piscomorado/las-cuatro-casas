# ADR 0004: Estrategia de renderizado del tablero (SVG vs Canvas/PixiJS)

## Estado
Propuesto para Fase 2

## Contexto
El juego utiliza un tablero hexagonal dinámico que crece orgánicamente en coordenadas axiales. Se evaluaron SVG interactivo vs Canvas 2D/PixiJS.

## Decisión
Iniciar la Fase 2 con SVG reactivo debido al tamaño de colonia (máximo 52 fichas en total), lo que garantiza perfecta accesibilidad, nitidez vectorial infinita, soporte CSS para animaciones y eventos DOM nativos por celda/ficha.

## Consecuencias
- Implementación de UI limpia y declarativa con React.
- Si en pruebas de rendimiento se requiriera, se puede migrar a Canvas/WebGL sin tocar el motor.
