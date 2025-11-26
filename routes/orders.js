const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Lapin = require('../models/Lapin');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { sendOrderConfirmationEmail } = require('../services/emailService');
const { sendOrderSMS } = require('../services/smsService');

// Créer une nouvelle commande
router.post('/', auth, async (req, res) => {
  try {
    const { items, totalAmount, deliveryAddress, customerInfo } = req.body;

    // Validation des données
    if (!items || items.length === 0) {
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

    // Créer la commande
    const order = new Order({
      customerId: req.user.id,
      items,
      totalAmount,
      deliveryAddress: deliveryAddress || {},
      customerInfo: {
        email: req.user.email,
        phone: customerInfo?.phone || '',
        fullName: req.user.name || ''
      }
    });

    await order.save();

    // Mettre à jour les stocks et lier la commande aux lapins
    for (const item of items) {
      await Lapin.findByIdAndUpdate(
        item.lapinId,
        { 
          $inc: { stock: -item.quantity },
          $push: { orders: order._id }
        }
      );
    }

    // Récupérer les informations complètes de la commande
    const orderWithDetails = await Order.findById(order._id)
      .populate('customerId', 'name email phone')
      .populate('items.lapinId', 'breed weight age');

    // Envoyer les notifications
    try {
      await sendOrderConfirmationEmail(orderWithDetails);
      await sendOrderSMS(orderWithDetails);
    } catch (notificationError) {
      console.error('Erreur envoi notifications:', notificationError);
      // On continue même si les notifications échouent
    }

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: orderWithDetails
    });

  } catch (error) {
    console.error('Erreur création commande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de la commande',
      error: error.message
    });
  }
});

// Récupérer les commandes d'un utilisateur
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('items.lapinId', 'breed images');

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;