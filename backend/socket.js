const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Vendor = require('./models/Vendor');
const User = require('./models/User');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Try vendor first
      const vendor = await Vendor.findById(decoded.id);
      if (vendor) {
        socket.vendorId = vendor._id.toString();
        socket.role = 'vendor';
        return next();
      }

      // Try user
      const user = await User.findById(decoded.id);
      if (user) {
        socket.userId = user._id.toString();
        socket.role = 'user';
        return next();
      }

      return next(new Error('User or Vendor not found'));
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.role === 'vendor') {
      socket.join(`vendor:${socket.vendorId}`);
      console.log(`Vendor ${socket.vendorId} connected via WebSocket`);
    } else if (socket.role === 'user') {
      socket.join(`user:${socket.userId}`);
      console.log(`User ${socket.userId} connected via WebSocket`);
    }

    socket.on('disconnect', () => {
      console.log(`${socket.role || 'Client'} disconnected`);
    });
  });

  return io;
};

const notifyVendorsNewOrder = (vendorId, payload) => {
  if (!io) return;

  io.to(`vendor:${vendorId}`).emit('new_order', {
    ...payload,
    time: 'Just now',
    message: `${payload.customer} placed an order — ${payload.items}`,
  });
};

const notifyVendorsNewBooking = (vendorId, payload) => {
  if (!io) return;

  io.to(`vendor:${vendorId}`).emit('new_booking', {
    ...payload,
    time: 'Just now',
    message: `${payload.customer} booked service ${payload.serviceName}`,
  });
};

const notifyUserOrderStatus = (userId, payload) => {
  if (!io) return;

  io.to(`user:${userId}`).emit('order_status_updated', payload);
};

const notifyUserBookingStatus = (userId, payload) => {
  if (!io) return;

  io.to(`user:${userId}`).emit('booking_status_updated', payload);
};

const broadcastProductAdded = (product) => {
  if (!io) return;
  io.emit('product_added', product);
};

const broadcastProductUpdated = (product) => {
  if (!io) return;
  io.emit('product_updated', product);
};

const broadcastProductDeleted = (productId) => {
  if (!io) return;
  io.emit('product_deleted', { productId });
};

const broadcastServiceAdded = (service) => {
  if (!io) return;
  io.emit('service_added', service);
};

const broadcastServiceUpdated = (service) => {
  if (!io) return;
  io.emit('service_updated', service);
};

const broadcastServiceDeleted = (serviceId) => {
  if (!io) return;
  io.emit('service_deleted', { serviceId });
};

const notifyVendorsOrderCancelled = (vendorId, payload) => {
  if (!io) return;

  io.to(`vendor:${vendorId}`).emit('order_cancelled', {
    ...payload,
    time: 'Just now',
    message: `${payload.customer} cancelled order — ${payload.items}`,
  });
};

module.exports = { 
  initSocket, 
  notifyVendorsNewOrder, 
  notifyVendorsNewBooking, 
  notifyVendorsOrderCancelled,
  notifyUserOrderStatus, 
  notifyUserBookingStatus,
  broadcastProductAdded,
  broadcastProductUpdated,
  broadcastProductDeleted,
  broadcastServiceAdded,
  broadcastServiceUpdated,
  broadcastServiceDeleted
};
