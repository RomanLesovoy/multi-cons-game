import { Injectable, OnDestroy, inject } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';
import { Room } from '../types';
import { GameStateService } from './game-state.service';
import { SocketEvents } from './socket.events';

@Injectable({
  providedIn: 'root'
})
export class GameManagerService implements OnDestroy {
  private socket = inject(Socket);
  private gameStateService = inject(GameStateService);

  constructor() {
    this.setupSocketListeners();

    this.getRooms().subscribe(rooms => {
      this.gameStateService.updateRooms(rooms);
    });
  }

  getRooms(): Observable<Room[]> {
    return this.socket.fromEvent<Room[]>(SocketEvents.GET_ROOMS);
  }

  startGame(): void {
    const currentState = this.gameStateService.getRoomState();
    if (currentState.room && currentState.currentPlayer?.isMaster) {
      // todo check isMaster on backend
      this.socket.emit(SocketEvents.START_GAME, { roomId: currentState.room.id }, (response: any) => {
        if (response.error) {
          throw new Error(response.error);
        }
      });
    }
  }

  private setupSocketListeners() {
    this.socket.fromEvent(SocketEvents.GAME_STARTED).subscribe((gameState: any) => {
      console.log('gameStarted', gameState);
      this.gameStateService.updateRoomState({
        ...this.gameStateService.getRoomState(),
        isGameStarted: true
      });
    });
  }

  public createGame(name: string, playerName: string): Observable<Room> {
    return new Observable(observer => { // todo fix any
      this.socket.emit(SocketEvents.CREATE_ROOM, { name, playerName }, (response: any) => {
        if (response.error) {
          observer.error(response.error);
        } else {
          observer.next(response.room);
        }
      });
    });
  }

  ngOnDestroy() {
    this.socket.off(SocketEvents.GAME_STARTED);
    this.socket.disconnect();
  }
}
