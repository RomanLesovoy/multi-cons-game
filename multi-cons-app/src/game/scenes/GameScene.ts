import { ConnectionManager } from "../../app/services/ConnectionManager";
import { CurrentPlayerService } from "../../app/services/current-player.service";
import { PlayerManager } from "../managers/PlayerManager";
import { EnemyManager } from "../managers/EnemyManager";
import { GameStateUpdate } from "../entities/GameTypes";
import { EnemyScene } from "./EnemyScene";
import { PlayerScene } from "./PlayerScene";
import { MapScene } from "./MapScene";
import config from "../config";

export class GameScene extends Phaser.Scene {
  private playerManager!: PlayerManager;
  private enemyManager!: EnemyManager;
  private playerScene!: PlayerScene;
  private enemyScene!: EnemyScene;
  private mapScene!: MapScene;

  constructor(
    private connectionManager: ConnectionManager,
    private currentPlayerService: CurrentPlayerService
  ) {
    super({ key: 'GameScene' });
    
    this.playerScene = new PlayerScene();
    this.enemyScene = new EnemyScene();
    this.mapScene = new MapScene();
  }

  create() {
    this.coordinateScenes();

    this.connectionManager.setStateUpdateCallback(this.handleGameStateUpdate.bind(this));
    
    this.playerManager = new PlayerManager(this.connectionManager, this.playerScene);
    this.enemyManager = new EnemyManager(this.connectionManager, this.enemyScene);

    // Initialize game
    this.setLocalPlayer();
    this.setDefaultEnemies();
  }

  private setLocalPlayer() {
    const player = this.currentPlayerService.getCurrentPlayer()!;
    this.playerManager.createLocalPlayer(player.id, player.name, { x: 400, y: 300 }); // position

    this.currentPlayerService.currentPlayer$.subscribe(player => {
      // todo end game if no user
      if (player) {
        this.playerManager.updateRemotePlayerState(player.id, { name: player.name, id: player.id });
      }
    });
  }

  private setDefaultEnemies() {
    if (this.connectionManager.isMasterPeer) {
      this.enemyManager.generateEnemies(20);
    }
  }

  override update() {
    this.playerManager.update();
    this.enemyManager.update();
  }

  private coordinateScenes() {
    const scenes = [this.mapScene, this.playerScene, this.enemyScene];

    // Add scenes in correct order
    this.scene.add('MapScene', this.mapScene, true);
    this.scene.add('EnemyScene', this.enemyScene, true);
    this.scene.add('PlayerScene', this.playerScene, true);

    // Set scenes as layers on top of the main
    this.scene.bringToTop('MapScene');
    this.scene.bringToTop('EnemyScene');
    this.scene.bringToTop('PlayerScene');

    // Link cameras of all scenes
    this.playerScene.cameras.main.setScroll(0, 0);
    this.enemyScene.cameras.main.setScroll(0, 0);
    //  this.mapScene.cameras.main.setScroll(0, 0);

    scenes.forEach(scene => {
      // Set camera bounds
      scene.cameras.main.setBounds(0, 0, config.mapWidth, config.mapHeight);
      // Basic camera position
      scene.cameras.main.setScroll(0, 0);
      // Make camera follow map bounds
      // scene.cameras.main.setBackgroundColor(0x000000);
    });

     this.playerScene.events.on('camera-update', (x: number, y: number) => {
      // Center camera on player
      scenes.forEach(scene => {
        scene.cameras.main.centerOn(x, y);
      });
    });

    // this.cameras.main.setBounds(0, 0, config.mapWidth, config.mapHeight);
  }

  private handleGameStateUpdate(update: GameStateUpdate) {
    console.log('handleGameStateUpdate', update);
    switch (update.type) {
      case 'playerUpdate':
        this.playerManager.updateRemotePlayerState(update.player!.id!, update.player!);
        break;
      case 'enemiesUpdate':
        this.enemyManager.setEnemies(update.enemies!);
        break;
      case 'enemiesPush':
        this.enemyManager.pushEnemies(update.enemies!);
        break;
    }
  }
}
