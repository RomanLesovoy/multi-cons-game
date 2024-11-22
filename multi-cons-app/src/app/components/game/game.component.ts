import { Component, OnInit, OnDestroy } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Game } from '../../../game/game';

@Component({
  standalone: true,
  selector: 'app-game',
  template: '<section id="game"></section>',
  styles: [':host { display: block; }']
})
export class GameComponent implements OnInit, OnDestroy {
  private game?: Game;
  private static gameInstance?: GameComponent;

  constructor(private socket: Socket) {
    if (!GameComponent.gameInstance) { // todo check
      GameComponent.gameInstance = this;
    }
    return GameComponent.gameInstance;
  }

  ngOnInit() {
    this.game = new Game(this.socket);
  }

  ngOnDestroy() {
    this.game?.destroy();
  }
}
