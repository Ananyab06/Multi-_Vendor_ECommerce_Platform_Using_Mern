const mongoose = require('mongoose');

const serviceBookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
    },
    vendor: {
      type: String,
      required: true,
    },
    serviceName: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: String,
      required: true,
    },
    slot: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed'],
      default: 'Pending',
    },
    technician: {
      type: String,
      default: 'Pending Assignment',
    },
  },
  { timestamps: true }
);

serviceBookingSchema.index({ userId: 1, createdAt: -1 });
serviceBookingSchema.index({ vendorId: 1, createdAt: -1 });
serviceBookingSchema.index({ vendor: 1 });

module.exports = mongoose.model('ServiceBooking', serviceBookingSchema);
