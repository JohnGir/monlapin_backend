const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { auth, authorize } = require('../middleware/auth');

// GET /api/categories - Liste toutes les catégories (PUBLIC)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('-__v')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Erreur getCategories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/categories - Créer une catégorie (ADMIN SEULEMENT)
router.post('/', auth, authorize('admin', 'gestionnaire'), async (req, res) => {
  try {
    const { name, description } = req.body;

    // Vérifier si la catégorie existe déjà
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Cette catégorie existe déjà'
      });
    }

    const category = new Category({
      name,
      description
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Catégorie créée avec succès',
      data: category
    });

  } catch (error) {
    console.error('Erreur createCategory:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création'
    });
  }
});

// GET /api/categories/stats - Statistiques des catégories
router.get('/stats', async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: 'lapins',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'lapins'
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          stockTotal: 1,
          totalLapins: { $size: '$lapins' },
          lapinsDisponibles: {
            $size: {
              $filter: {
                input: '$lapins',
                as: 'lapin',
                cond: { $eq: ['$$lapin.isAvailable', true] }
              }
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Erreur stats categories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;