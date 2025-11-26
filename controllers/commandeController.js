// controllers/commandeController.js
const Commande = require('../models/Commande');
const Client = require('../models/Client');
const Lapin = require('../models/Lapin');
const Eleveur = require('../models/Eleveur');

// POST /api/commandes - Créer une commande
exports.createCommande = async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les clients peuvent passer des commandes'
      });
    }

    const { items, deliveryAddress, totalAmount, customerInfo } = req.body;

    // Validation basique
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La commande doit contenir au moins un article'
      });
    }

    const client = await Client.findOne({ userId: req.user.id });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Profil client non trouvé'
      });
    }

    // Vérifier le stock pour chaque article
    for (const item of items) {
      const lapin = await Lapin.findById(item.lapinId);
      
      if (!lapin) {
        return res.status(404).json({
          success: false,
          message: `Lapin non trouvé: ${item.name || item.lapinId}`
        });
      }

      if (!lapin.isAvailable || lapin.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuffisant pour: ${item.name || lapin.breed}. Stock disponible: ${lapin.stock}`
        });
      }
    }

    // 🔥 CORRECTION : Générer le orderNumber AVANT de créer la commande
    const orderNumber = 'CMD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    console.log('📦 Création commande avec orderNumber:', orderNumber);

    // Créer la commande avec TOUS les champs requis
    const commande = new Commande({
      orderNumber, // ⬅️ BIEN INCLU ICI
      clientId: client._id,
      items: items.map(item => ({
        lapinId: item.lapinId,
        quantity: item.quantity,
        unitPrice: item.price,
        lapinBreed: item.name,
        name: item.name,
        price: item.price,
        image: item.image
      })),
      totalAmount: totalAmount || items.reduce((total, item) => total + (item.price * item.quantity), 0),
      deliveryAddress: deliveryAddress || client.deliveryAddress || {
        city: "Abidjan",
        address: "À préciser"
      },
      customerInfo: customerInfo || {
        email: req.user.email,
        phone: client.phone || '',
        fullName: client.fullName || req.user.name || ''
      },
      status: 'pending',
      paymentMethod: 'wave', // ⬅️ Ajouté pour Wave
      paymentStatus: 'pending'
    });

    // Sauvegarder la commande
    await commande.save();
    console.log('✅ Commande sauvegardée:', commande._id);

    // Réduire le stock
    for (const item of items) {
      await Lapin.findByIdAndUpdate(
        item.lapinId,
        { $inc: { stock: -item.quantity } }
      );
      console.log(`📉 Stock réduit pour ${item.lapinId}: -${item.quantity}`);
    }

    // Populer pour la réponse
    const commandeAvecDetails = await Commande.findById(commande._id)
      .populate('clientId', 'fullName phone deliveryAddress');

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: commandeAvecDetails
    });

  } catch (error) {
    console.error('❌ Erreur createCommande:', error);
    
    // Erreur spécifique pour orderNumber manquant
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation: ' + Object.values(error.errors).map(e => e.message).join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de commande',
      error: error.message
    });
  }
};

// GET /api/commandes/mes-commandes - Mes commandes (client)
exports.getMesCommandes = async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux clients'
      });
    }

    const client = await Client.findOne({ userId: req.user.id });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Profil client non trouvé'
      });
    }

    const commandes = await Commande.find({ clientId: client._id })
      .populate('assignedEleveurId', 'farmName farmAddress.city')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: commandes
    });

  } catch (error) {
    console.error('Erreur getMesCommandes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// GET /api/commandes/eleveur/mes-commandes - Commandes assignées à l'éleveur
exports.getCommandesEleveur = async (req, res) => {
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

    const commandes = await Commande.find({ assignedEleveurId: eleveur._id })
      .populate('clientId', 'type deliveryAddress')
      .sort({ createdAt: -1 });

    res.json({
      success: false,
      data: commandes
    });

  } catch (error) {
    console.error('Erreur getCommandesEleveur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};