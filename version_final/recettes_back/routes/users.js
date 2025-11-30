import express from 'express';
import {
  getUserById,
  updateUser,
  toggleFavorite,
  toggleBookmark,
  toggleFollow,
  getFollowers,
  getFollowing,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/:id', getUserById);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);

// Protected routes
router.put('/:id', protect, updateUser);
router.put('/:id/favorites', protect, toggleFavorite);
router.put('/:id/bookmarks', protect, toggleBookmark);
router.put('/:id/follow', protect, toggleFollow);

export default router;

