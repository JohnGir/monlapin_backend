const mongoose = require('mongoose');

const commandeSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  items: [{
    lapinId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lapin',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    lapinBreed: {
      type: String,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash_on_delivery', 'mobile_money'],
    default: 'cash_on_delivery'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  deliveryAddress: {
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    postalCode: { type: String },
    contactPhone: { type: String }
  },
  assignedEleveurId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Eleveur'
  },
  livraison: {
    yangoTrackingId: { type: String },
    livraisonStatus: {
      type: String,
      enum: ['en_attente', 'en_cours', 'livré'],
      default: 'en_attente'
    },
    estimatedDelivery: { type: Date },
    deliveryNotes: { type: String }
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index pour les recherches
commandeSchema.index({ orderNumber: 1 }, { unique: true });
commandeSchema.index({ clientId: 1 });
commandeSchema.index({ status: 1 });
commandeSchema.index({ assignedEleveurId: 1 });
commandeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Commande', commandeSchema);