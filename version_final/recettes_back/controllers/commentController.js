import Comment from '../models/Comment.js';
import Recipe from '../models/Recipe.js';
import Notification from '../models/Notification.js';

// @desc    Get comments by recipe
// @route   GET /api/comments/recipe/:recipeId
// @access  Public
export const getCommentsByRecipe = async (req, res) => {
  try {
    const comments = await Comment.find({ recipe: req.params.recipeId })
      .populate('author', 'username avatar')
      .populate('replies.author', 'username avatar')
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      count: comments.length,
      data: comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commentaires',
      error: error.message,
    });
  }
};

// @desc    Create comment
// @route   POST /api/comments
// @access  Private
export const createComment = async (req, res) => {
  try {
    const { recipe, content, rating } = req.body;

    // Check if recipe exists
    const recipeDoc = await Recipe.findById(recipe);
    if (!recipeDoc) {
      return res.status(404).json({
        success: false,
        message: 'Recette non trouvée',
      });
    }

    const commentData = {
      content,
      author: req.user._id,
      recipe,
    };

    if (rating) {
      commentData.rating = rating;
    }

    const comment = await Comment.create(commentData);

    // Update recipe rating if rating provided
    if (rating) {
      const comments = await Comment.find({ recipe, rating: { $exists: true } });
      const totalRating = comments.reduce((sum, c) => sum + c.rating, 0);
      recipeDoc.rating.average = totalRating / comments.length;
      recipeDoc.rating.count = comments.length;
      await recipeDoc.save();
    }

    // Create notification for recipe author
    if (recipeDoc.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: recipeDoc.author,
        type: 'recipe_comment',
        title: 'Nouveau commentaire',
        message: `${req.user.username} a commenté votre recette "${recipeDoc.title}"`,
        relatedUser: req.user._id,
        relatedRecipe: recipe,
        relatedComment: comment._id,
      });
    }

    await comment.populate('author', 'username avatar');

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du commentaire',
      error: error.message,
    });
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
export const updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé',
      });
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier ce commentaire',
      });
    }

    comment.content = req.body.content;
    comment.isEdited = true;
    await comment.save();

    await comment.populate('author', 'username avatar');
    await comment.populate('replies.author', 'username avatar');

    res.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du commentaire',
      error: error.message,
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé',
      });
    }

    // Check if user is the author or admin
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à supprimer ce commentaire',
      });
    }

    // Update recipe rating if needed
    if (comment.rating) {
      const recipe = await Recipe.findById(comment.recipe);
      if (recipe) {
        const comments = await Comment.find({
          recipe: comment.recipe,
          rating: { $exists: true },
          _id: { $ne: comment._id },
        });
        
        if (comments.length > 0) {
          const totalRating = comments.reduce((sum, c) => sum + c.rating, 0);
          recipe.rating.average = totalRating / comments.length;
          recipe.rating.count = comments.length;
        } else {
          recipe.rating.average = 0;
          recipe.rating.count = 0;
        }
        await recipe.save();
      }
    }

    await comment.deleteOne();

    res.json({
      success: true,
      message: 'Commentaire supprimé avec succès',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du commentaire',
      error: error.message,
    });
  }
};

// @desc    Like/Unlike comment
// @route   PUT /api/comments/:id/like
// @access  Private
export const likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé',
      });
    }

    const isLiked = comment.likes.includes(req.user._id);

    if (isLiked) {
      comment.likes = comment.likes.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      comment.likes.push(req.user._id);
    }

    await comment.save();

    res.json({
      success: true,
      data: comment,
      isLiked: !isLiked,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du like',
      error: error.message,
    });
  }
};

// @desc    Add reply to comment
// @route   POST /api/comments/:id/reply
// @access  Private
export const addReply = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Commentaire non trouvé',
      });
    }

    const reply = {
      content: req.body.content,
      author: req.user._id,
      createdAt: new Date(),
      likes: [],
    };

    comment.replies.push(reply);
    await comment.save();

    // Create notification for comment author
    if (comment.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: comment.author,
        type: 'comment_reply',
        title: 'Nouvelle réponse',
        message: `${req.user.username} a répondu à votre commentaire`,
        relatedUser: req.user._id,
        relatedRecipe: comment.recipe,
        relatedComment: comment._id,
      });
    }

    await comment.populate('author', 'username avatar');
    await comment.populate('replies.author', 'username avatar');

    res.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de la réponse',
      error: error.message,
    });
  }
};

