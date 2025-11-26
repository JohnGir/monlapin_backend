// check-migration-status.js
require('dotenv').config();
const mongoose = require('mongoose');
const Lapin = require('../models/Lapin');

const checkStatus = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Lapins avec l'ancien système
  const lapinsAvecCategory = await Lapin.countDocuments({ category: { $exists: true } });
  
  // Lapins avec le nouveau système
  const lapinsAvecCategoryId = await Lapin.countDocuments({ categoryId: { $exists: true } });
  
  // Lapins sans catégorie
  const lapinsSansCategorie = await Lapin.countDocuments({ 
    category: { $exists: false }, 
    categoryId: { $exists: false } 
  });
  
  console.log('📊 STATUT MIGRATION:');
  console.log(`- Lapins avec ancien champ 'category': ${lapinsAvecCategory}`);
  console.log(`- Lapins avec nouveau champ 'categoryId': ${lapinsAvecCategoryId}`);
  console.log(`- Lapins sans catégorie: ${lapinsSansCategorie}`);
  console.log(`- Total lapins: ${await Lapin.countDocuments()}`);
  
  process.exit();
};

checkStatus();