const ServiceBooking = require('../models/ServiceBooking');
const Vendor = require('../models/Vendor');
require('../models/User');

const transformBooking = (doc) => ({
  id: doc._id.toString(),
  name: doc.serviceName,
  vendor: doc.vendor,
  vendorId: doc.vendorId?.toString(),
  price: doc.price,
  date: doc.date,
  slot: doc.slot,
  address: doc.address,
  status: doc.status,
  technician: doc.technician,
  customer: doc.userId?.name,
  customerEmail: doc.userId?.email,
  createdAt: doc.createdAt,
});

const resolveVendor = async (vendorName) => {
  if (!vendorName) return null;
  const trimmed = vendorName.trim();
  return Vendor.findOne({
    $or: [
      { storeName: trimmed },
      { name: trimmed },
      { storeName: new RegExp(`^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    ],
  });
};

exports.createBooking = async (req, res) => {
  try {
    const { serviceName, vendor, price, date, slot, address } = req.body;

    if (!serviceName || !vendor || price == null || !date || !slot || !address) {
      return res.status(400).json({ message: 'All booking fields are required' });
    }

    const vendorDoc = await resolveVendor(vendor);

    const booking = new ServiceBooking({
      userId: req.user.id,
      vendorId: vendorDoc?._id,
      vendor: vendorDoc?.storeName || vendor,
      serviceName,
      price: Number(price),
      date,
      slot,
      address,
      status: 'Pending',
      technician: 'Pending Assignment',
    });

    await booking.save();
    await booking.populate('userId', 'name email');

    res.status(201).json({
      message: 'Service booked successfully',
      booking: transformBooking(booking),
    });
  } catch (err) {
    console.error('Error creating service booking:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await ServiceBooking.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json(bookings.map(transformBooking));
  } catch (err) {
    console.error('Error fetching user bookings:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getVendorBookings = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const bookings = await ServiceBooking.find({
      $or: [{ vendorId: vendor._id }, { vendor: vendor.storeName }],
    })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    const totalRevenue = bookings
      .filter((b) => b.status === 'Completed')
      .reduce((sum, b) => sum + (Number(b.price) || 0), 0);

    res.json({
      bookings: bookings.map(transformBooking),
      stats: {
        totalBookings: bookings.length,
        totalRevenue,
        storeName: vendor.storeName,
      },
    });
  } catch (err) {
    console.error('Error fetching vendor bookings:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Confirmed', 'Completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await ServiceBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = status;
    if (status === 'Confirmed' && booking.technician === 'Pending Assignment') {
      booking.technician = 'Assigned';
    }
    if (status === 'Completed') {
      booking.technician = booking.technician || 'Completed';
    }

    await booking.save();
    await booking.populate('userId', 'name email');

    res.json({
      message: 'Booking status updated',
      booking: transformBooking(booking),
    });
  } catch (err) {
    console.error('Error updating booking status:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
