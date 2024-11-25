import { Injectable, OnDestroy, inject } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable, tap } from 'rxjs';
import { PlayerJoinedResponse, Room } from '../types';
import { GameStateService } from './game-state.service';
import { CurrentPlayerService } from './current-player.service';
import { SocketEvents } from './socket.events';

@Injectable({
  providedIn: 'root'
})
export class GameManagerService implements OnDestroy {
  private socket = inject(Socket);
  private gameStateService = inject(GameStateService);
  private currentPlayerService = inject(CurrentPlayerService);

  constructor() {
    this.setupSocketListeners();

    window.onbeforeunload = () => {
      this.socket.disconnect();
      this.leaveRoom();
    }
  }

  /**
   * @TODO make subscription for only one room (to avoid so much event-traffic)
   * (multiple subscription should be used only in /games page)
   */
  latestRooms$(): Observable<Room[]> {
    return this.socket.fromEvent<Room[]>(SocketEvents.LATEST_ROOMS)
      .pipe(
        tap((rooms) => {
          console.log(rooms, 'rooms');
          this.gameStateService.updateRooms(rooms);
        })
      );
  }

  public joinRoom(roomId: string): Promise<PlayerJoinedResponse> {
    return new Promise((res, rej) => {
      const playerName = this.currentPlayerService.getPlayerName();
      this.socket.emit(SocketEvents.JOIN_ROOM, { roomId, playerName }, (response: PlayerJoinedResponse) => {
        console.log(response, 'response join room');
        if (response.error) {
          return rej(response.error);
        }
        res(response);
        this.gameStateService.setRoom(response.room);
      });
    })
  }

  public leaveRoom(): void {
    const room = this.gameStateService.getRoom();
    if (room) {
      console.log('emit leave room');
      this.socket.emit(SocketEvents.LEAVE_ROOM, { roomId: room.id });
    }
    this.gameStateService.resetRoom();
  }

  getRooms(): void {
    this.socket.emit(SocketEvents.LATEST_ROOMS, (rooms: Room[]) => {
      console.log(rooms)
      this.gameStateService.updateRooms(rooms);
    });
  }

  startGame(): void {
    const room = this.gameStateService.getRoom();
    console.log(room, 'start game room');
    if (room && this.currentPlayerService.getCurrentPlayer()?.id === room.masterId) {
      console.log('start emit');
      this.socket.emit(SocketEvents.START_GAME, { roomId: room.id }, (response: any) => {
        if (response.error) {
          throw new Error(response.error);
        }
      });
    }
  }

  private setupSocketListeners() {
    this.socket.fromEvent(SocketEvents.GAME_STARTED).subscribe((gameState: any) => {
      console.log('gameStarted', gameState);
      const room = this.gameStateService.getRoom()!;
      this.gameStateService.setRoom({
        ...room,
        isGameStarted: true
      });
    });
  }

  public createGame(name: string): Promise<Room> {
    const playerName = this.currentPlayerService.getPlayerName();
    return new Promise((resolve, reject) => {
      console.log('create game wtf', this.socket);
      this.socket.emit(SocketEvents.CREATE_ROOM, { name, playerName }, (response: any) => {
        console.log('111')
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.room);
        }
      });
    });
  }

  ngOnDestroy() {
    this.leaveRoom();
    this.socket.off(SocketEvents.GAME_STARTED);
  }
}
