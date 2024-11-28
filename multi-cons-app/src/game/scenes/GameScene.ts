import { ConnectionManager } from "../../app/services/ConnectionManager";
import Phaser from "phaser";
import { CurrentPlayerService } from "../../app/services/current-player.service";
import { PlayerManager } from "../managers/PlayerManager";
import { EnemyManager } from "../managers/EnemyManager";
import { EnemyUpdate, GameStateUpdate } from "../entities/GameTypes";
import { EnemyScene } from "./EnemyScene";
import { PlayerScene } from "./PlayerScene";
import { MapScene } from "./MapScene";
import config, { mapConfig } from "../config";
import { CollisionManager } from "../managers/CollisionManager";
import { ConnectionStatsScene } from "./ConnectionStatsScene";
import { GameEndScene } from "./GameEndScene";

export class GameScene extends Phaser.Scene {
  private gameInitialized = false;
  private playerManager!: PlayerManager;
  private enemyManager!: EnemyManager;
  private collisionManager!: CollisionManager;
  private readonly playerScene!: PlayerScene;
  private readonly enemyScene!: EnemyScene;
  private readonly mapScene!: MapScene;
  private connectionStatsScene!: ConnectionStatsScene;
  private gameEndScene!: GameEndScene;

  private lastUpdateTime: number = 0;
  private readonly UPDATE_INTERVAL = 100;

  constructor(
    private readonly connectionManager: ConnectionManager,
    private readonly currentPlayerService: CurrentPlayerService
  ) {
    super({ key: 'GameScene' });
    
    this.playerScene = new PlayerScene();
    this.enemyScene = new EnemyScene();
    this.mapScene = new MapScene();
    this.connectionStatsScene = new ConnectionStatsScene(this.connectionManager);
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
    this.collisionManager = new CollisionManager(this.connectionManager, this.playerManager, this.enemyManager, this.generateEnemiesAfterEvent);
    this.connectionStatsScene.setPlayerManager(this.playerManager);

    // Initialize game
    this.setLocalPlayer();
    this.generateEnemies();

    // Add game end scene
    this.gameEndScene = new GameEndScene();
    this.scene.add('GameEndScene', this.gameEndScene, false);

    this.gameInitialized = this.connectionManager.isMasterPeer;
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

  private checkGameEnd() {
    const players = this.playerManager.getPlayers();
    const onePlayerLeft = players.length === 1;
    const noEnemies = this.enemyManager.getEnemies().length === 0;

    if (onePlayerLeft && noEnemies) {
      const winner = players[0];
      this.scene.launch('GameEndScene', {
        winnerIsLocal: winner.id === this.playerManager.getLocalPlayer()?.id,
        winnerName: winner.name
      });
    }
  }

  private generateEnemies(count: number = 10) {
    if (this.connectionManager.isMasterPeer) {
      this.enemyManager.generateEnemies(count);
    }
  }

  override update() {
    this.playerManager.update();
    this.enemyManager.update();
    this.collisionManager.checkCollisions();
    this.gameInitialized && this.checkGameEnd();

    this.shouldUpdate && this.connectionManager.isMasterPeer && this.broadcastAll();
  }

  private coordinateScenes() {
    const scenes = [this.mapScene, this.playerScene, this.enemyScene, this.connectionStatsScene];

    // Add scenes in correct order
    this.scene.add('MapScene', this.mapScene, true);
    this.scene.add('EnemyScene', this.enemyScene, true);
    this.scene.add('PlayerScene', this.playerScene, true);
    this.scene.add('ConnectionStatsScene', this.connectionStatsScene, true);

    // Set scenes as layers on top of the main
    this.scene.bringToTop('MapScene');
    this.scene.bringToTop('EnemyScene');
    this.scene.bringToTop('PlayerScene');
    this.scene.bringToTop('ConnectionStatsScene');

    // Link cameras of all scenes
    this.playerScene.cameras.main.setScroll(0, 0);
    this.enemyScene.cameras.main.setScroll(0, 0);
    this.mapScene.cameras.main.setScroll(0, 0);
    this.connectionStatsScene.cameras.main.setScroll(0, 0);

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
    const { player, enemy, winner, loser, enemies, players, type } = update;

    switch (type) {
      case 'allUpdate':
        this.enemyManager.setEnemies(enemies!);
        this.playerManager.updatePlayers(players!);
        break;
      case 'playerLeft':
        this.playerManager.removeRemotePlayer(player!.id!);
        break;
      case 'playerJoin':
        this.playerManager.createPlayer(player!.id!, player!.name!, player!.position!);
        break;
      case 'playerUpdate':
        this.playerManager.updatePlayerState(player!.id!, player!);
        break;
      case 'collision':
        this.playerManager.updatePlayerState(player!.id, { radius: player!.radius });
        this.enemyManager.removeEnemy(enemy!.id);
        this.generateEnemiesAfterEvent();
        break;
      case 'playerCollision':
        this.playerManager.updatePlayerState(winner!.id, { radius: winner!.radius });
        this.playerManager.removeRemotePlayer(loser!.id);
        break;
    }

    !this.gameInitialized && (this.gameInitialized = true);
  }

  public generateEnemiesAfterEvent = () => {
    const enemiesCount = this.enemyManager.getEnemies().length;
    const playersCount = this.playerManager.getOtherPlayers().length;
    if (playersCount > 0 && enemiesCount <= this.enemyManager.maxEnemies / 5) {
      this.generateEnemies(this.enemyManager.maxEnemies + 5);
    }
  }

  public get shouldUpdate() {
    const currentTime = Date.now();
    return currentTime - this.lastUpdateTime >= this.UPDATE_INTERVAL;
  }

  private broadcastAll = () => {
    this.connectionManager.broadcastGameState({
      type: 'allUpdate',
      enemies: this.enemyManager.getEnemies().map(e => ({
        ...e.getState<EnemyUpdate>(),
      })),
      players: this.playerManager.getPlayers(),
    });
    this.lastUpdateTime = Date.now();
  }
}
