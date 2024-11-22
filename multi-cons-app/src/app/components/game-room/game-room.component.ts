import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of, Subject } from 'rxjs';
import { PlayerManagerService } from '../../services/player-manager.service';
import { GameManagerService } from '../../services/game-manager.service';
import { GameStateService } from '../../services/game-state.service';
import { RoomState } from '../../types';
import { GameComponent } from '../game/game.component';

@Component({
  selector: 'app-game-room',
  standalone: true,
  imports: [CommonModule, GameComponent],
  templateUrl: './game-room.component.html',
  styleUrls: ['./game-room.component.scss']
})
export class GameRoomComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public room!: RoomState;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private playerManagerService: PlayerManagerService,
    private gameManagerService: GameManagerService,
    private gameStateService: GameStateService
  ) {
    this.gameStateService.roomState$.subscribe(roomState => {
      this.room = roomState;
    });
  }

  ngOnInit() {
    const roomId = this.route.snapshot.params['id'];

    const playerName = localStorage.getItem('playerName') || 'Player'; // todo fix

    this.playerManagerService.joinRoom(roomId).pipe(
      catchError((error) => {
        console.error('Failed to join room:', error);
        this.router.navigate(['/games']);
        return of(null);
      })
    ).subscribe();
  }

  startGame(): void {
    this.gameManagerService.startGame();
  }

  leaveRoom(): void {
    this.playerManagerService.leaveRoom();
    this.router.navigate(['/games']);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.playerManagerService.leaveRoom();
  }
}
