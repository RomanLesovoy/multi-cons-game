import { ConnectionManager } from "../managers/ConnectionManager";
import { PlayerManager } from "../managers/PlayerManager";
import { EnemyManager } from "../managers/EnemyManager";
import { Socket } from "ngx-socket-io";
import { GameStateUpdate } from "../entities/GameTypes";
import { EnemyScene } from "./EnemyScene";
import { PlayerScene } from "./PlayerScene";

export class GameScene extends Phaser.Scene {
  private playerManager!: PlayerManager;
  private enemyManager!: EnemyManager;
  private connectionManager!: ConnectionManager;
  private playerScene!: PlayerScene;
  private enemyScene!: EnemyScene;

  constructor(
    private socket: Socket,
  ) {
    super({ key: 'GameScene' });
  }

  create() {
    this.connectionManager = new ConnectionManager(this.socket);
    this.connectionManager.setStateUpdateCallback(this.handleGameStateUpdate.bind(this));

    this.playerScene = new PlayerScene();
    this.enemyScene = new EnemyScene();

    this.playerManager = new PlayerManager(this.connectionManager, this.playerScene);
    this.enemyManager = new EnemyManager(this.connectionManager, this.enemyScene);

    // Initialize game
    this.setLocalPlayer();
    this.setDefaultEnemies();
  }

  setLocalPlayer() {
    this.playerManager.createLocalPlayer('Player1', { x: 400, y: 300 });
  }

  setDefaultEnemies() {
    if (this.connectionManager.isMasterPeer) {
      this.enemyManager.generateEnemies(20);
    }
  }

  override update() {
    this.enemyManager.update();
  }

  private handleGameStateUpdate(update: GameStateUpdate) {
    console.log('handleGameStateUpdate', update);
    switch (update.type) {
      case 'playerUpdate':
        if (update.player) {
          this.playerManager.updateRemotePlayerState(update.player.id!, update.player);
        }
        break;
      case 'enemiesUpdate':
        // if (!this.connectionManager.isMasterPeer) {
        //   this.enemyManager.syncEnemies(update.enemies);
        // }
        break;
    }
  }
}
