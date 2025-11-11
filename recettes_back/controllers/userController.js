import User from '../models/User.js';
import Recipe from '../models/Recipe.js';
import Notification from '../models/Notification.js';

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Public
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Get user stats
    const recipeCount = await Recipe.countDocuments({
      author: user._id,
      isPublished: true,
    });

    const stats = {
      recipeCount,
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
    };

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        stats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur',
      error: error.message,
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
export const updateUser = async (req, res) => {
  try {
    // Check if user is updating their own profile or is admin
    const userId = req.user._id || req.user.id;
    if (req.params.id !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier ce profil',
      });
    }

    // Remove password from update if present
    const { password, ...updateData } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'utilisateur',
      error: error.message,
    });
  }
};

// @desc    Toggle favorite recipe
// @route   PUT /api/users/:id/favorites
// @access  Private
export const toggleFavorite = async (req, res) => {
  try {
    const { recipeId } = req.body;

    // Check if user is updating their own favorites
    const userId = req.user._id || req.user.id;
    if (req.params.id !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier ces favoris',
      });
    }

    const user = await User.findById(userId);
    const recipe = await Recipe.findById(recipeId);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recette non trouvée',
      });
    }

    const isFavorite = user.favorites.includes(recipeId);

    if (isFavorite) {
      user.favorites = user.favorites.filter(
        (id) => id.toString() !== recipeId.toString()
      );
    } else {
      user.favorites.push(recipeId);

      // Create notification for recipe author
      if (recipe.author.toString() !== userId.toString()) {
        await Notification.create({
          user: recipe.author,
          type: 'recipe_favorite',
          title: 'Nouveau favori',
          message: `${user.username} a ajouté votre recette "${recipe.title}" à ses favoris`,
          relatedUser: userId,
          relatedRecipe: recipeId,
        });
      }
    }

    await user.save();

    res.json({
      success: true,
      data: user.favorites,
      isFavorite: !isFavorite,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des favoris',
      error: error.message,
    });
  }
};

// @desc    Toggle bookmark recipe
// @route   PUT /api/users/:id/bookmarks
// @access  Private
export const toggleBookmark = async (req, res) => {
  try {
    const { recipeId } = req.body;

    // Check if user is updating their own bookmarks
    const userId = req.user._id || req.user.id;
    if (req.params.id !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier ces signets',
      });
    }

    const user = await User.findById(userId);
    const recipe = await Recipe.findById(recipeId);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recette non trouvée',
      });
    }

    const isBookmarked = user.bookmarks.includes(recipeId);

    if (isBookmarked) {
      user.bookmarks = user.bookmarks.filter(
        (id) => id.toString() !== recipeId.toString()
      );
    } else {
      user.bookmarks.push(recipeId);
    }

    await user.save();

    res.json({
      success: true,
      data: user.bookmarks,
      isBookmarked: !isBookmarked,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des signets',
      error: error.message,
    });
  }
};

// @desc    Follow/Unfollow user
// @route   PUT /api/users/:id/follow
// @access  Private
export const toggleFollow = async (req, res) => {
  try {
    const targetUserId = req.params.id;

    // Can't follow yourself
    const userId = req.user._id || req.user.id;
    if (targetUserId === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas vous suivre vous-même',
      });
    }

    const currentUser = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Check if already following (convert both to strings for comparison)
    const isFollowing = currentUser.following.some(
      (id) => id.toString() === targetUserId.toString()
    );

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId.toString()
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // Follow - check if already in array to avoid duplicates
      const alreadyFollowing = currentUser.following.some(
        (id) => id.toString() === targetUserId.toString()
      );
      if (!alreadyFollowing) {
        currentUser.following.push(targetUserId);
      }
      
      const alreadyFollower = targetUser.followers.some(
        (id) => id.toString() === userId.toString()
      );
      if (!alreadyFollower) {
        targetUser.followers.push(userId);
      }

      // Create notification
      await Notification.create({
        user: targetUserId,
        type: 'new_follower',
        title: 'Nouveau follower',
        message: `${currentUser.username} vous suit maintenant`,
        relatedUser: userId,
      });
    }

    await currentUser.save();
    await targetUser.save();

    res.json({
      success: true,
      isFollowing: !isFollowing,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du suivi',
      error: error.message,
    });
  }
};

// @desc    Get user followers
// @route   GET /api/users/:id/followers
// @access  Public
export const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'username avatar bio')
      .select('followers');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    res.json({
      success: true,
      count: user.followers.length,
      data: user.followers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des followers',
      error: error.message,
    });
  }
};

// @desc    Get user following
// @route   GET /api/users/:id/following
// @access  Public
export const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'username avatar bio')
      .select('following');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    res.json({
      success: true,
      count: user.following.length,
      data: user.following,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs suivis',
      error: error.message,
    });
  }
};

