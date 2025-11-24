// migrate-simple.js
require('dotenv').config();
const mongoose = require('mongoose');

const migrateSimple = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const db = mongoose.connection.db;
    
    // Mapping des catégories
    const categoryMapping = {
      'Lapin frais': '6919c64108fbce24c31f67f4',
      'Lapin fumé': '6919c64108fbce24c31f67f7', 
      'Lapin prêt à cuire': '6919c64208fbce24c31f67fa',
      'lapin frais': '6919c64108fbce24c31f67f4',
      'undefined': '6919c64108fbce24c31f67f4'
    };

    // Mettre à jour tous les lapins
    const result = await db.collection('lapins').updateMany(
      { category: { $exists: true } },
      [
        {
          $set: {
            categoryId: {
              $switch: {
                branches: [
                  { case: { $eq: ["$category", "Lapin frais"] }, then: new mongoose.Types.ObjectId("6919c64108fbce24c31f67f4") },
                  { case: { $eq: ["$category", "Lapin fumé"] }, then: new mongoose.Types.ObjectId("6919c64108fbce24c31f67f7") },
                  { case: { $eq: ["$category", "Lapin prêt à cuire"] }, then: new mongoose.Types.ObjectId("6919c64208fbce24c31f67fa") },
                  { case: { $eq: ["$category", "lapin frais"] }, then: new mongoose.Types.ObjectId("6919c64108fbce24c31f67f4") }
                ],
                default: new mongoose.Types.ObjectId("6919c64108fbce24c31f67f4")
              }
            }
          }
        },
        {
          $unset: "category"
        }
      ]
    );

    console.log(`✅ Migration réussie: ${result.modifiedCount} lapins mis à jour`);

    // Vérification
    const lapinsAvecCategoryId = await db.collection('lapins').countDocuments({ categoryId: { $exists: true } });
    const lapinsAvecCategory = await db.collection('lapins').countDocuments({ category: { $exists: true } });
    
    console.log(`📊 Lapins avec categoryId: ${lapinsAvecCategoryId}`);
    console.log(`📊 Lapins avec category (ancien): ${lapinsAvecCategory}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur migration:', error);
    process.exit(1);
  }
};

migrateSimple();