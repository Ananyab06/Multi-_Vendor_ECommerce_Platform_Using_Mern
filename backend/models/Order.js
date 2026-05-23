const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  qty: {
    type: Number,
    required: true,
    default: 1,
  },
  size: {
    type: String,
    default: null,
  },
  vendor: {
    type: String,
    required: true,
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
  },
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  paymentMethod: {
    type: String,
    default: 'cash_on_delivery',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    createdAt: {
      type: Date,
    },
  },
  orderNumber: {
    type: String,
    unique: true,
  },
}, { timestamps: true });

// Pre-save hook to generate orderNumber
orderSchema.pre('save',async function () {
  if (!this.orderNumber) {
    const p1 = Math.floor(100 + Math.random() * 900);
    const p2 = Math.floor(1000000 + Math.random() * 9000000);
    const p3 = Math.floor(1000000 + Math.random() * 9000000);
    this.orderNumber = `${p1}-${p2}-${p3}`;
  }
});

// Index for efficient queries
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ 'items.vendor': 1 });
orderSchema.index({ 'items.vendorId': 1 });

module.exports = mongoose.model('Order', orderSchema);