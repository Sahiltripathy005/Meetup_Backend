import { Room } from '../models/Room.js';

export class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  async createRoom(roomData) {
    const room = new Room(roomData);
    this.rooms.set(roomData.id, room);
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  async joinRoom(roomId, user) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.addUser(user);
    return room;
  }

  async leaveRoom(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.removeUser(userId);
      
      // Remove room if empty and not persistent
      if (room.getUsers().length === 0 && !room.isPersistent) {
        this.rooms.delete(roomId);
      }
    }
  }

  async updateRoom(roomId, updates) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.update(updates);
    return room;
  }

  async deleteRoom(roomId) {
    this.rooms.delete(roomId);
  }

  async getUserRooms(userId) {
    const userRooms = [];
    
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.hasUser(userId)) {
        userRooms.push(roomId);
      }
    }
    
    return userRooms;
  }

  async getUserOwnedRooms(userId) {
    const ownedRooms = [];
    
    for (const room of this.rooms.values()) {
      if (room.ownerId === userId) {
        ownedRooms.push(room);
      }
    }
    
    return ownedRooms;
  }

  async getPublicRooms(page = 1, limit = 20) {
    const publicRooms = [];
    
    for (const room of this.rooms.values()) {
      if (!room.isPrivate) {
        publicRooms.push(room);
      }
    }
    
    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return publicRooms.slice(startIndex, endIndex);
  }

  getRoomCount() {
    return this.rooms.size;
  }

  getActiveUsers() {
    let totalUsers = 0;
    for (const room of this.rooms.values()) {
      totalUsers += room.getUsers().length;
    }
    return totalUsers;
  }
}
