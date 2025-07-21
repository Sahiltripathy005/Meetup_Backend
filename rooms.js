import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RoomManager } from '../services/RoomManager.js';
import { userManager } from '../Manager/userManagerInstance.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const roomManager = new RoomManager();

// Create room
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { name, description, mapTemplate, isPrivate, password, maxUsers } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Room name is required' });
    }
    console.log('Looking for user:', req.userId);
    console.log('All users:', userManager.getAllUsers());

    const user = await userManager.getUser(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const roomId = uuidv4();
    const room = await roomManager.createRoom({
      id: roomId,
      name,
      description: description || '',
      ownerId: req.userId,
      ownerName: user.name,
      mapTemplate: mapTemplate || 'office',
      isPrivate: isPrivate || false,
      password: password || null,
      maxUsers: maxUsers || 50,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      message: 'Room created successfully',
      room: room.getPublicData()
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get room by ID
router.get('/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = roomManager.getRoom(roomId);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({
      room: room.getPublicData(),
      users: room.getUsers()
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Join room with password
router.post('/:roomId/join', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = roomManager.getRoom(roomId);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const user = await userManager.getUser(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Optional: handle private room password check here

    room.addUser({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      joinedAt: new Date().toISOString()
    });

    res.json({
      message: 'Joined room successfully',
      room: room.getPublicData(),
      users: room.getUsers()
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Get user's rooms
router.get('/user/my-rooms', authenticateToken, async (req, res) => {
  try {
    const rooms = await roomManager.getUserOwnedRooms(req.userId);
    res.json({ rooms: rooms.map(room => room.getPublicData()) });
  } catch (error) {
    console.error('Get user rooms error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update room
router.put('/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, description, isPrivate, password, maxUsers } = req.body;
    
    const room = roomManager.getRoom(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is room owner
    if (room.ownerId !== req.userId) {
      return res.status(403).json({ message: 'Only room owner can update room' });
    }

    const updatedRoom = await roomManager.updateRoom(roomId, {
      name,
      description,
      isPrivate,
      password,
      maxUsers
    });

    if (!updatedRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({
      message: 'Room updated successfully',
      room: updatedRoom.getPublicData()
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete room
router.delete('/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = roomManager.getRoom(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is room owner
    if (room.ownerId !== req.userId) {
      return res.status(403).json({ message: 'Only room owner can delete room' });
    }

    await roomManager.deleteRoom(roomId);
    
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get public rooms
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const rooms = await roomManager.getPublicRooms(
      parseInt(page),
      parseInt(limit)
    );
    
    res.json({
      rooms: rooms.map(room => room.getPublicData()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get public rooms error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;