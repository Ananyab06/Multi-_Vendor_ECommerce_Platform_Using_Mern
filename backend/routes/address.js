const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', addressController.getAddresses);
router.post('/', addressController.addAddress);

module.exports = router;
