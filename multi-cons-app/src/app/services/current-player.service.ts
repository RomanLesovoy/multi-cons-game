import { Injectable, inject } from "@angular/core";
import { Socket } from "ngx-socket-io";
import { BehaviorSubject } from "rxjs";
import { Player } from "../types";

@Injectable({
  providedIn: 'root'
})
export class CurrentPlayerService {
  private socket = inject(Socket);
  private currentPlayer = new BehaviorSubject<Player | null>(null);
  readonly currentPlayer$ = this.currentPlayer.asObservable();

  constructor() {
    // todo allow user to set name
    const playerName = localStorage.getItem('playerName') || this.generateName();
    this.setPlayerName(playerName);

    if (this.socket.ioSocket.connected) {
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
    return 'Player-' + Math.random().toString(36).substring(2, 6);
  }
}
