import { GameScene } from "./scenes/GameScene";
import Phaser from 'phaser';
import { ConnectionManager } from "../app/services/ConnectionManager";
import { CurrentPlayerService } from "../app/services/current-player.service";
import configData from "./config";

export class Game {
  private game: Phaser.Game;
  
  constructor(
    private connectionManager: ConnectionManager,
    private currentPlayerService: CurrentPlayerService
  ) {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: configData.width,
      height: configData.height,
      backgroundColor: '#555',
      parent: 'game-container',
      physics: {
        default: 'arcade',
        arcade: {
          debug: false
        }
      },
      scene: []
    };

    this.game = new Phaser.Game(config);
    this.game.scene.add('GameScene', new GameScene(this.connectionManager, this.currentPlayerService), true);
  }

  destroy() {
    this.game.destroy(true);
  }
}
