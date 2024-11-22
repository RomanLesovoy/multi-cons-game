export class MapScene extends Phaser.Scene {
  constructor() {
      super({ key: 'MapScene' });
  }

  create() {
      // Create game world boundaries
      const graphics = this.add.graphics();
      graphics.lineStyle(2, 0xffffff);
      graphics.strokeRect(0, 0, 2000, 2000);
      
      // Setup camera
      this.cameras.main.setBounds(0, 0, 2000, 2000);
  }
}