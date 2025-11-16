const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nom de la catégorie est requis'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  },
  stockTotal: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Méthode statique pour mettre à jour le stock total
categorySchema.statics.updateStock = async function(categoryId) {
  const Lapin = mongoose.model('Lapin');
  const totalStock = await Lapin.aggregate([
    { $match: { categoryId: categoryId, isAvailable: true } },
    { $group: { _id: null, total: { $sum: '$stock' } } }
  ]);
  
  await this.findByIdAndUpdate(categoryId, {
    stockTotal: totalStock[0]?.total || 0
  });
};

module.exports = mongoose.model('Category', categorySchema);