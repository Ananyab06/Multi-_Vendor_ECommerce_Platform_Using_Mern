const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const vendorAuth = require('../middleware/vendorAuth');

// Public routes
router.post('/register', vendorController.register);
router.post('/login', vendorController.login);

// Protected route
router.get('/me', vendorAuth, vendorController.getMe);

module.exports = router;

