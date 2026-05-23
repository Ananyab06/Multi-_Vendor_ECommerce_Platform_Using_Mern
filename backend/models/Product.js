const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  originalPrice: {
    type: Number,
    min: 0,
  },
  image: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    required: true,
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  rating: {
    type: Number,
    default: 4.5,
    min: 0,
    max: 5,
  },
  reviews: {
    type: Number,
    default: 0,
    min: 0,
  },
  stock: {
    type: Number,
    default: 0,
    min: 0,
  },
  sizes: [{
    type: String,
  }],
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);

