import { Enemy } from "../entities/Enemy";
import { Position } from "../entities/GameTypes";
import { ConnectionManager } from "./ConnectionManager";
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

  update() {
      if (!this.connectionManager.isMasterPeer) return;

      this.enemies.forEach(enemy => enemy.update());
      this.connectionManager.broadcastGameState({
          type: 'enemiesUpdate',
          enemies: this.enemies.map(e => e.getState())
      });
  }
}
