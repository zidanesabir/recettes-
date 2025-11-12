<<<<<<< HEAD
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';

dotenv.config();

const initCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/recettes_db');
    console.log('✅ Connecté à MongoDB');

    const defaultCategories = [
      {
        name: 'Entrées',
        slug: 'entrees',
        description: 'Recettes d\'entrées et d\'apéritifs',
        isActive: true,
      },
      {
        name: 'Plats principaux',
        slug: 'plats-principaux',
        description: 'Recettes de plats principaux',
        isActive: true,
      },
      {
        name: 'Desserts',
        slug: 'desserts',
        description: 'Recettes de desserts',
        isActive: true,
      },
      {
        name: 'Boissons',
        slug: 'boissons',
        description: 'Recettes de boissons',
        isActive: true,
      },
    ];

    console.log('📦 Initialisation des catégories...');

    // Check if categories already exist
    const existingCategories = await Category.find({});
    if (existingCategories.length > 0) {
      console.log('ℹ️  Des catégories existent déjà. Utilisez importCategories.js pour réinitialiser.');
      process.exit(0);
    }

    // Insert default categories
    const createdCategories = await Category.insertMany(defaultCategories);
    console.log(`✅ ${createdCategories.length} catégories créées avec succès:`);
    
    createdCategories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.slug})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

initCategories();

=======
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';

dotenv.config();

const initCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/recettes_db');
    console.log('✅ Connecté à MongoDB');

    const defaultCategories = [
      {
        name: 'Entrées',
        slug: 'entrees',
        description: 'Recettes d\'entrées et d\'apéritifs',
        isActive: true,
      },
      {
        name: 'Plats principaux',
        slug: 'plats-principaux',
        description: 'Recettes de plats principaux',
        isActive: true,
      },
      {
        name: 'Desserts',
        slug: 'desserts',
        description: 'Recettes de desserts',
        isActive: true,
      },
      {
        name: 'Boissons',
        slug: 'boissons',
        description: 'Recettes de boissons',
        isActive: true,
      },
    ];

    console.log('📦 Initialisation des catégories...');

    // Check if categories already exist
    const existingCategories = await Category.find({});
    if (existingCategories.length > 0) {
      console.log('ℹ️  Des catégories existent déjà. Utilisez importCategories.js pour réinitialiser.');
      process.exit(0);
    }

    // Insert default categories
    const createdCategories = await Category.insertMany(defaultCategories);
    console.log(`✅ ${createdCategories.length} catégories créées avec succès:`);
    
    createdCategories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.slug})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

initCategories();

>>>>>>> 7bcff48 (add au projet recettes)
