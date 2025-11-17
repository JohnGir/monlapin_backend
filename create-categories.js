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
        description: 'Lapin frais directement de l\'élevage',
        image: '/images/categories/lapin-frais.jpg'
      },
      {
        name: 'Lapin fumé',
        description: 'Lapin fumé selon les méthodes traditionnelles',
        image: '/images/categories/lapin-fume.png'
      },
      {
        name: 'Lapin prêt à cuire',
        description: 'Lapin préparé et prêt pour la cuisson',
        image: '/images/categories/lapin-pret-a-cuire.png'
      }
    ];

    for (const categoryData of categories) {
      const existingCategory = await Category.findOne({ name: categoryData.name });
      
      if (!existingCategory) {
        const category = new Category(categoryData);
        await category.save();
        console.log(`✅ Catégorie créée: ${categoryData.name}`);
      } else {
        // Mettre à jour la catégorie existante avec l'image
        await Category.findOneAndUpdate(
          { name: categoryData.name },
          { image: categoryData.image },
          { new: true }
        );
        console.log(`🔄 Catégorie mise à jour: ${categoryData.name}`);
      }
    }

    console.log('\n🎉 Catégories initiales créées/mises à jour avec succès!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

createInitialCategories();