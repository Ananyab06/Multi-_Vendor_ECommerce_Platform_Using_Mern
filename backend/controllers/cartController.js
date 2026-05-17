const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
      await cart.save();
    }
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const qty = Number(quantity);
    

    // Validate product exists
    const product = await Product.findById(productId);
    

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    

    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
    }

    

    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    

    if (existingItemIndex >= 0) {
      // Update quantity
      cart.items[existingItemIndex].quantity += qty;
    } else {
      // Add new item
      cart.items.push({ productId, quantity: qty });
    }

    await cart.save();
  
    res.json({ message: 'Item added to cart', cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update item quantity in cart
exports.updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = Number(quantity);

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    if (!Number.isFinite(qty) || qty < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex < 0) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    cart.items[itemIndex].quantity = qty;
    await cart.save();

    const populated = await Cart.findById(cart._id).populate('items.productId');
    res.json({ message: 'Cart updated', cart: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;

    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Filter out the item
    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    if (cart.items.length === initialLength) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    await cart.save();
    res.json({ message: 'Item removed from cart', cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();
    res.json({ message: 'Cart cleared', cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};