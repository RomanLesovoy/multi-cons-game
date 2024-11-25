import { Enemy } from "../entities/Enemy";
import { EnemyUpdate, Position } from "../entities/GameTypes";
import { ConnectionManager } from "../../app/services/ConnectionManager";
import { EnemyScene } from "../scenes/EnemyScene";

export class EnemyManager {
  private enemies: Enemy[] = [];
  
  constructor(
    private connectionManager: ConnectionManager,
    private scene: EnemyScene
  ) {}

  generateEnemies(count: number) {
    if (!this.connectionManager.isMasterPeer) return;

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
  }

  getRandomPosition(): Position {
    return {
      x: Math.random() * this.scene.cameras.main.width,
      y: Math.random() * this.scene.cameras.main.height
    };
  }

  setEnemies(enemies: EnemyUpdate[]) {
    if (this.connectionManager.isMasterPeer) return;

    this.enemies = enemies.map(enemy => new Enemy(enemy.id, enemy.name, enemy.position, enemy.speed));
    this.scene.syncEnemies(this.enemies);
  }

  pushEnemies(enemies: EnemyUpdate[]) {
    if (this.connectionManager.isMasterPeer) return;

    const prev = this.enemies;
    const newEnemies = enemies.map(enemy => new Enemy(enemy.id, enemy.name, enemy.position, enemy.speed));
    this.enemies = [...prev, ...newEnemies];
    this.scene.syncEnemies(this.enemies);
  }

  update() {
    if (!this.connectionManager.isMasterPeer) return;

    this.enemies.forEach(enemy => enemy.update());

    this.connectionManager.broadcastGameState({
      type: 'enemiesUpdate',
      enemies: this.enemies.map(e => e.getState<EnemyUpdate>())
    });
  }
}
