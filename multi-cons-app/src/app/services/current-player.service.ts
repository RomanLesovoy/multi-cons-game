import { Injectable, inject } from "@angular/core";
import { Socket } from "ngx-socket-io";
import { BehaviorSubject, distinctUntilChanged } from "rxjs";
import { Player } from "../types";

@Injectable({
  providedIn: 'root'
})
export class CurrentPlayerService {
  private readonly socket = inject(Socket);
  private readonly currentPlayer = new BehaviorSubject<Player | null>(null);
  public readonly currentPlayer$ = this.currentPlayer.asObservable().pipe(
    distinctUntilChanged()
  );

  constructor() {
    // todo allow user to set name
    const playerName = localStorage.getItem('playerName') || this.generateName();
    this.setPlayerName(playerName);

    if (!this.socket.ioSocket.connected) {
      this.socket.on('connect', () => {
        this.setSocketData();
      });
    } else {
      this.setSocketData();
    }
  }

  private setSocketData(): void {
    this.currentPlayer.next({
      id: this.socket.ioSocket.id,
      name: this.getPlayerName(),
      socketId: this.socket.ioSocket.id,
    });
  }

  public getCurrentPlayer(): Player | null {
    return this.currentPlayer.value;
  }

  public getPlayerName(): string {
    return this.currentPlayer.value?.name || '';
  }

  public setPlayerName(name: string): void {
    localStorage.setItem('playerName', name);
    this.currentPlayer.next({ ...this.getCurrentPlayer()!, name });
  }

  private generateName(): string {
    // return 'Player-' + Math.random().toString(36).substring(2, 6);
    return Math.random().toString(36).substring(2, 6);
  }
}
