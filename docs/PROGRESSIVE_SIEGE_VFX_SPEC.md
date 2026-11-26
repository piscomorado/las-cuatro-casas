# Savage Gods — Especificación del Sistema de Asedio y Tensión Progresiva (VFX / Audio / UI)

Este documento define la estructura y reglas de diseño para los efectos visuales (VFX), diseño sonoro e insignias cómic dentro de **Savage Gods** (Las Cuatro Casas).

---

## 1. Regla Fundamental de Activación de Efectos de Asedio

> [!IMPORTANT]
> **Condición de Disparo Única:**
> Los efectos de choque y animaciones de asedio **ÚNICAMENTE** se activan cuando una ficha que **ya está en juego** (acción `MovePiece`, nunca colocación desde reserva `PlacePiece`) se mueve a una casilla **adyacente al Soberano de otra Casa viva** (`house !== sovereign.house`).
>
> Los movimientos ordinarios de reposicionamiento, saltos a casillas vacías o capturas que no toquen a un Soberano enemigo **NO** disparan la animación de choque ni el overlay de asedio.

---

## 2. Estructura de Tensión Progresiva de Asedio

A medida que un Soberano es rodeado en el tablero hexagonal, la tensión dramática escala de forma progresiva según el número de casillas vecinas ocupadas (1 a 6):

| Nivel de Asedio | Denominación | Efecto Visual / VFX | Insignia Cómic | Audio Procedural | Feedback Háptico / Pantalla |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1 a 3 fichas** | *Golpe de Asedio Directo* | Animación de impacto de la ficha atacante sobre el hexágono frontera con el Soberano. Estela cinética + ráfaga. | *Sin insignia (pantalla limpia)* | Sonido táctico de la pieza atacante (`playSwordSlash()`, `playBeastClaw()`, etc.) | Ninguno |
| **4 / 6 fichas** | *Asedio Avanzado* | Animación de impacto de la ficha atacante sobre el hexágono. | Insignia dorada ambarina:<br>`⚡ ASEDIO 4/6` | Sonido de la pieza atacante | Ninguno |
| **5 / 6 fichas** | *Peligro Crítico (¡Jaque Inminente!)* | Animación de impacto de la ficha atacante sobre el hexágono. | Insignia de alerta carmesí pulsante:<br>`⚠️ ¡CERCO 5/6!` | Doble latido de tensión / pulso cardíaco (`playCriticalAlert()`) + sonido de ataque | **Micro-screen shake cómic** en el tablero + **Destello de alerta roja en los bordes** (*Danger Vignette*) |
| **6 / 6 fichas** | *Caída del Soberano (Conquista)* | Gran impacto final sobre el Soberano rodeado. | Insignia triunfal esmeralda/oro:<br>`👑 ¡CONQUISTA!` | Campanada fúnebre / gong solemne (`playHouseFell()`) | Petrificación inmediata de la Casa derrotada en Ruinas |

---

## 3. Catálogo de Animaciones por Tipo de Ficha Atacante

Cada ficha que ejecuta un asedio sobre un Soberano enemigo tiene un estilo visual cinético diferenciado:

1. **Cazador (`CZ`)**:
   - Tira horizontal de 12 fotogramas embebida en Base64.
   - Tajo estelar cruzado en tonos bronce envejecido, oro y ámbar quemado.
   - Estela cinética punteada entre casilla origen y destino.
   - Anillo de choque geométrico expansivo (`r = 72px -> 96px`).
   - Escala: 195 px de diámetro (alcanza la mitad de los hexágonos adyacentes).
   - Audio: `playSwordSlash()` (whoosh cortante + tintineo metálico).

2. **Bestia Saltadora (`BS`)** *(Próxima incorporación)*:
   - Zarpazo salvaje de triple garra en bronce y carmesí.
   - Audio: `playBeastClaw()` (rasgado fiero en 3 barridos rápidos).

3. **Gigante (`GI`)** *(Próxima incorporación)*:
   - Pisotón sísmico con grietas geométricas en el suelo.
   - Audio: `playGiantStomp()` (sub-bass retumbante a 25 Hz).

4. **Explorador (`EX`)** *(Próxima incorporación)*:
   - Torbellino y estela eólica veloz.
   - Audio: `playSlide()` (deslizamiento silbante agudo).

5. **Hechicero (`HE`) / Nigromante (`NI`)** *(Próxima incorporación)*:
   - Runa arcana o eclipse espectral.
   - Audio: `playMystic()` (acorde trifónico descendente).

---

## 4. Implementación Técnica en Código

- **Detección y Evento (`checkSovereignClash` en `App.tsx`)**:
  - Filtra `action.type === 'MovePiece'`.
  - Evalúa `getNeighbors(soCoord)` contra `destCoord`.
  - Calcula `siegeCount` en `nextState.board` para asignar la insignia correcta.
- **Renderizado de Insignias y Sprites (`ComicClashOverlay.tsx`)**:
  - Rótulos vectoriales con borde resplandeciente (`#f59e0b` para 4/6, `#ef4444` para 5/6, `#22c55e` para 6/6).
  - Tipografía oficial: *Cinzel Decorative*.
- **Sacudida y Alerta Perimetral (`HexBoard.tsx` / `index.css`)**:
  - Micro-screen shake: `.animate-comic-shake` (duración 300-500 ms con desplazamiento rápido ±4px).
  - Danger vignette: `.comic-danger-vignette` (pulso radial perimetral rojo).
