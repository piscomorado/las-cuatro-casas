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
  getNeighbors,
  coordToKey,
  keyToCoord,
  PieceType,
} from '@lcch/engine';
import { HexBoard, LastMoveInfo } from './components/HexBoard';
import { HandTray } from './components/HandTray';
import { ManualModal } from './components/ManualModal';
import { OnlineLobbyModal } from './components/OnlineLobbyModal';
import { ComicClashEvent } from './components/ComicClashOverlay';
import { hexToPixel, HEX_SIZE } from './utils/hexMath';
import { sounds } from './utils/soundEffects';
import { OnlineMultiplayerManager, OnlineRole, PlayerInfo } from './utils/onlineMultiplayer';

export const App: React.FC = () => {
  // Game setup configuration
  const [numHouses, setNumHouses] = useState<2 | 3 | 4>(4);
  const [gameMode, setGameMode] = useState<'pvp' | 'bot'>('pvp');
  const [humanHouse, setHumanHouse] = useState<House>('red');
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lastMove, setLastMove] = useState<LastMoveInfo | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Online Multiplayer State
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'hosting'>('disconnected');
  const [onlineRole, setOnlineRole] = useState<OnlineRole>('host');
  const [onlineMyHouse, setOnlineMyHouse] = useState<House>('red');
  const [onlineRoomId, setOnlineRoomId] = useState<string>('');
  const [connectedPlayers, setConnectedPlayers] = useState<PlayerInfo[]>([]);
  const [onlineErrorMessage, setOnlineErrorMessage] = useState<string | null>(null);
  const multiplayerManagerRef = useRef<OnlineMultiplayerManager | null>(null);

  // Comic Clash Animation State
  const [clashEvent, setClashEvent] = useState<ComicClashEvent | null>(null);
  const [comicAnimationsEnabled, setComicAnimationsEnabled] = useState(true);
  const [logoExpanded, setLogoExpanded] = useState(false);
  const cazadorMoveCounter = useRef(0);

  const checkSovereignClash = (action: Action, prevState: GameState, nextState: GameState): ComicClashEvent | null => {
    if (action.type !== 'MovePiece' && action.type !== 'PlacePiece') return null;
    if (!('to' in action) || !action.to) return null;

    const destCoord = action.to;
    let actingPieceType: PieceType = 'SO';
    if ('pieceId' in action && prevState.pieces[action.pieceId]) {
      actingPieceType = prevState.pieces[action.pieceId]!.type;
    }

    // Turn-by-turn rotation for Cazador 3 moves (1 -> 2 -> 3 -> 1 -> 2 -> 3)
    let variation: 1 | 2 | 3 | undefined;
    if (actingPieceType === 'CZ') {
      cazadorMoveCounter.current += 1;
      variation = (((cazadorMoveCounter.current - 1) % 3) + 1) as 1 | 2 | 3;
    }

    const destPixel = hexToPixel(destCoord, HEX_SIZE);
    let moveDistance: number | undefined;
    if ('from' in action && action.from && action.to) {
      moveDistance = Math.max(
        Math.abs(action.from.q - action.to.q),
        Math.abs(action.from.r - action.to.r),
        Math.abs((-action.from.q - action.from.r) - (-action.to.q - action.to.r))
      );
    }

    // 2. Check if destCoord touches (is adjacent to) ANY ENEMY SOVEREIGN on the board
    for (const p of Object.values(nextState.pieces)) {
      if (
        p.type === 'SO' &&
        p.location === 'board' &&
        p.cellKey &&
        p.house !== action.house && // Enemy Sovereign
        nextState.aliveHouses.includes(p.house)
      ) {
        const soCoord = keyToCoord(p.cellKey);
        const isNeighbor = getNeighbors(soCoord).some((nb) => nb.q === destCoord.q && nb.r === destCoord.r);

        if (isNeighbor) {
          // Count occupied neighbor cells around this besieged Sovereign
          let siegeCount = 0;
          for (const nb of getNeighbors(soCoord)) {
            const key = coordToKey(nb);
            const stack = nextState.board[key];
            if (stack && stack.length > 0) {
              siegeCount++;
            }
          }

          // Sound tension progression based on siege count
          if (siegeCount === 6) {
            sounds.playHouseFell();
          } else if (siegeCount === 5) {
            sounds.playCriticalAlert();
            if (actingPieceType === 'CZ') sounds.playSwordSlash();
            else if (actingPieceType === 'EX') sounds.playWindCyclone();
            else if (actingPieceType === 'BS') sounds.playBeastClaw();
            else if (actingPieceType === 'GI') sounds.playGiantStomp();
            else sounds.playSlide();
          } else {
            if (actingPieceType === 'CZ') sounds.playSwordSlash();
            else if (actingPieceType === 'EX') sounds.playWindCyclone();
            else if (actingPieceType === 'BS') sounds.playBeastClaw();
            else if (actingPieceType === 'GI') sounds.playGiantStomp();
            else sounds.playSlide();
          }

          return {
            id: `${Date.now()}-${p.cellKey}`,
            attackerType: actingPieceType,
            attackerHouse: action.house,
            targetHouse: p.house,
            fromPixel: ('from' in action && action.from) ? hexToPixel(action.from, HEX_SIZE) : undefined,
            toPixel: destPixel,
            sovereignPixel: hexToPixel(soCoord, HEX_SIZE),
            siegeCount,
            moveDistance,
            variation,
          };
        }
      }
    }

    // 3. If not adjacent to enemy Sovereign, but it's a Cazador (CZ) or Bestia (BS) leap move, trigger dynamic combat animation!
    if (action.type === 'MovePiece' && (action.moveKind === 'cz' || action.moveKind === 'bs')) {
      if (actingPieceType === 'CZ') sounds.playSwordSlash();
      else if (actingPieceType === 'BS') sounds.playBeastClaw();

      return {
        id: `${Date.now()}-${destCoord.q},${destCoord.r}`,
        attackerType: actingPieceType,
        attackerHouse: action.house,
        fromPixel: ('from' in action && action.from) ? hexToPixel(action.from, HEX_SIZE) : undefined,
        toPixel: destPixel,
        moveDistance,
        variation,
      };
    }

    return null;
  };

  const isOnlineSession = onlineStatus === 'hosting' || onlineStatus === 'connected';

  // Initialize Multiplayer Manager
  useEffect(() => {
    const manager = new OnlineMultiplayerManager({
      onStateSync: (syncedState, assignedHouse, roomHouses) => {
        setGameState(syncedState);
        setSelectedPiece(null);
        if (assignedHouse) {
          setOnlineMyHouse(assignedHouse);
          setHumanHouse(assignedHouse);
        }
        if (roomHouses) {
          setNumHouses(roomHouses);
        }
        sounds.playTurnChime();
      },
      onRemoteAction: (action, nextState, remoteLastMove) => {
        // Sound feedback
        if (action.type === 'PlacePiece') {
          sounds.playPlaceTile();
        } else if (action.type === 'MovePiece') {
          if (action.moveKind === 'cz' || action.moveKind === 'bs') {
            sounds.playJump();
          } else {
            sounds.playSlide();
          }
        } else if (action.type === 'ClimbStack' || action.type === 'DescendStack') {
          sounds.playSlide();
        } else if (action.type === 'SwapPiece' || action.type === 'ExilePiece') {
          sounds.playMystic();
        } else if (action.type === 'Pass') {
          sounds.playTurnChime();
        }
        setGameState(nextState);
        setSelectedPiece(null);
        if (remoteLastMove) {
          setLastMove(remoteLastMove);
        }
        if (comicAnimationsEnabled) {
          const clash = checkSovereignClash(action, gameState, nextState);
          setClashEvent(null);
          if (clash) {
            requestAnimationFrame(() => {
              setClashEvent(clash);
            });
          }
        }
      },
      onPlayerConnected: (player) => {
        setConnectedPlayers((prev) => {
          if (prev.some((p) => p.peerId === player.peerId)) return prev;
          return [...prev, player];
        });
        sounds.playTurnChime();
      },
      onPlayerDisconnected: (house) => {
        setConnectedPlayers((prev) => prev.filter((p) => p.house !== house));
      },
      onError: (err) => {
        setOnlineErrorMessage(err);
      },
      onStatusChange: (status) => {
        setOnlineStatus(status);
        if (status === 'hosting' || status === 'connected') {
          setOnlineErrorMessage(null);
        }
      },
    });

    multiplayerManagerRef.current = manager;

    // Check URL parameters for ?room=...
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setIsOnlineModalOpen(true);
      setOnlineRole('guest');
      manager
        .joinRoom(roomParam)
        .then(() => {
          setOnlineRoomId(roomParam);
        })
        .catch((e) => {
          setOnlineErrorMessage(`No se pudo conectar a la sala ${roomParam}: ${e.message || e}`);
        });
    }

    return () => {
      manager.disconnect();
    };
  }, []);

  const handleHostOnlineRoom = async (hostHouse: House, housesCount: 2 | 3 | 4) => {
    if (!multiplayerManagerRef.current) return;
    setOnlineErrorMessage(null);
    setOnlineRole('host');
    setOnlineMyHouse(hostHouse);
    setHumanHouse(hostHouse);
    setNumHouses(housesCount);

    const freshState = initGame({ seed: Date.now(), houses: HOUSES.slice(0, housesCount), randomStart: true });
    setGameState(freshState);
    setSelectedPiece(null);
    setLastMove(null);

    try {
      const id = await multiplayerManagerRef.current.hostRoom(hostHouse, housesCount, freshState);
      setOnlineRoomId(id);
    } catch (err: any) {
      setOnlineErrorMessage(`Error al crear sala: ${err.message || err}`);
    }
  };

  const handleJoinOnlineRoom = async (targetRoomId: string) => {
    if (!multiplayerManagerRef.current) return;
    setOnlineErrorMessage(null);
    setOnlineRole('guest');
    try {
      await multiplayerManagerRef.current.joinRoom(targetRoomId);
      setOnlineRoomId(targetRoomId);
    } catch (err: any) {
      setOnlineErrorMessage(`Error al unirse a la sala: ${err.message || err}`);
    }
  };

  const handleDisconnectOnline = () => {
    multiplayerManagerRef.current?.disconnect();
    setOnlineRoomId('');
    setConnectedPlayers([]);
    setOnlineStatus('disconnected');
    setOnlineErrorMessage(null);
    if (window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Active houses array based on player count
  const activeHouses = useMemo(() => {
    return HOUSES.slice(0, numHouses);
  }, [numHouses]);

  const [gameState, setGameState] = useState<GameState>(() =>
    initGame({ seed: 1001, houses: activeHouses, randomStart: true })
  );
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [undoGrace, setUndoGrace] = useState<{
    secondsLeft: number;
    actingHouse: House;
    prevSnapshot: { gameState: GameState; lastMove: LastMoveInfo | null };
  } | null>(null);
  const isBotThinking = useRef(false);

  const currentHouse = gameState.aliveHouses[gameState.currentHouseIndex] as House;
  const isCurrentPlayerBot = gameMode === 'bot' && currentHouse !== humanHouse;
  const hasPiecesOnBoard = Object.values(gameState.pieces).some((p) => p.location === 'board');
  const showCollapsedLogo = (hasPiecesOnBoard || gameState.turn > 1 || gameState.phase === 'play') && !logoExpanded;

  // Calculate legal actions for current house
  const legalMoveResult = useMemo(() => {
    if (gameState.status === 'finished') return { actions: [], canPass: false };
    return getLegalMoves(gameState, currentHouse);
  }, [gameState, currentHouse]);

  const handleSelectPiece = (piece: Piece | null) => {
    if (undoGrace !== null) return; // Prevent selection while 5s grace window is ticking
    if (isCurrentPlayerBot) return; // Prevent human selection during bot turn
    if (isOnlineSession && currentHouse !== onlineMyHouse) return; // In online mode, only select on your turn
    setSelectedPiece(piece);
  };

  const handleExecuteAction = (action: Action) => {
    if (isOnlineSession && currentHouse !== onlineMyHouse) return; // In online mode, only act on your turn
    if (undoGrace !== null) return; // Wait during 5s undo grace period

    const prevSnapshot = { gameState, lastMove };
    const res = applyAction(gameState, action);
    if (res.success) {
      // Sound feedback based on action type
      if (action.type === 'PlacePiece') {
        sounds.playPlaceTile();
      } else if (action.type === 'MovePiece') {
        if (action.moveKind === 'cz' || action.moveKind === 'bs') {
          sounds.playJump();
        } else {
          sounds.playSlide();
        }
      } else if (action.type === 'ClimbStack' || action.type === 'DescendStack') {
        sounds.playSlide();
      } else if (action.type === 'SwapPiece' || action.type === 'ExilePiece') {
        sounds.playMystic();
      } else if (action.type === 'Pass') {
        sounds.playTurnChime();
      }

      // Check if house was defeated in this action
      const hasDefeatEvent = res.events.some((e) => e.type === 'HouseDefeated');
      if (hasDefeatEvent) {
        sounds.playHouseFell();
      }

      // Check if setup completed in this action
      const hasSetupCompleted = res.events.some((e) => e.type === 'SetupCompleted');
      if (hasSetupCompleted) {
        sounds.playTurnChime();
      }

      // Track last move for trajectory visualization
      let newLastMove: LastMoveInfo | null = null;
      if ('to' in action) {
        newLastMove = {
          action,
          from: 'from' in action ? action.from : null,
          to: action.to,
          house: action.house,
        };
        setLastMove(newLastMove);
      } else {
        setLastMove(null);
      }

      setGameState(res.state);
      setSelectedPiece(null);

      // Check for Comic Clash Animation against Sovereigns or Hunter jumps
      if (comicAnimationsEnabled) {
        const clash = checkSovereignClash(action, gameState, res.state);
        setClashEvent(null);
        if (clash) {
          requestAnimationFrame(() => {
            setClashEvent(clash);
          });
        }
      }

      // 5-second undo grace window (for testing moves & animations before passing turn)
      if (!isOnlineSession) {
        setUndoGrace({
          secondsLeft: 5,
          actingHouse: action.house,
          prevSnapshot,
        });
      }

      // Broadcast action to online peers
      if (isOnlineSession) {
        multiplayerManagerRef.current?.sendAction(action, res.state, newLastMove);
      }
    }
  };

  const handlePass = () => {
    const passAction: Action = { type: 'Pass', house: currentHouse };
    handleExecuteAction(passAction);
  };

  const handleRestart = (housesCount: 2 | 3 | 4 = numHouses) => {
    const houses = HOUSES.slice(0, housesCount);
    const newState = initGame({ seed: Date.now(), houses, randomStart: true });
    setGameState(newState);
    setSelectedPiece(null);
    setLastMove(null);
    setUndoGrace(null);
    setClashEvent(null);
    isBotThinking.current = false;

    if (isOnlineSession && onlineRole === 'host') {
      multiplayerManagerRef.current?.sendRestart(newState);
    }
  };

  // 5-second countdown timer for undo grace period
  useEffect(() => {
    if (!undoGrace) return;

    const timer = setInterval(() => {
      setUndoGrace((prev) => {
        if (!prev) return null;
        if (prev.secondsLeft <= 1) {
          return null; // Grace period expired -> turn passes to next player
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [undoGrace?.secondsLeft]);

  const handleUndo = () => {
    if (!undoGrace || isOnlineSession) return;

    const { prevSnapshot } = undoGrace;
    setUndoGrace(null);
    setGameState(prevSnapshot.gameState);
    setLastMove(prevSnapshot.lastMove);
    setSelectedPiece(null);
    setClashEvent(null);
    isBotThinking.current = false;
    sounds.playSlide();
  };

  // Keyboard shortcut: Ctrl+Z / Cmd+Z to undo during the 5s window
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoGrace, isOnlineSession]);

  // Bot Turn Automation with natural turn delay (waits for undo grace window to finish)
  useEffect(() => {
    if (gameState.status !== 'playing' || !isCurrentPlayerBot || undoGrace !== null) return;
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
  }, [gameState, isCurrentPlayerBot, currentHouse, botDifficulty, undoGrace]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 select-none">
      {/* Main Board View */}
      <div className="relative flex-1 h-full">
        {/* Top Floating Controls Bar */}
        <header className="absolute top-4 left-6 right-6 z-20 flex items-center justify-between pointer-events-none">
          {/* Top Left Title Header */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setLogoExpanded(!logoExpanded)}
              className="pointer-events-auto flex items-center transition-all duration-300 cursor-pointer select-none group"
              title={showCollapsedLogo ? 'Savage Gods — Clic para ver logo completo' : 'Savage Gods'}
            >
              {showCollapsedLogo ? (
                <img
                  src="/assets/savage_gods_v_flame.png"
                  alt="Savage Gods"
                  className="h-16 sm:h-20 w-auto object-contain filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] drop-shadow-[0_2px_18px_rgba(245,158,11,0.45)] transition-transform duration-300 group-hover:scale-105 active:scale-95"
                />
              ) : (
                <img
                  src="/assets/savage_gods_logo.png"
                  alt="Savage Gods"
                  className="h-24 sm:h-28 md:h-32 w-auto object-contain filter drop-shadow-[0_6px_20px_rgba(0,0,0,0.9)] drop-shadow-[0_2px_22px_rgba(245,158,11,0.35)] transition-transform duration-300 group-hover:scale-105 active:scale-95"
                />
              )}
            </div>

            {/* Online Status Pill */}
            {isOnlineSession && (
              <button
                onClick={() => setIsOnlineModalOpen(true)}
                className="pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/90 backdrop-blur border border-cyan-500/60 hover:border-cyan-400 text-xs font-bold shadow-2xl transition-all cursor-pointer"
                title="Ver detalles de la sala online o copiar link de invitación"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-cyan-300 font-mono text-[11px]">{onlineRoomId}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-200">
                  Tu Casa: <span className="uppercase text-amber-300 font-bold">{onlineMyHouse}</span>
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  currentHouse === onlineMyHouse ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' : 'bg-slate-800 text-slate-400'
                }`}>
                  {currentHouse === onlineMyHouse ? '¡Tu Turno!' : `Turno ${currentHouse}`}
                </span>
              </button>
            )}
          </div>

          {/* Top Right Quick Menu Trigger */}
          <div className="pointer-events-auto relative flex items-center gap-2" ref={menuRef}>
            {legalMoveResult.canPass && gameState.status === 'playing' && !isCurrentPlayerBot && (!isOnlineSession || currentHouse === onlineMyHouse) && (
              <button
                onClick={handlePass}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-transform active:scale-95 animate-pulse"
              >
                Sin Jugada Legal (Pasar)
              </button>
            )}

            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border transition-all duration-200 text-xs font-bold flex items-center gap-2 shadow-xl ${
                isMenuOpen
                  ? 'border-indigo-500 text-white shadow-indigo-950/50 ring-2 ring-indigo-500/30'
                  : 'border-slate-700 text-slate-200 hover:text-white'
              }`}
            >
              <span>⚙️ Menú</span>
              <span className={`text-[10px] text-slate-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {/* Dropdown Panel */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1 animate-fade-in">
                {/* Online Multiplayer Lobby Button */}
                <button
                  onClick={() => {
                    setIsOnlineModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl hover:bg-indigo-950/50 text-left text-xs font-bold text-cyan-300 flex items-center justify-between transition-colors border border-cyan-500/20"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🌐</span>
                    <div className="flex flex-col">
                      <span>Partida Online</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {isOnlineSession ? 'Sala activa (ver enlace)' : 'Invitar a jugar con link'}
                      </span>
                    </div>
                  </div>
                  {isOnlineSession && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </button>

                <div className="my-0.5 border-t border-slate-800/80" />

                <button
                  onClick={() => {
                    setIsManualOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-slate-800/80 text-left text-xs font-bold text-amber-300 flex items-center gap-2.5 transition-colors"
                >
                  <span className="text-base">📜</span>
                  <div className="flex flex-col">
                    <span>Manual Oficial</span>
                    <span className="text-[10px] text-slate-400 font-normal">Reglamento v0.4</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsSetupOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-slate-800/80 text-left text-xs font-semibold text-slate-200 flex items-center gap-2.5 transition-colors"
                >
                  <span className="text-base">⚙️</span>
                  <div className="flex flex-col">
                    <span>Configuración Local</span>
                    <span className="text-[10px] text-slate-400 font-normal">Casas, modo y dificultad</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    const muted = sounds.toggleMute();
                    setIsMuted(muted);
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-slate-800/80 text-left text-xs font-semibold text-slate-200 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{isMuted ? '🔇' : '🔊'}</span>
                    <div className="flex flex-col">
                      <span>Efectos de Sonido</span>
                      <span className="text-[10px] text-slate-400 font-normal">Web Audio procedural</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isMuted ? 'bg-rose-950 text-rose-400' : 'bg-emerald-950 text-emerald-400'}`}>
                    {isMuted ? 'OFF' : 'ON'}
                  </span>
                </button>

                {/* Comic Clash Animations Toggle */}
                <button
                  onClick={() => setComicAnimationsEnabled((prev) => !prev)}
                  className="w-full px-3 py-2 rounded-xl hover:bg-slate-800/80 text-left text-xs font-semibold text-slate-200 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{comicAnimationsEnabled ? '💥' : '⚪'}</span>
                    <div className="flex flex-col">
                      <span>Animaciones Cómic</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {comicAnimationsEnabled ? 'Garras, tajos y pisotón activos' : 'Modo minimalista'}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${comicAnimationsEnabled ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'}`}>
                    {comicAnimationsEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>

                <div className="my-1 border-t border-slate-800/80" />

                <button
                  onClick={() => {
                    handleRestart();
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-rose-950/40 text-left text-xs font-bold text-rose-400 flex items-center gap-2.5 transition-colors"
                >
                  <span className="text-base">🔄</span>
                  <div className="flex flex-col">
                    <span>Reiniciar Partida</span>
                    <span className="text-[10px] text-slate-500 font-normal">Nueva casa inicial al azar</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Board Component */}
        <HexBoard
          state={gameState}
          legalActions={legalMoveResult.actions}
          selectedPiece={selectedPiece}
          lastMove={lastMove}
          clashEvent={clashEvent}
          comicAnimationsEnabled={comicAnimationsEnabled}
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

        {/* Online Waiting for Rival Turn Indicator */}
        {isOnlineSession && currentHouse !== onlineMyHouse && gameState.status === 'playing' && (
          <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2.5 bg-slate-900/95 border border-cyan-500/50 rounded-xl px-4 py-2.5 shadow-2xl animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-bold text-slate-200">
              ⏳ Esperando la jugada de tu rival (<span className="uppercase text-cyan-400">Casa {currentHouse}</span>)...
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

      {/* Floating Bottom Active Hand Tray & Action Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 max-w-xl w-[92vw] pointer-events-auto">
        <HandTray
          house={undoGrace ? undoGrace.actingHouse : currentHouse}
          pieces={Object.values(gameState.pieces)}
          isActive={undoGrace ? true : (gameState.status === 'playing' && (!isOnlineSession || onlineMyHouse === currentHouse))}
          selectedPiece={selectedPiece}
          onSelectPiece={handleSelectPiece}
          ownTurn={gameState.ownTurns[undoGrace ? undoGrace.actingHouse : currentHouse] ?? 0}
          hasSovereignOnBoard={
            Object.values(gameState.pieces).some(
              (p) => p.house === (undoGrace ? undoGrace.actingHouse : currentHouse) && p.type === 'SO' && p.location === 'board'
            )
          }
          phase={gameState.phase}
          setupCount={gameState.setupCount[undoGrace ? undoGrace.actingHouse : currentHouse] ?? 0}
          onUndo={handleUndo}
          canUndo={undoGrace !== null && !isOnlineSession}
          undoSecondsLeft={undoGrace?.secondsLeft ?? null}
          onSkipUndo={() => setUndoGrace(null)}
        />
      </div>

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

      {/* Online Multiplayer Lobby Modal */}
      <OnlineLobbyModal
        isOpen={isOnlineModalOpen}
        onClose={() => setIsOnlineModalOpen(false)}
        status={onlineStatus}
        role={onlineRole}
        myHouse={onlineMyHouse}
        roomId={onlineRoomId}
        numHouses={numHouses}
        connectedPlayers={connectedPlayers}
        errorMessage={onlineErrorMessage}
        onHostRoom={handleHostOnlineRoom}
        onJoinRoom={handleJoinOnlineRoom}
        onDisconnect={handleDisconnectOnline}
      />
    </div>
  );
};

export default App;
