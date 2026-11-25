import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  initGame,
  applyAction,
  getLegalMoves,
  GameState,
  Piece,
  Action,
  House,
  HOUSES,
  getBotAction,
  BotDifficulty,
} from '@lcch/engine';
import { HexBoard } from './components/HexBoard';
import { HandTray } from './components/HandTray';
import { ManualModal } from './components/ManualModal';

export const App: React.FC = () => {
  // Game setup configuration
  const [numHouses, setNumHouses] = useState<2 | 3 | 4>(4);
  const [gameMode, setGameMode] = useState<'pvp' | 'bot'>('pvp');
  const [humanHouse, setHumanHouse] = useState<House>('red');
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);

  // Active houses array based on player count
  const activeHouses = useMemo(() => {
    return HOUSES.slice(0, numHouses);
  }, [numHouses]);

  const [gameState, setGameState] = useState<GameState>(() =>
    initGame({ seed: 1001, houses: activeHouses })
  );
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const isBotThinking = useRef(false);

  const currentHouse = gameState.aliveHouses[gameState.currentHouseIndex] as House;
  const isCurrentPlayerBot = gameMode === 'bot' && currentHouse !== humanHouse;

  // Calculate legal actions for current house
  const legalMoveResult = useMemo(() => {
    if (gameState.status === 'finished') return { actions: [], canPass: false };
    return getLegalMoves(gameState, currentHouse);
  }, [gameState, currentHouse]);

  const handleSelectPiece = (piece: Piece | null) => {
    if (isCurrentPlayerBot) return; // Prevent human selection during bot turn
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

  const handleRestart = (housesCount: 2 | 3 | 4 = numHouses) => {
    const houses = HOUSES.slice(0, housesCount);
    setGameState(initGame({ seed: Date.now(), houses }));
    setSelectedPiece(null);
    isBotThinking.current = false;
  };

  // Bot Turn Automation with natural turn delay
  useEffect(() => {
    if (gameState.status !== 'playing' || !isCurrentPlayerBot) return;
    if (isBotThinking.current) return;

    isBotThinking.current = true;
    const timer = setTimeout(() => {
      const botAction = getBotAction(gameState, currentHouse, botDifficulty, Date.now());
      if (botAction) {
        handleExecuteAction(botAction);
      } else {
        handlePass();
      }
      isBotThinking.current = false;
    }, 500);

    return () => {
      clearTimeout(timer);
      isBotThinking.current = false;
    };
  }, [gameState, isCurrentPlayerBot, currentHouse, botDifficulty]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 select-none">
      {/* Main Board View */}
      <div className="relative flex-1 h-full">
        {/* Top Floating Status Bar */}
        <header className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2 shadow-xl">
            <h1 className="font-extrabold text-sm tracking-wide bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400 bg-clip-text text-transparent">
              LAS CUATRO CASAS
            </h1>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Fase:</span>
              <span className="font-bold text-emerald-400">
                {gameState.phase === 'setup'
                  ? `Apertura (${gameState.setupCount[currentHouse] + 1}/3 fichas)`
                  : 'Desarrollo'}
              </span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Acción:</span>
              <span className="font-mono font-bold text-white">{gameState.turn + 1} / 400</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Modo:</span>
              <span className="font-bold text-indigo-400">
                {gameMode === 'pvp' ? `PVP (${gameState.activeHouses.length}J)` : `vs Bot (${botDifficulty})`}
              </span>
            </div>
          </div>

          {/* Quick Actions (Manual / Mode / Restart) */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={() => setIsManualOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-lg transition-transform active:scale-95"
            >
              <span>📜</span> Manual Oficial
            </button>

            <button
              onClick={() => setIsSetupOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 font-medium text-xs shadow-lg transition-colors"
            >
              ⚙️ Opciones
            </button>

            {legalMoveResult.canPass && gameState.status === 'playing' && !isCurrentPlayerBot && (
              <button
                onClick={handlePass}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-transform active:scale-95 animate-pulse"
              >
                Sin Jugada Legal (Pasar)
              </button>
            )}

            <button
              onClick={() => handleRestart()}
              className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold shadow-lg transition-colors"
            >
              Reiniciar
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

        {/* Bot Thinking Banner Indicator */}
        {isCurrentPlayerBot && gameState.status === 'playing' && (
          <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2.5 bg-slate-900/95 border border-indigo-500/50 rounded-xl px-4 py-2.5 shadow-2xl animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
            <span className="text-xs font-bold text-slate-200">
              🤖 Pensando jugada para <span className="uppercase text-indigo-400">Casa {currentHouse}</span>...
            </span>
          </div>
        )}

        {/* Game Finished Overlay Modal */}
        {gameState.status === 'finished' && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
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
                  onClick={() => handleRestart()}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg transition-transform active:scale-95"
                >
                  Jugar de Nuevo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar / Hand Trays */}
      <aside className="w-80 h-full border-l border-slate-800/80 bg-slate-900/50 backdrop-blur-xl p-4 flex flex-col justify-between overflow-y-auto z-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 px-1 mb-1">
            <span>Reservas de Casas</span>
            <span className="text-[10px] text-slate-500 font-normal">{gameState.activeHouses.length} Casas en juego</span>
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
              hasSovereignOnBoard={
                Object.values(gameState.pieces).some(
                  (p) => p.house === h && p.type === 'SO' && p.location === 'board'
                )
              }
              phase={gameState.phase}
              setupCount={gameState.setupCount[h]}
            />
          ))}
        </div>

        {/* Selected piece info panel */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
          {selectedPiece ? (
            <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-700">
              <div className="font-bold text-slate-200">
                Ficha seleccionada: <span className="text-white">{selectedPiece.type}</span> ({selectedPiece.house})
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {selectedPiece.location === 'hand'
                  ? '🟩 Haz clic en cualquiera de las casillas verdes iluminadas para colocarla.'
                  : '🟦 Haz clic en las casillas iluminadas para moverla (azul: suelo, morado: trepar, amarillo: swap, rojo: destierro).'}
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-center py-2 italic text-[11px]">
              {isCurrentPlayerBot
                ? `🤖 Turno del bot (${currentHouse})...`
                : 'Haz clic en una ficha de tu reserva o en el tablero para ver sus jugadas legales.'}
            </div>
          )}
        </div>
      </aside>

      {/* Setup / Game Mode Modal */}
      {isSetupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">⚙️ Configuración de Partida</h3>
              <button
                onClick={() => setIsSetupOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {/* Houses count */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Número de Casas / Jugadores:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([2, 3, 4] as const).map((count) => (
                  <button
                    key={count}
                    onClick={() => setNumHouses(count)}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                      numHouses === count
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                    }`}
                  >
                    {count} Casas
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">
                {numHouses === 2 && 'Roja vs Azul'}
                {numHouses === 3 && 'Roja vs Azul vs Verde'}
                {numHouses === 4 && 'Roja vs Azul vs Verde vs Ámbar (partida completa)'}
              </p>
            </div>

            {/* Game mode */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Modo de Juego:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setGameMode('pvp')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    gameMode === 'pvp'
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                  }`}
                >
                  👥 PVP Local (Hotseat)
                </button>
                <button
                  onClick={() => setGameMode('bot')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    gameMode === 'bot'
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                  }`}
                >
                  🤖 Contra Bots
                </button>
              </div>
            </div>

            {/* Human house picker (if bot mode) */}
            {gameMode === 'bot' && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Tu Casa (Jugador):
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {activeHouses.map((h) => (
                    <button
                      key={h}
                      onClick={() => setHumanHouse(h)}
                      className={`py-2 rounded-xl border text-xs font-bold capitalize transition-all ${
                        humanHouse === h
                          ? 'bg-white text-slate-900 border-white shadow-md'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                      }`}
                    >
                      {h === 'red' ? 'Roja' : h === 'blue' ? 'Azul' : h === 'green' ? 'Verde' : 'Ámbar'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bot difficulty (if bot mode) */}
            {gameMode === 'bot' && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Dificultad de los Bots:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setBotDifficulty(diff)}
                      className={`py-2 rounded-xl border text-xs font-bold capitalize transition-all ${
                        botDifficulty === diff
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                      }`}
                    >
                      {diff === 'easy' && 'Fácil'}
                      {diff === 'medium' && 'Media'}
                      {diff === 'hard' && 'Calibrada'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  handleRestart(numHouses);
                  setIsSetupOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-transform active:scale-95"
              >
                Aplicar y Nueva Partida
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Modal */}
      <ManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
    </div>
  );
};

export default App;
