// debug-categories.js
require('dotenv').config();
const mongoose = require('mongoose');
const Lapin = require('../models/Lapin');

const debugLapins = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Voir toutes les valeurs distinctes de category
    const distinctCategories = await Lapin.distinct('category');
    console.log('📋 Valeurs distinctes de category:', distinctCategories);

    // Voir quelques lapins avec leur category
    const sampleLapins = await Lapin.find({ category: { $exists: true } })
      .select('breed category')
      .limit(5);
    
    console.log('\n📝 Exemples de lapins:');
    sampleLapins.forEach(lapin => {
      console.log(`- ${lapin.breed}: category = "${lapin.category}" (type: ${typeof lapin.category})`);
    });

    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

debugLapins();