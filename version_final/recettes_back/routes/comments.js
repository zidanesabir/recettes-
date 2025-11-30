import express from 'express';
import {
  getCommentsByRecipe,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  addReply,
} from '../controllers/commentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/recipe/:recipeId', getCommentsByRecipe);

// Protected routes
router.post('/', protect, createComment);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);
router.put('/:id/like', protect, likeComment);
router.post('/:id/reply', protect, addReply);

export default router;

