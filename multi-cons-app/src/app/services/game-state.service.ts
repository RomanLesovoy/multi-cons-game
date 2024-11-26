import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';
import { Room } from '../types';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  private readonly rooms = new BehaviorSubject<Room[]>([]);
  public readonly rooms$ = this.rooms.asObservable().pipe(
    distinctUntilChanged()
  );

  private readonly room = new BehaviorSubject<Room | null>(null);
  public readonly room$ = this.room.asObservable().pipe(
    distinctUntilChanged()
  );

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
    this.room.next(null);
  }

  public getRoom() {
    return this.room.value;
  }
}
