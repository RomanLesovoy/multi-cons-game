import { Enemy } from "../entities/Enemy";
import { EnemyUpdate } from "../entities/GameTypes";
import { ConnectionManager } from "../../app/services/ConnectionManager";
import { EnemyScene } from "../scenes/EnemyScene";
import { BaseManager } from "./BaseManager";
import { MapScene } from "../scenes/MapScene";

export class EnemyManager extends BaseManager {
  private enemies: Enemy[] = [];
  // private lastUpdateTime: number = 0;
  // private readonly UPDATE_INTERVAL = 20;
  
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
        MapScene.getRandomPosition(),
        Math.floor(Math.random() * 30) + 4,
      );
      this.enemies.push(enemy);
      this.scene.addEnemy(enemy);
    }
  })

  public getEnemies = (): Enemy[] => this.enemies;

  public removeEnemy(enemyId: string) {
    this.enemies = this.enemies.filter(enemy => enemy.id !== enemyId);
    this.scene.removeEnemy(enemyId);
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
        );
      }
    });
  }

  // Avoid overload memory
  // public get shouldUpdate() {
  //   const currentTime = Date.now();
  //   return currentTime - this.lastUpdateTime >= this.UPDATE_INTERVAL;
  // }

  update() {
    // if (!this.shouldUpdate) return;

    this.enemies.forEach(enemy => enemy.update());
    this.scene.syncEnemies(this.enemies);

    if (this.connectionManager.isMasterPeer) {
      this.broadcastEnemies();
    }

    // this.lastUpdateTime = Date.now();
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
