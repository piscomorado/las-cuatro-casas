Las Cuatro Casas
Documento de referencia para diseño e implementación virtual
Propósito: explicar a un asistente de IA las dinámicas, componentes, reglas, estadísticas y posibilidades de evolución de Las Cuatro Casas, para apoyar su diseño e implementación digital sin inventar reglas ausentes.

Estado del documento: referencia de trabajo reconstruida a partir de la conversación. No sustituye el manual vigente ni el código completo de simulación. Los detalles no confirmados se marcan como Pendiente de verificación.

1. Resumen del juego
Las Cuatro Casas es un juego de estrategia abstracta para cuatro casas, cada una representada por un color. Las piezas se colocan en un tablero hexagonal y se desplazan conforme a reglas propias. El objetivo central es conquistar al Soberano de las casas rivales rodeándolo en sus seis casillas adyacentes.

La partida combina:

Colocación de piezas: cada nueva pieza debe respetar la regla de contacto por casa.

Movimiento táctico: las piezas tienen patrones de movimiento distintos, desde desplazamiento libre hasta saltos y movimiento condicionado por pilas.

Control del espacio: conectividad del conjunto de piezas, accesibilidad, bloqueos y amenazas alrededor de los Soberanos.

Interacción entre mundos: el juego contempla ruinas y piezas desterradas que pueden volver al tablero, según la versión de las reglas probada.

Victoria por cerco: las seis casillas vecinas del Soberano deben quedar ocupadas. Pueden ocuparlas piezas de cualquier color.

El juego tiene inspiración declarada en The Hive para ciertos principios de movimiento, conectividad y colocación, pero sus reglas específicas deben tratarse como propias de Las Cuatro Casas.

2. Componentes y composición
La composición presente en el código compartido para las simulaciones fue de 14 piezas por casa, 56 en total.

Ficha

Código usado en el motor

Cantidad por casa

Movimiento identificado en la simulación

Soberano

SO

1

Movimiento de una casilla, sujeto a las reglas generales de desplazamiento

Explorador

EX

3

Movimiento libre alrededor de la colonia, sujeto a restricciones de entrada y conectividad

Cazador

CZ

3

Salto en línea recta con un máximo de cuatro pasos

Bestia Saltadora

BS

2

Salta sobre piezas según su regla de salto

Gigante

GI

2

Puede subir a pilas; su interacción puede inmovilizar al Hechicero que queda debajo

Hechicero

HE

1

Puede copiar temporalmente movimientos de otras fichas que toca, excepto al Nigromante; si está encima de una pila, se mueve como el Gigante hasta volver al suelo

Nigromante

NI

1

En el código hay mecánicas relacionadas con destierro y reingreso; su regla definitiva requiere verificación

Importante: estas cantidades y abreviaturas proceden del código compartido. Antes de publicar el juego, contrastarlas con el manual final aprobado.

3. Iconos de las fichas
La conversación registra que existe un conjunto aprobado de siete emblemas en blanco y negro, pensado para alta visibilidad sobre fichas hexagonales. Sin embargo, en el contexto disponible aquí no aparecen las imágenes de esos emblemas ni una descripción visual verificable de cada símbolo.

Por tanto, esta referencia no debe inventar ni redibujar los iconos oficiales. Al construir el juego virtual:

recuperar los archivos originales aprobados de los siete emblemas;

asignar cada emblema a su ficha usando el manual imprimible vigente;

conservar el contraste blanco/negro y la legibilidad en tamaño pequeño;

mostrar el símbolo sin nombres o nomenclaturas sobre las fichas, conforme a la indicación de diseño para el imprimible;

verificar el renderizado en tablero, pila, selección, movimiento legal y vista móvil.

Pendiente de verificación: identificar cuál de los iconos aprobados corresponde a cada ficha. No usar iconos provisionales como si fueran los originales.

4. Reglas del juego
4.1 Preparación y turnos
Juegan cuatro casas, identificadas en la simulación como Roja, Azul, Verde y Ámbar.

Cada casa tiene su propio conjunto de fichas.

La partida avanza por turnos entre las casas que siguen activas.

El código compartido utiliza el orden de casas Roja, Azul, Verde y Ámbar.

Pendiente de verificación: disposición inicial exacta, qué casa inicia, sentido del orden, número de acciones por turno y condiciones exactas para introducir al Soberano.

4.2 Colocación de piezas
La regla discutida para la colocación es que una pieza nueva solo puede tocar piezas de su propia casa en los seis lados adyacentes. No puede tocar directamente piezas de otras casas.

Esta lógica se aplica durante el juego, no solo en la posición inicial. Se propuso permitir colocar una pieza junto a una ruina cuando la pieza nueva solo toque piezas de su propia casa. La regla de excepción asociada al Soberano limita el cerco mediante colocación.

Regla de excepción confirmada en la conversación: se puede colocar una pieza en contacto con piezas enemigas, pero no se puede completar la sexta casilla adyacente a un Soberano vivo mediante esa colocación.

Pendiente de verificación: cómo se define formalmente “tocar la colonia propia” cuando una pieza se coloca junto a una ruina; si una ruina cuenta como casilla ocupada o como pieza a efectos de contacto; y qué sucede si no existe una colocación legal.

4.3 Conectividad y movimiento
El conjunto de piezas debe conservar la conectividad exigida por la regla de colonia. El código de simulación contiene una comprobación de conectividad denominada one_hive, que comprueba si las casillas ocupadas forman un solo grupo conectado.

La restricción de conectividad afecta qué pieza puede moverse: un movimiento no debe separar el conjunto si con ello deja piezas desconectadas, salvo que el reglamento aprobado establezca una excepción.

Pendiente de verificación: si la conectividad se aplica a todas las piezas del tablero como un solo conjunto o a cada colonia por separado, y cómo interactúan las ruinas y las pilas con esa comprobación.

4.4 Desplazamiento de cada ficha
Soberano
Se mueve una casilla por turno en la versión representada por el motor.

Su posición es el objetivo de la condición de victoria.

Un Soberano está conquistado cuando sus seis casillas adyacentes están ocupadas.

Las seis casillas pueden estar ocupadas por piezas de cualquier casa; no es necesario que sean todas del mismo color.

Pendiente de verificación: condiciones de movimiento específicas del Soberano, cuándo es obligatorio introducirlo y si puede mover mientras está amenazado.

Explorador
Se desplaza libremente por los alrededores de la colonia, según la descripción del usuario.

No puede entrar en un espacio si la entrada está bloqueada por la configuración de piezas, de acuerdo con la regla de deslizamiento inspirada en The Hive.

El movimiento debe conservar la conectividad general exigida.

Pendiente de verificación: si el movimiento es a una casilla adyacente o puede recorrer varias casillas; resolver el paso estrecho con precisión en el manual.

Cazador
Se desplaza en línea recta y puede saltar por encima de piezas.

Tiene un límite de cuatro pasos, a diferencia del Saltamontes de The Hive, cuyo desplazamiento no tiene ese límite.

El usuario aprobó que no pueda pasar cuando haya una pila de dos fichas.

Pendiente de verificación: si “cuatro pasos” cuenta casillas recorridas, piezas saltadas o ambos; si el destino puede ser cualquier casilla libre después del salto; y si las pilas de una ficha pueden saltarse siempre.

Bestia Saltadora
Salta por encima de piezas para desplazarse, con una mecánica comparable al saltamontes de The Hive.

La descripción disponible no confirma un límite de distancia.

Pendiente de verificación: dirección obligatoria, número mínimo de piezas saltadas, destino permitido y tratamiento de pilas.

Gigante
Puede subir a una pila de piezas.

La conversación indica que un Gigante puede interceptar al Hechicero cuando este está encima de una ficha y dejarlo sin movimiento.

El Gigante también tiene una función de salto mencionada durante la discusión de mecánicas, pero las condiciones exactas no están completas en el contexto actual.

Pendiente de verificación: movimiento en suelo, altura máxima, orden de las piezas de una pila, cómo se sube o baja, y alcance exacto de la capacidad de salto.

Hechicero
Puede copiar el movimiento de una ficha que toque, viva o muerta, excepto el del Nigromante.

La copia dura únicamente ese turno.

Si está encima de una ficha, se mueve como el Gigante hasta regresar al suelo.

Mientras está sobre fichas, solo puede desplazarse un espacio por turno, según la aclaración del usuario.

Un Gigante puede interceptarlo y dejarlo sin movimiento.

Pendiente de verificación: si el Hechicero puede escoger entre varias fichas tocadas; cómo se determina qué movimiento copia cuando toca una pila; y el efecto exacto de que el Hechicero esté inmovilizado.

Nigromante
La conversación exploró que pueda desplazarse por los mundos de vivos y muertos, con movimiento de una casilla por turno.

También se discutió una capacidad de intercambio de posiciones.

El código de simulación compartido registra contadores de destierros, reingresos y piezas perdidas, por lo que una versión probada del motor contemplaba destierro y retorno.

La regla definitiva no puede establecerse solo con el contexto disponible: hay referencias distintas a destierro, intercambio y otras funciones.

Pendiente de verificación prioritaria: escoger y documentar una sola habilidad definitiva. No combinar destierro e intercambio ni asumir sus costes, objetivos, duración o restricciones sin el manual aprobado.

4.5 Pilas
Las piezas pueden formar pilas; la existencia de pilas y la capacidad de escalarlas está presente en las reglas discutidas.

El Gigante participa en el movimiento sobre pilas.

El Hechicero se comporta como el Gigante mientras se encuentra encima de piezas.

Una pila de dos piezas bloquea el paso del Cazador.

Pendiente de verificación: quién controla una pila, si las piezas conservan habilidades bajo otras piezas, qué movimientos puede realizar una pieza cubierta y si hay un límite de altura. El usuario indicó que no quería un tope de altura, pero el texto completo de la regla de pila debe confirmarse antes de implementarla.

4.6 Ruinas, destierro y reingreso
Las ruinas forman parte del sistema de juego y se relacionan con la colocación y los mundos de vivos y muertos.

En la regla definitiva del destierro indicada por el usuario, cuando una ficha vuelve, se reinicia: entra como una ficha nueva.

El código de prueba contabilizaba destierros, reingresos y perdidos.

Pendiente de verificación: cómo se crea una ruina, qué ocupa la casilla, quién puede usarla, cuánto dura el destierro, qué fichas pueden ser desterradas, cuándo vuelven y si la ficha reingresada conserva o no su identidad funcional. La única precisión firme disponible es que su estado se reinicia al reingresar como ficha nueva.

4.7 Derrota y victoria
Una casa queda derrotada cuando su Soberano tiene ocupadas sus seis casillas adyacentes.

Las piezas que forman el cerco pueden ser de cualquier color.

El objetivo general es ser la última casa superviviente o cumplir la condición de victoria fijada para la partida.

Pendiente de verificación: si la derrota de una casa elimina todas sus piezas, si estas permanecen como obstáculos, cómo se resuelven victorias simultáneas y si existe empate por repetición o límite de acciones.

4.8 Empate y estancamiento
Se discutió el estancamiento como problema estratégico, especialmente después de la derrota de una casa. También se propuso explorar si una habilidad existente podría convertir situaciones bloqueadas, para evitar añadir demasiadas reglas o personajes.

Pendiente de verificación: definición formal de estancamiento, umbral de repetición, mecanismo de empate y efecto de la eliminación de una casa en el flujo de turnos.

5. Dinámica estratégica
5.1 La colonia y el control del espacio
La regla de contacto propio hace que cada casa construya una colonia y limita la entrada directa de piezas enemigas durante la colocación. El tablero se expande de forma interdependiente: las casas compiten por espacio, rutas de acceso y posiciones alrededor de los Soberanos.

5.2 Amenaza al Soberano
El cerco se construye ocupando seis espacios, pero las piezas de cualquier casa pueden contribuir. Esto permite que las amenazas surjan de interacciones entre varias casas, no solo de un ataque directo de un único rival.

5.3 Movilidad y restricciones
Las piezas aportan perfiles distintos:

El Explorador ofrece movilidad alrededor de la colonia.

El Cazador y la Bestia Saltadora pueden superar bloqueos mediante saltos, con reglas distintas.

El Gigante afecta las pilas y puede restringir al Hechicero.

El Hechicero obtiene flexibilidad situacional copiando movimientos.

El Nigromante depende de la habilidad definitiva que se confirme.

Esta variedad puede generar decisiones de expansión, defensa, bloqueo, rescate y ataque, pero requiere verificar el reglamento completo antes de evaluar el equilibrio de cada pieza.

5.4 Interacciones entre casas
Las piezas de diferentes casas pueden contribuir al cerco de un Soberano. La regla de colocación con excepción debe impedir que una sola colocación complete de inmediato el sexto espacio alrededor de un Soberano vivo, según la formulación acordada. La combinación de esa excepción con el contacto de casa es central para evitar capturas triviales y debe probarse con casos de borde.

6. Estadísticas y resultados conocidos
6.1 Evidencia disponible
En la conversación se registró una evaluación de simulación de 2,000 partidas, con una decidibilidad aproximada del 91.5%. También se hicieron pruebas de partidas y se discutió aumentar el muestreo a 50 y después ejecutar una prueba más larga. El código compartido establece parámetros como CAP=400, SAMPLE=50 y contadores para eventos específicos.

No se dispone en este contexto de la tabla original completa de resultados ni de los datos por ficha. Por eso, no se deben presentar como hechos los porcentajes individuales de uso, victoria, derrota o empate de cada ficha.

6.2 Interpretación prudente
La cifra aproximada de 91.5% se describió como decidibilidad observada en las simulaciones, no como probabilidad garantizada de que una partida humana termine.

Las simulaciones permiten detectar bloqueos, asimetrías gruesas y tendencias del agente que las juega.

No miden directamente diversión, claridad de reglas, facilidad de aprendizaje ni calidad de la experiencia humana.

Los resultados dependen del código, la estrategia automática, los parámetros y la versión exacta de las reglas.

Una evaluación estadística solo es comparable si se conservan las mismas reglas y configuración entre muestras.

6.3 Pruebas pendientes o no verificables
La prueba de ablación, es decir, retirar la ficha menos usada en las partidas recientes y repetir las simulaciones, se solicitó, pero no hay un resultado verificable disponible aquí.

Falta una tabla confirmada de frecuencia de uso por ficha.

Falta separar resultados por casa inicial, orden de turnos, versión de reglas y duración.

Falta comprobar con jugadores humanos la comprensión y el balance percibido.

Regla para la IA: no afirmar que ya se ejecutó la ablación ni inventar cuál fue la pieza menos usada. Si se requiere ese dato, recuperar los registros o volver a ejecutar la prueba con el código íntegro y las reglas aprobadas.

7. Mejoras posibles para el futuro
7.1 Cerrar y versionar las reglas
Crear una versión de reglas con número y fecha.

Resolver primero las reglas pendientes de Nigromante, ruinas, pilas y movimientos de salto.

Añadir ejemplos ilustrados de movimiento legal e ilegal.

Crear una tabla de decisiones para casos límite.

Mantener por separado reglas aprobadas, propuestas y reglas experimentales.

7.2 Mejorar las pruebas automatizadas
Ejecutar pruebas unitarias para cada movimiento y condición de victoria.

Probar colocaciones junto a ruinas y alrededor de Soberanos.

Comprobar conectividad al mover piezas, escalar y desterrar.

Registrar por partida: duración, casa ganadora, empates, capturas, piezas colocadas, uso de habilidades y causas de fin.

Ejecutar partidas con distintas estrategias automáticas y no solo un agente.

Realizar análisis de sensibilidad cambiando una regla por vez.

Hacer la prueba de ablación solo después de disponer de frecuencias de uso fiables.

7.3 Playtesting con personas
Medir si los jugadores entienden la colocación y las excepciones sin intervención.

Registrar dudas, errores frecuentes, duración y percepción de agencia.

Comparar partidas con y sin explicación guiada.

Usar las simulaciones para hallar casos extremos y las pruebas humanas para valorar claridad y diversión.

7.4 Escalabilidad del juego virtual
Una implementación digital puede crecer por módulos:

Motor de reglas: estado del tablero, turnos, legalidad de movimientos y victoria.

Interfaz del tablero: hexágonos, selección, resaltado de movimientos y pilas.

Asistencia al jugador: explicación de por qué un movimiento es legal o ilegal.

Registro de partida: historial, repetición y análisis posterior.

Modos de juego: local, en línea, tutorial y partida contra agentes.

Analítica: estadísticas agregadas, con opción de exportar partidas para auditoría.

Contenido y accesibilidad: iconos oficiales, contraste, zoom, controles táctiles y ayuda contextual.

Variantes experimentales: reglas opcionales claramente etiquetadas y separadas del modo estándar.

7.5 Arquitectura recomendada
Mantener una representación única del estado de partida y un motor de reglas independiente de la interfaz.

Implementar movimientos como validadores explícitos por ficha, con pruebas automatizadas.

Registrar la versión de reglas y del motor en cada partida guardada.

Separar datos de iconos y presentación visual de la lógica del juego.

Evitar que la interfaz decida por sí misma si un movimiento es legal.

Permitir reproducir partidas desde un registro determinista de acciones y semillas aleatorias, si el modo de simulación las utiliza.

Diseñar la lógica para añadir variantes sin alterar silenciosamente las reglas estándar.

8. Instrucciones para un asistente de IA que trabaje en el juego
Tratar como definitivas únicamente las reglas marcadas como confirmadas.

Mantener marcadas como pendientes las mecánicas ambiguas; preguntar antes de convertirlas en código final.

No inventar los siete iconos oficiales; solicitarlos o recuperarlos del material aprobado.

No presentar los resultados estadísticos sin la salida o registro que los respalde.

No asumir que las partidas simuladas representan por completo el juego humano.

Separar las reglas del juego de las propuestas de mejora.

Al programar, usar la versión de reglas acordada y añadir pruebas para cada excepción.

Si una regla cambia, actualizar el manual, el motor y las pruebas como una sola revisión versionada.

Preservar la terminología preferida: el juego se llama por ahora Las Cuatro Casas.

No llamar al juego El Patrón Oculto ni sustituir el nombre sin una indicación explícita del usuario.

9. Lista de verificación antes de una implementación definitiva
[ ] Manual vigente incorporado íntegramente.

[ ] Iconos oficiales de las siete fichas identificados y vinculados.

[ ] Movimientos del Soberano y del Explorador formalizados.

[ ] Movimiento de la Bestia Saltadora definido con ejemplos.

[ ] Alcance del Cazador y conteo de sus cuatro pasos aclarados.

[ ] Movimiento del Gigante y regla de pilas formalizados.

[ ] Copia de movimiento e inmovilización del Hechicero verificadas.

[ ] Habilidad definitiva del Nigromante aprobada.

[ ] Ruinas, destierro y reingreso especificados.

[ ] Orden de turnos, preparación y colocación inicial confirmados.

[ ] Derrota, piezas de casas derrotadas, empate y estancamiento definidos.

[ ] Estadísticas enlazadas a los registros reales de las simulaciones.

[ ] Prueba de ablación ejecutada y documentada, si sigue siendo deseada.

10. Nota de procedencia y límites
Este documento organiza los acuerdos y discusiones que constan en la conversación disponible. No sustituye el manual PDF ni el código íntegro del motor, y no afirma haber verificado archivos que no están presentes aquí. Para convertirlo en una especificación cerrada de desarrollo, deben cotejarse las reglas pendientes y los iconos con el manual y los recursos originales aprobados.