import { Enemy } from "../entities/Enemy";
import { BaseEntityScene } from "./BaseEntityScene";

export class EnemyScene extends BaseEntityScene {
  constructor() {
    super('EnemyScene');
  }

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
    for (const [id, _sprite] of this.entities) {
      if (!currentEnemyIds.has(id)) {
        this.removeEntity(id);
      }
    }

    // Update or add new enemies
    enemies.forEach(enemy => {
      const entity = this.getEntity(enemy.id);
      if (!entity?.sprite) {
        enemy.setSprite(this.createEntitySprite(enemy));
      } else {
        this.updateEntityPosition(enemy.id, enemy.position.x, enemy.position.y);
      }
    });
  }
}
