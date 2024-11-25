import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuComponent } from "./partials/menu/menu.component";
import { GameManagerService } from './services/game-manager.service';
import { ConnectionManager } from './services/ConnectionManager';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MenuComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'multi-cons-app';

  constructor(
    private gameManager: GameManagerService,
    private _: ConnectionManager // needs to be initialized before gameStateService
  ) {
    this.gameManager.getRooms();
    this.gameManager.latestRooms$().subscribe();
  }
}
