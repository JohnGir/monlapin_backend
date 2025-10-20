const Commande = require('../models/Commande');
const Client = require('../models/Client');
const Lapin = require('../models/Lapin');
const Eleveur = require('../models/Eleveur');

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

// POST /api/commandes - Créer une commande
exports.createCommande = async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les clients peuvent passer des commandes'
      });
    }

    const { items, deliveryAddress } = req.body;

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

    // Vérifier le stock et calculer le total
    let totalAmount = 0;
    const itemsAvecDetails = [];

    for (const item of items) {
      const lapin = await Lapin.findById(item.lapinId);
      
      if (!lapin) {
        return res.status(404).json({
          success: false,
          message: `Lapin non trouvé: ${item.lapinId}`
        });
      }

      if (!lapin.isAvailable || lapin.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuffisant pour: ${lapin.breed}`
        });
      }

      totalAmount += lapin.price * item.quantity;
      
      itemsAvecDetails.push({
        lapinId: lapin._id,
        quantity: item.quantity,
        unitPrice: lapin.price,
        lapinBreed: lapin.breed
      });
    }

    // Générer numéro de commande
    const orderNumber = 'CMD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    // Créer la commande
    const commande = new Commande({
      orderNumber,
      clientId: client._id,
      items: itemsAvecDetails,
      totalAmount,
      deliveryAddress: deliveryAddress || client.deliveryAddress,
      status: 'pending',
      paymentMethod: 'cash_on_delivery',
      paymentStatus: 'pending'
    });

    await commande.save();

    // Réduire le stock (version simplifiée)
    for (const item of items) {
      await Lapin.findByIdAndUpdate(
        item.lapinId,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Populer pour la réponse
    await commande.populate('assignedEleveurId', 'farmName farmAddress.city');

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: commande
    });

  } catch (error) {
    console.error('Erreur createCommande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de commande'
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
      success: true,
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