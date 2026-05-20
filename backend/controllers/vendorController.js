const Vendor = require('../models/Vendor');
const jwt = require('jsonwebtoken');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^[0-9]{10}$/;

const findVendorByIdentifier = (identifier) => {
  const trimmed = identifier.trim();
  if (EMAIL_REGEX.test(trimmed)) {
    return Vendor.findOne({ email: trimmed.toLowerCase() });
  }
  if (MOBILE_REGEX.test(trimmed)) {
    return Vendor.findOne({ mobile: trimmed });
  }
  return null;
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register vendor
exports.register = async (req, res) => {
  try {
    const { name, email, password, storeName, mobile } = req.body;

    if (!mobile || !MOBILE_REGEX.test(mobile)) {
      return res.status(400).json({ message: 'A valid 10-digit mobile number is required' });
    }

    // Check if vendor already exists
    let vendor = await Vendor.findOne({ email });
    if (vendor) {
      return res.status(400).json({ message: 'Vendor already exists with this email' });
    }

    const existingMobile = await Vendor.findOne({ mobile });
    if (existingMobile) {
      return res.status(400).json({ message: 'Vendor already exists with this mobile number' });
    }

    // Create new vendor
    vendor = new Vendor({
      name,
      email,
      password,
      storeName,
      mobile,
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
        mobile: vendor.mobile,
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
    const { email, mobile, identifier, password } = req.body;
    const loginId = (identifier || email || mobile || '').trim();

    if (!loginId || !password) {
      return res.status(400).json({ message: 'Email or mobile number and password are required' });
    }

    const vendor = await findVendorByIdentifier(loginId);
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
        mobile: vendor.mobile,
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
