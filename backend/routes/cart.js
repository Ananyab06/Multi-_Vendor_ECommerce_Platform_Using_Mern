const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const auth = require('../middleware/auth');

// All cart routes require authentication
router.use(auth);

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.put('/update', cartController.updateCartItem);
router.delete('/remove', cartController.removeFromCart);
router.delete('/clear', cartController.clearCart);

module.exports = router;


