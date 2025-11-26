// cleanup-old-category-field.js
require('dotenv').config();
const mongoose = require('mongoose');
const Lapin = require('./models/Lapin');

const cleanup = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Supprimer définitivement le champ 'category' de tous les lapins
  const result = await Lapin.updateMany(
    { category: { $exists: true } },
    { $unset: { category: 1 } }
  );
  
  console.log('🧹 NETTOYAGE TERMINÉ:');
  console.log(`- Documents modifiés: ${result.modifiedCount}`);
  console.log(`- Champ 'category' supprimé de tous les lapins`);
  
  process.exit();
};

cleanup();