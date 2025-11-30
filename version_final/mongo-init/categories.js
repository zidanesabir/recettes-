// Seed categories into the 'recette' database.
// This script is designed to be safe to run multiple times (idempotent).

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const dbName = 'recette';
const dbRef = db.getSiblingDB(dbName);

// Ensure indexes for uniqueness
try {
  dbRef.categories.createIndex({ name: 1 }, { unique: true });
  dbRef.categories.createIndex({ slug: 1 }, { unique: true, sparse: true });
} catch (e) {
  // ignore if already exists
}

const categories = [
  {
    _id: new ObjectId('6912359657e11354823534a1'),
    name: 'Entrées',
    slug: slugify('Entrées'),
    description: 'Petits plats pour commencer le repas.',
    isActive: true,
  },
  {
    _id: new ObjectId('69123abd57e11354823534e9'),
    name: 'Plats principaux',
    slug: 'plats-principaux',
    description: 'Les plats principaux complets et nourrissants pour le déjeuner ou le dîner.',
    isActive: true,
  },
  {
    _id: new ObjectId('69123abd57e11354823534ea'),
    name: 'Desserts',
    slug: 'desserts',
    description: 'Douceurs sucrées pour terminer le repas sur une note gourmande.',
    isActive: true,
  },
  {
    _id: new ObjectId('69123abd57e11354823534eb'),
    name: 'Boissons',
    slug: 'boissons',
    description: 'Jus, smoothies, cafés et autres boissons rafraîchissantes.',
    isActive: true,
  },
];

categories.forEach((cat) => {
  const slug = cat.slug || slugify(cat.name);
  const doc = { ...cat, slug };
  dbRef.categories.updateOne(
    { name: doc.name },
    { $setOnInsert: doc },
    { upsert: true }
  );
});

print(`Seeded/ensured ${categories.length} categories into database '${dbName}'.`);