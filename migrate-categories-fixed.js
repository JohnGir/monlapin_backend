// migrate-categories-fixed.js
require('dotenv').config();
const mongoose = require('mongoose');
const Lapin = require('./models/Lapin');
const Category = require('./models/Category');

const migrateLapinsCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer toutes les catégories existantes
    const categories = await Category.find({});
    console.log('📋 Catégories disponibles:', categories.map(c => ({ name: c.name, _id: c._id })));

    // Mapping avec fallback pour "undefined"
    const categoryMapping = {
      'lapin frais': '6919c64108fbce24c31f67f4',
      'lapin fumé': '6919c64108fbce24c31f67f7', 
      'lapin prêt à cuire': '6919c64208fbce24c31f67fa',
      'undefined': '6919c64108fbce24c31f67f4' // ⬅️ Fallback pour "undefined"
    };

    // Récupérer tous les lapins avec l'ancien champ category
    const lapins = await Lapin.find({ category: { $exists: true } });
    console.log(`📦 ${lapins.length} lapins à migrer`);

    let migrated = 0;
    let errors = 0;

    for (const lapin of lapins) {
      try {
        const newCategoryId = categoryMapping[lapin.category];
        
        if (newCategoryId) {
          await Lapin.findByIdAndUpdate(lapin._id, {
            $set: { categoryId: new mongoose.Types.ObjectId(newCategoryId) },
            $unset: { category: 1 }
          });
          migrated++;
          console.log(`✅ Lapin ${lapin._id} migré: "${lapin.category}" → ${newCategoryId}`);
        } else {
          console.log(`❌ Catégorie non mappée: "${lapin.category}" - Attribution par défaut`);
          // Attribution à une catégorie par défaut
          await Lapin.findByIdAndUpdate(lapin._id, {
            $set: { categoryId: new mongoose.Types.ObjectId('6919c64108fbce24c31f67f4') }, // Lapin frais par défaut
            $unset: { category: 1 }
          });
          migrated++;
        }
      } catch (error) {
        errors++;
        console.log(`❌ Erreur sur lapin ${lapin._id}:`, error.message);
      }
    }

    console.log(`\n🎉 Migration terminée: ${migrated}/${lapins.length} lapins migrés, ${errors} erreurs`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur migration:', error);
    process.exit(1);
  }
};

migrateLapinsCategories();