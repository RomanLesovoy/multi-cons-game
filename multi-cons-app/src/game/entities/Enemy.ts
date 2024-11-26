import { GameEntity } from "./GameEntity";
import { EnemyState, Position } from "./GameTypes";
import config from "../config";

export class Enemy extends GameEntity implements EnemyState {
  private velocity: Position = { x: 0, y: 0 };
  public speed: number;
  private readonly baseSpeed: number = 2; // Default speed
  private readonly minSpeed: number = 0.5; // Minimum speed
  private readonly maxSpeed: number = 3; // Maximum speed
  private readonly accelerationRate: number = 0.4;
  private direction: Position = { 
    x: Math.random() * 2 - 1, 
    y: Math.random() * 2 - 1 
  };
  private readonly worldBounds: { width: number; height: number };

  constructor(
    id: string,
    name: string,
    position: Position,
    radius: number,
    color?: string,
) {
    super(id, 'enemy', name, position, radius, color);

    this.speed = this.baseSpeed;
    this.worldBounds = {
      width: config.mapWidth,
      height: config.mapHeight
    };
    // Normalize initial direction
    const length = Math.sqrt(this.direction.x * this.direction.x + this.direction.y * this.direction.y);
    this.direction.x /= length;
    this.direction.y /= length;
  }

  update() {
    // Smoothly change direction
    this.direction.x += (Math.random() - 0.5) * this.accelerationRate;
    this.direction.y += (Math.random() - 0.5) * this.accelerationRate;

    // Normalize direction
    const length = Math.sqrt(this.direction.x * this.direction.x + this.direction.y * this.direction.y);
    this.direction.x /= length;
    this.direction.y /= length;

    // Update velocity based on direction and current speed
    this.velocity.x = this.direction.x * this.speed;
    this.velocity.y = this.direction.y * this.speed;

    // Random small change in speed
    this.speed += (Math.random() - 0.5) * 0.1;
    this.speed = Phaser.Math.Clamp(this.speed, this.minSpeed, this.maxSpeed);
    
    // Update position
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

    // Reflection from borders
    if (this.position.x <= this.radius || this.position.x >= this.worldBounds.width - this.radius) {
      this.direction.x *= -1;
      this.speed = this.baseSpeed; // Reset speed on reflection
    }
    if (this.position.y <= this.radius || this.position.y >= this.worldBounds.height - this.radius) {
      this.direction.y *= -1;
      this.speed = this.baseSpeed; // Reset speed on reflection
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
      direction: this.direction,
      speed: this.speed
    } as EnemyState;
  }

  public override updateEntityState(state: Partial<EnemyState & { 
    velocity?: Position;
    direction?: Position;
    speed?: number;
  }>) {
    super.updateEntityState(state);
    if (state.velocity) this.velocity = state.velocity;
    if (state.direction) this.direction = state.direction;
    if (state.speed) this.speed = state.speed;
  }
}
