import { ConnectionManager } from "../../app/services/ConnectionManager";
import { CurrentPlayerService } from "../../app/services/current-player.service";
import { PlayerManager } from "../managers/PlayerManager";
import { EnemyManager } from "../managers/EnemyManager";
import { EnemyUpdate, GameStateUpdate } from "../entities/GameTypes";
import { EnemyScene } from "./EnemyScene";
import { PlayerScene } from "./PlayerScene";
import { MapScene } from "./MapScene";
import config, { mapConfig } from "../config";
import { CollisionManager } from "../managers/CollisionManager";

export class GameScene extends Phaser.Scene {
  private playerManager!: PlayerManager;
  private enemyManager!: EnemyManager;
  private collisionManager!: CollisionManager;
  private readonly playerScene!: PlayerScene;
  private readonly enemyScene!: EnemyScene;
  private readonly mapScene!: MapScene;

  constructor(
    private readonly connectionManager: ConnectionManager,
    private readonly currentPlayerService: CurrentPlayerService
  ) {
    super({ key: 'GameScene' });
    
    this.playerScene = new PlayerScene();
    this.enemyScene = new EnemyScene();
    this.mapScene = new MapScene();
  }

  private connectDisconnectHandlers = () => {
    this.connectionManager.setBeforeDestroyCallback((socketId: string) => {
      this.connectionManager.broadcastGameState({
        type: 'playerLeft',
        player: { id: socketId }
      })
    });

    this.connectionManager.setOnConnectedCallback((socketId: string) => {
      const playerData = this.currentPlayerService.getCurrentPlayer()!;
      this.connectionManager.broadcastGameState({
        type: 'playerJoin',
        player: { id: playerData.id, name: playerData.name, position: MapScene.getRandomPosition() }
      });
    });
  }

  create() {
    this.coordinateScenes();

    // Main callback for all state updates
    this.connectionManager.setStateUpdateCallback(
      this.handleGameStateUpdate.bind(this) as <GameStateUpdate>(update: GameStateUpdate) => void
    );

    this.connectDisconnectHandlers();
    
    this.playerManager = new PlayerManager(this.connectionManager, this.playerScene);
    this.enemyManager = new EnemyManager(this.connectionManager, this.enemyScene);
    this.collisionManager = new CollisionManager(this.connectionManager, this.playerManager, this.enemyManager);

    // Initialize game
    this.setLocalPlayer();
    this.setDefaultEnemies();
  }

  private setLocalPlayer() {
    const playerData = this.currentPlayerService.getCurrentPlayer()!;
    this.playerManager.createLocalPlayer(playerData.id, playerData.name, MapScene.getRandomPosition());

    this.currentPlayerService.currentPlayer$.subscribe(playerData => {
      // todo end game if no user
      if (playerData) {
        this.playerManager.updateCurrentPlayerState({ name: playerData.name, id: playerData.id });
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
    this.collisionManager.checkCollisions();
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
    this.mapScene.cameras.main.setScroll(0, 0);

    scenes.forEach(scene => {
      // Set camera bounds
      const camera = scene.cameras.main;
      camera.setBounds(
        -mapConfig.leftOffset, // Small left offset
        -mapConfig.topOffset, // Small top offset
        config.mapWidth + mapConfig.rightOffset, // Add right offset
        config.mapHeight + mapConfig.bottomOffset // Add bottom offset
      );
      // Basic camera position
      camera.setScroll(0, 0);
    });

     this.playerScene.events.on('camera-update', (x: number, y: number) => {
      // Center camera on player
      scenes.forEach(scene => {
        scene.cameras.main.centerOn(x, y);
      });
    });
  }

  private handleGameStateUpdate(update: GameStateUpdate) {
    const { player, enemy, winner, loser, enemies, type } = update;

    switch (type) {
      case 'playerLeft':
        this.playerManager.removeRemotePlayer(player!.id!);
        break;
      case 'playerJoin':
        this.playerManager.createPlayer(player!.id!, player!.name!, player!.position!);
        break;
      case 'playerUpdate':
        this.playerManager.updatePlayerState(player!.id!, player!);
        break;
      case 'enemiesUpdate':
        this.enemyManager.setEnemies(enemies!);
        break;
      case 'collision':
        this.playerManager.updatePlayerState(player!.id, { radius: player!.radius });
        this.enemyManager.removeEnemy(enemy!.id);
        break;
      case 'playerCollision':
        this.playerManager.updatePlayerState(winner!.id, { radius: winner!.radius });
        this.playerManager.removeRemotePlayer(loser!.id);
        break;
    }
  }
}
