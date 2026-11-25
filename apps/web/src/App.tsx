import React, { useState, useMemo } from 'react';
import {
  initGame,
  applyAction,
  getLegalMoves,
  GameState,
  Piece,
  Action,
  House,
} from '@lcch/engine';
import { HexBoard } from './components/HexBoard';
import { HandTray } from './components/HandTray';

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => initGame({ seed: 1001 }));
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);

  const currentHouse = gameState.aliveHouses[gameState.currentHouseIndex] as House;

  // Calculate legal actions for current house
  const legalMoveResult = useMemo(() => {
    if (gameState.status === 'finished') return { actions: [], canPass: false };
    return getLegalMoves(gameState, currentHouse);
  }, [gameState, currentHouse]);

  const handleSelectPiece = (piece: Piece | null) => {
    setSelectedPiece(piece);
  };

  const handleExecuteAction = (action: Action) => {
    const res = applyAction(gameState, action);
    if (res.success) {
      setGameState(res.state);
      setSelectedPiece(null);
    }
  };

  const handlePass = () => {
    const passAction: Action = { type: 'Pass', house: currentHouse };
    handleExecuteAction(passAction);
  };

  const handleRestart = () => {
    setGameState(initGame({ seed: Date.now() }));
    setSelectedPiece(null);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 select-none">
      {/* Main Board View (Interactive Canvas / SVG) */}
      <div className="relative flex-1 h-full">
        {/* Top Floating Status Bar */}
        <header className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2.5 shadow-xl">
            <h1 className="font-extrabold text-sm tracking-wide bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400 bg-clip-text text-transparent">
              LAS CUATRO CASAS
            </h1>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Acción global:</span>
              <span className="font-mono font-bold text-white">{gameState.turn + 1} / 400</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Casas vivas:</span>
              <div className="flex gap-1.5">
                {gameState.aliveHouses.map((h) => (
                  <span
                    key={h}
                    className={`w-2.5 h-2.5 rounded-full ${
                      h === 'red'
                        ? 'bg-red-500'
                        : h === 'blue'
                        ? 'bg-blue-500'
                        : h === 'green'
                        ? 'bg-green-500'
                        : 'bg-amber-500'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions (Pass / Restart) */}
          <div className="pointer-events-auto flex items-center gap-2">
            {legalMoveResult.canPass && gameState.status === 'playing' && (
              <button
                onClick={handlePass}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-transform active:scale-95 animate-pulse"
              >
                Sin Jugada Legal (Pasar)
              </button>
            )}

            <button
              onClick={handleRestart}
              className="px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold shadow-lg transition-colors"
            >
              Nueva Partida
            </button>
          </div>
        </header>

        {/* Board Component */}
        <HexBoard
          state={gameState}
          legalActions={legalMoveResult.actions}
          selectedPiece={selectedPiece}
          onSelectPiece={handleSelectPiece}
          onExecuteAction={handleExecuteAction}
        />

        {/* Game Finished Overlay Modal */}
        {gameState.status === 'finished' && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
              {gameState.winner ? (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center text-3xl">
                    👑
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2">¡VICTORIA!</h2>
                  <p className="text-slate-300 text-sm mb-6">
                    La <span className="font-bold uppercase text-amber-400">Casa {gameState.winner}</span> ha
                    conquistado los Soberanos rivales y reina sobre el tablero.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/30 border border-slate-600 flex items-center justify-center text-3xl">
                    ⚔️
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2">TABLAS / EMPATE</h2>
                  <p className="text-slate-300 text-sm mb-6">
                    {gameState.drawReason === 'repetition' && 'Partida empatada por repetición triple de posición.'}
                    {gameState.drawReason === 'simultaneous' && 'Cayeron todos los Soberanos restantes al mismo tiempo.'}
                    {gameState.drawReason === 'cap' && 'Se alcanzó el tope de 400 acciones sin cerco definitivo.'}
                  </p>
                </>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleRestart}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg transition-transform active:scale-95"
                >
                  Jugar de Nuevo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar / Hand Trays for 2-4 Players */}
      <aside className="w-80 h-full border-l border-slate-800/80 bg-slate-900/50 backdrop-blur-xl p-4 flex flex-col justify-between overflow-y-auto z-10">
        <div className="flex flex-col gap-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 mb-1">
            Reservas de Casas
          </div>

          {gameState.activeHouses.map((h) => (
            <HandTray
              key={h}
              house={h}
              pieces={Object.values(gameState.pieces)}
              isActive={currentHouse === h && gameState.status === 'playing'}
              selectedPiece={selectedPiece}
              onSelectPiece={handleSelectPiece}
              ownTurn={gameState.ownTurns[h]}
            />
          ))}
        </div>

        {/* Selected piece info panel */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
          {selectedPiece ? (
            <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-700">
              <div className="font-bold text-slate-200">
                Ficha seleccionada: <span className="text-white">{selectedPiece.type}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {selectedPiece.location === 'hand'
                  ? 'Haz clic en una casilla verde resaltada para colocarla.'
                  : 'Haz clic en una casilla azul/morada resaltada para moverla.'}
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-center py-2 italic text-[11px]">
              Selecciona una ficha de tu reserva o del tablero para ver sus jugadas legales.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default App;
