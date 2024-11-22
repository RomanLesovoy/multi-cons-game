import { GameScene } from "./scenes/GameScene";
import Phaser from 'phaser';
import { Socket } from "ngx-socket-io";

export class Game {
  private game: Phaser.Game;
  
  constructor(private socket: Socket) {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800, // todo size
      height: 600,
      physics: {
        default: 'arcade',
        arcade: {
          debug: false
        }
      },
      scene: []
    };

    this.game = new Phaser.Game(config);
    this.game.scene.add('GameScene', new GameScene(this.socket), true);
  }

  destroy() {
    this.game.destroy(true);
  }
}
