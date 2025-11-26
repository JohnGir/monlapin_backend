// final-cleanup.js
require('dotenv').config();
const mongoose = require('mongoose');

const finalCleanup = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  console.log('🧹 DÉBUT DU NETTOYAGE COMPLET...');
  
  // 1. Liste des collections
  const collections = await db.listCollections().toArray();
  console.log('📋 Collections existantes:');
  collections.forEach(c => console.log(`- ${c.name}`));
  
  // 2. Vérifier les données orphelines
  const Lapin = require('./models/Lapin');
  const Category = require('./models/Category');
  
  const lapinsSansCategorieValide = await Lapin.countDocuments({
    categoryId: { $exists: true },
    $or: [
      { categoryId: null },
      { categoryId: { $type: 'string' } } // Au cas où
    ]
  });
  
  console.log(`\n🔍 Lapins avec categoryId invalide: ${lapinsSansCategorieValide}`);
  
  // 3. Nettoyage final du champ category
  const cleanupResult = await Lapin.updateMany(
    { category: { $exists: true } },
    { $unset: { category: "" } }
  );
  
  console.log(`\n✅ NETTOYAGE TERMINÉ:`);
  console.log(`- Champ 'category' nettoyé: ${cleanupResult.modifiedCount} documents`);
  console.log(`- Migration totalement finalisée`);
  
  process.exit();
};

finalCleanup();