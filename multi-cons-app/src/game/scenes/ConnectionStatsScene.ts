import Phaser from "phaser";
import { ConnectionManager, ConnectionStats } from "../../app/services/ConnectionManager";
import { PlayerManager } from "../managers/PlayerManager";

export class ConnectionStatsScene extends Phaser.Scene {
  private connectionInfoTexts: Phaser.GameObjects.Text[] = [];
  private playerManager?: PlayerManager;

  constructor(
    private readonly connectionManager: ConnectionManager,
  ) {
    super('ConnectionStatsScene');
  }

  create() {
    setInterval(() => {
      try {
        this.setTexts();
      } catch {}
    }, 2000);
  }

  public setPlayerManager(playerManager: PlayerManager) {
    this.playerManager = playerManager;
  }

  private setTexts() {
    this.connectionInfoTexts.forEach(text => text.destroy());
    this.connectionInfoTexts = [];

    this.playerManager?.getOtherPlayers().forEach((player, index) => {
      const stats = this.connectionManager.getPeerStats(player.id)!;
      const { quality, color } = this.getConnectionQualityText(stats);
     
      const text = `${player.name}: ${quality}`;
      this.connectionInfoTexts[index] = this.add.text(10, 10 + index * 20, text, {
        fontSize: '14px',
        color,
        backgroundColor: '#000000',
        padding: { x: 5, y: 5 }
      })
      .setScrollFactor(0)
      .setDepth(100);
    });
  }

  private getConnectionQualityText(stats: ConnectionStats) {
    let quality = 'Poor';
    let color = '#ff0000';

    if (stats.currentRoundTripTime) {
      stats.currentRoundTripTime < 200 && (quality = 'Fair') && (color = '#ffa500');
      stats.currentRoundTripTime < 100 && (quality = 'Good') && (color = '#ffff00');
      stats.currentRoundTripTime < 50 && (quality = 'Excellent') && (color = '#00ff00');
    }

    return { quality, color };
  }
}
