const mongoose = require('mongoose');

const eleveurSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  farmName: {
    type: String,
    required: [true, 'Nom de la ferme est requis'],
    trim: true
  },
  farmAddress: {
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
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
  siret: {
    type: String,
    trim: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'inactive'
  },
  subscriptionExpiry: {
    type: Date
  },
  description: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Index géospatial SPARSE
eleveurSchema.index({ 'farmAddress.coordinates': '2dsphere' }, { sparse: true });
eleveurSchema.index({ isApproved: 1, subscriptionStatus: 1 });

module.exports = mongoose.model('Eleveur', eleveurSchema);