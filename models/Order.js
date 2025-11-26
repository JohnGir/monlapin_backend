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
  }
}, {
  timestamps: true
});

// Générer un numéro de commande unique
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const timestamp = date.getTime();
    const random = Math.floor(Math.random() * 1000);
    this.orderNumber = `CMD-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);