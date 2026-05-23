const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please fill a valid email address'],
  },
  mobile: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number'],
  },
  password: {
    type: String,
    required: true,
  },
  storeName: {
    type: String,
    required: true,
    trim: true,
  },
  gstNumber: {
    type: String,
    default: 'NA',
    trim: true,
  },
}, { timestamps: true });

// Hash password before saving
vendorSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
vendorSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Vendor', vendorSchema);