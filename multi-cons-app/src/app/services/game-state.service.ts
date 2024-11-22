import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Room, RoomState } from '../types';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  private rooms = new BehaviorSubject<Room[]>([]);
  readonly rooms$ = this.rooms.asObservable();

  private roomState = new BehaviorSubject<RoomState>({
    room: null,
    isGameStarted: false,
    players: [],
    currentPlayer: null
  });
  readonly roomState$ = this.roomState.asObservable();

  public updateRooms(rooms: Room[]) {
    this.rooms.next(rooms);
  }

  // todo find secure way to update room state
  public updateRoomState(state: Partial<RoomState>) {
    const previousState = this.getRoomState();
    this.roomState.next({ ...previousState, ...state });
  }

  public getRoomState() {
    return this.roomState.value;
  }
}
