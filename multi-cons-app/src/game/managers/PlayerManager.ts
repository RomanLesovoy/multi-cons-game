import { PlayerState, Position } from "../entities/GameTypes";
import { Player } from "../entities/Player";
import { ConnectionManager } from "./ConnectionManager";
import { PlayerScene } from "../scenes/PlayerScene";

export class PlayerManager {
  private players: Map<string, Player> = new Map();
  private localPlayerId: string;

  constructor(
    private connectionManager: ConnectionManager,
    private scene: PlayerScene
  ) {
    this.localPlayerId = crypto.randomUUID();
  }

  createLocalPlayer(name: string, position: Position) {
    const player = new Player(this.localPlayerId, name, position);
    this.players.set(this.localPlayerId, player);
    this.scene.addPlayer(player);
  }

  updateRemotePlayerState(id: string, state: Partial<PlayerState>) {
    const player = this.players.get(id);
    if (player) {
      player.updatePlayerState(state);
    }
  }

  
  updateCurrentPlayerState(state: Partial<PlayerState>) {
        const player = this.players.get(this.localPlayerId);
        if (player) {
            player.updatePlayerState(state);
            this.connectionManager.broadcastGameState({
                type: 'playerUpdate',
                player: state
            });
        }
    }
}
