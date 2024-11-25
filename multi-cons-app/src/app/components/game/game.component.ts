import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConnectionManager } from '../../services/ConnectionManager';
import { Game } from '../../../game/game';
import { CurrentPlayerService } from '../../services/current-player.service';

@Component({
  standalone: true,
  selector: 'app-game',
  template: '<section id="game-container"></section>',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, OnDestroy {
  private game?: Game;
  private static gameInstance?: GameComponent;

  constructor(
    private connectionManager: ConnectionManager,
    private currentPlayerService: CurrentPlayerService
  ) {
    if (!GameComponent.gameInstance) { // todo check
      GameComponent.gameInstance = this;
    }
    return GameComponent.gameInstance;
  }

  ngOnInit() {
    this.game = new Game(this.connectionManager, this.currentPlayerService);
  }

  ngOnDestroy() {
    this.connectionManager.destroy();
    this.game?.destroy();
  }
}
