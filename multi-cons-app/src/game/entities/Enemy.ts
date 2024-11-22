import { GameEntity } from "./GameEntity";
import { EnemyState, Position } from "./GameTypes";

export class Enemy extends GameEntity implements EnemyState {
  private velocity: Position = { x: 0, y: 0 };

  constructor(
    id: string,
    name: string,
    position: Position,
    radius: number,
    color?: string
) {
    super(id, name, position, radius, color);
  }

  update() {
      // Random movement
      this.velocity.x += (Math.random() - 0.5) * 0.5;
      this.velocity.y += (Math.random() - 0.5) * 0.5;
      
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;

      if (this.sprite) {
        this.sprite.setPosition(this.position.x, this.position.y);
      }
  }
}
