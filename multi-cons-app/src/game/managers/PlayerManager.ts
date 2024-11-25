import { PlayerState, Position } from "../entities/GameTypes";
import { Player } from "../entities/Player";
import { ConnectionManager } from "../../app/services/ConnectionManager";
import { PlayerScene } from "../scenes/PlayerScene";
import config from "../config";

export class PlayerManager {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private moveSpeed = 5;
  private players: Map<string, Player> = new Map();
  private localPlayerId!: string;
  private worldBounds = {
    x: 0,
    y: 0,
    width: config.mapWidth,
    height: config.mapHeight
  };

  constructor(
    private connectionManager: ConnectionManager,
    private scene: PlayerScene
  ) {
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
  }

  update() {
    this.moveLocalPlayer();
  }

  public createLocalPlayer(playerId: string, playerName: string, position: Position) {
    this.localPlayerId = playerId;
    const player = new Player(this.localPlayerId, playerName, position);
    this.players.set(this.localPlayerId, player);
    this.scene.addPlayer(player);

    this.connectionManager.broadcastGameState({
      type: 'playerJoin',
      player: { id: playerId, name: playerName, position }
    });
  }

  public createRemotePlayer(playerId: string, playerName: string, position: Position) {
    const player = new Player(playerId, playerName, position);
    this.players.set(playerId, player);
    this.scene.addPlayer(player);
  }

  private updateCamera(position: Position) {
    // Update camera position in GameScene
    this.scene.events.emit('camera-update', position.x, position.y);
  }

  private moveLocalPlayer() {
    const player = this.players.get(this.localPlayerId);
    if (!player) return;

    let dx = 0;
    let dy = 0;

    // Handle movement
    if (this.cursors.left.isDown) {
      dx -= this.moveSpeed;
    }
    if (this.cursors.right.isDown) {
      dx += this.moveSpeed;
    }
    if (this.cursors.up.isDown) {
      dy -= this.moveSpeed;
    }
    if (this.cursors.down.isDown) {
      dy += this.moveSpeed;
    }

    // If there was movement
    if (dx !== 0 || dy !== 0) {
     const newPosition = this.movementInVisibleArea(dx, dy, player);

      // Update current player state & broadcast to all clients
      if (newPosition.x !== player.position.x || newPosition.y !== player.position.y) {
        this.updateCurrentPlayerState({ position: newPosition });
        this.updateCamera(newPosition);
      }
    }
  }

  private movementInVisibleArea(dx: number, dy: number, player: Player): Position {
    const newPosition = {
      x: Phaser.Math.Clamp(
        player.position.x + dx,
        player.radius, // Min X position with radius
        this.worldBounds.width - player.radius // Max X position
      ),
      y: Phaser.Math.Clamp(
        player.position.y + dy,
        player.radius, // Min Y position with radius
        this.worldBounds.height - player.radius // Max Y position
      )
    };

    return newPosition;
  }

  public updateRemotePlayerState(id: string, state: Partial<PlayerState>) {
    const player = this.players.get(id);
    if (player) {
      player.updateEntityState(state);
    } else {
      console.warn('Player not found in updateRemotePlayerState', id);
    }
  }
  
  private updateCurrentPlayerState(state: Partial<PlayerState>) {
    const player = this.players.get(this.localPlayerId);
    if (player) {
      player.updateEntityState(state);

      this.connectionManager.broadcastGameState({
        type: 'playerUpdate',
        player: { id: this.localPlayerId, ...state }
      });
    }
  }
}
