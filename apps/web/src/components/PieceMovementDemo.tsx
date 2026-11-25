import React, { useState, useEffect } from 'react';
import { PieceType, House } from '@lcch/engine';
import { hexToPixel, getHexCornerPoints } from '../utils/hexMath';
import { SvgPieceIcon, PieceIcon } from './PieceIcon';

const DEMO_HEX_SIZE = 28;

const HOUSE_COLORS: Record<House | 'ruin' | 'target' | 'empty', { fill: string; stroke: string; glow?: string }> = {
  red: { fill: '#b91c1c', stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.6)' },
  blue: { fill: '#1d4ed8', stroke: '#3b82f6', glow: 'rgba(59, 130, 246, 0.6)' },
  green: { fill: '#15803d', stroke: '#22c55e', glow: 'rgba(34, 197, 94, 0.6)' },
  amber: { fill: '#b45309', stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.6)' },
  ruin: { fill: '#3f3f46', stroke: '#71717a' },
  target: { fill: 'rgba(59, 130, 246, 0.25)', stroke: '#60a5fa', glow: 'rgba(96, 165, 250, 0.7)' },
  empty: { fill: 'rgba(15, 23, 42, 0.7)', stroke: '#334155' },
};

export interface DemoHexCell {
  q: number;
  r: number;
  pieceType?: PieceType;
  house?: House;
  isTarget?: boolean;
  label?: string;
  isPinnedUnder?: boolean;
}

export interface DemoScenario {
  title: string;
  pieceType: PieceType;
  pieceName: string;
  subtitle: string;
  description: string;
  ruleCallout: string;
  baseHexes: DemoHexCell[];
  // Animation frames or sequence:
  // Waypoint positions the moving piece visits
  waypoints: {
    q: number;
    r: number;
    stepLabel: string;
    isClimbing?: boolean;
    isJumping?: boolean;
    beamFrom?: { q: number; r: number };
    beamTo?: { q: number; r: number };
    copiedType?: PieceType;
  }[];
  // Extra animated elements (for Nigromante swap/exile or Hechicero magic link)
  secondaryActor?: {
    type: PieceType;
    house: House;
    start: { q: number; r: number };
    waypoints: { q: number; r: number; opacity?: number }[];
  };
  linkBeam?: { from: { q: number; r: number }; to: { q: number; r: number } };
}

export const PIECE_SCENARIOS: Record<PieceType, DemoScenario[]> = {
  SO: [
    {
      title: 'Desplazamiento básico del Soberano',
      pieceType: 'SO',
      pieceName: 'El Soberano',
      subtitle: '1 paso a casilla adyacente vacía',
      description: 'El Soberano se mueve una sola casilla por turno a un espacio vacío contiguo, siempre manteniendo la colonia unida.',
      ruleCallout: '⚠️ Si sus 6 casillas alrededor son ocupadas por cualquier combinación de fichas o ruinas, ¡tu casa cae derrotada!',
      baseHexes: [
        { q: 0, r: 0, pieceType: 'GI', house: 'blue', label: 'Colonia' },
        { q: 1, r: 0, pieceType: 'EX', house: 'green', label: 'Colonia' },
        { q: 0, r: 1, pieceType: 'BS', house: 'amber', label: 'Colonia' },
        { q: -1, r: 0, label: 'Inicio' },
        { q: -1, r: 1, isTarget: true, label: 'Destino A' },
        { q: 0, r: -1, isTarget: true, label: 'Destino B' },
      ],
      waypoints: [
        { q: -1, r: 0, stepLabel: 'Posición inicial' },
        { q: -1, r: 1, stepLabel: 'Se desliza 1 paso bordeando la formación' },
        { q: -1, r: 0, stepLabel: 'Retorna a la posición de origen' },
      ],
    },
  ],
  EX: [
    {
      title: 'Vuelo perimetral del Explorador',
      pieceType: 'EX',
      pieceName: 'El Explorador',
      subtitle: 'Deslizamiento ilimitado por el perímetro exterior',
      description: 'El Explorador se desliza cualquier número de casillas a lo largo del borde externo de la formación (como la hormiga en Hive).',
      ruleCallout: 'Debe respetar la regla del paso físico (no puede atravesar espacios estrechos bloqueados).',
      baseHexes: [
        { q: 0, r: 0, pieceType: 'SO', house: 'blue', label: 'Soberano' },
        { q: 1, r: 0, pieceType: 'GI', house: 'green' },
        { q: 0, r: 1, pieceType: 'BS', house: 'amber' },
        { q: -1, r: 0, label: 'Inicio' },
        { q: -1, r: 1, isTarget: true },
        { q: 0, r: 2, isTarget: true },
        { q: 1, r: 1, isTarget: true },
        { q: 2, r: 0, isTarget: true, label: 'Destino' },
      ],
      waypoints: [
        { q: -1, r: 0, stepLabel: 'Punto de partida' },
        { q: -1, r: 1, stepLabel: 'Paso 1: Bordeando...' },
        { q: 0, r: 2, stepLabel: 'Paso 2: Bordeando...' },
        { q: 1, r: 1, stepLabel: 'Paso 3: Bordeando...' },
        { q: 2, r: 0, stepLabel: 'Llegada: Hasta 4 o más casillas' },
        { q: -1, r: 0, stepLabel: 'Reinicia la patrulla' },
      ],
    },
  ],
  CZ: [
    {
      title: 'Saltos Legales de 2, 3 y 4 Pasos (Solo sobre fichas ocupadas)',
      pieceType: 'CZ',
      pieceName: 'El Cazador / Espadachín',
      subtitle: 'Salto rectilíneo y diagonal: 1 a 3 fichas saltadas + casilla de destino',
      description: 'El Cazador solo puede saltar si hay fichas físicas ocupadas debajo de su salto. Salta en línea recta sobre 1, 2 o hasta 3 fichas contiguas y aterriza en el primer hueco vacío inmediato.',
      ruleCallout: '⚠️ Prohibido saltar sobre vacío: Cada casilla sobrevolada debe estar ocupada por una ficha física. No puede saltar en direcciones con casillas vacías ni saltar pilas de altura 2.',
      baseHexes: [
        { q: 0, r: 0, label: 'Cazador' },

        // Salto 1: Diagonal Noreste (+1, -1) -> 1 ficha saltada + destino (2 pasos)
        { q: 1, r: -1, pieceType: 'EX', house: 'green', label: '1 Ficha NE' },
        { q: 2, r: -2, isTarget: true, label: 'Destino (2 pasos)' },

        // Salto 2: Diagonal Sureste (0, +1) -> 2 fichas saltadas + destino (3 pasos)
        { q: 0, r: 1, pieceType: 'GI', house: 'amber', label: '1.ª Ficha SE' },
        { q: 0, r: 2, pieceType: 'EX', house: 'blue', label: '2.ª Ficha SE' },
        { q: 0, r: 3, isTarget: true, label: 'Destino (3 pasos)' },

        // Salto 3: Horizontal Este (+1, 0) -> 3 fichas saltadas + destino (4 pasos)
        { q: 1, r: 0, pieceType: 'EX', house: 'blue', label: '1.ª Ficha E' },
        { q: 2, r: 0, pieceType: 'GI', house: 'green', label: '2.ª Ficha E' },
        { q: 3, r: 0, pieceType: 'BS', house: 'amber', label: '3.ª Ficha E' },
        { q: 4, r: 0, isTarget: true, label: 'Destino (4 pasos)' },

        // Apoyo de colonia conectada
        { q: 0, r: -1, pieceType: 'SO', house: 'blue', label: 'Colonia' },
        { q: -1, r: 0, pieceType: 'GI', house: 'amber', label: 'Colonia' },
        { q: 1, r: 1, pieceType: 'SO', house: 'green', label: 'Colonia' },
        { q: 1, r: 2, pieceType: 'EX', house: 'amber', label: 'Colonia' },
        { q: 2, r: 1, pieceType: 'GI', house: 'blue', label: 'Colonia' },
      ],
      waypoints: [
        { q: 0, r: 0, stepLabel: 'En posición central: cada salto exige fichas físicas debajo' },
        { q: 2, r: -2, stepLabel: '¡Salto de 2 pasos! Salta sobre 1 ficha en Diagonal Noreste y ocupa el hueco', isJumping: true },
        { q: 0, r: 0, stepLabel: 'Regresa al origen' },
        { q: 0, r: 3, stepLabel: '¡Salto de 3 pasos! Salta sobre 2 fichas consecutivas en Diagonal Sureste', isJumping: true },
        { q: 0, r: 0, stepLabel: 'Regresa al origen' },
        { q: 4, r: 0, stepLabel: '¡Salto de 4 pasos! Salta sobre 3 fichas consecutivas en Horizontal Este y ocupa el 4.º espacio', isJumping: true },
        { q: 0, r: 0, stepLabel: 'Ciclo completado: 100% saltos sobre fichas ocupadas' },
      ],
    },
    {
      title: 'Prohibición: Ilegal saltar sobre casillas vacías',
      pieceType: 'CZ',
      pieceName: 'El Cazador / Espadachín',
      subtitle: 'Requiere impulso físico contiguo',
      description: 'Si la casilla contigua en una dirección está vacía, el Cazador tiene terminantemente prohibido saltar en esa dirección porque no hay ficha sobre la que impulsarse.',
      ruleCallout: 'El Cazador no vuela por el aire libre: solo salta si hay una ficha contigua. Si hay un hueco vacío, el salto no existe.',
      baseHexes: [
        { q: 0, r: 0, label: 'Cazador' },
        // Hacia el Este: Ficha presente -> Salto legal
        { q: 1, r: 0, pieceType: 'EX', house: 'green', label: 'Con ficha (Legal)' },
        { q: 2, r: 0, isTarget: true, label: 'Aterrizaje' },
        // Hacia el Oeste: Casilla vacía -> Ilegal
        { q: -1, r: 0, label: 'Casilla vacía' },
        { q: -2, r: 0, label: '¡ILEGAL saltar al aire!' },
        // Colonia de soporte
        { q: 0, r: 1, pieceType: 'SO', house: 'amber', label: 'Colonia' },
        { q: 1, r: 1, pieceType: 'GI', house: 'blue', label: 'Colonia' },
      ],
      waypoints: [
        { q: 0, r: 0, stepLabel: 'Hacia el Oeste hay casilla vacía: Movimiento completamente ILEGAL' },
        { q: 2, r: 0, stepLabel: 'Hacia el Este hay una ficha física: ¡Salto legal concedido!', isJumping: true },
        { q: 0, r: 0, stepLabel: 'Retorna a su posición inicial' },
      ],
    },
  ],
  BS: [
    {
      title: 'Carga demoledora de la Bestia Saltadora',
      pieceType: 'BS',
      pieceName: 'La Bestia Saltadora',
      subtitle: 'Salta una hilera continua de piezas',
      description: 'Carga en línea recta sobre cualquier número de fichas contiguas y aterriza en el primer espacio vacío al otro lado.',
      ruleCallout: 'Debe saltar al menos 1 ficha. Es letal para entrar o escapar de huecos completamente rodeados.',
      baseHexes: [
        { q: -2, r: 0, label: 'Inicio' },
        { q: -1, r: 0, pieceType: 'EX', house: 'blue', label: 'Hilera' },
        { q: 0, r: 0, pieceType: 'GI', house: 'green', label: 'Hilera' },
        { q: 1, r: 0, pieceType: 'SO', house: 'amber', label: 'Hilera' },
        { q: 2, r: 0, isTarget: true, label: 'Primer hueco' },
        { q: 0, r: 1, pieceType: 'HE', house: 'blue', label: 'Apoyo' },
      ],
      waypoints: [
        { q: -2, r: 0, stepLabel: 'Detecta la hilera de 3 fichas' },
        { q: 2, r: 0, stepLabel: '¡Carga en línea recta y aterriza en el primer hueco!', isJumping: true },
        { q: -2, r: 0, stepLabel: 'Retorna a la posición inicial' },
      ],
    },
  ],
  GI: [
    {
      title: 'Avance y dominación del Gigante',
      pieceType: 'GI',
      pieceName: 'El Gigante',
      subtitle: 'Avanza 1 paso o trepa encima de otra ficha',
      description: 'El Gigante avanza 1 espacio en el suelo o puede trepar a cualquier pila adyacente. La pieza que queda debajo queda inmovilizada.',
      ruleCallout: 'La casilla dominada cuenta con el color del Gigante para cercos y desempates mientras permanezca arriba.',
      baseHexes: [
        { q: -1, r: 0, label: 'Inicio' },
        { q: 0, r: 0, pieceType: 'SO', house: 'blue', label: 'Soberano Rival', isPinnedUnder: true },
        { q: 0, r: -1, isTarget: true, label: 'Descenso' },
        { q: 1, r: 0, pieceType: 'EX', house: 'green', label: 'Apoyo' },
      ],
      waypoints: [
        { q: -1, r: 0, stepLabel: 'En el suelo contiguo a la víctima' },
        { q: 0, r: 0, stepLabel: '¡Trepa a la casilla y aplasta al Soberano rival!', isClimbing: true },
        { q: 0, r: -1, stepLabel: 'Desde la cima, desciende a un espacio libre adyacente' },
        { q: -1, r: 0, stepLabel: 'Retorna a su posición original' },
      ],
    },
  ],
  HE: [
    {
      title: 'Mimetismo Múltiple (Bestia, Explorador y Gigante)',
      pieceType: 'HE',
      pieceName: 'El Hechicero de Cadenas',
      subtitle: 'Copia cualquier ficha adyacente (viva o ruina)',
      description: 'El Hechicero puede elegir qué habilidad copiar de entre todas las fichas que esté tocando físicamente al inicio de su turno.',
      ruleCallout: 'Copia el movimiento de la ficha superior de cualquier pila que toque (excepto al Nigromante). La copia vale solo ese turno.',
      baseHexes: [
        { q: 0, r: 0, label: 'Hechicero' },
        // Vecino 1: Bestia Saltadora (Este)
        { q: 1, r: 0, pieceType: 'BS', house: 'blue', label: 'Bestia (Este)' },
        { q: 2, r: 0, isTarget: true, label: 'Salto Bestia' },

        // Vecino 2: Explorador (Sureste)
        { q: 0, r: 1, pieceType: 'EX', house: 'green', label: 'Explorador (SE)' },
        { q: 1, r: 1, isTarget: true, label: 'Borde EX' },

        // Vecino 3: Gigante (Oeste)
        { q: -1, r: 0, pieceType: 'GI', house: 'amber', label: 'Gigante (Oeste)' },

        // Vecino 4: Soberano (Noroeste) - casilla donde trepar
        { q: 0, r: -1, pieceType: 'SO', house: 'blue', label: 'Soberano (NO)', isPinnedUnder: true },

        // Piezas de apoyo para cerrar la colonia
        { q: -1, r: 1, pieceType: 'SO', house: 'green', label: 'Colonia' },
        { q: 1, r: -1, pieceType: 'EX', house: 'amber', label: 'Colonia' },
      ],
      waypoints: [
        { q: 0, r: 0, stepLabel: 'En el centro: Toca a la Bestia (Este), Explorador (SE) y Gigante (Oeste)' },
        {
          q: 0,
          r: 0,
          stepLabel: '1. Enlace místico con la Bestia: Canaliza su poder de salto',
          beamFrom: { q: 0, r: 0 },
          beamTo: { q: 1, r: 0 },
          copiedType: 'BS',
        },
        {
          q: 2,
          r: 0,
          stepLabel: '¡Ejecuta el salto de Bestia! Salta sobre la ficha contigua hasta el hueco',
          isJumping: true,
          copiedType: 'BS',
        },
        { q: 0, r: 0, stepLabel: 'Retorna a la posición central' },
        {
          q: 0,
          r: 0,
          stepLabel: '2. Enlace místico con el Explorador: Canaliza su patrulla perimetral',
          beamFrom: { q: 0, r: 0 },
          beamTo: { q: 0, r: 1 },
          copiedType: 'EX',
        },
        {
          q: 1,
          r: 1,
          stepLabel: '¡Ejecuta el planeo del Explorador! Bordea el perímetro exterior de la colmena',
          copiedType: 'EX',
        },
        { q: 0, r: 0, stepLabel: 'Retorna a la posición central' },
        {
          q: 0,
          r: 0,
          stepLabel: '3. Enlace místico con el Gigante: Canaliza la fuerza para trepar',
          beamFrom: { q: 0, r: 0 },
          beamTo: { q: -1, r: 0 },
          copiedType: 'GI',
        },
        {
          q: 0,
          r: -1,
          stepLabel: '¡Ejecuta la trepada de Gigante! Sube encima del Soberano quedando a altura ▲2',
          isClimbing: true,
          copiedType: 'GI',
        },
        { q: 0, r: 0, stepLabel: 'Desciende y retorna al suelo. Mimetismo múltiple completado' },
      ],
    },
    {
      title: 'Trepada y Descenso (Copia de Gigante)',
      pieceType: 'HE',
      pieceName: 'El Hechicero de Cadenas',
      subtitle: 'Comportamiento en la cima de pilas',
      description: 'Solo copiando a un Gigante puede trepar a una pila. Mientras esté sobre una pila, se mueve 1 paso como Gigante y ya no copia habilidades.',
      ruleCallout: 'En la cima de una pila, no copia nada: se desplaza 1 espacio a otra pila o desciende al suelo.',
      baseHexes: [
        { q: -1, r: 0, label: 'Inicio' },
        { q: 0, r: 0, pieceType: 'SO', house: 'blue', label: 'Soberano Rival', isPinnedUnder: true },
        { q: -1, r: 1, pieceType: 'GI', house: 'amber', label: 'Gigante (Aliado)' },
        { q: 1, r: 0, pieceType: 'EX', house: 'green', label: 'Apoyo' },
        { q: 0, r: -1, isTarget: true, label: 'Descenso' },
      ],
      waypoints: [
        {
          q: -1,
          r: 0,
          stepLabel: 'Canaliza al Gigante aliado contiguo',
          beamFrom: { q: -1, r: 0 },
          beamTo: { q: -1, r: 1 },
          copiedType: 'GI',
        },
        { q: 0, r: 0, stepLabel: '¡Trepa a la pila del Soberano quedando en altura ▲2!', isClimbing: true, copiedType: 'GI' },
        { q: 0, r: -1, stepLabel: 'Desde la cima, desciende a un espacio libre adyacente' },
        { q: -1, r: 0, stepLabel: 'Retorna a su posición inicial' },
      ],
    },
    {
      title: 'Excepción Absoluta: Inmune ante Nigromante',
      pieceType: 'HE',
      pieceName: 'El Hechicero de Cadenas',
      subtitle: 'No puede copiar habilidades del Nigromante',
      description: 'Aunque esté tocando a un Nigromante enemigo o aliado, el Hechicero de Cadenas tiene prohibido copiar sus poderes (ni intercambio ni destierro).',
      ruleCallout: '⚠️ Excepción de Oro: El Nigromante es la única ficha cuyas habilidades nunca pueden ser copiadas por el Hechicero.',
      baseHexes: [
        { q: 0, r: 0, label: 'Hechicero' },
        { q: 1, r: 0, pieceType: 'NI', house: 'blue', label: 'Nigromante (Incopiable)' },
        { q: 0, r: 1, pieceType: 'EX', house: 'green', label: 'Explorador (Copiable)' },
        { q: 1, r: 1, isTarget: true, label: 'Destino EX' },
        { q: -1, r: 0, pieceType: 'SO', house: 'amber', label: 'Colonia' },
      ],
      waypoints: [
        { q: 0, r: 0, stepLabel: 'Toca al Nigromante y al Explorador' },
        { q: 0, r: 0, stepLabel: '❌ Intento con Nigromante: Poderes oscuros bloqueados' },
        {
          q: 0,
          r: 0,
          stepLabel: '✓ Elige copiar al Explorador vecino',
          beamFrom: { q: 0, r: 0 },
          beamTo: { q: 0, r: 1 },
          copiedType: 'EX',
        },
        { q: 1, r: 1, stepLabel: '¡Ejecuta el movimiento legal del Explorador!', copiedType: 'EX' },
        { q: 0, r: 0, stepLabel: 'Retorna a la posición inicial' },
      ],
    },
  ],
  NI: [
    {
      title: 'Poder B: Intercambio Nigromántico (Swap)',
      pieceType: 'NI',
      pieceName: 'El Nigromante',
      subtitle: 'Intercambia posiciones con un vecino',
      description: 'El Nigromante intercambia instantáneamente su lugar con la pieza superior de una casilla vecina (incluso Soberanos).',
      ruleCallout: 'Permite rescatar a tu propio Soberano de un cerco o desplazar a un Soberano rival a una trampa.',
      baseHexes: [
        { q: -1, r: 0, label: 'Nigromante' },
        { q: 0, r: 0, label: 'Víctima' },
        { q: 1, r: 0, pieceType: 'EX', house: 'amber', label: 'Apoyo' },
        { q: 0, r: 1, pieceType: 'SO', house: 'green', label: 'Apoyo' },
      ],
      waypoints: [
        { q: -1, r: 0, stepLabel: 'Posición antes del intercambio' },
        { q: 0, r: 0, stepLabel: '¡Intercambian sus casillas en el mismo turno!' },
        { q: -1, r: 0, stepLabel: 'Ciclo demostrativo completado' },
      ],
      secondaryActor: {
        type: 'GI',
        house: 'blue',
        start: { q: 0, r: 0 },
        waypoints: [
          { q: 0, r: 0 },
          { q: -1, r: 0 },
          { q: 0, r: 0 },
        ],
      },
    },
    {
      title: 'Poder C: Destierro Nigromántico (Exile)',
      pieceType: 'NI',
      pieceName: 'El Nigromante',
      subtitle: 'Expulsa una pieza enemiga del tablero',
      description: 'Destierra una ficha enemiga viva solitaria y adyacente (que no sea Soberano y sin dividir la colmena), devolviéndola a su reserva.',
      ruleCallout: 'La ficha desterrada regresa a la mano de su dueño al final de su siguiente turno como ficha fresca.',
      baseHexes: [
        { q: -1, r: 0, label: 'Nigromante' },
        { q: 0, r: 0, label: 'Enemigo Solitario' },
        { q: -1, r: 1, pieceType: 'SO', house: 'red', label: 'Apoyo' },
        { q: 0, r: 1, pieceType: 'EX', house: 'green', label: 'Apoyo' },
      ],
      waypoints: [
        { q: -1, r: 0, stepLabel: 'El Nigromante conjura el portal de destierro' },
        { q: -1, r: 0, stepLabel: '¡El enemigo es desterrado y desaparece a su reserva!' },
        { q: -1, r: 0, stepLabel: 'La casilla queda liberada' },
      ],
      secondaryActor: {
        type: 'CZ',
        house: 'blue',
        start: { q: 0, r: 0 },
        waypoints: [
          { q: 0, r: 0, opacity: 1 },
          { q: 0, r: 0, opacity: 0 }, // banished!
          { q: 0, r: 0, opacity: 1 },
        ],
      },
    },
  ],
};

export interface PieceMovementDemoProps {
  initialPiece?: PieceType;
  onSelectPiece?: (type: PieceType) => void;
}

export const PieceMovementDemo: React.FC<PieceMovementDemoProps> = ({
  initialPiece = 'SO',
}) => {
  const [selectedPiece, setSelectedPiece] = useState<PieceType>(initialPiece);
  const [subScenarioIndex, setSubScenarioIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const scenarios = PIECE_SCENARIOS[selectedPiece] || PIECE_SCENARIOS.SO;
  const activeScenario = scenarios[subScenarioIndex] || scenarios[0];

  // Reset steps and subScenario when piece changes
  useEffect(() => {
    setSubScenarioIndex(0);
    setCurrentStep(0);
  }, [selectedPiece]);

  // Animation timer loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % activeScenario.waypoints.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isPlaying, activeScenario]);

  const waypoint = activeScenario.waypoints[currentStep] || activeScenario.waypoints[0];
  const movingPos = hexToPixel(waypoint, DEMO_HEX_SIZE);

  // Secondary actor position (if applicable, e.g. Nigromante Swap/Exile)
  const secondaryWaypoint = activeScenario.secondaryActor?.waypoints[currentStep] ||
    activeScenario.secondaryActor?.waypoints[0];
  const secondaryPos = secondaryWaypoint
    ? hexToPixel({ q: secondaryWaypoint.q, r: secondaryWaypoint.r }, DEMO_HEX_SIZE)
    : null;
  const secondaryOpacity = secondaryWaypoint?.opacity ?? 1;

  // Compute bounding box for SVG center
  const allCoords = [
    ...activeScenario.baseHexes.map((h) => ({ q: h.q, r: h.r })),
    ...activeScenario.waypoints.map((w) => ({ q: w.q, r: w.r })),
  ];
  let minX = 9999,
    maxX = -9999,
    minY = 9999,
    maxY = -9999;
  for (const c of allCoords) {
    const pt = hexToPixel(c, DEMO_HEX_SIZE);
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }
  const padding = 55;
  const viewBoxWidth = Math.max(340, maxX - minX + padding * 2);
  const viewBoxHeight = Math.max(220, maxY - minY + padding * 2);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const viewBox = `${centerX - viewBoxWidth / 2} ${centerY - viewBoxHeight / 2} ${viewBoxWidth} ${viewBoxHeight}`;

  const hexPolygonPoints = getHexCornerPoints(0, 0, DEMO_HEX_SIZE - 2);

  // Jump arc path if currently jumping or moving
  const prevWaypoint = currentStep > 0 ? activeScenario.waypoints[currentStep - 1] : activeScenario.waypoints[0];
  const originCoord = waypoint.isJumping ? activeScenario.waypoints[0] : prevWaypoint;
  const startPos = hexToPixel(originCoord, DEMO_HEX_SIZE);
  const dx = movingPos.x - startPos.x;
  const dy = movingPos.y - startPos.y;
  const dist = Math.hypot(dx, dy);

  let arcPath = '';
  if (dist > 4) {
    const nx = -dy / dist;
    const ny = dx / dist;
    const bow = waypoint.isJumping ? 28 : 12;
    const midX = (startPos.x + movingPos.x) / 2 + nx * bow * 0.3;
    const midY = (startPos.y + movingPos.y) / 2 + ny * bow * 0.3 - (waypoint.isJumping ? 30 : 10);
    arcPath = `M ${startPos.x} ${startPos.y} Q ${midX} ${midY} ${movingPos.x} ${movingPos.y}`;
  }

  const PIECES_LIST: { code: PieceType; label: string; icon: string }[] = [
    { code: 'SO', label: 'Soberano', icon: '👑' },
    { code: 'EX', label: 'Explorador', icon: '🥾' },
    { code: 'CZ', label: 'Cazador', icon: '⚔️' },
    { code: 'BS', label: 'Bestia', icon: '🐆' },
    { code: 'GI', label: 'Gigante', icon: '✊' },
    { code: 'HE', label: 'Hechicero', icon: '✨' },
    { code: 'NI', label: 'Nigromante', icon: '💀' },
  ];

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Piece Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
        {PIECES_LIST.map((p) => {
          const isSelected = selectedPiece === p.code;
          return (
            <button
              key={p.code}
              onClick={() => setSelectedPiece(p.code)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 scale-105'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
              }`}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
              <span className="text-[10px] opacity-75 font-mono">({p.code})</span>
            </button>
          );
        })}
      </div>

      {/* Sub-scenario selector if more than 1 (e.g. Nigromante Swap vs Exile) */}
      {scenarios.length > 1 && (
        <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800 self-start">
          <span className="text-[11px] font-semibold text-slate-400 px-2">Modos de acción:</span>
          {scenarios.map((sc, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSubScenarioIndex(idx);
                setCurrentStep(0);
              }}
              className={`text-xs px-3 py-1 rounded-lg font-bold transition-all ${
                subScenarioIndex === idx
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {sc.title.split(':')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Main Interactive Arena */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center justify-center p-2">
        {/* Arena top badges */}
        <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1 rounded-full backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-200">{activeScenario.title}</span>
          </div>
          <span className="text-[11px] text-amber-400 font-semibold hidden sm:inline">
            {activeScenario.subtitle}
          </span>
        </div>

        {/* Playback controls (top right) */}
        <div className="absolute top-3 right-4 z-10 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 px-2 py-1 rounded-full backdrop-blur-md">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pausar animación' : 'Reanudar animación'}
            className="text-xs font-bold text-slate-300 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800 transition-colors"
          >
            {isPlaying ? '⏸ Pausa' : '▶ Reproducir'}
          </button>
          <button
            onClick={() => setCurrentStep((prev) => (prev + 1) % activeScenario.waypoints.length)}
            title="Siguiente fotograma"
            className="text-xs font-bold text-slate-300 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800 transition-colors"
          >
            ⏭ Paso
          </button>
        </div>

        {/* SVG Board */}
        <div className="w-full h-64 sm:h-72 flex items-center justify-center">
          <svg
            viewBox={viewBox}
            className="w-full h-full select-none"
            style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}
          >
            <defs>
              <linearGradient id="demoTargetGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="magicBeam" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>

            {/* Render Static Hexes */}
            {activeScenario.baseHexes.map((hex, i) => {
              const pt = hexToPixel({ q: hex.q, r: hex.r }, DEMO_HEX_SIZE);
              const theme = hex.isTarget
                ? HOUSE_COLORS.target
                : hex.house
                ? HOUSE_COLORS[hex.house]
                : HOUSE_COLORS.empty;

              return (
                <g key={`hex-${i}`} transform={`translate(${pt.x}, ${pt.y})`}>
                  {/* Hexagon shape */}
                  <polygon
                    points={hexPolygonPoints}
                    fill={hex.isTarget ? 'url(#demoTargetGlow)' : theme.fill}
                    stroke={theme.stroke}
                    strokeWidth={hex.isTarget ? 2 : 1.5}
                    strokeDasharray={hex.isTarget ? '4 2' : 'none'}
                    className={hex.isTarget ? 'animate-pulse' : ''}
                  />

                  {/* Piece Emblem if static cell has a piece */}
                  {hex.pieceType && hex.house && (
                    <g opacity={hex.isPinnedUnder && waypoint.isClimbing ? 0.45 : 1}>
                      <circle r={DEMO_HEX_SIZE * 0.72} fill={HOUSE_COLORS[hex.house].fill} />
                      <SvgPieceIcon
                        type={hex.pieceType}
                        x={-DEMO_HEX_SIZE * 0.55}
                        y={-DEMO_HEX_SIZE * 0.55}
                        size={DEMO_HEX_SIZE * 1.1}
                        white={true}
                      />
                    </g>
                  )}

                  {/* Cell Label */}
                  {hex.label && (
                    <text
                      y={DEMO_HEX_SIZE * 0.78}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="9"
                      fontWeight="bold"
                      className="pointer-events-none drop-shadow"
                    >
                      {hex.label}
                    </text>
                  )}

                  {/* Pin badge if pinned under Giant */}
                  {hex.isPinnedUnder && waypoint.isClimbing && (
                    <text
                      y={-DEMO_HEX_SIZE * 0.55}
                      textAnchor="middle"
                      fill="#f87171"
                      fontSize="9"
                      fontWeight="black"
                    >
                      🔒 INMOVILIZADO
                    </text>
                  )}
                </g>
              );
            })}

            {/* Trajectory Guide Line or Jump Arc */}
            {activeScenario.waypoints.length > 1 && (
              <path
                d={arcPath}
                fill="none"
                stroke={waypoint.isJumping ? '#38bdf8' : '#60a5fa'}
                strokeWidth={waypoint.isJumping ? '2.5' : '1.8'}
                strokeDasharray="4 3"
                opacity="0.85"
              />
            )}

            {/* Dynamic Magic Link Beam (for Hechicero) */}
            {(() => {
              const bFrom = waypoint.beamFrom || activeScenario.linkBeam?.from;
              const bTo = waypoint.beamTo || activeScenario.linkBeam?.to;
              if (!bFrom || !bTo) return null;
              const pFrom = hexToPixel(bFrom, DEMO_HEX_SIZE);
              const pTo = hexToPixel(bTo, DEMO_HEX_SIZE);
              return (
                <line
                  x1={pFrom.x}
                  y1={pFrom.y}
                  x2={pTo.x}
                  y2={pTo.y}
                  stroke="url(#magicBeam)"
                  strokeWidth="3.5"
                  strokeDasharray="5 3"
                  className="animate-pulse"
                />
              );
            })()}

            {/* Secondary Actor (e.g. Nigromante Swap/Exile victim) */}
            {activeScenario.secondaryActor && secondaryPos && (
              <g
                style={{
                  transform: `translate(${secondaryPos.x}px, ${secondaryPos.y}px)`,
                  transition: 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.8s ease',
                  opacity: secondaryOpacity,
                }}
              >
                <circle
                  r={DEMO_HEX_SIZE * 0.75}
                  fill={HOUSE_COLORS[activeScenario.secondaryActor.house].fill}
                  stroke={HOUSE_COLORS[activeScenario.secondaryActor.house].stroke}
                  strokeWidth="2"
                />
                <SvgPieceIcon
                  type={activeScenario.secondaryActor.type}
                  x={-DEMO_HEX_SIZE * 0.55}
                  y={-DEMO_HEX_SIZE * 0.55}
                  size={DEMO_HEX_SIZE * 1.1}
                  white={true}
                />
              </g>
            )}

            {/* The Animated Moving Piece (Active Actor) */}
            <g
              style={{
                transform: `translate(${movingPos.x}px, ${movingPos.y}px)`,
                transition: 'transform 0.75s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {/* Outer glowing aura */}
              <circle
                r={DEMO_HEX_SIZE * 0.9}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="3 2"
                className="animate-spin"
                style={{ animationDuration: '6s' }}
              />
              {/* Main piece token disc */}
              <circle
                r={DEMO_HEX_SIZE * 0.75}
                fill={HOUSE_COLORS.red.fill}
                stroke="#fbbf24"
                strokeWidth="2.5"
                style={{ filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.7))' }}
              />
              {/* Emblem icon */}
              <SvgPieceIcon
                type={activeScenario.pieceType}
                x={-DEMO_HEX_SIZE * 0.55}
                y={-DEMO_HEX_SIZE * 0.55}
                size={DEMO_HEX_SIZE * 1.1}
                white={true}
              />
              {/* Climbing elevation badge */}
              {waypoint.isClimbing && (
                <g transform="translate(14, -14)">
                  <circle r="8" fill="#e11d48" stroke="#ffffff" strokeWidth="1.5" />
                  <text
                    y="3"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="black"
                  >
                    ▲2
                  </text>
                </g>
              )}
              {/* Copied ability badge (for Hechicero) */}
              {waypoint.copiedType && (
                <g transform="translate(13, 13)">
                  <circle r="9" fill="#7e22ce" stroke="#facc15" strokeWidth="1.5" />
                  <SvgPieceIcon
                    type={waypoint.copiedType}
                    x={-6}
                    y={-6}
                    size={12}
                    white={true}
                  />
                </g>
              )}
            </g>
          </svg>
        </div>

        {/* Step Progression Bar and Explanation */}
        <div className="w-full bg-slate-900/90 border-t border-slate-800 p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <PieceIcon type={activeScenario.pieceType} size={22} white={true} />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Paso {currentStep + 1} de {activeScenario.waypoints.length}:</span>
                <span className="text-amber-400 font-semibold">{waypoint.stepLabel}</span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">{activeScenario.description}</p>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5 shrink-0">
            {activeScenario.waypoints.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  currentStep === idx
                    ? 'bg-amber-400 scale-125'
                    : 'bg-slate-700 hover:bg-slate-500'
                }`}
                title={`Ir a paso ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tactical Rule Callout Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
        <span className="text-lg">💡</span>
        <div className="text-xs text-slate-300">
          <span className="font-bold text-amber-400">Regla Oficial Clave: </span>
          {activeScenario.ruleCallout}
        </div>
      </div>
    </div>
  );
};
