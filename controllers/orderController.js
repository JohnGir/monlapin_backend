// controllers/orderController.js
const Order = require('../models/Order'); // ⬅️ Order, pas Commande
const Lapin = require('../models/Lapin');

exports.createOrder = async (req, res) => {
  try {
    const { items, totalAmount, deliveryAddress, customerInfo } = req.body;

    console.log('📦 Début création commande pour user:', req.user.id);

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le panier est vide'
      });
    }

    // Vérifier le stock
    for (const item of items) {
      const lapin = await Lapin.findById(item.lapinId);
      if (!lapin || lapin.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuffisant pour ${item.name}`
        });
      }
    }

    // Générer orderNumber
    const orderNumber = `CMD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    console.log('🔢 OrderNumber généré:', orderNumber);

    // Créer avec Order
    const order = new Order({
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
      deliveryAddress: deliveryAddress || { city: "Abidjan", address: "À préciser" },
      customerInfo: {
        email: req.user.email,
        phone: customerInfo?.phone || '',
        fullName: req.user.name || ''
      },
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'wave'
    });

    await order.save();
    console.log('✅ Order sauvegardée:', order._id);

    // Mettre à jour stocks
    for (const item of items) {
      await Lapin.findByIdAndUpdate(item.lapinId, { $inc: { stock: -item.quantity } });
    }

    const orderWithDetails = await Order.findById(order._id)
      .populate('customerId', 'name email phone')
      .populate('items.lapinId', 'breed weight age');

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: orderWithDetails
    });

  } catch (error) {
    console.error('❌ Erreur création order:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user.id })
      .populate('items.lapinId', 'breed images')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate('items.lapinId', 'breed weight age images');

    if (!order) return res.status(404).json({ success: false, message: 'Commande non trouvée' });

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};