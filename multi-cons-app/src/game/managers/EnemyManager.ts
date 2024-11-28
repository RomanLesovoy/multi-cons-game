import { Enemy } from "../entities/Enemy";
import { EnemyUpdate } from "../entities/GameTypes";
import { ConnectionManager } from "../../app/services/ConnectionManager";
import { EnemyScene } from "../scenes/EnemyScene";
import { BaseManager } from "./BaseManager";
import { MapScene } from "../scenes/MapScene";

export class EnemyManager extends BaseManager {
  private enemies: Enemy[] = [];
  public maxEnemies: number = 20;
  
  constructor(
    protected override connectionManager: ConnectionManager,
    private scene: EnemyScene
  ) {
    super(connectionManager);
  }

  public generateEnemies = (count: number) => this.onlyMasterPeerDecorator(() => {
    this.maxEnemies = count;
    for (let i = 0; i < count; i++) {
      const enemy = new Enemy(
        crypto.randomUUID(),
        `Enemy ${i + 1}`,
        MapScene.getRandomPosition(),
        Math.floor(Math.random() * 25) + 5,
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

  update() {
    this.enemies.forEach(enemy => enemy.update());
    this.scene.syncEnemies(this.enemies);
  }
}
