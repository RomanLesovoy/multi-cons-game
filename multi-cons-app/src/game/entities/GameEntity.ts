import { Position, PlayerState } from "./GameTypes";

export class GameEntity {
  public id: string;
  public position: Position;
  public radius: number;
  public color: string;
  protected sprite!: Phaser.GameObjects.Arc;

  constructor(id: string, public name: string, position: Position, radius?: number, color?: string) {
    this.id = id;
    this.position = position;
    this.color = color || GameEntity.getRandomColor();
    this.radius = radius || 20;
  }

  private static getRandomColor(): string {
    return Phaser.Display.Color.RandomRGB().toString();
  }

  public updatePlayerState(state: Partial<PlayerState>) {
    this.position = state.position || this.position;
    state.position && this.sprite.setPosition(state.position.x, state.position.y);
    state.radius && (this.radius = state.radius);
    state.color && (this.color = state.color);
  }

  public setSprite(sprite: Phaser.GameObjects.Arc) {
    this.sprite = sprite;
  }

  public getState(): PlayerState {
    return {
      id: this.id,
      position: this.position,
      radius: this.radius,
      name: this.name,
      color: this.color
    };
  }
}
