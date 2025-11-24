// migrate-categories.js
require('dotenv').config();
const mongoose = require('mongoose');
const Lapin = require('./models/Lapin');
const Category = require('./models/Category');

const migrateLapinsCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Mapping des anciennes catégories string vers les nouveaux IDs
    const categoryMapping = {
      'lapin frais': '6919c64108fbce24c31f67f4',
      'lapin fumé': '6919c64108fbce24c31f67f7', 
      'lapin prêt à cuire': '6919c64208fbce24c31f67fa'
    };

    // Récupérer tous les lapins avec l'ancien champ category
    const lapins = await Lapin.find({ category: { $exists: true } });
    console.log(`📦 ${lapins.length} lapins à migrer`);

    let migrated = 0;
    for (const lapin of lapins) {
      const newCategoryId = categoryMapping[lapin.category];
      
      if (newCategoryId) {
        await Lapin.findByIdAndUpdate(lapin._id, {
          $set: { categoryId: newCategoryId },
          $unset: { category: 1 } // Supprimer l'ancien champ
        });
        migrated++;
        console.log(`✅ Lapin ${lapin._id} migré: "${lapin.category}" → ${newCategoryId}`);
      } else {
        console.log(`❌ Catégorie non mappée: "${lapin.category}"`);
      }
    }

    console.log(`\n🎉 Migration terminée: ${migrated}/${lapins.length} lapins migrés`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur migration:', error);
    process.exit(1);
  }
};

migrateLapinsCategories();