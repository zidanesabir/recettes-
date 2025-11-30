import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Category from '../models/Category.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const importCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/recettes_db');
    console.log('✅ Connecté à MongoDB');

    // Read categories from JSON file
    const categoriesPath = path.join(__dirname, '../data/categories.json');
    const categoriesData = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

    console.log(`📦 Import de ${categoriesData.length} catégories...`);

    // Delete existing categories
    await Category.deleteMany({});
    console.log('🗑️  Catégories existantes supprimées');

    // Insert categories
    const createdCategories = await Category.insertMany(categoriesData);
    console.log(`✅ ${createdCategories.length} catégories importées avec succès:`);
    
    createdCategories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.slug})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

importCategories();





