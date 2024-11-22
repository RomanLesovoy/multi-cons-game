import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoomService } from './room.service';
import { GameGateway } from './game.gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, RoomService, GameGateway],
})
export class AppModule {}
