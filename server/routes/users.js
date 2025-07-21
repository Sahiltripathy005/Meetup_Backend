import express from 'express';
import { UserManager } from '../services/UserManager.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const userManager = new UserManager();

// Get user profile
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await userManager.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Search users
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { query, page = 1, limit = 20 } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const users = await userManager.searchUsers(
      query,
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        avatar: user.avatar
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;