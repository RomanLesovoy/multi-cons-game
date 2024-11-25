import { Component, OnInit, OnDestroy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of, pipe, Subject } from 'rxjs';
import { GameManagerService } from '../../services/game-manager.service';
import { GameStateService } from '../../services/game-state.service';
import { Player, Room } from '../../types';
import { GameComponent } from '../game/game.component';
import { CurrentPlayerService } from '../../services/current-player.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-game-room',
  standalone: true,
  imports: [CommonModule, GameComponent],
  templateUrl: './game-room.component.html',
  styleUrls: ['./game-room.component.scss']
})
export class GameRoomComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public currentPlayer!: Player | null;
  public room!: Room | null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private currentPlayerService: CurrentPlayerService,
    private gameManagerService: GameManagerService,
    private gameStateService: GameStateService,
    private destroyRef: DestroyRef
  ) {
    this.gameStateService.room$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(room => {
        this.room = room;
      });

    this.currentPlayerService.currentPlayer$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(player => {
        this.currentPlayer = player;
      });
  }

  async ngOnInit() {
    const roomId = this.route.snapshot.params['id'];

    try {
      await this.gameManagerService.joinRoom(roomId);
    } catch {
      console.error('Failed to join room');
      this.router.navigate(['/games']);
    }
  }

  startGame(): void {
    this.gameManagerService.startGame();
  }

  leaveRoom(): void {
    this.gameManagerService.leaveRoom();
    this.router.navigate(['/games']);
  }

  ngOnDestroy() {
    this.gameManagerService.leaveRoom();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
