require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const ServiceBooking = require('../models/ServiceBooking');

const run = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');

  const bookingId = '6a112e5da22dd650a346e761';
  const result = await ServiceBooking.findByIdAndUpdate(bookingId, {
    date: '2026-05-22'
  }, { new: true });

  if (result) {
    console.log('Successfully updated booking date:', result.date, 'for booking:', result._id);
  } else {
    console.log('Booking not found for ID:', bookingId);
  }

  await mongoose.disconnect();
  console.log('Done.');
};

run().catch((err) => {
  console.error('Update failed:', err);
  process.exit(1);
});
