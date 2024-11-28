import Phaser from "phaser";

export class GameEndScene extends Phaser.Scene {
  constructor() {
    super('GameEndScene');
  }

  create(data: { winnerIsLocal: boolean; winnerName: string }) {
    const bg = this.add.rectangle(
      0, 0,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000, 0.7
    );
    bg.setOrigin(0);
    bg.setScrollFactor(0);
    bg.setDepth(1000);

    const winText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 50,
      data.winnerIsLocal ? 'You win!' : `${data.winnerName} wins!`,
      {
        fontSize: '32px',
        color: '#ffffff'
      }
    );
    winText.setOrigin(0.5);
    winText.setScrollFactor(0);
    winText.setDepth(1001);
  }
}
