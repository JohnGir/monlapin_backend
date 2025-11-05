const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email est requis'],
    unique: true,
    lowercase: true,
    trim: true
  },
  source: {
    type: String,
    default: 'site_vitrine',
    enum: ['site_vitrine', 'application', 'evenement', 'reseau_social']
  },
  statut: {
    type: String,
    default: 'actif',
    enum: ['actif', 'desabonne', 'invalide']
  },
  preferences: {
    notifications: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true },
    nouvelles: { type: Boolean, default: true }
  },
  metadata: {
    ip: String,
    userAgent: String,
    pageInscription: String
  }
}, {
  timestamps: true
});

// Index pour recherches
newsletterSchema.index({ email: 1 }, { unique: true });
newsletterSchema.index({ statut: 1 });
newsletterSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Newsletter', newsletterSchema);