import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Cet utilisateur existe déjà',
      });
    }

    // Create user




        const user = await User.create({ username, email, password });

    if (user) {
      const token = generateToken(user._id);

      return res.status(201).json({
        success: true,
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar || null,
          role: user.role || 'user',
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Données utilisateur invalides',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'inscription",
      error: error.message,
    });
  }
};
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists and get password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar || null,
        role: user.role || 'user',
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message,
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -__v')
      .populate('favorites', 'title image')
      .populate('bookmarks', 'title image');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Get user stats
    const Recipe = (await import('../models/Recipe.js')).default;
    const recipeCount = await Recipe.countDocuments({
      author: user._id,
      isPublished: true,
    });

    return res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        stats: {
          recipeCount,
          followersCount: user.followers?.length || 0,
          followingCount: user.following?.length || 0,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message,
    });
  }
};
