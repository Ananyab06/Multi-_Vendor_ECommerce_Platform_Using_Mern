const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', bookingController.createBooking);
router.get('/user', bookingController.getUserBookings);
router.get('/vendor/:vendorId', bookingController.getVendorBookings);
router.patch('/:bookingId/status', bookingController.updateBookingStatus);

module.exports = router;
