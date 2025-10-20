const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['particulier', 'professionnel'],
    required: true
  },
  deliveryAddress: {
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    postalCode: { type: String },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: false // ⚠️ RENDU OPTIONNEL
      }
    }
  },
  subscriptionType: {
    type: String,
    enum: ['none', 'basic', 'premium'],
    default: 'none'
  },
  subscriptionExpiry: {
    type: Date
  }
}, {
  timestamps: true
});

// Index géospatial SPARSE (fonctionne seulement si coordinates existe)
clientSchema.index({ 'deliveryAddress.coordinates': '2dsphere' }, { sparse: true });

module.exports = mongoose.model('Client', clientSchema);