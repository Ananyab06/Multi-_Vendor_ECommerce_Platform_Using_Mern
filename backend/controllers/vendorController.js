const Vendor = require('../models/Vendor');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register vendor
exports.register = async (req, res) => {
  try {
    const { name, email, password, storeName } = req.body;

    // Check if vendor already exists
    let vendor = await Vendor.findOne({ email });
    if (vendor) {
      return res.status(400).json({ message: 'Vendor already exists' });
    }

    // Create new vendor
    vendor = new Vendor({
      name,
      email,
      password,
      storeName,
    });

    await vendor.save();

    // Generate token
    const token = generateToken(vendor._id);

    res.status(201).json({
      message: 'Vendor registered successfully',
      token,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        storeName: vendor.storeName,
        isVendor: true,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login vendor
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find vendor by email
    const vendor = await Vendor.findOne({ email });
    if (!vendor) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await vendor.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(vendor._id);

    res.json({
      message: 'Login successful',
      token,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        storeName: vendor.storeName,
        isVendor: true, 
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current vendor (protected)
exports.getMe = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor.id).select('-password');
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json(vendor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
