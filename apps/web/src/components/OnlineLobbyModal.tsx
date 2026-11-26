import React, { useState } from 'react';
import { House } from '@lcch/engine';
import { OnlineRole, PlayerInfo } from '../utils/onlineMultiplayer';

export interface OnlineLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'disconnected' | 'connecting' | 'connected' | 'hosting';
  role: OnlineRole;
  myHouse: House;
  roomId: string;
  numHouses: 2 | 3 | 4;
  connectedPlayers: PlayerInfo[];
  errorMessage: string | null;
  onHostRoom: (house: House, numHouses: 2 | 3 | 4) => void;
  onJoinRoom: (roomId: string) => void;
  onDisconnect: () => void;
}

const HOUSE_DATA: Record<House, { name: string; bg: string; text: string; border: string }> = {
  red: { name: 'Casa Roja (Guerra)', bg: 'bg-red-950/70', text: 'text-red-400', border: 'border-red-600' },
  blue: { name: 'Casa Azul (Agua)', bg: 'bg-blue-950/70', text: 'text-blue-400', border: 'border-blue-600' },
  green: { name: 'Casa Verde (Tierra)', bg: 'bg-green-950/70', text: 'text-green-400', border: 'border-green-600' },
  amber: { name: 'Casa Ámbar (Fuego)', bg: 'bg-amber-950/70', text: 'text-amber-400', border: 'border-amber-600' },
};

export const OnlineLobbyModal: React.FC<OnlineLobbyModalProps> = ({
  isOpen,
  onClose,
  status,
  role,
  myHouse,
  roomId,
  numHouses,
  connectedPlayers,
  errorMessage,
  onHostRoom,
  onJoinRoom,
  onDisconnect,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [selectedHouse, setSelectedHouse] = useState<House>('red');
  const [selectedNumHouses, setSelectedNumHouses] = useState<2 | 3 | 4>(2);
  const [joinInput, setJoinInput] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Compute shareable URL
  const shareableUrl = roomId
    ? `${window.location.origin}${window.location.pathname}?room=${roomId}`
    : '';

  const handleCopyLink = () => {
    if (!shareableUrl) return;
    navigator.clipboard.writeText(shareableUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let code = joinInput.trim();
    if (!code) return;

    // If user pasted a full URL with ?room=..., extract it
    if (code.includes('?room=')) {
      const match = code.match(/[?&]room=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        code = match[1];
      }
    }
    onJoinRoom(code);
  };

  const isSessionActive = status === 'hosting' || status === 'connected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-white max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl filter drop-shadow">🌐</span>
            <div>
              <h2 className="text-lg font-black tracking-wide uppercase bg-gradient-to-r from-cyan-400 via-indigo-400 to-rose-400 bg-clip-text text-transparent">
                Partida Online Multijugador
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Invita a otros jugadores mediante enlace directo P2P
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Error notification if any */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-600/70 rounded-2xl text-xs text-rose-200 flex items-center gap-2.5">
            <span className="text-base">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Mode: Already Connected or Hosting */}
        {isSessionActive ? (
          <div className="flex flex-col gap-4">
            {/* Live Room Status Card */}
            <div className="p-4 bg-slate-800/80 border border-indigo-500/50 rounded-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    {role === 'host' ? 'Sala Online Creada (Anfitrión)' : 'Conectado a la Sala'}
                  </span>
                  <span className="text-[11px] text-slate-400">({numHouses} Casas)</span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 font-mono text-cyan-300 font-bold">
                  {roomId}
                </span>
              </div>

              {/* Shareable Invite Link Box */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  🔗 Enlace para invitar al rival:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareableUrl}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {copied ? '✓ ¡Copiado!' : '📋 Copiar'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Copia y envía este enlace a quien quieras por WhatsApp, Telegram o correo. Al hacer clic entrará directamente a jugar contigo.
                </p>
              </div>

              {/* WhatsApp Quick Share */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `¡Te desafío a jugar Las Cuatro Casas! Entra con este enlace para comenzar la partida: ${shareableUrl}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 rounded-xl text-xs font-bold text-emerald-300 flex items-center justify-center gap-2 transition-colors"
              >
                <span>📲 Compartir por WhatsApp</span>
              </a>
            </div>

            {/* Players in Room */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Jugadores en la partida:
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  <div className="flex flex-col text-xs">
                    <span className="font-bold text-white">
                      Tú ({HOUSE_DATA[myHouse].name})
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {role === 'host' ? 'Anfitrión' : 'Invitado'}
                    </span>
                  </div>
                </div>

                {connectedPlayers.map((player) => (
                  <div
                    key={player.peerId}
                    className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl flex items-center gap-2.5"
                  >
                    <span className="w-3 h-3 rounded-full bg-cyan-400" />
                    <div className="flex flex-col text-xs">
                      <span className="font-bold text-white">
                        Rival ({HOUSE_DATA[player.house].name})
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        Conectado en línea
                      </span>
                    </div>
                  </div>
                ))}

                {connectedPlayers.length === 0 && (
                  <div className="p-3 bg-slate-900/50 border border-dashed border-slate-700 rounded-xl flex items-center gap-2.5 text-slate-400 text-xs">
                    <span className="animate-spin text-sm">⏳</span>
                    <span>Esperando a que el rival abra el link...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions: Disconnect / Play */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={onDisconnect}
                className="px-4 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-200 text-xs font-bold transition-colors"
              >
                🚪 Abandonar Sala Online
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg transition-transform active:scale-95"
              >
                Ir al Tablero de Juego ⚔️
              </button>
            </div>
          </div>
        ) : (
          /* Mode: Not Connected yet (Create or Join) */
          <div className="flex flex-col gap-4">
            {/* Navigation Tabs */}
            <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'create'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ✨ Crear Sala e Invitar
              </button>
              <button
                onClick={() => setActiveTab('join')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'join'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🔗 Unirse a una Sala
              </button>
            </div>

            {activeTab === 'create' ? (
              <div className="flex flex-col gap-4">
                {/* Number of Houses */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Número de Casas (Jugadores):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([2, 3, 4] as const).map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSelectedNumHouses(num)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                          selectedNumHouses === num
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {num === 2 ? '⚔️ 2 Casas (Duelo)' : num === 3 ? '🛡️ 3 Casas' : '👑 4 Casas (Guerra)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Choose Your House */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Tu Casa (Anfitrión):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['red', 'blue', 'green', 'amber'] as const).slice(0, selectedNumHouses).map((h) => {
                      const data = HOUSE_DATA[h];
                      const isSelected = selectedHouse === h;
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setSelectedHouse(h)}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs font-bold transition-all ${
                            isSelected
                              ? `${data.bg} ${data.border} ring-2 ring-indigo-500/40 text-white`
                              : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span>{data.name}</span>
                          {isSelected && <span className="text-emerald-400">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Host */}
                <button
                  onClick={() => onHostRoom(selectedHouse, selectedNumHouses)}
                  disabled={status === 'connecting'}
                  className="w-full mt-2 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl transition-transform active:scale-98 flex items-center justify-center gap-2"
                >
                  {status === 'connecting' ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Creando sala P2P...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀 Crear Sala y Generar Link</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Tab: Join */
              <form onSubmit={handleJoinSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Código de Sala o Enlace Completo:
                  </label>
                  <input
                    type="text"
                    placeholder="Pega aquí el enlace de invitación o el código (ej. lcch-k8f2m9)"
                    value={joinInput}
                    onChange={(e) => setJoinInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    Si tu amigo te envió un enlace por WhatsApp o chat, puedes pegarlo directamente aquí o simplemente abrir el enlace en tu navegador.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!joinInput.trim() || status === 'connecting'}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl transition-transform active:scale-98 flex items-center justify-center gap-2"
                >
                  {status === 'connecting' ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Conectando a la sala...</span>
                    </>
                  ) : (
                    <>
                      <span>🔗 Unirse a la Partida</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
