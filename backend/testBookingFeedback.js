const mongoose = require('mongoose');
const bookingController = require('./controllers/bookingController');
const ServiceBooking = require('./models/ServiceBooking');

const run = async () => {
  await mongoose.connect('mongodb://localhost:27017/ecommerce');
  console.log('Connected');

  // Find a completed booking
  const booking = await ServiceBooking.findOne({ status: 'Completed' });
  if (!booking) {
    console.log('No completed booking found');
    await mongoose.disconnect();
    return;
  }

  console.log('Testing booking feedback for booking:', booking._id);
  console.log('User ID of booking:', booking.userId);

  const req = {
    params: { bookingId: booking._id.toString() },
    body: { rating: 5, comment: 'Great service!' },
    user: { id: booking.userId.toString() }
  };

  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      console.log('Response status:', this.statusCode || 200);
      console.log('Response JSON:', data);
    }
  };

  try {
    await bookingController.submitServiceBookingFeedback(req, res);
  } catch (err) {
    console.error('Error executing controller:', err);
  }

  await mongoose.disconnect();
};

run();
