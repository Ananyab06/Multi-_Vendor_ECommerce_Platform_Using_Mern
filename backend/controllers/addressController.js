const User = require('../models/User');

const toAddressResponse = (addressDoc) => ({
  id: addressDoc._id.toString(),
  name: addressDoc.name,
  street: addressDoc.street,
  city: addressDoc.city,
  state: addressDoc.state,
  zip: addressDoc.zip,
});

exports.getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('addresses');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.addresses.map(toAddressResponse));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const { name, street, city, state, zip } = req.body;

    if (!name?.trim() || !street?.trim() || !city?.trim() || !state?.trim() || !zip?.trim()) {
      return res.status(400).json({ message: 'All address fields are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const address = {
      name: name.trim(),
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      zip: zip.trim(),
    };

    user.addresses.push(address);
    await user.save();

    const saved = user.addresses[user.addresses.length - 1];
    res.status(201).json(toAddressResponse(saved));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
