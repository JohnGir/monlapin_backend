// create-categories-first.js
require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');

const createCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const categories = [
      {
        _id: new mongoose.Types.ObjectId("6919c64108fbce24c31f67f4"),
        name: 'Lapin frais',
        description: 'Lapin frais directement de l\'élevage',
        image: '/images/categories/lapin-frais.jpg',
        isActive: true
      },
      {
        _id: new mongoose.Types.ObjectId("6919c64108fbce24c31f67f7"),
        name: 'Lapin fumé',
        description: 'Lapin fumé selon les méthodes traditionnelles',
        image: '/images/categories/lapin-fume.png',
        isActive: true
      },
      {
        _id: new mongoose.Types.ObjectId("6919c64208fbce24c31f67fa"),
        name: 'Lapin prêt à cuire',
        description: 'Lapin préparé et prêt pour la cuisson',
        image: '/images/categories/lapin-pret-a-cuire.png',
        isActive: true
      }
    ];

    for (const categoryData of categories) {
      const existing = await Category.findById(categoryData._id);
      if (!existing) {
        const category = new Category(categoryData);
        await category.save();
        console.log(`✅ Catégorie créée: ${categoryData.name}`);
      } else {
        console.log(`ℹ️  Catégorie existe déjà: ${categoryData.name}`);
      }
    }

    // Vérification
    const allCategories = await Category.find({});
    console.log('\n📋 Catégories dans la base:');
    allCategories.forEach(cat => {
      console.log(`- ${cat.name} (${cat._id})`);
    });

    console.log('\n🎉 Catégories créées avec succès!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

createCategories();