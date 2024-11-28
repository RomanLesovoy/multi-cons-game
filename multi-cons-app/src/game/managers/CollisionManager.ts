import { ConnectionManager } from "../../app/services/ConnectionManager";
import { Enemy } from "../entities/Enemy";
import { GameEntity } from "../entities/GameEntity";
import { Player } from "../entities/Player";
import { EnemyManager } from "./EnemyManager";
import { PlayerManager } from "./PlayerManager";

export class CollisionManager {
  constructor(
    private readonly connectionManager: ConnectionManager,
    private readonly playerManager: PlayerManager,
    private readonly enemyManager: EnemyManager,
    private readonly onCollision: Function,
  ) {}

  private isColliding(entity1: GameEntity, entity2: GameEntity): boolean {
    const dx = entity1.position.x - entity2.position.x;
    const dy = entity1.position.y - entity2.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < entity1.radius + entity2.radius;
  }

  public checkCollisions() {
    const localPlayer = this.playerManager.getLocalPlayer();
    if (!localPlayer) return;
  
    // Check collisions with enemies
    const enemies = this.enemyManager.getEnemies();
    enemies.forEach(enemy => {
      if (this.isColliding(localPlayer, enemy)) {
        this.handleEnemyCollision(localPlayer, enemy);
      }
    });
  
    // Check collisions with other players
    const otherPlayers = this.playerManager.getOtherPlayers();
    otherPlayers.forEach(otherPlayer => {
      if (this.isColliding(localPlayer, otherPlayer)) {
        this.handlePlayerCollision(localPlayer, otherPlayer);
      }
    });
  }
  
  private handleEnemyCollision(player: Player, enemy: Enemy) {
    const collisionEffect = (radius: number) => {
      this.enemyManager.removeEnemy(enemy.id);
      this.playerManager.updateCurrentPlayerState({ radius });
      this.onCollision();

      this.connectionManager.broadcastGameState({
        type: 'collision',
        player: { 
          id: player.id,
          radius 
        },
        enemy: { id: enemy.id }
      });
    };

    if (player.radius > enemy.radius) {
      const newRadius = +(player.radius + (enemy.radius / 10));
      collisionEffect(newRadius);
    } else {
      const newRadius = +(player.radius - (enemy.radius / 10));
      collisionEffect(newRadius);
    }
  }
  
  private handlePlayerCollision(localPlayer: Player, otherPlayer: Player) {
    // Big player eats small player
    if (localPlayer.radius > otherPlayer.radius) {
      const newRadius = +(localPlayer.radius + (otherPlayer.radius / 5));
  
      this.playerManager.updateCurrentPlayerState({ radius: newRadius });
      this.playerManager.removeRemotePlayer(otherPlayer.id);
      
      this.connectionManager.broadcastGameState({
        type: 'playerCollision',
        winner: { 
          id: localPlayer.id,
          radius: newRadius 
        },
        loser: { 
          id: otherPlayer.id 
        }
      });
    }
  }
}
