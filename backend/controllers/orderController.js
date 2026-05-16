const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');

// Create a new order from cart
exports.createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod = 'cash_on_delivery' } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Calculate total amount and prepare order items
    let totalAmount = 0;
    const orderItems = [];

    for (const cartItem of cart.items) {
      const product = cartItem.productId;
      if (!product) {
        return res.status(404).json({ message: `Product not found for item ${cartItem.productId}` });
      }

      // Convert to numbers for proper calculations (use 'quantity' field from Cart model)
      const currentStock = Number(product.stock) || 0;
      const requestedQty = Number(cartItem.quantity) || 0;
      const productPrice = Number(product.price) || 0;

      // Check stock availability
      if (currentStock < requestedQty) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${currentStock}, Requested: ${requestedQty}`
        });
      }

      const itemTotal = productPrice * requestedQty;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: productPrice,
        qty: requestedQty,
        size: cartItem.size,
        vendor: product.vendor || 'Unknown Vendor',
      });

      // Decrease product stock with proper number conversion
      product.stock = Math.max(0, currentStock - requestedQty);
      await product.save();
    }

    // Create the order
    const order = new Order({
      userId: req.user.id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod,
    });

    await order.save();

    // Clear the cart after successful order
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
      }
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

// Get all orders (for admin/vendor management)
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

// Get orders for a specific vendor
exports.getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.params.vendorId;

    // Find vendor to get their store name
    const Vendor = require('../models/Vendor');
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Find orders containing this vendor's products
    const orders = await Order.find({
      'items.vendor': vendor.companyName || vendor.storeName
    })
      .populate('userId', 'name email')
      .populate('items.productId')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error('Error fetching vendor orders:', err);
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