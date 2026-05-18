const express = require('express');
const upload = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');
const vendorAuth = require('../middleware/vendorAuth');

const router = express.Router();

router.post(
  '/image',
  vendorAuth,
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message || 'Image upload failed' });
      }
      next();
    });
  },
  uploadController.uploadImage
);

module.exports = router;
