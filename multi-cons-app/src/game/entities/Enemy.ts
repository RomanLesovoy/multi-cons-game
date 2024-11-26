import { GameEntity } from "./GameEntity";
import { EnemyState, Position } from "./GameTypes";
import config from "../config";

export class Enemy extends GameEntity implements EnemyState {
  private velocity: Position = { x: 0, y: 0 };
  public speed: number;
  private readonly worldBounds: { width: number; height: number };

  constructor(
    id: string,
    name: string,
    position: Position,
    radius: number,
    color?: string,
    speed?: number
) {
    super(id, name, position, radius, color);

    this.speed = speed || 10;
    this.worldBounds = {
      width: config.mapWidth,
      height: config.mapHeight
    };
  }

  update() {
    // Random movement
    this.velocity.x += (Math.random() - 0.5) * 0.5;
    this.velocity.y += (Math.random() - 0.5) * 0.5;

    // Limit speed
    this.velocity.x = Phaser.Math.Clamp(this.velocity.x, -this.speed, this.speed);
    this.velocity.y = Phaser.Math.Clamp(this.velocity.y, -this.speed, this.speed);
    
    // Update position with borders
    this.position.x = Phaser.Math.Clamp(
      this.position.x + this.velocity.x,
      this.radius,
      this.worldBounds.width - this.radius
    );
    this.position.y = Phaser.Math.Clamp(
      this.position.y + this.velocity.y,
      this.radius,
      this.worldBounds.height - this.radius
    );

    // Reflect movement from borders
    if (this.position.x <= this.radius || this.position.x >= this.worldBounds.width - this.radius) {
      this.velocity.x *= -0.8;
    }
    if (this.position.y <= this.radius || this.position.y >= this.worldBounds.height - this.radius) {
      this.velocity.y *= -0.8;
    }

    if (this.sprite) {
      this.sprite.setPosition(this.position.x, this.position.y);
    }
  }

  public override getState<EnemyState>(): EnemyState {
    const state = super.getState<Enemy>();
    return {
      ...state,
      velocity: this.velocity,
    } as EnemyState;
  }

  public override updateEntityState(state: Partial<EnemyState & { velocity?: Position }>) {
    super.updateEntityState(state);
    if (state.velocity) {
      this.velocity = state.velocity;
    }
  }
}
