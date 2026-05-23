const mongoose = require('mongoose');
const ServiceBooking = require('./models/ServiceBooking');

const run = async () => {
  await mongoose.connect('mongodb://localhost:27017/ecommerce');
  const bookings = await ServiceBooking.find({});
  console.log('Bookings status and IDs:');
  bookings.forEach(b => {
    console.log(`ID: ${b._id}, Service: ${b.serviceName}, Status: ${b.status}, userId: ${b.userId}, feedback: ${JSON.stringify(b.feedback)}`);
  });
  await mongoose.disconnect();
};
run();
