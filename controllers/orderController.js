// controllers/orderController.js

const Commande = require('../models/Commande'); // ⬅️ Changé
const Lapin = require('../models/Lapin');
const User = require('../models/User');

// 🛒 POST /api/orders - Créer une nouvelle commande
exports.createOrder = async (req, res) => {
  try {
    const { items, totalAmount, deliveryAddress, customerInfo } = req.body;

    console.log('📦 Début création commande pour user:', req.user.id);

    // Validation basique
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le panier est vide'
      });
    }

    // Vérifier le stock pour chaque article
    for (const item of items) {
      const lapin = await Lapin.findById(item.lapinId);
      
      if (!lapin) {
        return res.status(404).json({
          success: false,
          message: `Produit non trouvé: ${item.name}`
        });
      }

      if (lapin.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuffisant pour ${item.name}. Stock disponible: ${lapin.stock}`
        });
      }
    }

    // Générer le numéro de commande
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const orderNumber = `CMD-${timestamp}-${random}`;
    
    console.log('🔢 OrderNumber généré:', orderNumber);

    // Créer la commande
    const commande = new Commande({ // ⬅️ Changé
      orderNumber: orderNumber,
      customerId: req.user.id,
      items: items.map(item => ({
        lapinId: item.lapinId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
      totalAmount: totalAmount,
      deliveryAddress: deliveryAddress || {
        city: "Abidjan",
        address: "À préciser"
      },
      customerInfo: {
        email: req.user.email,
        phone: customerInfo?.phone || '',
        fullName: req.user.name || ''
      },
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'wave'
    });

    console.log('💾 Sauvegarde de la commande...');
    await commande.save(); // ⬅️ Changé
    console.log('✅ Commande sauvegardée avec ID:', commande._id);

    // Mettre à jour les stocks
    for (const item of items) {
      await Lapin.findByIdAndUpdate(
        item.lapinId,
        { $inc: { stock: -item.quantity } }
      );
      console.log(`📉 Stock réduit pour ${item.lapinId}: -${item.quantity}`);
    }

    // Récupérer la commande avec les détails
    const commandeWithDetails = await Commande.findById(commande._id) // ⬅️ Changé
      .populate('customerId', 'name email phone')
      .populate('items.lapinId', 'breed weight age');

    console.log('🎉 Commande créée avec succès:', orderNumber);

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: commandeWithDetails
    });

  } catch (error) {
    console.error('❌ Erreur création commande:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation: ' + errors.join(', ')
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Numéro de commande déjà utilisé, veuillez réessayer'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de la commande',
      error: error.message
    });
  }
};

// Les autres fonctions restent similaires avec Commande au lieu de Order