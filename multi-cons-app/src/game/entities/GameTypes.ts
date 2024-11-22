export interface Position {
  x: number;
  y: number;
}

export interface GameEntity {
  id: string;
  position: Position;
  radius: number;
}

export interface PlayerState extends GameEntity {
  name: string;
  color: string;
}

export interface EnemyState extends GameEntity {
  color: string;
}

export type GameState = {
  players: Map<string, PlayerState>;
  enemies: EnemyState[];
}

export interface GameStateUpdate {
  type: 'enemiesUpdate' | 'collision' | 'playerUpdate';
  player?: Partial<PlayerState>;
  enemies?: EnemyState[];
}
