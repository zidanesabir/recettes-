import express from 'express';
import {
  getAllRecipes,
  getRecentRecipes,
  getPopularRecipes,
  getFollowedRecipes,
  getFavoriteRecipes,
  getMyRecipes,
  getRecipeById,
  getRecipesByUser,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  likeRecipe,
} from '../controllers/recipeController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protected routes - must be defined before routes with :id parameter
router.get('/followed', protect, getFollowedRecipes);
router.get('/favorites', protect, getFavoriteRecipes);
router.get('/my-recipes', protect, getMyRecipes);
router.post('/', protect, createRecipe);
router.put('/:id/like', protect, likeRecipe);
router.put('/:id', protect, updateRecipe);
router.delete('/:id', protect, deleteRecipe);

// Public routes
router.get('/recent', getRecentRecipes);
router.get('/popular', getPopularRecipes);
router.get('/user/:userId', getRecipesByUser);
router.get('/:id', getRecipeById);
router.get('/', getAllRecipes);

export default router;

