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
  isGameStarted: boolean;
}

export interface RoomState {
  roomId: string;
  players: Player[];
  masterId: string;
}

export enum SocketEvents {
  RTC_ANSWER = 'rtcAnswer',
  RTC_ICE_CANDIDATE = 'rtcIceCandidate',
  RTC_OFFER = 'rtcOffer',
  CREATE_ROOM = 'createRoom',
  JOIN_ROOM = 'joinRoom',
  LEAVE_ROOM = 'leaveRoom',
  START_GAME = 'startGame',
  PLAYER_LEFT = 'playerLeft',
  LATEST_ROOMS = 'latestRooms',
  GAME_STARTED = 'gameStarted',
  PLAYER_JOINED = 'playerJoined'
}
