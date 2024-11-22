import { Enemy } from "../entities/Enemy";
import { BaseEntityScene } from "./BaseEntityScene";

export class EnemyScene extends BaseEntityScene {
  addEnemy(enemy: Enemy) {
    const sprite = this.createEntitySprite(enemy);
    enemy.setSprite(sprite);
  }

  removeEnemy(enemyId: string) {
    this.removeEntity(enemyId);
  }

  syncEnemies(enemies: Enemy[]) {
    // Remove enemies that are no longer in the list
    const currentEnemyIds = new Set(enemies.map(e => e.id));
    for (const [id, sprite] of this.entities) {
        if (!currentEnemyIds.has(id)) {
            this.removeEntity(id);
        }
    }

    // Update or add new enemies
    enemies.forEach(enemy => {
        let sprite = this.entities.get(enemy.id);
        if (!sprite) {
            sprite = this.createEntitySprite(enemy);
            enemy.setSprite(sprite);
        } else {
            sprite.setPosition(enemy.position.x, enemy.position.y);
        }
    });
  }
}
