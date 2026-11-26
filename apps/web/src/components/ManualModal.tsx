import React, { useState } from 'react';
import { PieceType } from '@lcch/engine';
import { PieceIcon } from './PieceIcon';
import { PieceMovementDemo } from './PieceMovementDemo';

export interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPiece?: PieceType;
}

const PIECE_MANUAL: {
  code: PieceType;
  name: string;
  count: number;
  description: string;
  details: string[];
}[] = [
  {
    code: 'SO',
    name: 'El Soberano',
    count: 1,
    description: 'Objetivo de victoria del juego. Se desliza 1 espacio a una casilla adyacente vacía.',
    details: [
      'Si sus 6 casillas vecinas quedan ocupadas (cerco de cualquier color o ruinas), tu casa cae inmediatamente.',
      'Debe colocarse en el tablero dentro de las 3 primeras fichas de la Apertura.',
      'No se pueden mover otras fichas hasta que tu Soberano esté en el tablero.',
    ],
  },
  {
    code: 'EX',
    name: 'El Explorador',
    count: 3,
    description: 'Se desliza libremente cualquier número de casillas por el perímetro exterior de la colonia.',
    details: [
      'Debe bordear la formación sin despegarse de ella.',
      'Respeta la regla de deslizamiento (paso físico estrecho).',
      'No puede trepar a pilas ni saltar.',
    ],
  },
  {
    code: 'CZ',
    name: 'El Cazador / Espadachín',
    count: 3,
    description: 'Salta en línea recta hasta 4 pasos en cualquiera de sus 6 sentidos (horizontales y diagonales).',
    details: [
      'Salta obligatoriamente por encima de 1, 2 o hasta 3 fichas contiguas de altura 1 y ocupa la casilla vacía inmediata (hasta 4 pasos).',
      'Jamás salta sobre casillas vacías: cada espacio sobrevolado debe tener una ficha física contigua.',
      'Cualquier pila de altura 2 o más corta su carrera por completo.',
      'Aterriza en la primera casilla vacía inmediatamente después de las fichas saltadas.',
    ],
  },
  {
    code: 'BS',
    name: 'La Bestia Saltadora',
    count: 2,
    description: 'Carga en línea recta sobre cualquier número de fichas contiguas.',
    details: [
      'Aterriza en la primera casilla vacía inmediatamente al otro lado.',
      'Debe saltar al menos una ficha (mínimo 1).',
      'Puede entrar y salir de huecos rodeados.',
    ],
  },
  {
    code: 'GI',
    name: 'El Gigante',
    count: 2,
    description: 'Avanza 1 espacio en suelo o trepa a cualquier pila quedando encima.',
    details: [
      'Desde la cima de una pila, puede avanzar a otra pila o descender a un espacio libre.',
      'La ficha que queda debajo queda inmovilizada mientras el Gigante permanezca encima.',
      'La posición en el tablero adopta el color del Gigante mientras esté arriba.',
    ],
  },
  {
    code: 'HE',
    name: 'El Hechicero de Cadenas',
    count: 1,
    description: 'Copia habilidades tácticas ajenas.',
    details: [
      'En el suelo: copia el movimiento de la ficha superior de cualquier pila que toque (viva o ruina), excepto al Nigromante. La copia vale solo ese turno.',
      'Solo copiando al Gigante puede trepar a una pila.',
      'Sobre una pila: se mueve 1 paso como el Gigante y no copia nada.',
      'Si un Gigante lo cubre, queda sin movimiento.',
    ],
  },
  {
    code: 'NI',
    name: 'El Nigromante',
    count: 1,
    description: 'Conector de los mundos. Realiza una de tres acciones exclusivas por turno:',
    details: [
      'A. Deslizar: avanza 1 espacio a una casilla vacía vecina.',
      'B. Intercambiar: cambia instantáneamente su lugar con la pieza superior de una pila adyacente (viva o ruina, Soberanos incluidos).',
      'C. Destierro: retira del tablero una ficha enemiga viva solitaria y contigua (que no sea Soberano y sin dividir la colonia). Vuelve a la reserva de su dueño al final de su siguiente turno como ficha nueva.',
    ],
  },
];

export const ManualModal: React.FC<ManualModalProps> = ({
  isOpen,
  onClose,
  initialPiece = 'SO',
}) => {
  const [activeTab, setActiveTab] = useState<'demo' | 'catalog'>('demo');
  const [selectedDemoPiece, setSelectedDemoPiece] = useState<PieceType>(initialPiece);

  if (!isOpen) return null;

  const handleOpenDemoForPiece = (code: PieceType) => {
    setSelectedDemoPiece(code);
    setActiveTab('demo');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📜</span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide font-cinzel">
                MANUAL OFICIAL — SAVAGE GODS
              </h2>
              <p className="text-[11px] text-slate-400">Reglamento v0.4 con demostración gráfica interactiva</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-950/40 border-b border-slate-800/80">
          <button
            onClick={() => setActiveTab('demo')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'demo'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>♟️</span>
            <span>Movimientos Animados</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase bg-amber-400/30 text-amber-950">
              En Vivo
            </span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'catalog'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>📖</span>
            <span>Reglas de Oro & Catálogo</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5">
          {activeTab === 'demo' ? (
            /* Animated Demo View */
            <div className="space-y-4">
              <PieceMovementDemo initialPiece={selectedDemoPiece} />
            </div>
          ) : (
            /* Written Rules & Piece Catalog */
            <div className="space-y-5">
              {/* Rules overview */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-amber-400 text-sm mb-1 flex items-center gap-1.5">
                  <span>⚔️</span> Las Reglas de Oro
                </div>
                <p>
                  • <strong className="text-white">Fase de Apertura (3 fichas iniciales):</strong> Cada casa despliega obligatoriamente 3 fichas en su zona antes de comenzar la fase de desarrollo. Entre esas 3 fichas DEBE estar su Soberano.
                </p>
                <p>
                  • <strong className="text-white">Colocación Estricta:</strong> Cada ficha nueva colocada desde la reserva debe tocar al menos una ficha propia y NO PUEDE tocar fichas de otras casas vivas (excepto la primera ficha de cada casa).
                </p>
                <p>
                  • <strong className="text-white">Conectividad (One Hive):</strong> La colonia entera (vivos y ruinas) forma siempre una sola pieza conectada. Ninguna jugada puede separar la formación.
                </p>
                <p>
                  • <strong className="text-white">Prohibición de Cerco por Colocación:</strong> Jamás se permite completar la sexta casilla de cerco alrededor de un Soberano vivo mediante una colocación directa.
                </p>
              </div>

              {/* Piece catalog grid */}
              <div>
                <div className="font-bold text-xs text-slate-400 mb-3 uppercase tracking-wider">
                  Catálogo de Personajes (Haz clic para ver su animación)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PIECE_MANUAL.map((p) => (
                    <div
                      key={p.code}
                      className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3.5 flex flex-col justify-between gap-3 hover:border-slate-500 transition-colors"
                    >
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 shadow-inner">
                          <PieceIcon type={p.code} size={30} white={true} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-white">{p.name}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                              {p.count} por casa
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">{p.description}</p>
                          <ul className="mt-2 space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                            {p.details.map((d, i) => (
                              <li key={i}>{d}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenDemoForPiece(p.code)}
                        className="w-full py-1.5 px-3 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        <span>▶</span> Ver demostración animada
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {activeTab === 'demo' ? 'Usa los botones superiores para pausar o saltar pasos' : 'Haz clic en cualquier ficha para ver su movimiento en vivo'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-transform active:scale-95"
          >
            Cerrar Manual
          </button>
        </div>
      </div>
    </div>
  );
};
