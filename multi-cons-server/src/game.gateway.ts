import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from './room.service';
import { SocketEvents } from './room.types';

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
      if (client.id !== (await this.roomService.getRoom(data.roomId))?.masterId) {
        throw new Error('You are not a master');
      }
      this.server.to(data.roomId).emit(SocketEvents.GAME_STARTED);
    }

    @SubscribeMessage(SocketEvents.CREATE_ROOM)
    async handleCreateRoom(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { name: string, playerName: string }
    ) {
        const room = await this.roomService.createRoom({
            name: data.name,
            maxPlayers: 4,
            masterId: client.id
        });

        const player = await this.roomService.addPlayerToRoom(room.id, {
            id: client.id,
            name: data.playerName,
            socketId: client.id
        });

        client.join(room.id);
        return { room, player };
    }

    @SubscribeMessage(SocketEvents.GET_ROOMS)
    async handleGetRooms(@ConnectedSocket() client: Socket) {
      const rooms = await this.roomService.getRooms();
      return rooms;
    }

    @SubscribeMessage(SocketEvents.JOIN_ROOM)
    async handleJoinRoom(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { roomId: string, playerName: string }
    ) {
        const room = await this.roomService.getRoom(data.roomId);

        if (!room) throw new Error('Room not found');

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
        
        return { 
          room,
          player,
          players: room.players.filter(p => p.id !== client.id),
          masterId: room.masterId
        };
    }

    @SubscribeMessage('disconnect')
    async handleDisconnect(@ConnectedSocket() client: Socket) {
        // Find the room where the player was
        const rooms = this.server.sockets.adapter.sids.get(client.id);
        if (!rooms) return;

        for (const roomId of rooms) {
            if (roomId !== client.id) { // Skip personal socket room
                await this.roomService.removePlayerFromRoom(roomId, client.id);
                const room = await this.roomService.getRoom(roomId);
                
                // Notify other players about the departure
                this.server.to(roomId).emit(SocketEvents.PLAYER_LEFT, {
                    playerId: client.id,
                    newMasterId: room?.masterId
                });
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
