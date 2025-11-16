require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');

const createInitialCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const categories = [
      {
        name: 'Lapin frais',
        description: 'Lapin frais directement de l\'élevage'
      },
      {
        name: 'Lapin fumé',
        description: 'Lapin fumé selon les méthodes traditionnelles'
      },
      {
        name: 'Lapin prêt à cuire',
        description: 'Lapin préparé et prêt pour la cuisson'
      }
    ];

    for (const categoryData of categories) {
      const existingCategory = await Category.findOne({ name: categoryData.name });
      
      if (!existingCategory) {
        const category = new Category(categoryData);
        await category.save();
        console.log(`✅ Catégorie créée: ${categoryData.name}`);
      } else {
        console.log(`ℹ️  Catégorie existe déjà: ${categoryData.name}`);
      }
    }

    console.log('\n🎉 Catégories initiales créées avec succès!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

createInitialCategories();