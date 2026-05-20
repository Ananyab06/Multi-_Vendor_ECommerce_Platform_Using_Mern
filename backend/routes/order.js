const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');

// All order routes require authentication
router.use(auth);

// User routes
router.post('/', orderController.createOrder);
router.get('/user', orderController.getUserOrders);
router.post('/:orderId/feedback', orderController.submitOrderFeedback);

// Vendor/Admin routes
router.get('/vendor/:vendorId', orderController.getVendorOrders);
router.get('/all', orderController.getAllOrders);
router.put('/:orderId/status', orderController.updateOrderStatus);

module.exports = router;