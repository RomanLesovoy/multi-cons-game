import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { GameStateService } from '../../services/game-state.service';

@Component({
  selector: 'app-games-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './games-list.component.html',
  styleUrls: ['./games-list.component.scss']
})
export class GamesListComponent {
  public games$;

  constructor(
    private router: Router,
    private gameStateService: GameStateService,
  ) {
    this.games$ = this.gameStateService.rooms$;
  }

  joinGame(gameId: string) {
    this.router.navigate(['/game', gameId]);
  }
}
