import { Enemy } from "../entities/Enemy";
import { EnemyUpdate, Position } from "../entities/GameTypes";
import { ConnectionManager } from "../../app/services/ConnectionManager";
import { EnemyScene } from "../scenes/EnemyScene";
import { BaseManager } from "./BaseManager";
import config from "../config";

export class EnemyManager extends BaseManager {
  private enemies: Enemy[] = [];
  // private lastUpdateTime: number = 0;
  // private readonly UPDATE_INTERVAL = 50;
  
  constructor(
    protected override connectionManager: ConnectionManager,
    private scene: EnemyScene
  ) {
    super(connectionManager);
  }

  public generateEnemies = (count: number) => this.onlyMasterPeerDecorator(() => {
    for (let i = 0; i < count; i++) {
      const enemy = new Enemy(
        crypto.randomUUID(),
        `Enemy ${i + 1}`,
        this.getRandomPosition(),
        Math.random() * 20 + 10,
      );
      this.enemies.push(enemy);
      this.scene.addEnemy(enemy);
    }
  })

  public getEnemies = (): Enemy[] => this.enemies;

  private getRandomPosition(): Position {
    return {
      x: Math.random() * (config.mapWidth - 100) + 50, // Offset from edges
      y: Math.random() * (config.mapHeight - 100) + 50
    };
  }

  public setEnemies = (enemies: EnemyUpdate[]) => {
    const existingEnemies = new Map(this.enemies.map(e => [e.id, e]));
    
    this.enemies = enemies.map(enemyUpdate => {
      const existingEnemy = existingEnemies.get(enemyUpdate.id);
      if (existingEnemy) {
        existingEnemy.updateEntityState(enemyUpdate);
        return existingEnemy;
      } else {
        return new Enemy(
          enemyUpdate.id,
          enemyUpdate.name,
          enemyUpdate.position,
          enemyUpdate.radius || 15,
          enemyUpdate.color,
          enemyUpdate.speed
        );
      }
    });

    this.scene.syncEnemies(this.enemies);
  }

  update() {
    this.enemies.forEach(enemy => enemy.update());

    if (this.connectionManager.isMasterPeer) {
      this.broadcastEnemies();
    }
  }

  public broadcastEnemies = () => this.onlyMasterPeerDecorator(() => {
    this.connectionManager.broadcastGameState({
      type: 'enemiesUpdate',
      enemies: this.enemies.map(e => ({
        ...e.getState<EnemyUpdate>(),
      }))
    });
  })
}
