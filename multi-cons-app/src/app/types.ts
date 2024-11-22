export interface Player {
  id: string;
  name: string;
  socketId: string;
  isMaster: boolean;
}

export interface Room {
  id: string;
  name: string;
  players: Player[];
  maxPlayers: number;
  masterId?: string;
}

export interface RoomState {
  players: Player[];
  room: Room | null;
  isGameStarted: boolean;
  currentPlayer: Player | null;
}

export interface PlayerJoinedResponse {
  room: Room;
  player: Player;
  players: Player[];
  masterId: string;
  error?: any;
}

export interface PlayerJoinedEvent {
  player: Player;
  shouldInitiateConnection: boolean;
  isMaster: boolean;
}

export interface RTCOfferEvent {
  from: string;
  offer: RTCSessionDescriptionInit;
}

export interface RTCAnswerEvent {
  from: string;
  answer: RTCSessionDescriptionInit;
}

export interface RTCIceCandidateEvent {
  from: string;
  candidate: RTCIceCandidateInit;
}
