const express = require('express');
const router = express.Router();
const Lapin = require('../models/Lapin');
const Eleveur = require('../models/Eleveur');
const Category = require('../models/Category'); // ⬅️ AJOUT IMPORTANT
const { lapinValidation } = require('../middleware/validation');
const { auth, authorize, checkLapinOwnership } = require('../middleware/auth');

// 🐇 GET /api/lapins - Liste tous les lapins disponibles (PUBLIC)
router.get('/', async (req, res) => {
  try {
    const {
      categoryId, // ⬅️ CORRIGÉ: 'category' → 'categoryId'
      minPrice,
      maxPrice,
      city,
      page = 1,
      limit = 10
    } = req.query;

    // Construire le filtre
    let filter = { isAvailable: true, stock: { $gt: 0 } };
    
    if (categoryId) filter.categoryId = categoryId; // ⬅️ CORRIGÉ: 'category' → 'categoryId'
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const lapins = await Lapin.find(filter)
      .populate('eleveurId', 'farmName farmAddress.city farmAddress.coordinates')
      .populate('categoryId', 'name description image') // ⬅️ AJOUT: Peupler la catégorie
      .select('-__v')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Lapin.countDocuments(filter);

    // 🔥 CALCUL DU STOCK TOTAL
    const totalLapins = await Lapin.aggregate([
      { $match: filter },
      { $group: { _id: null, totalLapins: { $sum: "$stock" } } }
    ]);

    res.json({
      success: true,
      data: lapins,
      stats: {
        totalRaceLapins: total,
        totalLapins: totalLapins[0]?.totalLapins || 0
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur getLapins:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// 🐇 GET /api/lapins/category/:categoryId - Lapins par catégorie (PUBLIC) ⬅️ NOUVELLE ROUTE
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Vérifier que la catégorie existe
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }

    const filter = { 
      isAvailable: true, 
      stock: { $gt: 0 },
      categoryId: categoryId 
    };

    const lapins = await Lapin.find(filter)
      .populate('eleveurId', 'farmName farmAddress.city farmAddress.coordinates')
      .populate('categoryId', 'name description image')
      .select('-__v')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Lapin.countDocuments(filter);

    res.json({
      success: true,
      data: {
        category: {
          _id: category._id,
          name: category.name,
          description: category.description,
          image: category.image
        },
        lapins: lapins
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur getLapinsByCategory:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// 🐇 GET /api/lapins/:id - Détails d'un lapin (PUBLIC)
router.get('/:id', async (req, res) => {
  try {
    const lapin = await Lapin.findById(req.params.id)
      .populate('eleveurId', 'farmName farmAddress.city description')
      .populate('categoryId', 'name description image'); // ⬅️ AJOUT: Peupler la catégorie

    if (!lapin) {
      return res.status(404).json({
        success: false,
        message: 'Lapin non trouvé'
      });
    }

    res.json({
      success: true,
      data: lapin
    });

  } catch (error) {
    console.error('Erreur getLapin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// 🐇 POST /api/lapins - Créer un lapin (ÉLEVEUR SEULEMENT)
router.post('/', auth, authorize('eleveur'), async (req, res) => {
  try {
    console.log('=== 🚀 DÉBUT CRÉATION LAPIN ===');
    console.log('👤 User:', req.user.email, req.user._id);
    console.log('📦 Body reçu:', JSON.stringify(req.body, null, 2));

    // Validation des données
    const { error } = lapinValidation(req.body);
    if (error) {
      console.log('❌ ERREUR VALIDATION:', error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    console.log('✅ Validation OK');

    // Vérifier que l'éleveur existe
    const eleveur = await Eleveur.findOne({ userId: req.user.id });
    console.log('🔍 Recherche éleveur pour userId:', req.user.id);
    
    if (!eleveur) {
      console.log('❌ ÉLEVEUR NON TROUVÉ pour userId:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Profil éleveur non trouvé'
      });
    }
    console.log('✅ Éleveur trouvé:', eleveur.farmName, 'ID:', eleveur._id);
    console.log('📋 Statut approbation:', eleveur.isApproved);

    if (!eleveur.isApproved) {
      console.log('❌ ÉLEVEUR NON APPROUVÉ');
      return res.status(403).json({
        success: false,
        message: 'Votre compte éleveur n\'est pas encore approuvé'
      });
    }
    console.log('✅ Éleveur approuvé');

    // Vérifier que la catégorie existe
    const category = await Category.findById(req.body.categoryId);
    if (!category) {
      console.log('❌ CATÉGORIE NON TROUVÉE:', req.body.categoryId);
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }
    console.log('✅ Catégorie trouvée:', category.name);

    // Créer le lapin
    console.log('📝 Création du document Lapin...');
    const lapin = new Lapin({
      breed: req.body.breed,
      age: req.body.age,
      weight: req.body.weight,
      price: req.body.price,
      categoryId: req.body.categoryId, // ⬅️ CORRIGÉ: 'category' → 'categoryId'
      description: req.body.description,
      stock: req.body.stock,
      eleveurId: eleveur._id,
      isAvailable: true,
      images: req.body.images || [] // ⬅️ CORRIGÉ
    });

    console.log('💾 Sauvegarde en base...');
    await lapin.save();
    console.log('✅ Lapin sauvegardé avec ID:', lapin._id);

    // Populer pour la réponse
    await lapin.populate('categoryId', 'name description');
    await lapin.populate('eleveurId', 'farmName farmAddress.city');
    
    console.log('=== 🎉 CRÉATION RÉUSSIE ===');

    res.status(201).json({
      success: true,
      message: 'Lapin créé avec succès',
      data: lapin
    });

  } catch (error) {
    console.error('❌ ERREUR CRITIQUE:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création',
      error: error.message
    });
  }
});

// 🐇 PUT /api/lapins/:id - Modifier un lapin (SON ÉLEVEUR SEULEMENT)
router.put('/:id', auth, authorize('eleveur', 'admin', 'gestionnaire'), checkLapinOwnership, async (req, res) => {
  try {
    const updatedLapin = await Lapin.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('eleveurId', 'farmName farmAddress.city')
    .populate('categoryId', 'name description image'); // ⬅️ AJOUT

    res.json({
      success: true,
      message: 'Lapin modifié avec succès',
      data: updatedLapin
    });

  } catch (error) {
    console.error('Erreur updateLapin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la modification'
    });
  }
});

// 🐇 DELETE /api/lapins/:id - Supprimer un lapin (PROPRIÉTAIRE OU ADMIN)
router.delete('/:id', auth, authorize('admin', 'gestionnaire'), checkLapinOwnership, async (req, res) => {
  try {
    await Lapin.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Lapin supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur deleteLapin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression'
    });
  }
});

// 🐇 GET /api/lapins/eleveur/mes-lapins - Mes lapins (ÉLEVEUR SEULEMENT)
router.get('/eleveur/mes-lapins', auth, authorize('eleveur'), async (req, res) => {
  try {
    const eleveur = await Eleveur.findOne({ userId: req.user.id });
    if (!eleveur) {
      return res.status(404).json({
        success: false,
        message: 'Profil éleveur non trouvé'
      });
    }

    const lapins = await Lapin.find({ eleveurId: eleveur._id })
      .populate('eleveurId', 'farmName farmAddress.city')
      .populate('categoryId', 'name description image') // ⬅️ AJOUT
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: lapins
    });

  } catch (error) {
    console.error('Erreur getMesLapins:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// 🐇 PATCH /api/lapins/admin/approve-eleveur - Approuver un éleveur (ADMIN/GESTIONNAIRE)
router.patch('/admin/approve-eleveur/:eleveurId', auth, authorize('admin', 'gestionnaire'), async (req, res) => {
  try {
    const eleveur = await Eleveur.findById(req.params.eleveurId);
    
    if (!eleveur) {
      return res.status(404).json({
        success: false,
        message: 'Éleveur non trouvé'
      });
    }

    eleveur.isApproved = true;
    await eleveur.save();

    res.json({
      success: true,
      message: `Éleveur ${eleveur.farmName} approuvé avec succès`,
      data: eleveur
    });

  } catch (error) {
    console.error('Erreur approbation éleveur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;