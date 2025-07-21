import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import userRoutes from './routes/users.js';
import { authenticateSocket } from './middleware/auth.js';
import { RoomManager } from './services/RoomManager.js';
import { UserManager } from './services/UserManager.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/users', userRoutes);

// Initialize managers
const roomManager = new RoomManager();
const userManager = new UserManager();

// Socket.IO connection handling
io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);

  // Join room
  socket.on('join-room', async (data) => {
    try {
      const { roomId, avatar } = data;
      const user = await userManager.getUser(socket.userId);
      
      if (!user) {
        socket.emit('error', { message: 'User not found' });
        return;
      }

      // Join the room
      socket.join(roomId);
      const room = await roomManager.joinRoom(roomId, {
        id: socket.userId,
        name: user.name,
        email: user.email,
        avatar: avatar || user.avatar,
        position: { x: 100, y: 100 },
        socketId: socket.id
      });

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Send room data to user
      socket.emit('room-joined', {
        room: room.getPublicData(),
        users: room.getUsers()
      });

      // Notify other users in the room
      socket.to(roomId).emit('user-joined', {
        id: socket.userId,
        name: user.name,
        avatar: avatar || user.avatar,
        position: { x: 100, y: 100 }
      });

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Leave room
  socket.on('leave-room', async (roomId) => {
    try {
      socket.leave(roomId);
      await roomManager.leaveRoom(roomId, socket.userId);
      
      // Notify other users
      socket.to(roomId).emit('user-left', { userId: socket.userId });
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  // Update user position
  socket.on('update-position', async (data) => {
    try {
      const { roomId, position } = data;
      const room = roomManager.getRoom(roomId);
      
      if (room) {
        room.updateUserPosition(socket.userId, position);
        
        // Broadcast position to other users in the room
        socket.to(roomId).emit('user-moved', {
          userId: socket.userId,
          position
        });
      }
    } catch (error) {
      console.error('Error updating position:', error);
    }
  });

  // Send chat message
  socket.on('send-message', async (data) => {
    try {
      const { roomId, message, type = 'text' } = data;
      const user = await userManager.getUser(socket.userId);
      
      if (!user) return;

      const chatMessage = {
        id: Date.now().toString(),
        userId: socket.userId,
        userName: user.name,
        userAvatar: user.avatar,
        message,
        type,
        timestamp: new Date().toISOString()
      };

      // Save message to room
      const room = roomManager.getRoom(roomId);
      if (room) {
        room.addMessage(chatMessage);
        
        // Broadcast message to all users in the room
        io.to(roomId).emit('new-message', chatMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  // Video call signaling
  socket.on('video-offer', (data) => {
    const { roomId, targetUserId, offer } = data;
    socket.to(roomId).emit('video-offer', {
      fromUserId: socket.userId,
      targetUserId,
      offer
    });
  });

  socket.on('video-answer', (data) => {
    const { roomId, targetUserId, answer } = data;
    socket.to(roomId).emit('video-answer', {
      fromUserId: socket.userId,
      targetUserId,
      answer
    });
  });

  socket.on('ice-candidate', (data) => {
    const { roomId, targetUserId, candidate } = data;
    socket.to(roomId).emit('ice-candidate', {
      fromUserId: socket.userId,
      targetUserId,
      candidate
    });
  });

  // Screen sharing
  socket.on('start-screen-share', (data) => {
    const { roomId } = data;
    socket.to(roomId).emit('user-started-screen-share', {
      userId: socket.userId
    });
  });

  socket.on('stop-screen-share', (data) => {
    const { roomId } = data;
    socket.to(roomId).emit('user-stopped-screen-share', {
      userId: socket.userId
    });
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.userId}`);
    
    // Remove user from all rooms
    const userRooms = await roomManager.getUserRooms(socket.userId);
    for (const roomId of userRooms) {
      await roomManager.leaveRoom(roomId, socket.userId);
      socket.to(roomId).emit('user-left', { userId: socket.userId });
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});