import Recipe from '../models/Recipe.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import Category from '../models/Category.js';
import Notification from '../models/Notification.js';
import mongoose from 'mongoose';

// @desc    Get all recipes
// @route   GET /api/recipes
// @access  Public
export const getAllRecipes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build query
    const query = { isPublished: true };

    if (req.query.category && req.query.category !== 'undefined') {
      // Try to find category by slug first, then by ID
      let category = await Category.findOne({ slug: req.query.category });
      if (!category) {
        // Try as ObjectId
        if (mongoose.Types.ObjectId.isValid(req.query.category)) {
          category = await Category.findById(req.query.category);
        }
      }
      if (category) {
        query.category = category._id;
      } else {
        // If category not found, return empty results
        return res.json({
          success: true,
          count: 0,
          page,
          pages: 0,
          total: 0,
          data: [],
        });
      }
    }

    if (req.query.difficulty) {
      query.difficulty = req.query.difficulty;
    }

    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    const recipes = await Recipe.find(query)
      .populate('author', 'username avatar')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await Recipe.countDocuments(query);

    res.json({
      success: true,
      count: recipes.length,
      page,
      pages: Math.ceil(total / limit),
      total,
      data: recipes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des recettes',
      error: error.message,
    });
  }
};

// @desc    Get recent recipes
// @route   GET /api/recipes/recent
// @access  Public
export const getRecentRecipes = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;
    
    const recipes = await Recipe.find({ isPublished: true })
      .populate('author', 'username avatar')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-__v');

    res.json({
      success: true,
      count: recipes.length,
      data: recipes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des recettes récentes',
      error: error.message,
    });
  }
};

// @desc    Get popular recipes
// @route   GET /api/recipes/popular
// @access  Public
export const getPopularRecipes = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;
    
    const recipes = await Recipe.find({ isPublished: true })
      .populate('author', 'username avatar')
      .populate('category', 'name slug')
      .sort({ 
        views: -1,
        'rating.average': -1,
        likes: -1 
      })
      .limit(limit)
      .select('-__v');

    res.json({
      success: true,
      count: recipes.length,
      data: recipes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des recettes populaires',
      error: error.message,
    });
  }
};

// @desc    Get recipes from followed users
// @route   GET /api/recipes/followed
// @access  Private
export const getFollowedRecipes = async (req, res) => {
  try {
    console.log('getFollowedRecipes called, req.user:', req.user ? 'exists' : 'missing');
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié',
      });
    }
    const limit = parseInt(req.query.limit) || 12;
    const userId = req.user._id || req.user.id;
    if (!userId) {
      console.error('No userId found in req.user');
      return res.status(401).json({
        success: false,
        message: 'ID utilisateur non trouvé',
      });
    }
    console.log('Fetching user with ID:', userId);
    const user = await User.findById(userId);
    
    if (!user) {
      console.error('User not found with ID:', userId);
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }
    
    if (!user.following || user.following.length === 0) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        message: 'Vous ne suivez aucun utilisateur',
      });
    }

    console.log('User follows', user.following.length, 'users');
    const recipes = await Recipe.find({
      author: { $in: user.following },
      isPublished: true,
    })
      .populate('author', 'username avatar')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-__v');

    console.log('Found', recipes.length, 'recipes from followed users');
    res.json({
      success: true,
      count: recipes.length,
      data: recipes || [],
    });
  } catch (error) {
    console.error('Error in getFollowedRecipes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des recettes des utilisateurs suivis',
      error: error.message,
    });
  }
};

// @desc    Get favorite recipes
// @route   GET /api/recipes/favorites
// @access  Private
export const getFavoriteRecipes = async (req, res) => {
  try {
    console.log('getFavoriteRecipes called, req.user:', req.user ? 'exists' : 'missing');
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié',
      });
    }
    const limit = parseInt(req.query.limit) || 12;
    const userId = req.user._id || req.user.id;
    if (!userId) {
      console.error('No userId found in req.user');
      return res.status(401).json({
        success: false,
        message: 'ID utilisateur non trouvé',
      });
    }
    console.log('Fetching user favorites with ID:', userId);
    const user = await User.findById(userId).select('favorites');
    
    if (!user) {
      console.error('User not found with ID:', userId);
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }
    
    if (!user.favorites || user.favorites.length === 0) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        message: 'Vous n\'avez aucune recette favorite',
      });
    }

    // user.favorites is already an array of ObjectIds
    const recipeIds = user.favorites;
    console.log('User has', recipeIds.length, 'favorites');
    
    const recipes = await Recipe.find({
      _id: { $in: recipeIds },
      isPublished: true,
    })
      .populate('author', 'username avatar')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-__v');

    console.log('Found', recipes.length, 'favorite recipes');
    res.json({
      success: true,
      count: recipes.length,
      data: recipes || [],
    });
  } catch (error) {
    console.error('Error in getFavoriteRecipes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des recettes favorites',
      error: error.message,
    });
  }
};

// @desc    Get my recipes
// @route   GET /api/recipes/my-recipes
// @access  Private
export const getMyRecipes = async (req, res) => {
  try {
    console.log('getMyRecipes called, req.user:', req.user ? 'exists' : 'missing');
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié',
      });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const userId = req.user._id || req.user.id;
    if (!userId) {
      console.error('No userId found in req.user');
      return res.status(401).json({
        success: false,
        message: 'ID utilisateur non trouvé',
      });
    }
    console.log('Fetching recipes for user ID:', userId);
    const recipes = await Recipe.find({ author: userId })
      .populate('author', 'username avatar')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await Recipe.countDocuments({ author: userId });
    console.log('Found', recipes.length, 'recipes out of', total, 'total');

    res.json({
      success: true,
      count: recipes.length,
      page,
      pages: Math.ceil(total / limit),
      total,
      data: recipes || [],
    });
  } catch (error) {
    console.error('Error in getMyRecipes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de vos recettes',
      error: error.message,
    });
  }
};

// @desc    Get recipe by ID
// @route   GET /api/recipes/:id
// @access  Public
export const getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate('author', 'username avatar bio')
      .populate('category', 'name slug')
      .select('-__v');

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recette non trouvée',
      });
    }

    // Increment views
    recipe.views += 1;
    await recipe.save();

    res.json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la recette',
      error: error.message,
    });
  }
};

// @desc    Get recipes by user ID
// @route   GET /api/recipes/user/:userId
// @access  Public
export const getRecipesByUser = async (req, res) => {
  try {
    const recipes = await Recipe.find({
      author: req.params.userId,
      isPublished: true,
    })
      .populate('author', 'username avatar')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      count: recipes.length,
      data: recipes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des recettes',
      error: error.message,
    });
  }
};

// @desc    Create recipe
// @route   POST /api/recipes
// @access  Private
export const createRecipe = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    req.body.author = userId;
    const recipe = await Recipe.create(req.body);

    await recipe.populate('author', 'username avatar');
    await recipe.populate('category', 'name slug');

    res.status(201).json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la recette',
      error: error.message,
    });
  }
};

// @desc    Update recipe
// @route   PUT /api/recipes/:id
// @access  Private
export const updateRecipe = async (req, res) => {
  try {
    let recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recette non trouvée',
      });
    }

    // Check if user is the author or admin
    const userId = req.user._id || req.user.id;
    if (recipe.author.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier cette recette',
      });
    }

    recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('author', 'username avatar')
      .populate('category', 'name slug');

    res.json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la recette',
      error: error.message,
    });
  }
};

// @desc    Delete recipe
// @route   DELETE /api/recipes/:id
// @access  Private
export const deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recette non trouvée',
      });
    }

    // Check if user is the author or admin
    const userId = req.user._id || req.user.id;
    if (recipe.author.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à supprimer cette recette',
      });
    }

    // Delete associated comments
    await Comment.deleteMany({ recipe: recipe._id });

    await recipe.deleteOne();

    res.json({
      success: true,
      message: 'Recette supprimée avec succès',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la recette',
      error: error.message,
    });
  }
};

// @desc    Like/Unlike recipe
// @route   PUT /api/recipes/:id/like
// @access  Private
export const likeRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate('author', 'username');

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recette non trouvée',
      });
    }

    const userId = req.user._id || req.user.id;
    const isLiked = recipe.likes.some(
      (id) => id.toString() === userId.toString()
    );

    if (isLiked) {
      recipe.likes = recipe.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      recipe.likes.push(userId);
      
      // Create notification for recipe author (only if not liking own recipe)
      if (recipe.author._id.toString() !== userId.toString()) {
        await Notification.create({
          user: recipe.author._id,
          type: 'recipe_like',
          title: 'Nouveau like',
          message: `${req.user.username} a aimé votre recette "${recipe.title}"`,
          relatedUser: userId,
          relatedRecipe: recipe._id,
        });
      }
    }

    await recipe.save();

    res.json({
      success: true,
      data: recipe,
      liked: !isLiked,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du like',
      error: error.message,
    });
  }
};

