import { Socket } from "ngx-socket-io";
import { PlayerJoinedEvent, RTCOfferEvent, RTCAnswerEvent, RTCIceCandidateEvent } from '../../app/types';
import { GameStateUpdate } from '../entities/GameTypes';
import { SocketEvents } from '../../app/services/socket.events';

export class ConnectionManager {
  private peers: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  public isMasterPeer: boolean = false;
  private stateUpdateCallback?: (update: GameStateUpdate) => void;

  constructor(
    private socket: Socket,
    // private localPlayerId: string,
  ) {
    this.setupSocketListeners();
  }

  public setStateUpdateCallback(callback: (update: GameStateUpdate) => void) {
    this.stateUpdateCallback = callback;
  }

  private setupSocketListeners() {
    // New player joined
    this.socket.on(SocketEvents.PLAYER_JOINED, ({ player, shouldInitiateConnection, isMaster }: PlayerJoinedEvent) => {
      this.isMasterPeer = isMaster;
      if (shouldInitiateConnection) { // Only existed players should initiate connection with new player
        const peerConnection = this.createPeerConnection(player.id);
        const dataChannel = peerConnection.createDataChannel('gameState');
        this.setupDataChannel(dataChannel, player.id); // player.id -> new player
        this.initiateOffer(peerConnection, player.id);
      }
    });

    // RTC signals handling
    this.socket.on(SocketEvents.RTC_OFFER, async ({ from, offer }: RTCOfferEvent) => {
      const peerConnection = this.createPeerConnection(from); // We are not initiators
      await this.handleRTCOffer(peerConnection, offer);
    });

    this.socket.on(SocketEvents.RTC_ANSWER, async ({ from, answer }: RTCAnswerEvent) => {
      await this.handleRTCAnswer(from, answer);
    });

    this.socket.on(SocketEvents.RTC_ICE_CANDIDATE, async ({ from, candidate }: RTCIceCandidateEvent) => {
      await this.handleIceCandidate(from, candidate);
    });
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    // Check if peer connection already exists
    let peerConnection = this.peers.get(peerId);
    if (peerConnection) {
      return peerConnection;
    }

    // Create new peer connection
    peerConnection = new RTCPeerConnection({
      // todo check is there any other stun servers
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Setup event handlers
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit(SocketEvents.RTC_ICE_CANDIDATE, {
          targetId: peerId,
          candidate: event.candidate
        });
      }
    };

    peerConnection.ondatachannel = (event) => {
      this.setupDataChannel(event.channel, peerId);
    };

    this.peers.set(peerId, peerConnection);
    return peerConnection;
  }

  private setupDataChannel(channel: RTCDataChannel, peerId: string) {
    channel.onopen = () => {
      console.log(`Data channel with ${peerId} opened`);
      this.dataChannels.set(peerId, channel);
    };

    channel.onmessage = (event) => {
      const update: GameStateUpdate = JSON.parse(event.data);
      console.log('channel.onmessage', update);
      if (this.stateUpdateCallback) {
        this.stateUpdateCallback(update);
      }
    };

    channel.onclose = () => {
      console.log(`Data channel with ${peerId} closed`);
      this.dataChannels.delete(peerId);
      this.peers.delete(peerId);
    };
  }

  private async initiateOffer(peerConnection: RTCPeerConnection, peerId: string) {
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      this.socket.emit(SocketEvents.RTC_OFFER, {
        targetId: peerId,
        offer: peerConnection.localDescription
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }

  private async handleRTCOffer(peerConnection: RTCPeerConnection, offer: RTCSessionDescriptionInit) {
    try {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      this.socket.emit(SocketEvents.RTC_ANSWER, {
        // @ts-ignore todo id not exists 
        targetId: peerConnection.id,
        answer: peerConnection.localDescription
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  private async handleRTCAnswer(peerId: string, answer: RTCSessionDescriptionInit) {
    const peerConnection = this.peers.get(peerId);
    if (peerConnection) {
      await peerConnection.setRemoteDescription(answer);
    }
  }

  private async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit) {
    const peerConnection = this.peers.get(peerId);
    if (peerConnection) {
      await peerConnection.addIceCandidate(candidate);
    }
  }

  public broadcastGameState(state: GameStateUpdate) {
    const stateString = JSON.stringify(state);
    this.dataChannels.forEach(channel => {
      if (channel.readyState === 'open') {
        channel.send(stateString);
      }
    });
  }
}
