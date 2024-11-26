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
  private readonly socket = inject(Socket);
  private readonly gameStateService = inject(GameStateService);
  private readonly currentPlayerService = inject(CurrentPlayerService);

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
          this.gameStateService.updateRooms(rooms);
        })
      );
  }

  public joinRoom(roomId: string): Promise<PlayerJoinedResponse> {
    return new Promise((res, rej) => {
      const playerName = this.currentPlayerService.getPlayerName();
      this.socket.emit(SocketEvents.JOIN_ROOM, { roomId, playerName }, (response: PlayerJoinedResponse) => {
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
      this.socket.emit(SocketEvents.LEAVE_ROOM, { roomId: room.id });
    }
    this.gameStateService.resetRoom();
  }

  getRooms(): void {
    this.socket.emit(SocketEvents.LATEST_ROOMS, (rooms: Room[]) => {
      this.gameStateService.updateRooms(rooms);
    });
  }

  startGame(): void {
    const room = this.gameStateService.getRoom();
    if (room && this.currentPlayerService.getCurrentPlayer()?.id === room.masterId) {
      this.socket.emit(SocketEvents.START_GAME, { roomId: room.id }, (response: any) => {
        if (response.error) {
          throw new Error(response.error);
        }
      });
    }
  }

  private setupSocketListeners() {
    this.socket.fromEvent(SocketEvents.GAME_STARTED).subscribe((gameState: any) => {
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
      this.socket.emit(SocketEvents.CREATE_ROOM, { name, playerName }, (response: any) => {
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
