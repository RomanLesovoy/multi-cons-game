import { Injectable, inject } from "@angular/core";
import { Socket } from "ngx-socket-io";
import { Player, PlayerJoinedResponse } from "../types";
import { GameStateService } from "./game-state.service";
import { Observable } from "rxjs";
import { SocketEvents } from "./socket.events";

@Injectable({
  providedIn: 'root'
})
export class PlayerManagerService {
  private socket = inject(Socket);
  private gameStateService = inject(GameStateService);

  private handlePlayerJoined(player: Player) {
    const currentState = this.gameStateService.getRoomState();
    if (currentState.room) {
      this.gameStateService.updateRoomState({
        players: [...currentState.players, player]
      });
    }
  }

  private handlePlayerLeft(playerId: string) {
    const currentState = this.gameStateService.getRoomState();
    if (currentState.room) {
      this.gameStateService.updateRoomState({
        players: currentState.players.filter(p => p.id !== playerId)
      });
    }
  }
  
  public joinRoom(roomId: string): Observable<PlayerJoinedResponse> {
    return new Observable(observer => { // todo fix any
      this.socket.emit(SocketEvents.JOIN_ROOM, { roomId }, (response: PlayerJoinedResponse) => {
        if (response.error) {
          return observer.error(response.error);
        }
        observer.next(response);
        this.gameStateService.updateRoomState(response);
      });
    });
  }

  public leaveRoom(): void {
    const currentState = this.gameStateService.getRoomState();
    if (currentState.room) {
      this.socket.emit(SocketEvents.LEAVE_ROOM, { roomId: currentState.room.id });
      this.gameStateService.updateRoomState({
        room: null,
        players: [],
        isGameStarted: false,
      });
    }
  }
}
