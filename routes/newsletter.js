const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');
const { newsletterValidation } = require('../middleware/newsletterValidation');

// 📧 POST /api/newsletter/inscription - Inscription newsletter (PUBLIC)
router.post('/inscription', async (req, res) => {
  try {
    // Validation des données
    const { error } = newsletterValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, source = 'site_vitrine', preferences = {} } = req.body;

    // Vérifier si l'email existe déjà
    const existingEmail = await Newsletter.findOne({ email });
    if (existingEmail) {
      if (existingEmail.statut === 'desabonne') {
        // Réactiver l'inscription
        existingEmail.statut = 'actif';
        existingEmail.preferences = { ...existingEmail.preferences, ...preferences };
        await existingEmail.save();
        
        return res.json({
          success: true,
          message: 'Email réactivé avec succès!',
          data: existingEmail
        });
      }
      
      return res.status(409).json({
        success: false,
        message: 'Cet email est déjà inscrit à notre newsletter'
      });
    }

    // Créer nouvelle inscription
    const nouvelleInscription = new Newsletter({
      email,
      source,
      preferences: {
        notifications: preferences.notifications !== false,
        promotions: preferences.promotions !== false,
        nouvelles: preferences.nouvelles !== false
      },
      metadata: {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        pageInscription: req.get('Referer')
      }
    });

    await nouvelleInscription.save();

    res.status(201).json({
      success: true,
      message: 'Inscription à la newsletter réussie!',
      data: nouvelleInscription
    });

  } catch (error) {
    console.error('Erreur inscription newsletter:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription'
    });
  }
});

// 📧 GET /api/newsletter/abonnes - Liste des abonnés (ADMIN SEULEMENT)
router.get('/abonnes', async (req, res) => {
  try {
    const { statut, page = 1, limit = 20 } = req.query;

    let filter = {};
    if (statut) filter.statut = statut;

    const abonnes = await Newsletter.find(filter)
      .select('-__v')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Newsletter.countDocuments(filter);

    res.json({
      success: true,
      data: abonnes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur liste abonnés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// 📧 PATCH /api/newsletter/desabonnement - Désabonnement (PUBLIC)
router.patch('/desabonnement', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email est requis pour le désabonnement'
      });
    }

    const abonne = await Newsletter.findOne({ email });
    if (!abonne) {
      return res.status(404).json({
        success: false,
        message: 'Email non trouvé'
      });
    }

    abonne.statut = 'desabonne';
    await abonne.save();

    res.json({
      success: true,
      message: 'Désabonnement réussi'
    });

  } catch (error) {
    console.error('Erreur désabonnement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// 📧 GET /api/newsletter/stats - Statistiques (ADMIN)
router.get('/stats', async (req, res) => {
  try {
    const totalAbonnes = await Newsletter.countDocuments({ statut: 'actif' });
    const totalDesabonnes = await Newsletter.countDocuments({ statut: 'desabonne' });
    
    const inscriptionsParMois = await Newsletter.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    const sources = await Newsletter.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalAbonnes,
        totalDesabonnes,
        inscriptionsParMois,
        sources
      }
    });

  } catch (error) {
    console.error('Erreur stats newsletter:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;