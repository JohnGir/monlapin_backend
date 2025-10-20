const mongoose = require('mongoose');

const lapinSchema = new mongoose.Schema({
  eleveurId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Eleveur',
    required: true
  },
  breed: {
    type: String,
    required: [true, 'Race du lapin est requise'],
    trim: true
  },
  age: {
    type: Number,
    required: [true, 'Âge du lapin est requis'],
    min: 1
  },
  weight: {
    type: Number,
    required: [true, 'Poids du lapin est requis'],
    min: 0.1
  },
  price: {
    type: Number,
    required: [true, 'Prix du lapin est requis'],
    min: 0
  },
  category: {
    type: String,
    enum: ['viande', 'reproducteur', 'animal_de_compagnie'],
    required: true
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

// Index pour les recherches et filtres
lapinSchema.index({ eleveurId: 1 });
lapinSchema.index({ category: 1 });
lapinSchema.index({ isAvailable: 1 });
lapinSchema.index({ price: 1 });
lapinSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Lapin', lapinSchema);