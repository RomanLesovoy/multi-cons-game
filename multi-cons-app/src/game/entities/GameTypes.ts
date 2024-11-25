export interface Position {
  x: number;
  y: number;
}

export interface GameEntity {
  id: string;
  position: Position;
  radius: number;
  color: string;
}

export interface PlayerState extends GameEntity {
  name: string;
}

export interface EnemyState extends GameEntity {
  speed: number;
}

export interface EnemyUpdate extends EnemyState {
  name: string;
}

export type GameState = {
  players: Map<string, PlayerState>;
  enemies: EnemyState[];
}

export interface GameStateUpdate {
  type: 'enemiesUpdate' | 'collision' | 'playerUpdate' | 'enemiesPush';
  player?: Partial<PlayerState>;
  enemies?: EnemyUpdate[];
}
