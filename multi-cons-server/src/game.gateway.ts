import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from './room.service';
import { Room, SocketEvents } from './room.types';

@WebSocketGateway({
    cors: {
        origin: '*',
    }
})
export class GameGateway {
    @WebSocketServer()
    server: Server;

    constructor(private roomService: RoomService) {}

    @SubscribeMessage(SocketEvents.START_GAME)
    async handleStartGame(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { roomId: string }
    ) {
      const room = await this.roomService.getRoom(data.roomId);
      if (!room) return { error: 'Room not found' };

      if (client.id !== room.masterId) {
        return { error: 'You are not a master' };
      }
      await this.roomService.updateRoom(data.roomId, { ...room, isGameStarted: true });
      this.server.to(data.roomId).emit(SocketEvents.GAME_STARTED);
    }

    @SubscribeMessage(SocketEvents.CREATE_ROOM)
    async handleCreateRoom(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { name: string, playerName: string }
    ) {
      console.log('create room');
        const room = await this.roomService.createRoom({
          name: data.name,
          maxPlayers: 4,
          masterId: client.id
        });

        console.log('room', room);

        try {
          await this.playerJoined(client, { roomId: room.id, playerName: data.playerName }, room);
          return { room };
        } catch (e) {
          return { error: e };
        } finally {
          this.handleLatestRooms();
        }
    }

    /**
     * Push latest rooms to all clients
     * needs for game-manager.service
     * 
     * @TODO make emit for only one room (to avoid so much event-traffic)
     */
    @SubscribeMessage(SocketEvents.LATEST_ROOMS)
    async handleLatestRooms() {
      const rooms = await this.roomService.getRooms();
      this.server.emit(SocketEvents.LATEST_ROOMS, rooms);
      return rooms;
    }

    @SubscribeMessage(SocketEvents.JOIN_ROOM)
    async handleJoinRoom(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { roomId: string, playerName: string }
    ) {
        const room = await this.roomService.getRoom(data.roomId);

        if (!room) return { error: 'Room not found' };

        try {
          await this.playerJoined(client, data, room);

          return { 
            room,
            players: room.players.filter(p => p.id !== client.id),
            masterId: room.masterId
          };
        } catch (e) {
          return { error: e };
        }
    }

    private async playerJoined(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { roomId: string, playerName: string },
      room: Room
    ) {
      const player = await this.roomService.addPlayerToRoom(data.roomId, {
        id: client.id,
        name: data.playerName,
        socketId: client.id
      });

      client.join(data.roomId);

      // Send a signal to all players in the room about the new participant
      client.to(data.roomId).emit(SocketEvents.PLAYER_JOINED, { 
        player: player,
        isMaster: client.id === room.masterId,
        shouldInitiateConnection: true, // only existed participants should initiate connection
      });

      this.handleLatestRooms();
    }

    @SubscribeMessage(SocketEvents.LEAVE_ROOM)
    async handleLeaveRoom(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { roomId: string }
    ) {
      try {
        const room = await this.roomService.removePlayerFromRoom(data.roomId, client.id);

        // Notify other players about the departure
        this.server.to(data.roomId).emit(SocketEvents.PLAYER_LEFT, {
          playerId: client.id,
          newMasterId: room.masterId
        });
      } catch (e) {
        return { error: e };
      } finally {
        this.handleLatestRooms();
      }
    }

    @SubscribeMessage('disconnect')
    async handleDisconnect(@ConnectedSocket() client: Socket) {
        // Find the room where the player was
        console.log('disconnect', client.id);
        const rooms = await this.roomService.findRoomsByPlayerId(client.id);
        if (!rooms.length) return;
        console.log(rooms, '0000');

        for (let room of rooms) {
          if (room.id !== client.id) { // Skip personal socket room
            const updatedRoom = await this.roomService.removePlayerFromRoom(room.id, client.id);
            
            // Notify other players about the departure
            this.server.to(room.id).emit(SocketEvents.PLAYER_LEFT, {
              playerId: client.id,
              newMasterId: updatedRoom.masterId
            });

            this.handleLatestRooms();
          }
        }
    }


    // ----------------------------- RTC -----------------------------

    @SubscribeMessage(SocketEvents.RTC_OFFER)
    handleRTCOffer(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { targetId: string, offer: RTCSessionDescriptionInit }
    ) {
        this.server.to(data.targetId).emit(SocketEvents.RTC_OFFER, {
          from: client.id,
          offer: data.offer
        });
    }

    @SubscribeMessage(SocketEvents.RTC_ANSWER)
    handleRTCAnswer(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { targetId: string, answer: RTCSessionDescriptionInit }
    ) {
        this.server.to(data.targetId).emit(SocketEvents.RTC_ANSWER, {
          from: client.id,
          answer: data.answer
        });
    }

    @SubscribeMessage(SocketEvents.RTC_ICE_CANDIDATE)
    handleIceCandidate(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { targetId: string, candidate: RTCIceCandidateInit }
    ) {
        this.server.to(data.targetId).emit(SocketEvents.RTC_ICE_CANDIDATE, {
          from: client.id,
          candidate: data.candidate
        });
    }
}
