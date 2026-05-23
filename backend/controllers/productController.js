const Product = require('../models/Product');

// Helper to transform product document to frontend shape
const transformProduct = (productDoc) => {
  const vendor = productDoc.vendorId
    ? productDoc.vendorId.storeName || productDoc.vendorId.name
    : 'Unknown Vendor';
  
  return {
    id: productDoc._id.toString(), // keep as string for now
    name: productDoc.name,
    price: productDoc.price,
    originalPrice: productDoc.originalPrice,
    rating: productDoc.rating,
    reviews: productDoc.reviews,
    vendor,
    stock: productDoc.stock,
    category: productDoc.category,
    description: productDoc.description,
    image: productDoc.image,
    sizes: productDoc.sizes || [],
  };
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('vendorId', 'name storeName');
    const transformed = products.map(transformProduct);
    res.json(transformed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single product
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('vendorId', 'name storeName');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(transformProduct(product));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create product (vendor only)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, originalPrice, image, category, rating, reviews, stock, sizes } = req.body;
    const vendorId = req.vendor.id;

    const product = new Product({
      name,
      description,
      price,
      originalPrice,
      image,
      category,
      vendorId,
      rating: rating || 4.5,
      reviews: reviews || 0,
      stock: stock || 0,
      sizes: sizes || [],
    });

    await product.save();
    const populated = await Product.findById(product._id).populate('vendorId', 'name storeName');
    const transformed = transformProduct(populated);
    
    const { broadcastProductAdded } = require('../socket');
    broadcastProductAdded(transformed);

    res.status(201).json({ message: 'Product created', product: transformed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update product (vendor only)
exports.updateProduct = async (req, res) => {
  try {
    const { name, description, price, originalPrice, image, category, rating, reviews, stock, sizes } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the vendor owns the product
    if (product.vendorId.toString() !== req.vendor.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (originalPrice !== undefined) product.originalPrice = originalPrice;
    if (image !== undefined) product.image = image;
    if (category !== undefined) product.category = category;
    if (rating !== undefined) product.rating = rating;
    if (reviews !== undefined) product.reviews = reviews;
    if (stock !== undefined) product.stock = stock;
    if (sizes !== undefined) product.sizes = sizes;

    await product.save();
    const populated = await Product.findById(product._id).populate('vendorId', 'name storeName');
    const transformed = transformProduct(populated);

    const { broadcastProductUpdated } = require('../socket');
    broadcastProductUpdated(transformed);

    res.json({ message: 'Product updated', product: transformed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete product (vendor only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the vendor owns the product
    if (product.vendorId.toString() !== req.vendor.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const productId = product._id.toString();
    await product.deleteOne();

    const { broadcastProductDeleted } = require('../socket');
    broadcastProductDeleted(productId);

    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

