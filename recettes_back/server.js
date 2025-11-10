import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import recipeRoutes from './routes/recipes.js';
import userRoutes from './routes/users.js';
import commentRoutes from './routes/comments.js';
import categoryRoutes from './routes/categories.js';
import notificationRoutes from './routes/notifications.js';

// Load environment variables
dotenv.config();

const app = express();

// === Middleware CORS ===
// Autorise toutes les origines pour développement réseau local
app.use(cors({
  origin: (origin, callback) => {
    // Autorise Postman, mobile apps, curl, etc.
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware pour parser JSON et urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === Routes ===
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running' });
});

// Middleware de gestion d'erreurs
app.use(errorHandler);

// === Connexion MongoDB ===
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/recettes_db';
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connecté avec succès');
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    process.exit(1);
  }
};

connectDB();

// === Démarrage serveur ===
// 0.0.0.0 = accessible depuis tout le réseau local
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT} (accessible sur le réseau local)`);
});
