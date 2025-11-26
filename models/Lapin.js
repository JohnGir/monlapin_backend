// models/Lapin.js - VERSION CORRIGÉE
const mongoose = require('mongoose');

const lapinSchema = new mongoose.Schema({
  eleveurId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Eleveur',
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  breed: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 1
  },
  weight: {
    type: Number,
    required: true,
    min: 0.1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    maxlength: 1000
  },
  images: [{
    type: String,
    trim: true
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 1
  }
}, {
  timestamps: true
});

// 🔥 CORRECTION : Hooks simplifiés et sécurisés
lapinSchema.post('save', function(doc) {
  // Ne rien faire pour l'instant - désactivé temporairement
  console.log('🐇 Lapin sauvegardé:', doc._id);
});

lapinSchema.post('findOneAndUpdate', function(doc) {
  // Ne rien faire pour l'instant - désactivé temporairement
  if (doc) {
    console.log('🐇 Lapin modifié:', doc._id);
  }
});

lapinSchema.post('findOneAndDelete', function(doc) {
  // Ne rien faire pour l'instant - désactivé temporairement  
  if (doc) {
    console.log('🐇 Lapin supprimé:', doc._id);
  }
});

// Index
lapinSchema.index({ eleveurId: 1 });
lapinSchema.index({ categoryId: 1 });
lapinSchema.index({ isAvailable: 1 });
lapinSchema.index({ price: 1 });
lapinSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Lapin', lapinSchema);