const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const vendorAuth = require('../middleware/vendorAuth');

router.get('/', serviceController.getAllServices);
router.get('/:id', serviceController.getServiceById);

router.post('/', vendorAuth, serviceController.createService);
router.put('/:id', vendorAuth, serviceController.updateService);
router.delete('/:id', vendorAuth, serviceController.deleteService);

module.exports = router;
