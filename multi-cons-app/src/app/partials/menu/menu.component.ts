import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CurrentPlayerService } from '../../services/current-player.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent {
  public currentPlayerService = inject(CurrentPlayerService);
  public currentPlayer$ = this.currentPlayerService.currentPlayer$;
}
