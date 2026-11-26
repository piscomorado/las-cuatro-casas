import Peer, { DataConnection } from 'peerjs';
import { GameState, Action, House } from '@lcch/engine';
import { LastMoveInfo } from '../components/HexBoard';

export type OnlineRole = 'host' | 'guest';

export interface PlayerInfo {
  peerId: string;
  house: House;
  isHost: boolean;
  name?: string;
}

export type NetworkMessage =
  | {
      type: 'INIT_SYNC';
      state: GameState;
      assignedHouse: House;
      hostHouse: House;
      numHouses: 2 | 3 | 4;
      activeHouses: House[];
    }
  | {
      type: 'ACTION';
      action: Action;
      nextState: GameState;
      lastMove?: LastMoveInfo | null;
    }
  | {
      type: 'RESTART_GAME';
      state: GameState;
    }
  | {
      type: 'PLAYER_JOINED';
      house: House;
    }
  | {
      type: 'CHAT';
      senderHouse: House;
      message: string;
    };

export interface OnlineMultiplayerEvents {
  onStateSync: (state: GameState, assignedHouse?: House, numHouses?: 2 | 3 | 4) => void;
  onRemoteAction: (action: Action, nextState: GameState, lastMove?: LastMoveInfo | null) => void;
  onPlayerConnected: (player: PlayerInfo) => void;
  onPlayerDisconnected: (house: House) => void;
  onError: (err: string) => void;
  onStatusChange: (status: 'disconnected' | 'connecting' | 'connected' | 'hosting') => void;
}

export class OnlineMultiplayerManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private role: OnlineRole = 'host';
  private myHouse: House = 'red';
  private roomId: string = '';
  private events: OnlineMultiplayerEvents;
  private assignedGuests: Map<string, House> = new Map(); // peerId -> House

  constructor(events: OnlineMultiplayerEvents) {
    this.events = events;
  }

  public getRole(): OnlineRole {
    return this.role;
  }

  public getMyHouse(): House {
    return this.myHouse;
  }

  public getRoomId(): string {
    return this.roomId;
  }

  public isConnected(): boolean {
    return this.connections.size > 0;
  }

  /**
   * Host starts a room and waits for players to connect with the link.
   */
  public hostRoom(hostHouse: House, numHouses: 2 | 3 | 4, initialGameState: GameState): Promise<string> {
    this.disconnect();
    this.role = 'host';
    this.myHouse = hostHouse;
    this.events.onStatusChange('connecting');

    // Generate readable random room ID: lcch-xxxx
    const randSuffix = Math.random().toString(36).substring(2, 8);
    const roomCode = `lcch-${randSuffix}`;
    this.roomId = roomCode;

    return new Promise((resolve, reject) => {
      try {
        const peer = new Peer(roomCode);
        this.peer = peer;

        peer.on('open', (id) => {
          this.roomId = id;
          this.events.onStatusChange('hosting');
          resolve(id);
        });

        peer.on('connection', (conn) => {
          this.setupConnectionAsHost(conn, numHouses, initialGameState);
        });

        peer.on('error', (err) => {
          this.events.onError(`Error de conexión P2P: ${err.message || err.type}`);
          reject(err);
        });
      } catch (e: any) {
        this.events.onError(`No se pudo iniciar el servicio de red: ${e.message}`);
        reject(e);
      }
    });
  }

  private setupConnectionAsHost(conn: DataConnection, numHouses: 2 | 3 | 4, getCurrentState: GameState) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);

      // Determine available house for the new guest
      const allHouses: House[] = ['red', 'blue', 'green', 'amber'];
      const activeHouses = allHouses.slice(0, numHouses);
      const usedHouses = new Set<House>([this.myHouse, ...this.assignedGuests.values()]);
      const availableHouse = activeHouses.find((h) => !usedHouses.has(h)) || 'blue';

      this.assignedGuests.set(conn.peer, availableHouse);

      // Send initial synchronization packet to this guest
      const syncMsg: NetworkMessage = {
        type: 'INIT_SYNC',
        state: getCurrentState,
        assignedHouse: availableHouse,
        hostHouse: this.myHouse,
        numHouses,
        activeHouses,
      };
      conn.send(syncMsg);

      this.events.onPlayerConnected({
        peerId: conn.peer,
        house: availableHouse,
        isHost: false,
      });

      // Broadcast to other existing guests that a new player joined
      this.broadcastExcept(conn.peer, {
        type: 'PLAYER_JOINED',
        house: availableHouse,
      });
    });

    conn.on('data', (data) => {
      this.handleIncomingData(data as NetworkMessage, conn.peer);
    });

    conn.on('close', () => {
      const house = this.assignedGuests.get(conn.peer);
      this.connections.delete(conn.peer);
      this.assignedGuests.delete(conn.peer);
      if (house) {
        this.events.onPlayerDisconnected(house);
      }
    });
  }

  /**
   * Guest joins an existing room hosted by another player.
   */
  public joinRoom(targetRoomId: string): Promise<void> {
    this.disconnect();
    this.role = 'guest';
    this.roomId = targetRoomId;
    this.events.onStatusChange('connecting');

    return new Promise((resolve, reject) => {
      try {
        const peer = new Peer();
        this.peer = peer;

        peer.on('open', () => {
          const conn = peer.connect(targetRoomId, {
            reliable: true,
          });

          conn.on('open', () => {
            this.connections.set(targetRoomId, conn);
            this.events.onStatusChange('connected');
            resolve();
          });

          conn.on('data', (data) => {
            this.handleIncomingData(data as NetworkMessage, targetRoomId);
          });

          conn.on('close', () => {
            this.events.onPlayerDisconnected(this.myHouse);
            this.events.onStatusChange('disconnected');
          });

          conn.on('error', (err) => {
            this.events.onError(`Error en la sala del rival: ${err}`);
            reject(err);
          });
        });

        peer.on('error', (err) => {
          this.events.onError(`No se pudo conectar a la sala ${targetRoomId}: ${err.message || err.type}`);
          reject(err);
        });
      } catch (e: any) {
        this.events.onError(`Error al iniciar cliente: ${e.message}`);
        reject(e);
      }
    });
  }

  private handleIncomingData(msg: NetworkMessage, senderPeerId: string) {
    if (msg.type === 'INIT_SYNC') {
      this.myHouse = msg.assignedHouse;
      this.events.onStateSync(msg.state, msg.assignedHouse, msg.numHouses);
      this.events.onStatusChange('connected');
    } else if (msg.type === 'ACTION') {
      this.events.onRemoteAction(msg.action, msg.nextState, msg.lastMove);
      // If host, forward action to all other guests
      if (this.role === 'host') {
        this.broadcastExcept(senderPeerId, msg);
      }
    } else if (msg.type === 'RESTART_GAME') {
      this.events.onStateSync(msg.state);
      if (this.role === 'host') {
        this.broadcastExcept(senderPeerId, msg);
      }
    } else if (msg.type === 'PLAYER_JOINED') {
      this.events.onPlayerConnected({
        peerId: senderPeerId,
        house: msg.house,
        isHost: false,
      });
    }
  }

  /**
   * Broadcast an action executed locally to connected peers.
   */
  public sendAction(action: Action, nextState: GameState, lastMove?: LastMoveInfo | null) {
    const msg: NetworkMessage = {
      type: 'ACTION',
      action,
      nextState,
      lastMove,
    };
    this.broadcast(msg);
  }

  public sendRestart(newState: GameState) {
    const msg: NetworkMessage = {
      type: 'RESTART_GAME',
      state: newState,
    };
    this.broadcast(msg);
  }

  private broadcast(msg: NetworkMessage) {
    for (const conn of this.connections.values()) {
      if (conn.open) {
        conn.send(msg);
      }
    }
  }

  private broadcastExcept(excludedPeerId: string, msg: NetworkMessage) {
    for (const [peerId, conn] of this.connections.entries()) {
      if (peerId !== excludedPeerId && conn.open) {
        conn.send(msg);
      }
    }
  }

  /**
   * Disconnect and close all peers.
   */
  public disconnect() {
    for (const conn of this.connections.values()) {
      try {
        conn.close();
      } catch {}
    }
    this.connections.clear();
    this.assignedGuests.clear();

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {}
      this.peer = null;
    }
    this.roomId = '';
    this.events.onStatusChange('disconnected');
  }
}
