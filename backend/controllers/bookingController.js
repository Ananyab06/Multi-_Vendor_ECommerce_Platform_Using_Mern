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
  paymentMethod: doc.paymentMethod || 'credit_card',
  feedback: doc.feedback ? {
    rating: doc.feedback.rating,
    comment: doc.feedback.comment,
    createdAt: doc.feedback.createdAt
  } : null
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

const isServiceSlotPassed = (dateStr, slotStr) => {
  try {
    if (!dateStr || !slotStr) return true;
    const [year, month, day] = dateStr.split('-').map(Number);
    const parts = slotStr.split('-');
    if (parts.length < 2) return true;
    const endPart = parts[1].trim();
    const match = endPart.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return true;
    
    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const ampm = match[3].toUpperCase();
    
    if (ampm === 'PM' && hours < 12) {
      hours += 12;
    } else if (ampm === 'AM' && hours === 12) {
      hours = 0;
    }
    
    const appointmentEnd = new Date(year, month - 1, day, hours, minutes, 0, 0);
    const now = new Date();
    return now > appointmentEnd;
  } catch (err) {
    console.error('Error parsing booking slot:', err);
    return true;
  }
};
exports.createBooking = async (req, res) => {
  try {
    const { serviceName, vendor, price, date, slot, address, paymentMethod } = req.body;

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
      paymentMethod: paymentMethod || 'credit_card',
    });

    await booking.save();
    await booking.populate('userId', 'name email');

    // Notify vendor via WebSocket
    try {
      const { notifyVendorsNewBooking } = require('../socket');
      if (booking.vendorId) {
        notifyVendorsNewBooking(booking.vendorId.toString(), {
          bookingId: booking._id.toString(),
          customer: booking.userId?.name || 'Customer',
          serviceName: booking.serviceName,
          price: booking.price,
          date: booking.date,
          slot: booking.slot,
          address: booking.address,
          status: booking.status,
          technician: booking.technician,
        });
      }
    } catch (socketErr) {
      console.error('Error sending new booking socket update:', socketErr);
    }

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

    if (!['Pending', 'Confirmed', 'Completed', 'Cancelled'].includes(status)) {
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
      if (!isServiceSlotPassed(booking.date, booking.slot)) {
        return res.status(400).json({ message: 'Cannot mark service as completed before the scheduled slot has passed.' });
      }
      booking.technician = booking.technician || 'Completed';
    }

    await booking.save();
    await booking.populate('userId', 'name email');

    // Notify user via WebSocket
    try {
      const { notifyUserBookingStatus } = require('../socket');
      notifyUserBookingStatus(booking.userId._id.toString(), {
        bookingId: booking._id.toString(),
        status: booking.status,
        technician: booking.technician,
      });
    } catch (socketErr) {
      console.error('Error sending booking status socket update:', socketErr);
    }

    res.json({
      message: 'Booking status updated',
      booking: transformBooking(booking),
    });
  } catch (err) {
    console.error('Error updating booking status:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit feedback for a completed service booking (customer only)
exports.submitServiceBookingFeedback = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { rating, comment } = req.body;

    const parsedRating = Number(rating);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const booking = await ServiceBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to review this service booking' });
    }

    if (!booking.status || booking.status.toLowerCase() !== 'completed') {
      return res.status(400).json({ message: 'Feedback is only allowed after service is completed' });
    }

    if (booking.feedback?.rating) {
      return res.status(400).json({ message: 'Feedback already submitted for this booking' });
    }

    booking.feedback = {
      rating: parsedRating,
      comment: (comment || '').trim(),
      createdAt: new Date(),
    };
    await booking.save();

    res.json({
      message: 'Feedback submitted successfully',
      feedback: booking.feedback,
    });
  } catch (err) {
    console.error('Error submitting booking feedback:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
