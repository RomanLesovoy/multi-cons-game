import { PlayerState, Position } from "./GameTypes";
import { GameEntity } from "./GameEntity";

export class Player extends GameEntity implements PlayerState {
  constructor(id: string, name: string, position: Position) {
    super(id, 'player', name, position);
  }
}
