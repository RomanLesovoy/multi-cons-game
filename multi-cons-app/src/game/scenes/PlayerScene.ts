import { Player } from "../entities/Player";
import { BaseEntityScene } from "./BaseEntityScene";

export class PlayerScene extends BaseEntityScene {
  constructor() {
    super('PlayerScene');
  }

  addPlayer(player: Player) {
    const sprite = this.createEntitySprite(player);
    player.setSprite(sprite);
  }

  removePlayer(playerId: string) {
    this.removeEntity(playerId);
  }
}
