import { PlayerState, Position } from "../entities/GameTypes";
import Phaser from "phaser";
import { Player } from "../entities/Player";
import { ConnectionManager } from "../../app/services/ConnectionManager";
import { PlayerScene } from "../scenes/PlayerScene";
import config from "../config";
import { BaseManager } from "./BaseManager";

export class PlayerManager extends BaseManager {
  private readonly cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly moveSpeed = 5;
  private readonly players: Map<string, Player> = new Map();
  private localPlayerId!: string;
  private readonly worldBounds = {
    x: 0,
    y: 0,
    width: config.mapWidth,
    height: config.mapHeight
  };

  constructor(
    protected override connectionManager: ConnectionManager,
    private scene: PlayerScene
  ) {
    super(connectionManager);
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
  }

  update() {
    this.moveLocalPlayer();
  }

  public createLocalPlayer(playerId: string, playerName: string, position: Position) {
    if (this.getPlayer(playerId)) return;

    this.connectionManager.broadcastGameState({
      type: 'playerJoin',
      player: { id: playerId, name: playerName, position }
    });
    this.localPlayerId = playerId;
    this.createPlayer(playerId, playerName, position);
    this.updateCamera(position);
  }

  public createPlayer(playerId: string, playerName: string, position: Position) {
    if (this.getPlayer(playerId)) return;

    const player = new Player(playerId, playerName, position);
    this.players.set(playerId, player);
    this.scene.addPlayer(player);
  }

  public removeRemotePlayer(playerId: string) {
    this.players.delete(playerId);
    this.scene.removePlayer(playerId);
  }

  public getLocalPlayer(): Player | undefined {
    return this.getPlayer(this.localPlayerId);
  }

  public getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  public getOtherPlayers(): Player[] {
    return this.getPlayers().filter(player => player.id !== this.localPlayerId);
  }

  public getPlayers(): Player[] {
    return Array.from(this.players.values());
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

  /**
   * It needed to prevent player from moving out of the visible area
   */
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

  public updatePlayerState(id: string, state: Partial<PlayerState>) {
    const player = this.players.get(id);
    if (player) {
      player.updateEntityState(state);
    } else {
      console.warn('Player not found in updatePlayerState', id);
    }
  }
  
  public updateCurrentPlayerState(state: Partial<PlayerState>) {
    this.updatePlayerState(this.localPlayerId, state);

    this.connectionManager.broadcastGameState({
      type: 'playerUpdate',
      player: { id: this.localPlayerId, ...state }
    });
  }
}
