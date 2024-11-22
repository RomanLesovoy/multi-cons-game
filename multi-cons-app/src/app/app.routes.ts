import { Routes } from '@angular/router';
import { GamesListComponent } from './components/game-list/games-list.component';
import { CreateGameComponent } from './components/create-game/create-game.component';
import { GameRoomComponent } from './components/game-room/game-room.component';

export const routes: Routes = [
  { path: '', redirectTo: 'games', pathMatch: 'full' },
  { path: 'games', component: GamesListComponent },
  { path: 'create-game', component: CreateGameComponent },
  { path: 'game/:id', component: GameRoomComponent }
];
