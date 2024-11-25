import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { GameManagerService } from '../../services/game-manager.service';

@Component({
  selector: 'app-create-game',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-game.component.html',
  styleUrls: ['./create-game.component.scss']
})
export class CreateGameComponent {
  private fb = inject(FormBuilder);
  private gameManagerService = inject(GameManagerService);
  private router = inject(Router);

  gameForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
  });

  async createGame() {
    console.log('createGame');
    if (this.gameForm.valid) {
      const { name } = this.gameForm.value;
      
      console.log('try create game');
      try {
        const game = await this.gameManagerService.createGame(name!);
        this.router.navigate(['/game', game.id]);
      } catch {
        console.error('Failed to create game');
      }
    }
  }

  back() {
    this.router.navigate(['/']);
  }
}
