import { Socket } from "ngx-socket-io";
import { PlayerJoinedEvent, RTCOfferEvent, RTCAnswerEvent, RTCIceCandidateEvent, PlayerLeftEvent } from '../types';
import { GameStateUpdate } from '../../game/entities/GameTypes';
import { SocketEvents } from './socket.events';
import { Injectable, OnDestroy } from "@angular/core";
import { GameStateService } from "./game-state.service";

@Injectable({
  providedIn: 'root'
})
export class ConnectionManager implements OnDestroy {
  private peers: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  public isMasterPeer: boolean = false;
  private stateUpdateCallback?: (update: GameStateUpdate) => void;

  constructor(
    private socket: Socket,
    private gameStateService: GameStateService
  ) {
    // todo maybe move this to game-state service or somewhere else
    this.gameStateService.room$.subscribe((room) => {
      if (room) {
        this.setupSocketListeners();
      } else {
        this.destroy();
      }
    });
  }

  public setupSocketListeners() {
    this.unsubscribeFromSocketEvents();

    // New player joined
    this.socket.on(SocketEvents.PLAYER_JOINED, ({ player, shouldInitiateConnection, isMaster }: PlayerJoinedEvent) => {
      this.isMasterPeer = isMaster;
      if (shouldInitiateConnection) {
        this.initiateConnection(player.id);
      }
    });

    // Player left
    this.socket.on(SocketEvents.PLAYER_LEFT, ({ playerId }: PlayerLeftEvent) => {
      this.removePeer(playerId);
    });

    // WebRTC signals
    this.socket.on(SocketEvents.RTC_OFFER, ({ from, offer }: RTCOfferEvent) => {
      this.handleOffer(from, offer);
    });

    this.socket.on(SocketEvents.RTC_ANSWER, ({ from, answer }: RTCAnswerEvent) => {
      const peer = this.peers.get(from);
      if (peer) peer.setRemoteDescription(answer);
    });

    this.socket.on(SocketEvents.RTC_ICE_CANDIDATE, ({ from, candidate }: RTCIceCandidateEvent) => {
      const peer = this.peers.get(from);
      if (peer?.remoteDescription) {
        peer.addIceCandidate(candidate);
      } else {
        console.warn('No remote description for peer', from);
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
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

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

    await peer.setRemoteDescription(offer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    this.socket.emit(SocketEvents.RTC_ANSWER, {
      targetId: peerId,
      answer
    });
  }

  public setStateUpdateCallback(callback: (update: GameStateUpdate) => void) {
    this.stateUpdateCallback = callback;
  }

  private setupDataChannel(channel: RTCDataChannel, peerId: string) {
    channel.onopen = () => {
      this.dataChannels.set(peerId, channel);
    };

    channel.onmessage = (event) => {
      const update = JSON.parse(event.data);
      this.stateUpdateCallback?.(update);
    };

    channel.onclose = () => {
      this.dataChannels.delete(peerId);
    };
  }

  private removePeer(peerId: string) {
    this.dataChannels.get(peerId)?.close();
    this.dataChannels.delete(peerId);
    this.peers.get(peerId)?.close();
    this.peers.delete(peerId);
  }

  public broadcastGameState(state: GameStateUpdate) {
    const message = JSON.stringify(state);
    this.dataChannels.forEach(channel => {
      if (channel.readyState === 'open') {
        channel.send(message);
      }
    });
  }

  public destroy() {
    this.unsubscribeFromSocketEvents();
    this.peers.forEach(peer => peer.close());
    this.dataChannels.forEach(channel => channel.close());
    this.peers.clear();
    this.dataChannels.clear();
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
