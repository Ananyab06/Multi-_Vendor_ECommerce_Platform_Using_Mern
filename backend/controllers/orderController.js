const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
require('../models/User'); // required for populate('userId')
const mongoose = require('mongoose');

const getVendorDisplayName = (vendorDoc) => {
  if (!vendorDoc) return 'Unknown Vendor';
  return vendorDoc.storeName || vendorDoc.name || 'Unknown Vendor';
};

// Create a new order from cart
exports.createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod = 'cash_on_delivery' } = req.body;

    const cart = await Cart.findOne({ userId: req.user.id }).populate({
      path: 'items.productId',
      populate: { path: 'vendorId', select: 'storeName name' },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const cartItem of cart.items) {
      const product = cartItem.productId;
      if (!product) {
        return res.status(404).json({ message: 'Product not found in cart' });
      }

      const currentStock = Number(product.stock) || 0;
      const requestedQty = Number(cartItem.quantity) || 0;
      const productPrice = Number(product.price) || 0;

      if (currentStock < requestedQty) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${currentStock}, Requested: ${requestedQty}`,
        });
      }

      const vendorDoc = product.vendorId;
      if (!vendorDoc || !vendorDoc._id) {
        return res.status(400).json({ message: `Vendor not found for product ${product.name}` });
      }

      totalAmount += productPrice * requestedQty;

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: productPrice,
        qty: requestedQty,
        size: cartItem.size || null,
        vendor: getVendorDisplayName(vendorDoc),
        vendorId: vendorDoc._id,
      });

      product.stock = Math.max(0, currentStock - requestedQty);
      await product.save();
    }

    const order = new Order({
      userId: req.user.id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod,
      status: 'processing',
    });

    await order.save();

    cart.items = [];
    await cart.save();

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: order._id,
        items: orderItems,
        totalAmount,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's orders
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate('items.productId')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error('Error fetching user orders:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all orders (for admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email')
      .populate('items.productId')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error('Error fetching all orders:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get orders for a specific vendor (matches by product ownership — works for legacy orders too)
exports.getVendorOrders = async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({ message: 'Invalid vendor ID' });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const vendorProductIds = await Product.find({ vendorId }).distinct('_id');
    const vendorProductIdSet = new Set(vendorProductIds.map((id) => id.toString()));

    if (vendorProductIdSet.size === 0) {
      return res.json({
        orders: [],
        stats: { totalRevenue: 0, orderCount: 0, storeName: vendor.storeName },
      });
    }

    const orders = await Order.find({
      'items.productId': { $in: vendorProductIds },
    })
      .populate('userId', 'name email')
      .populate('items.productId')
      .sort({ createdAt: -1 });

    let totalRevenue = 0;
    const ordersWithVendorTotals = [];

    for (const order of orders) {
      const vendorItems = order.items.filter((item) => {
        const productRef = item.productId?._id || item.productId;
        return productRef && vendorProductIdSet.has(productRef.toString());
      });

      if (vendorItems.length === 0) continue;

      const vendorOrderTotal = vendorItems.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0),
        0
      );
      totalRevenue += vendorOrderTotal;

      // Backfill legacy order lines missing vendorId / wrong vendor name
      let orderUpdated = false;
      for (const item of order.items) {
        const productRef = item.productId?._id || item.productId;
        if (!productRef || !vendorProductIdSet.has(productRef.toString())) continue;
        if (!item.vendorId || item.vendor === 'Unknown Vendor') {
          item.vendorId = vendor._id;
          item.vendor = vendor.storeName;
          orderUpdated = true;
        }
      }
      if (orderUpdated) {
        await order.save();
      }

      ordersWithVendorTotals.push({
        ...order.toObject(),
        vendorItems,
        vendorOrderTotal,
      });
    }

    res.json({
      orders: ordersWithVendorTotals,
      stats: {
        totalRevenue,
        orderCount: ordersWithVendorTotals.length,
        storeName: vendor.storeName,
      },
    });
  } catch (err) {
    console.error('Error fetching vendor orders:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit feedback for a delivered order (customer only)
exports.submitOrderFeedback = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, comment } = req.body;

    const parsedRating = Number(rating);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to review this order' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Feedback is only allowed after delivery' });
    }

    if (order.feedback?.rating) {
      return res.status(400).json({ message: 'Feedback already submitted for this order' });
    }

    order.feedback = {
      rating: parsedRating,
      comment: (comment || '').trim(),
      createdAt: new Date(),
    };
    await order.save();

    res.json({
      message: 'Feedback submitted successfully',
      feedback: order.feedback,
    });
  } catch (err) {
    console.error('Error submitting order feedback:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    await order.save();

    res.json({ message: 'Order status updated successfully', order });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
