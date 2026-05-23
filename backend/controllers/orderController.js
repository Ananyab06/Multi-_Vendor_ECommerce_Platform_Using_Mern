const PDFDocument = require('pdfkit');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
require('../models/User'); // required for populate('userId')
const mongoose = require('mongoose');
const { notifyVendorsNewOrder } = require('../socket');

const numberToWords = (num) => {
  const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  const inWords = (n) => {
    if (n < 20) return a[n];
    const digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit ? '-' + a[digit] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' hundred ' + (n % 100 === 0 ? '' : 'and ' + inWords(n % 100));
    return '';
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = '';
  if (rupees === 0) {
    result = 'Zero Rupees';
  } else {
    let temp = rupees;
    if (temp >= 1000) {
      const thousands = Math.floor(temp / 1000);
      result += inWords(thousands) + 'thousand ';
      temp = temp % 1000;
    }
    result += inWords(temp) + 'Rupees ';
  }

  if (paise > 0) {
    result += 'and ' + inWords(paise) + 'Paise ';
  }
  return result.trim().replace(/\b\w/g, c => c.toUpperCase()) + ' Only';
};

const formatShippingAddress = (address) => {
  if (!address) return 'N/A';
  const parts = [address.street, address.city, address.state, address.zipCode, address.country].filter(Boolean);
  return parts.length ? parts.join(', ') : 'N/A';
};

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

    const existingOrdersCount = await Order.countDocuments({ userId: req.user.id });
    const isFirstOrder = existingOrdersCount === 0;
    let hasFashionItem = false;

    let totalAmount = 0;
    const orderItems = [];
    const stockUpdates = [];

    for (const cartItem of cart.items) {
      const product = cartItem.productId;
      if (!product) {
        return res.status(404).json({ message: 'Product not found in cart' });
      }

      const requestedQty = Number(cartItem.quantity) || 0;
      const productPrice = Number(product.price) || 0;

      if (requestedQty < 1) {
        return res.status(400).json({ message: `Invalid quantity for ${product.name}` });
      }

      const vendorDoc = product.vendorId;
      if (!vendorDoc || !vendorDoc._id) {
        return res.status(400).json({ message: `Vendor not found for product ${product.name}` });
      }

      // Atomic stock decrement — avoids stale populated docs and race conditions
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: product._id, stock: { $gte: requestedQty } },
        { $inc: { stock: -requestedQty } },
        { new: true }
      );

      if (!updatedProduct) {
        const fresh = await Product.findById(product._id).select('stock name');
        const available = Number(fresh?.stock) || 0;
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${available}, Requested: ${requestedQty}`,
        });
      }

      if (product.category && product.category.toLowerCase() === 'fashion') {
        hasFashionItem = true;
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

      stockUpdates.push({
        productId: updatedProduct._id.toString(),
        stock: updatedProduct.stock,
      });
    }

    let discountAmount = 0;
    if (isFirstOrder && hasFashionItem && totalAmount > 0) {
      discountAmount = Math.min(200, totalAmount);
      totalAmount -= discountAmount;
    }

    // Add flat Shipping Fee (68.00) and Platform/Marketplace Fee (1.95)
    totalAmount += 68.00 + 1.95;

    const order = new Order({
      userId: req.user.id,
      items: orderItems,
      totalAmount,
      discountAmount,
      shippingAddress,
      paymentMethod,
      status: 'processing',
    });

    await order.save();

    const customer = await User.findById(req.user.id).select('name');
    const vendorIdsNotified = new Set();

    for (const item of orderItems) {
      const vid = item.vendorId?.toString();
      if (!vid || vendorIdsNotified.has(vid)) continue;

      vendorIdsNotified.add(vid);
      const vendorItems = orderItems.filter((i) => i.vendorId?.toString() === vid);
      const vendorTotal = vendorItems.reduce(
        (sum, i) => sum + (Number(i.price) || 0) * (Number(i.qty) || 0),
        0
      );

      notifyVendorsNewOrder(vid, {
        orderId: order._id.toString(),
        customer: customer?.name || 'Customer',
        items: vendorItems.map((i) => `${i.qty}x ${i.name}`).join(', '),
        total: vendorTotal,
        status: order.status,
        createdAt: order.createdAt,
      });
    }

    cart.items = [];
    await cart.save();

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: order._id,
        items: orderItems,
        totalAmount,
        discountAmount,
        status: order.status,
        createdAt: order.createdAt,
      },
      stockUpdates,
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's orders
exports.getUserOrders = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { userId: req.user.id };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({ message: 'Invalid startDate' });
        }
        start.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({ message: 'Invalid endDate' });
        }
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const orders = await Order.find(filter)
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

    const vendorObjectId = new mongoose.Types.ObjectId(vendorId);
    const vendorProductIds = await Product.find({ vendorId: vendorObjectId }).distinct('_id');
    const vendorProductIdSet = new Set(vendorProductIds.map((id) => id.toString()));

    const storeNameLower = (vendor.storeName || '').trim().toLowerCase();
    const vendorNameLower = (vendor.name || '').trim().toLowerCase();

    const itemBelongsToVendor = (item) => {
      if (item.vendorId && item.vendorId.toString() === vendorId) return true;

      const productRef = item.productId?._id || item.productId;
      if (productRef && vendorProductIdSet.has(productRef.toString())) return true;

      if (item.productId?.vendorId?.toString() === vendorId) return true;

      const itemVendor = (item.vendor || '').trim().toLowerCase();
      if (itemVendor && (itemVendor === storeNameLower || itemVendor === vendorNameLower)) {
        return true;
      }

      return false;
    };

    const orderQuery = {
      $or: [
        { 'items.vendorId': vendorObjectId },
        ...(vendorProductIds.length > 0
          ? [{ 'items.productId': { $in: vendorProductIds } }]
          : []),
        { 'items.vendor': vendor.storeName },
        ...(vendor.name && vendor.name !== vendor.storeName
          ? [{ 'items.vendor': vendor.name }]
          : []),
      ],
    };

    const orders = await Order.find(orderQuery)
      .populate('userId', 'name email')
      .populate('items.productId')
      .sort({ createdAt: -1 });

    let totalRevenue = 0;
    const ordersWithVendorTotals = [];

    for (const order of orders) {
      const vendorItems = order.items.filter(itemBelongsToVendor);

      if (vendorItems.length === 0) continue;

      const vendorOrderTotal = vendorItems.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0),
        0
      );
      if (order.status !== 'cancelled' && order.status !== 'Cancelled') {
        totalRevenue += vendorOrderTotal;
      }

      // Backfill legacy order lines missing vendorId / wrong vendor name
      let orderUpdated = false;
      for (const item of order.items) {
        if (!itemBelongsToVendor(item)) continue;
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

// Download order invoice PDF (customer only)
exports.downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await Order.findById(orderId)
      .populate('userId', 'name email mobile')
      .populate({
        path: 'items.productId',
        populate: { path: 'vendorId' }
      });
      
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const orderUserId = order.userId?._id?.toString() || order.userId?.toString();
    if (orderUserId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to download this invoice' });
    }

    const customerName = order.userId?.name || 'Customer';
    
    // Get vendor info
    const firstItem = order.items[0];
    const vendorDoc = firstItem?.productId?.vendorId;
    const vendorName = vendorDoc?.storeName || firstItem?.vendor || 'UniBox Seller';
    const gstNumber = vendorDoc?.gstNumber;
    const showGST = gstNumber && gstNumber !== 'NA' && gstNumber !== '';

    const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const invoiceDate = orderDate;
    const invoiceNum = `IN-${order._id.toString().slice(-6).toUpperCase()}`;
    const invoiceDetails = `HR-${order._id.toString().slice(-12).toUpperCase()}`;

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const filename = `invoice-${orderId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // --- Draw Header ---
    doc.fillColor('#000000').fontSize(24).font('Helvetica-Bold').text('unibox', 40, 40);
    // Draw signature curved line below logo
    doc.strokeColor('#FF9900').lineWidth(2).moveTo(40, 68).quadraticCurveTo(80, 75, 120, 68).stroke();
    
    doc.fillColor('#000000').fontSize(11).font('Helvetica-Bold').text('Tax Invoice/Bill of Supply/Cash Memo', 260, 40, { align: 'right', width: 295 });
    doc.fontSize(9).font('Helvetica').text('(Original for Recipient)', 260, 55, { align: 'right', width: 295 });
    
    doc.strokeColor('#CCCCCC').lineWidth(0.5).moveTo(40, 85).lineTo(555, 85).stroke();

    // --- Sold By Section ---
    let y = 95;
    doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold').text('Sold By :', 40, y);
    doc.font('Helvetica');
    doc.text(vendorName, 40, y + 13);
    
    let currentVendorY = y + 25;
    if (vendorDoc?.address) {
      doc.text(vendorDoc.address, 40, currentVendorY);
      currentVendorY += 12;
    }
    
    if (showGST) {
      doc.font('Helvetica-Bold').text('GST Registration No:', 40, currentVendorY);
      doc.font('Helvetica').text(gstNumber, 140, currentVendorY);
      currentVendorY += 12;
    }

    // --- Billing / Shipping Section ---
    let currentCustomerY = y;
    const hasShipping = order.shippingAddress && (order.shippingAddress.street || order.shippingAddress.city);
    
    if (hasShipping) {
      doc.font('Helvetica-Bold').text('Billing Address :', 320, currentCustomerY);
      doc.font('Helvetica');
      doc.text(customerName, 320, currentCustomerY + 13);
      doc.text(formatShippingAddress(order.shippingAddress), 320, currentCustomerY + 25, { width: 235 });
      
      const shippingLines = Math.ceil(formatShippingAddress(order.shippingAddress).length / 45);
      const shippingOffset = Math.max(1, shippingLines) * 12;
      
      currentCustomerY = currentCustomerY + 25 + shippingOffset + 15;
      
      doc.font('Helvetica-Bold').text('Shipping Address :', 320, currentCustomerY);
      doc.font('Helvetica');
      doc.text(customerName, 320, currentCustomerY + 13);
      doc.text(formatShippingAddress(order.shippingAddress), 320, currentCustomerY + 25, { width: 235 });
      
      const shippingLines2 = Math.ceil(formatShippingAddress(order.shippingAddress).length / 45);
      const shippingOffset2 = Math.max(1, shippingLines2) * 12;
      currentCustomerY = currentCustomerY + 25 + shippingOffset2 + 15;
    }

    const nextY = Math.max(currentVendorY + 15, currentCustomerY + 15, 200);
    doc.strokeColor('#CCCCCC').lineWidth(0.5).moveTo(40, nextY).lineTo(555, nextY).stroke();

    // --- Order / Invoice Meta Details ---
    let metaY = nextY + 10;
    doc.font('Helvetica-Bold').text('Order Number: ', 40, metaY);
    doc.font('Helvetica').text(order.orderNumber || '404-3787682-9088333', 120, metaY);
    
    doc.font('Helvetica-Bold').text('Order Date: ', 40, metaY + 12);
    doc.font('Helvetica').text(orderDate, 105, metaY + 12);

    doc.font('Helvetica-Bold').text('Invoice Number : ', 320, metaY);
    doc.font('Helvetica').text(invoiceNum, 410, metaY);
    
    doc.font('Helvetica-Bold').text('Invoice Details : ', 320, metaY + 12);
    doc.font('Helvetica').text(invoiceDetails, 405, metaY + 12);
    
    doc.font('Helvetica-Bold').text('Invoice Date : ', 320, metaY + 24);
    doc.font('Helvetica').text(invoiceDate, 395, metaY + 24);

    const tableTop = metaY + 45;
    
    // --- Table Headers ---
    doc.strokeColor('#CCCCCC').lineWidth(0.5).moveTo(40, tableTop).lineTo(555, tableTop).stroke();
    
    const colSl = 40;
    const colDesc = 70;
    const colPrice = 250;
    const colQty = 300;
    const colNet = 325;
    const colTaxType = 385;
    const colTaxAmt = 435;
    const colTotal = 495;

    doc.font('Helvetica-Bold').fontSize(8);
    doc.text('Sl. No.', colSl, tableTop + 5);
    doc.text('Description', colDesc, tableTop + 5, { width: 180 });
    doc.text('Unit Price', colPrice, tableTop + 5, { align: 'right', width: 50 });
    doc.text('Qty', colQty, tableTop + 5, { align: 'right', width: 25 });
    doc.text('Net Amount', colNet, tableTop + 5, { align: 'right', width: 55 });
    doc.text('Tax Type', colTaxType, tableTop + 5, { width: 45 });
    doc.text('Tax Amount', colTaxAmt, tableTop + 5, { align: 'right', width: 55 });
    doc.text('Total Amount', colTotal, tableTop + 5, { align: 'right', width: 60 });

    doc.strokeColor('#666666').lineWidth(0.5).moveTo(40, tableTop + 18).lineTo(555, tableTop + 18).stroke();
    doc.font('Helvetica').fontSize(8);

    let currentY = tableTop + 24;
    let sl = 1;

    let totalNet = 0;
    let totalTax = 0;
    let totalAmt = 0;

    // Helper to add row
    const addRow = (desc, unitPrice, qty, netAmt, taxType, taxAmt, total) => {
      doc.text(String(sl++), colSl, currentY);
      doc.text(desc, colDesc, currentY, { width: 180 });
      doc.text(`₹${unitPrice.toFixed(2)}`, colPrice, currentY, { align: 'right', width: 50 });
      doc.text(String(qty), colQty, currentY, { align: 'right', width: 25 });
      doc.text(`₹${netAmt.toFixed(2)}`, colNet, currentY, { align: 'right', width: 55 });
      doc.text(taxType, colTaxType, currentY, { width: 45 });
      doc.text(`₹${taxAmt.toFixed(2)}`, colTaxAmt, currentY, { align: 'right', width: 55 });
      doc.text(`₹${total.toFixed(2)}`, colTotal, currentY, { align: 'right', width: 60 });

      totalNet += netAmt;
      totalTax += taxAmt;
      totalAmt += total;

      currentY += 30;
    };

    // Print Items
    for (const item of order.items) {
      const itemTotal = (Number(item.price) || 0) * (Number(item.qty) || 0);
      const itemNet = itemTotal / 1.18;
      const itemTax = itemTotal - itemNet;
      const unitNet = (Number(item.price) || 0) / 1.18;
      const itemLabel = `${item.name}${item.size ? ` (Size: ${item.size})` : ''}`;

      addRow(itemLabel, unitNet, item.qty, itemNet, 'IGST', itemTax, itemTotal);
    }

    // Print Shipping Charges
    addRow('Shipping Charges', 57.63, 1, 57.63, 'IGST', 10.37, 68.00);

    // Print Platform Fee
    addRow('Platform Fee', 1.65, 1, 1.65, 'IGST', 0.30, 1.95);

    doc.strokeColor('#666666').lineWidth(0.5).moveTo(40, currentY - 8).lineTo(555, currentY - 8).stroke();

    // TOTALS Row
    doc.font('Helvetica-Bold');
    doc.text('TOTAL:', colDesc, currentY);
    doc.text(`₹${totalNet.toFixed(2)}`, colNet, currentY, { align: 'right', width: 55 });
    doc.text(`₹${totalTax.toFixed(2)}`, colTaxAmt, currentY, { align: 'right', width: 55 });
    doc.text(`₹${totalAmt.toFixed(2)}`, colTotal, currentY, { align: 'right', width: 60 });

    doc.strokeColor('#000000').lineWidth(1).moveTo(40, currentY + 12).lineTo(555, currentY + 12).stroke();

    // Amount in Words
    let wordsY = currentY + 22;
    doc.font('Helvetica-Bold').text('Amount in Words:', 40, wordsY);
    doc.font('Helvetica').text(numberToWords(totalAmt), 40, wordsY + 12, { width: 280 });

    // Authorized Signatory
    doc.font('Helvetica-Bold').text(`For ${vendorName}:`, 380, wordsY, { align: 'right', width: 175 });
    doc.moveDown(2);
    doc.font('Helvetica').text('Authorized Signatory', 380, doc.y + 15, { align: 'right', width: 175 });

    // Bottom Border
    doc.strokeColor('#CCCCCC').lineWidth(0.5).moveTo(40, doc.y + 30).lineTo(555, doc.y + 30).stroke();

    // Footer Info
    let footerY = doc.y + 40;
    doc.fontSize(8);
    doc.font('Helvetica-Bold').text('Payment Transaction ID: ', 40, footerY);
    const mockTxId = `32fgy1xynlgf` + order._id.toString().slice(-8);
    doc.font('Helvetica').text(mockTxId, 140, footerY);

    doc.font('Helvetica-Bold').text('Date & Time: ', 40, footerY + 12);
    doc.font('Helvetica').text(new Date(order.createdAt).toLocaleString('en-IN'), 100, footerY + 12);

    doc.font('Helvetica-Bold').text('Invoice Value: ', 320, footerY);
    doc.font('Helvetica').text(`₹${totalAmt.toFixed(2)}`, 385, footerY);

    doc.font('Helvetica-Bold').text('Mode of Payment: ', 320, footerY + 12);
    const payMode = order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod === 'upi' ? 'UPI' : 'Credit Card';
    doc.font('Helvetica').text(payMode, 400, footerY + 12);

    doc.end();
  } catch (err) {
    console.error('Error generating invoice:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to generate invoice' });
    }
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

    const oldStatus = order.status;
    order.status = status;
    await order.save();

    if (status === 'cancelled' && oldStatus !== 'cancelled') {
      for (const item of order.items) {
        if (item.productId) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: item.qty }
          });
        }
      }

      // Notify vendors if cancelled by customer
      try {
        const userDoc = await User.findById(req.user.id);
        const isCustomerCancel = userDoc && userDoc.role === 'user';
        if (isCustomerCancel) {
          const customerName = userDoc.name || 'Customer';
          const vendorIdsNotified = new Set();
          const { notifyVendorsOrderCancelled } = require('../socket');

          for (const item of order.items) {
            const vid = item.vendorId?.toString();
            if (!vid || vendorIdsNotified.has(vid)) continue;

            vendorIdsNotified.add(vid);
            const vendorItems = order.items.filter((i) => i.vendorId?.toString() === vid);

            notifyVendorsOrderCancelled(vid, {
              orderId: order._id.toString(),
              customer: customerName,
              items: vendorItems.map((i) => `${i.qty}x ${i.name}`).join(', '),
              status: order.status,
              createdAt: order.createdAt,
            });
          }
        }
      } catch (notifyErr) {
        console.error('Error notifying vendors of cancellation:', notifyErr);
      }
    }

    // Notify customer via WebSocket
    try {
      const { notifyUserOrderStatus } = require('../socket');
      notifyUserOrderStatus(order.userId.toString(), {
        orderId: order._id.toString(),
        status: order.status,
      });
    } catch (socketErr) {
      console.error('Error sending order status socket update:', socketErr);
    }

    res.json({ message: 'Order status updated successfully', order });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
