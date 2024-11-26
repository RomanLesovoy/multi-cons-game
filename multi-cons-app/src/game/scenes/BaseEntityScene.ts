import { GameEntity } from "../entities/GameEntity";
import config from "../config";

const testConfig = {
  stroke: '#000000',
  strokeThickness: 1,
  color: '#ffffff',
  backgroundColor: '#000000b0',
  align: 'center',
}

export abstract class BaseEntityScene extends Phaser.Scene {
  protected readonly entities: Map<string, {
    sprite: Phaser.GameObjects.Arc;
    nameText: Phaser.GameObjects.Text | null;
    statsText: Phaser.GameObjects.Text;
  }> = new Map();

  create() {
    // Make scene transparent
    this.cameras.main.transparent = true;
    this.physics.world.setBounds(0, 0, config.mapWidth, config.mapHeight);
    this.cameras.main.setBounds(0, 0, config.mapWidth, config.mapHeight);
  }

  protected createEntitySprite(entity: GameEntity): Phaser.GameObjects.Arc {
    const color = Phaser.Display.Color.HexStringToColor(entity.color).color;

    // Create entity sprite
    const sprite = this.add.circle(
      entity.position.x,
      entity.position.y,
      entity.radius,
      color,
    );

    sprite.setStrokeStyle(2, 0x000000);

    // Add physics
    this.physics.add.existing(sprite, false);
    (sprite.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);

    const { nameText, statsText } = this.addEntityTexts(entity);

    // Save all elements
    this.entities.set(entity.id, {
      sprite,
      nameText,
      statsText
    });

    return sprite;
  }

  private addEntityTexts(entity: GameEntity) {
    // Add name
    let nameText: Phaser.GameObjects.Text | null = null;
    if (entity.type === 'player') {
      nameText = this.add.text(
        entity.position.x,
        entity.position.y,
        entity.name,
        { fontSize: '16px', ...testConfig }
      );
      nameText.setOrigin(0.5); // Center text
   }

    // Add radius below
    const statsText = this.add.text(
      entity.position.x,
      entity.position.y + entity.radius + 10,
      `${100 * entity.radius}`,
      { fontSize: '14px', ...testConfig }
    );
    statsText.setOrigin(0.5);

    return { nameText, statsText };
  }

  public getEntity(id: string) {
    return this.entities.get(id);
  }

  protected removeEntity(id: string) {
    const entity = this.entities.get(id);
    if (entity) {
      entity.sprite.destroy();
      entity.nameText?.destroy();
      entity.statsText.destroy();
      this.entities.delete(id);
    }
  }

  // Add method to update text position
  public updateEntityPosition(id: string, x: number, y: number) {
    const entity = this.entities.get(id);
    if (entity) {
      entity.sprite.setPosition(x, y);
      entity.nameText?.setPosition(x, y);
      entity.statsText.setPosition(x, y + entity.sprite.radius + 10);
    }
  }
}
