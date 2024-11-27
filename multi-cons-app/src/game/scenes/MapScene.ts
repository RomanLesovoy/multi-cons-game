import config from "../config";

export class MapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MapScene' });
  }

  preload() {
    // Загружаем текстуру
    this.load.image('floor_texture', 'assets/floor_texture.jpg');
  }

  static getRandomPosition() {
    return {
      x: Math.random() * (config.mapWidth - 100) + 50, // Offset from edges
      y: Math.random() * (config.mapHeight - 100) + 50
    }
  }

  create() {
    // Calculate the number of tiles to fill the entire map
    const tilesX = Math.ceil(config.mapWidth / 200);
    const tilesY = Math.ceil(config.mapHeight / 200);

    // Create a group for tiles
    const groundGroup = this.add.group();

    // Fill the map with tiles
    for (let x = 0; x < tilesX; x++) {
      for (let y = 0; y < tilesY; y++) {
        const tile = this.add.image(x * 200, y * 200, 'floor_texture');
        tile.setOrigin(0, 0); // Set origin to top left
        groundGroup.add(tile);
      }
    }

    // Add map boundaries on top of the texture
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0xffffff);
    graphics.strokeRect(0, 0, config.mapWidth, config.mapHeight);

    // Configure the camera
    this.cameras.main.setBounds(0, 0, config.mapWidth, config.mapHeight);
    this.cameras.main.setBackgroundColor(0x000000);
  }
}
