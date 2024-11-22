import { GameEntity } from "../entities/GameEntity";
import Phaser from 'phaser';

export abstract class BaseEntityScene extends Phaser.Scene {
  protected entities: Map<string, Phaser.GameObjects.Arc> = new Map();

  protected createEntitySprite(entity: GameEntity): Phaser.GameObjects.Arc {
    const sprite = this.add.circle(
      entity.position.x,
      entity.position.y,
      entity.radius,
      Phaser.Display.Color.HexStringToColor(entity.color || '#ff0000').color
    );

    this.entities.set(entity.id, sprite);
    return sprite;
  }

  protected removeEntity(id: string) {
    const sprite = this.entities.get(id);
    if (sprite) {
      sprite.destroy();
      this.entities.delete(id);
    }
  }
}
