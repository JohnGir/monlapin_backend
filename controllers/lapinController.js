const Lapin = require('../models/Lapin');
const Eleveur = require('../models/Eleveur');
const { lapinValidation } = require('../middleware/validation');

// GET /api/lapins - Liste tous les lapins disponibles
exports.getLapins = async (req, res) => {
  try {
    const {
      categoryId, // ← Changé de 'category' à 'categoryId'
      breed,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10
    } = req.query;

    // Construire le filtre
    let filter = { isAvailable: true };
    
    if (categoryId) filter.categoryId = categoryId; // ← CORRECTION ICI
    if (breed) filter.breed = new RegExp(breed, 'i');
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const lapins = await Lapin.find(filter)
      .populate('eleveurId', 'farmName farmAddress.city')
      .populate('categoryId', 'name description image') // ← AJOUT: Peupler la catégorie
      .select('-__v')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Lapin.countDocuments(filter);

    res.json({
      success: true,
      data: lapins,
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
};

// Récupérer les lapins d'une catégorie spécifique
exports.getLapinsByCategory = async (req, res) => {
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
      categoryId: categoryId 
    };

    const lapins = await Lapin.find(filter)
      .populate('eleveurId', 'farmName farmAddress.city')
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
};

// GET /api/lapins/:id - Détails d'un lapin
exports.getLapin = async (req, res) => {
  try {
    const lapin = await Lapin.findById(req.params.id)
      .populate('eleveurId', 'farmName farmAddress.city description');

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
};

// POST /api/lapins - Créer un lapin (Éleveur seulement)
exports.createLapin = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un éleveur
    if (req.user.role !== 'eleveur') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les éleveurs peuvent créer des lapins'
      });
    }

    // Validation des données
    const { error } = lapinValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Vérifier que l'éleveur existe et est approuvé
    const eleveur = await Eleveur.findOne({ userId: req.user.id });
    if (!eleveur) {
      return res.status(404).json({
        success: false,
        message: 'Profil éleveur non trouvé'
      });
    }

    if (!eleveur.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Votre compte éleveur n\'est pas encore approuvé'
      });
    }

    // Créer le lapin
    const lapin = new Lapin({
      ...req.body,
      eleveurId: eleveur._id
    });

    await lapin.save();

    // Populer les données pour la réponse
    await lapin.populate('eleveurId', 'farmName farmAddress.city');

    res.status(201).json({
      success: true,
      message: 'Lapin créé avec succès',
      data: lapin
    });

  } catch (error) {
    console.error('Erreur createLapin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création'
    });
  }
};

// PUT /api/lapins/:id - Modifier un lapin
exports.updateLapin = async (req, res) => {
  try {
    const lapin = await Lapin.findById(req.params.id);
    
    if (!lapin) {
      return res.status(404).json({
        success: false,
        message: 'Lapin non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire du lapin
    const eleveur = await Eleveur.findOne({ userId: req.user.id });
    if (!eleveur || lapin.eleveurId.toString() !== eleveur._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier ce lapin'
      });
    }

    const updatedLapin = await Lapin.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('eleveurId', 'farmName farmAddress.city');

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
};

// DELETE /api/lapins/:id - Supprimer un lapin
exports.deleteLapin = async (req, res) => {
  try {
    const lapin = await Lapin.findById(req.params.id);
    
    if (!lapin) {
      return res.status(404).json({
        success: false,
        message: 'Lapin non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire du lapin
    const eleveur = await Eleveur.findOne({ userId: req.user.id });
    if (!eleveur || lapin.eleveurId.toString() !== eleveur._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à supprimer ce lapin'
      });
    }

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
};

// GET /api/lapins/eleveur/mes-lapins - Mes lapins (pour éleveur)
exports.getMesLapins = async (req, res) => {
  try {
    if (req.user.role !== 'eleveur') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux éleveurs'
      });
    }

    const eleveur = await Eleveur.findOne({ userId: req.user.id });
    if (!eleveur) {
      return res.status(404).json({
        success: false,
        message: 'Profil éleveur non trouvé'
      });
    }

    const lapins = await Lapin.find({ eleveurId: eleveur._id })
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
};