// src/scripts/initCategories.ts - VERSION CORRIGÉE
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore'; // ← Ajouter Timestamp
import { db } from '@/utils/firebase';

const initialCategories = [
  {
    name: "Entrées",
    description: "Plats légers pour commencer le repas",
    image: "/categories/entrees.jpg",
    recipeCount: 0,
    isActive: true,
    slug: "entrees"
  },
  {
    name: "Plats principaux", 
    description: "Plats complets et nourrissants",
    image: "/categories/plats-principaux.jpg",
    recipeCount: 0,
    isActive: true,
    slug: "plats-principaux"
  },
  {
    name: "Desserts",
    description: "Douceurs pour terminer le repas", 
    image: "/categories/desserts.jpg",
    recipeCount: 0,
    isActive: true,
    slug: "desserts"
  },
  {
    name: "Boissons",
    description: "Rafraîchissements et cocktails",
    image: "/categories/boissons.jpg", 
    recipeCount: 0,
    isActive: true,
    slug: "boissons"
  },
  {
    name: "Apéritifs",
    description: "Bouchées et accompagnements pour l'apéro",
    image: "/categories/aperitifs.jpg",
    recipeCount: 0,
    isActive: true,
    slug: "aperitifs"
  },
  {
    name: "Sauces",
    description: "Sauces et accompagnements",
    image: "/categories/sauces.jpg",
    recipeCount: 0,
    isActive: true,
    slug: "sauces"
  }
];

export const initializeCategories = async () => {
  try {
    console.log('🔍 Vérification des catégories...');
    
    const existingCategories = await getDocs(collection(db, 'categories'));
    
    if (existingCategories.empty) {
      console.log('📝 Création des catégories initiales...');
      
      for (const category of initialCategories) {
        await addDoc(collection(db, 'categories'), {
          ...category,
          createdAt: Timestamp.now(), // ← UTILISER Timestamp
          updatedAt: Timestamp.now()  // ← UTILISER Timestamp
        });
        console.log(`✅ Créée: ${category.name}`);
      }
      
      console.log('🎉 Toutes les catégories créées avec succès !');
    } else {
      console.log('✅ Catégories déjà existantes:', existingCategories.size);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création des catégories:', error);
  }
};