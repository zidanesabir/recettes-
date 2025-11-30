import mongoose from 'mongoose';
// Comment Schema
const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Le contenu du commentaire est requis'],
    trim: true,
    maxlength: [1000, 'Le commentaire ne peut pas dépasser 1000 caractères'],
    },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  replies: [{
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'La réponse ne peut pas dépasser 500 caractères'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  }],
  isEdited: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Index for recipe comments
commentSchema.index({ recipe: 1, createdAt: -1 });

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;

