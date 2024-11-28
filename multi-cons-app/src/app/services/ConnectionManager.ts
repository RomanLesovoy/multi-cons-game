import { Socket } from "ngx-socket-io";
import { PlayerJoinedEvent, RTCOfferEvent, RTCAnswerEvent, RTCIceCandidateEvent, PlayerLeftEvent } from '../types';
import { SocketEvents } from './socket.events';
import { Injectable, isDevMode, OnDestroy } from "@angular/core";
import { GameStateService } from "./game-state.service";
import { startWith, pairwise } from "rxjs";

export interface ConnectionStats {
  currentRoundTripTime?: number; // RTT (ping)
  packetsLost?: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConnectionManager implements OnDestroy {
  private peerStats: Map<string, ConnectionStats> = new Map();
  private readonly peers: Map<string, RTCPeerConnection> = new Map();
  private readonly dataChannels: Map<string, RTCDataChannel> = new Map();
  public isMasterPeer: boolean = false;
  private iceCandidatesBuffer: Map<string, RTCIceCandidateInit[]> = new Map();
  private stateUpdateCallback?: <T>(update: T) => void;
  private onConnectedCallback?: (socketId: string) => void;
  private beforeDestroyCallback?: (socketId: string) => void;

  constructor(
    private socket: Socket,
    private gameStateService: GameStateService
  ) {
    this.startStatsCollection();
    // todo maybe move this to game-state service or somewhere else
    this.gameStateService.room$
      .pipe(startWith(null), pairwise())
      .subscribe(([previousRoom, currentRoom]) => {
        const roomUpdated = !previousRoom && !!currentRoom;
        const roomDestroyed = !!previousRoom && !currentRoom;
        const gameStopped = !!previousRoom?.isGameStarted && !currentRoom?.isGameStarted;

        this.isMasterPeer = this.socket.ioSocket.id === currentRoom?.masterId;

        if (roomUpdated) {
          this.setupSocketListeners();
        } else if (roomDestroyed || gameStopped) {
          this.destroy();
        }
    });
  }

  private debug(type: 'info' | 'warn' | 'error', message: string): void {
    if (isDevMode() || true) {
      console[type] && console[type](message);
    }
  }

  private async getConnectionStats(peerId: string) {
    const connection = this.peers.get(peerId);
    if (!connection) return;

    try {
      const stats = await connection.getStats();
      stats.forEach(report => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          this.peerStats.set(peerId, {
            currentRoundTripTime: report.currentRoundTripTime * 1000, // Convert to ms
            packetsLost: report.packetsLost,
            timestamp: Date.now()
          });
        }
      });
    } catch (error) {
      console.warn('Failed to get connection stats:', error);
    }
  }

  // periodically collect stats
  private startStatsCollection() {
    setInterval(() => {
      this.peers.forEach((_, peerId) => {
        this.getConnectionStats(peerId);
      });
    }, 2000);
  }

  public getPeerStats(peerId: string): ConnectionStats | undefined {
    return this.peerStats.get(peerId);
  }

  public setupSocketListeners() {
    this.unsubscribeFromSocketEvents();

    // New player joined
    this.socket.on(SocketEvents.PLAYER_JOINED, ({ player, shouldInitiateConnection, isMaster: _newPlayerIsMaster }: PlayerJoinedEvent) => {
      this.debug('info', `Player joined ${player.id}`);
      if (shouldInitiateConnection) {
        this.initiateConnection(player.id);
      }
    });

    // Player left
    this.socket.on(SocketEvents.PLAYER_LEFT, ({ playerId }: PlayerLeftEvent) => {
      this.debug('info', `Player left ${playerId}`);
      this.removePeer(playerId);
    });

    // WebRTC signals
    this.socket.on(SocketEvents.RTC_OFFER, ({ from, offer }: RTCOfferEvent) => {
      this.handleOffer(from, offer);
    });

    this.socket.on(SocketEvents.RTC_ANSWER, ({ from, answer }: RTCAnswerEvent) => {
      const peer = this.peers.get(from);
      if (peer) {
        peer.setRemoteDescription(answer)
      } else {
        this.debug('warn', `No peer found ${from}`);
      }
    });

    this.socket.on(SocketEvents.RTC_ICE_CANDIDATE, async ({ from, candidate }: RTCIceCandidateEvent) => {
      const peer = this.peers.get(from);
      try {
        if (peer?.remoteDescription) {
          // Если описание уже установлено, добавляем кандидата сразу
          await peer.addIceCandidate(candidate);
        } else {
          // Иначе буферизуем
          const buffer = this.iceCandidatesBuffer.get(from) || [];
          buffer.push(candidate);
          this.iceCandidatesBuffer.set(from, buffer);
        }
      } catch (error) {
        this.debug('error', `Error handling ICE candidate: ${error}`);
      }
    });
  }

  private async initiateConnection(peerId: string) {
    const peer = await this.initializeConnection(peerId);
    const dataChannel = peer.createDataChannel('gameState');
    this.setupDataChannel(dataChannel, peerId);

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const peerLocalDescription = await peer.localDescription;

    this.socket.emit(SocketEvents.RTC_OFFER, {
      targetId: peerId,
      offer: peerLocalDescription
    });
  }

  private async initializeConnection(peerId: string): Promise<RTCPeerConnection> {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
      ],
      iceTransportPolicy: 'all',
      iceCandidatePoolSize: 10
    });
    this.debug('info', `Initialized peer ${peerId}`);

    peer.oniceconnectionstatechange = () => {
      this.debug('info', `ICE connection state changed to: ${peer.iceConnectionState} for peer ${peerId}`);
    };

    peer.onconnectionstatechange = () => {
      this.debug('info', `Connection state changed to: ${peer.connectionState} for peer ${peerId}`);
    };
  
    peer.onicegatheringstatechange = () => {
      this.debug('info', `ICE gathering state changed to: ${peer.iceGatheringState} for peer ${peerId}`);
    };

    peer.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.socket.emit(SocketEvents.RTC_ICE_CANDIDATE, {
          targetId: peerId,
          candidate
        });
      }
    };

    peer.ondatachannel = ({ channel }) => {
      this.setupDataChannel(channel, peerId);
    };
    this.peers.set(peerId, peer);

    return peer
  }

  private async handleOffer(peerId: string, offer: RTCSessionDescriptionInit) {
    const peer = await this.initializeConnection(peerId);

    // Initialize ice candidates buffer
    this.iceCandidatesBuffer.set(peerId, []);

    try {
      await peer.setRemoteDescription(offer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      // Добавляем буферизованные кандидаты
      const bufferedCandidates = this.iceCandidatesBuffer.get(peerId) || [];
      for (const candidate of bufferedCandidates) {
        await peer.addIceCandidate(candidate);
      }
      this.iceCandidatesBuffer.delete(peerId);

      this.socket.emit(SocketEvents.RTC_ANSWER, {
        targetId: peerId,
        answer
      });
    } catch (error) {
      this.debug('error', `Error handling offer: ${error}`);
      this.removePeer(peerId);
    }
  }

  public setStateUpdateCallback(callback: <T>(update: T) => void) {
    this.stateUpdateCallback = callback;
  }

  public setBeforeDestroyCallback(callback: (socketId: string) => void) {
    this.beforeDestroyCallback = callback;
  }

  public setOnConnectedCallback(callback: (socketId: string) => void) {
    this.onConnectedCallback = callback;
  }

  private setupDataChannel(channel: RTCDataChannel, peerId: string) {
    channel.onopen = () => {
      this.debug('info', `Data channel opened ${peerId}`);
      this.dataChannels.set(peerId, channel);
      this.onConnectedCallback?.(peerId);
    };

    channel.onmessage = (event) => {
      const update = JSON.parse(event.data);
      this.stateUpdateCallback?.(update);
    };

    channel.onclose = () => {
      this.debug('info', `Data channel closed ${peerId}`);
      this.dataChannels.delete(peerId);
    };
  }

  private removePeer(peerId: string) {
    this.dataChannels.get(peerId)?.close();
    this.dataChannels.delete(peerId);
    this.peers.get(peerId)?.close();
    this.peers.delete(peerId);
    this.iceCandidatesBuffer.delete(peerId);
  }

  public broadcastGameState<T>(state: T) {
    const message = JSON.stringify(state);
    this.dataChannels.forEach(channel => {
      if (channel.readyState === 'open') {
        channel.send(message);
      }
    });
  }

  public getPeersLength() {
    return this.peers.size;
  }

  public destroy() {
    this.beforeDestroyCallback?.(this.socket.ioSocket.id);
    this.unsubscribeFromSocketEvents();
    this.peers.forEach(peer => peer.close());
    this.dataChannels.forEach(channel => channel.close());
    this.peers.clear();
    this.dataChannels.clear();
    this.iceCandidatesBuffer.clear();
    this.debug('info', 'ConnectionManager destroyed');
  }

  private unsubscribeFromSocketEvents() {
    this.socket.off(SocketEvents.PLAYER_JOINED);
    this.socket.off(SocketEvents.PLAYER_LEFT);
    this.socket.off(SocketEvents.RTC_OFFER);
    this.socket.off(SocketEvents.RTC_ANSWER);
    this.socket.off(SocketEvents.RTC_ICE_CANDIDATE);
  }

  ngOnDestroy() {
    this.destroy();
  }
}
