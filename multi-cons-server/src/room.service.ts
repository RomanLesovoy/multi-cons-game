import { Injectable } from '@nestjs/common';
import { Room, Player } from './room.types';

@Injectable()
export class RoomService {
    private rooms: Map<string, Room> = new Map();

    async createRoom(data: { name: string, maxPlayers: number, masterId: string }): Promise<Room> {
        const roomId = Math.random().toString(36).substring(7);
        const room: Room = {
            id: roomId,
            name: data.name,
            players: [],
            maxPlayers: data.maxPlayers,
            masterId: data.masterId
        };
        
        this.rooms.set(roomId, room);
        return room;
    }

    async getRooms(): Promise<Room[]> {
        return Array.from(this.rooms.values());
    }

    // async findRoomByPlayerId(playerId: string): Promise<Room | undefined> {
    //   for (const room of this.rooms.values()) {
    //       if (room.players.some(p => p.id === playerId)) {
    //           return room;
    //       }
    //   }
    //   return undefined;
    // }

    async getRoom(roomId: string): Promise<Room | undefined> {
        return this.rooms.get(roomId);
    }

    async getRoomPlayers(roomId: string): Promise<Player[]> {
      const room = await this.getRoom(roomId);
      return room ? room.players : [];
    }

    async addPlayerToRoom(roomId: string, player: Player): Promise<Player> {
        const room = this.rooms.get(roomId);
        if (!room) throw new Error('Room not found');
        if (room.players.length >= room.maxPlayers) {
            throw new Error('Room is full');
        }

        // If this is the first player, make them the master
        if (room.players.length === 0) {
            room.masterId = player.id;
        }

        room.players.push(player);
        return player;
    }

    async removePlayerFromRoom(roomId: string, playerId: string): Promise<void> {
        const room = this.rooms.get(roomId);
        if (!room) return;

        room.players = room.players.filter(p => p.id !== playerId);

        // If master left the room, assign a new one
        if (room.masterId === playerId && room.players.length > 0) {
            room.masterId = room.players[0].id;
        }

        // If room is empty, delete it
        if (room.players.length === 0) {
            this.rooms.delete(roomId);
        }
    }
}
