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
  masterId: string;
}

export interface RoomState {
  roomId: string;
  players: Player[];
  masterId: string;
}

export enum SocketEvents {
  GET_ROOMS = 'getRooms',
  GAME_STARTED = 'gameStarted',
  CREATE_ROOM = 'createRoom',
  JOIN_ROOM = 'joinRoom',
  LEAVE_ROOM = 'leaveRoom',
  START_GAME = 'startGame',
  PLAYER_LEFT = 'playerLeft',
  RTC_OFFER = 'rtcOffer',
  RTC_ANSWER = 'rtcAnswer',
  RTC_ICE_CANDIDATE = 'rtcIceCandidate',
  PLAYER_JOINED = 'playerJoined'
}
