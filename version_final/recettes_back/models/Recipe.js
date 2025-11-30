import mongoose from 'mongoose';

const recipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true,
    maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères'],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  image: {
    type: String,
    default: '',
  },
  images: [{
    type: String,
  }],
  prepTime: {
    type: Number,
    required: [true, 'Le temps de préparation est requis'],
    min: [0, 'Le temps de préparation doit être positif'],
  },
  cookTime: {
    type: Number,
    required: [true, 'Le temps de cuisson est requis'],
    min: [0, 'Le temps de cuisson doit être positif'],
  },
  servings: {
    type: Number,
    required: [true, 'Le nombre de portions est requis'],
    min: [1, 'Le nombre de portions doit être au moins 1'],
  },
  difficulty: {
    type: String,
    enum: ['facile', 'moyenne', 'difficile'],
    required: [true, 'La difficulté est requise'],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'La catégorie est requise'],
  },
  tags: [{
    type: String,
    trim: true,
  }],
  ingredients: [{
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: String,
      trim: true,
    },
    unit: {
      type: String,
      trim: true,
    },
  }],
  instructions: [{
    step: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  }],
  nutrition: {
    calories: {
      type: Number,
      default: 0,
    },
    proteins: {
      type: Number,
      default: 0,
    },
    carbs: {
      type: Number,
      default: 0,
    },
    fats: {
      type: Number,
      default: 0,
    },
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  isPublished: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for search
recipeSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Calculate total time
recipeSchema.virtual('totalTime').get(function() {
  return this.prepTime + this.cookTime;
});

recipeSchema.set('toJSON', { virtuals: true });
recipeSchema.set('toObject', { virtuals: true });

const Recipe = mongoose.model('Recipe', recipeSchema);

export default Recipe;

