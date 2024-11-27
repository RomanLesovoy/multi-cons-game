import { BaseEntityScene } from "../scenes/BaseEntityScene";
import { Position } from "./GameTypes";

export class GameEntity {
  public id: string;
  public type: 'player' | 'enemy';
  public position: Position;
  public radius: number;
  public color: string;
  protected sprite!: Phaser.GameObjects.Arc;

  constructor(id: string, type: 'player' | 'enemy', public name: string, position: Position, radius?: number, color?: string) {
    this.id = id;
    this.type = type;
    this.position = position;
    this.color = color || GameEntity.getRandomColor();
    this.radius = radius || 20;
  }

  private static getRandomColor(): string {
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
  }

  public updateEntityState(state: Partial<GameEntity>) {
    if (state.position) {
      this.position = state.position;
      if (this.sprite) {
        const scene = this.sprite.scene as BaseEntityScene;
        scene.updateEntityPosition(this.id, state.position.x, state.position.y);
      }
    }
    
    if (state.radius) {
      this.radius = state.radius;
      this.sprite.setRadius(state.radius);
      const entity = (this.sprite.scene as BaseEntityScene).getEntity(this.id);
      if (entity) {
        entity.statsText.setText(`${100 * this.radius}`);
      }
    }
    
    if (state.color) {
      this.color = state.color;
      this.sprite.setFillStyle(
        Phaser.Display.Color.HexStringToColor(this.color).color
      );
    }
  }

  public setSprite(sprite: Phaser.GameObjects.Arc) {
    this.sprite = sprite;
  }

  public getState<T extends object>(): T {
    // Create a new object with only the needed properties
    const state = {} as T;
    
    // Get all keys from the interface T
    const keys = Object.keys(this) as Array<keyof T>;
    
    // Copy only properties that are in the interface
    keys.forEach(key => {
      if (key in this) {
        // @ts-ignore // todo not sure
        state[key] = this[key as keyof this] as T[keyof T];
      }
    });

    return state;
  }
}
