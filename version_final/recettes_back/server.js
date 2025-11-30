// === Import des modules ===
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';

// === Import des routes ===
import authRoutes from './routes/auth.js';
import recipeRoutes from './routes/recipes.js';
import userRoutes from './routes/users.js';
import commentRoutes from './routes/comments.js';
import categoryRoutes from './routes/categories.js';
import notificationRoutes from './routes/notifications.js';

// === Chargement des variables d'environnement ===
dotenv.config();

// === Initialisation de l’application Express ===
const app = express();

// === Configuration CORS ===
// Autorise toutes les origines (pour développement)
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// === Middleware pour parser les requêtes ===
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === Déclaration des routes ===
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);

// === Route de test (Health Check) ===
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running 🚀' });
});

// === Middleware global de gestion d'erreurs ===
app.use(errorHandler);

// === Connexion à MongoDB ===
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/recettes_db';
    await mongoose.connect(uri);
    console.log(`✅ MongoDB connecté avec succès : ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB :', error.message);
    process.exit(1);
  }
};

// === Lancer la connexion à la base de données ===
connectDB();

// === Gestion propre de l’arrêt du serveur ===
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🛑 Connexion MongoDB fermée proprement');
  process.exit(0);
});

// === Démarrage du serveur ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT} (accessible sur le réseau local)`);
});
