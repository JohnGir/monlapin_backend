// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    lapinId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lapin',
      required: true
    },
    name: String,
    price: Number,
    quantity: Number,
    image: String
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  deliveryAddress: {
    city: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  customerInfo: {
    email: String,
    phone: String,
    fullName: String
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['wave', 'orange_money', 'cash_on_delivery'],
    default: 'wave'
  }
}, {
  timestamps: true,
  collection: 'commandes' // ⬅️ FORCE l'utilisation de la collection existante
});

module.exports = mongoose.model('Order', orderSchema, 'commandes'); // ⬅️ ICI AUSSI