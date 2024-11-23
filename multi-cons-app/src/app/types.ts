export interface Player {
  id: string;
  name: string;
  socketId: string;
}

export interface Room {
  id: string;
  name: string;
  players: Player[];
  maxPlayers: number;
  masterId?: string;
  isGameStarted: boolean;
}

export interface PlayerJoinedResponse {
  room: Room;
  players: Player[];
  masterId: string;
  error?: any;
}

export interface PlayerJoinedEvent {
  player: Player;
  shouldInitiateConnection: boolean;
  isMaster: boolean;
}

export interface PlayerLeftEvent {
  playerId: string;
  newMasterId: string;
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
