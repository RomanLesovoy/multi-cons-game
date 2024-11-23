import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Room } from '../types';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  private rooms = new BehaviorSubject<Room[]>([]);
  readonly rooms$ = this.rooms.asObservable();

  private room = new BehaviorSubject<Room | null>(null);
  readonly room$ = this.room.asObservable();

  constructor() {
    this.rooms$.subscribe((rooms) => {
      const currentRoom = rooms.find(r => r.id === this.room.value?.id);
      this.room.next(currentRoom || null);
    });
  }

  public updateRooms(rooms: Room[]) {
    this.rooms.next(rooms);
  }

  // todo find secure way to update room state
  public setRoom(room: Room) {
    this.room.next(room);
  }

  public resetRoom() {
    console.log('reset room');
    this.room.next(null);
  }

  public getRoom() {
    return this.room.value;
  }
}
