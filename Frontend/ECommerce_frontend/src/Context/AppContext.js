import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as api from '../api';
import { connectSocket } from '../socket';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [serviceBookings, setServiceBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // Restore login session from token after page refresh
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token');
      const accountType = localStorage.getItem('accountType');

      if (!token) {
        setAuthLoading(false);
        return;
      }

      const setVendorUser = (vendor) => {
        setUser({
          id: vendor._id?.toString() || vendor.id,
          name: vendor.name,
          email: vendor.email,
          storeName: vendor.storeName,
          isVendor: true,
        });
      };

      const setCustomerUser = (customer) => {
        setUser({
          id: customer._id?.toString() || customer.id,
          name: customer.name,
          email: customer.email,
          role: customer.role,
          isVendor: false,
        });
      };

      try {
        if (accountType === 'vendor') {
          const res = await api.getCurrentVendor();
          setVendorUser(res.data);
        } else if (accountType === 'user') {
          const res = await api.getCurrentUser();
          setCustomerUser(res.data);
        } else {
          try {
            const res = await api.getCurrentUser();
            setCustomerUser(res.data);
            localStorage.setItem('accountType', 'user');
          } catch {
            const res = await api.getCurrentVendor();
            setVendorUser(res.data);
            localStorage.setItem('accountType', 'vendor');
          }
        }
      } catch (err) {
        console.error('Session restore failed', err);
        localStorage.removeItem('token');
        localStorage.removeItem('accountType');
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Fetch products and services from backend on mount
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const [productsRes, servicesRes] = await Promise.all([
          api.fetchProducts(),
          api.fetchServices(),
        ]);
        if (productsRes.data && Array.isArray(productsRes.data)) {
          setProducts(productsRes.data);
        }
        if (servicesRes.data && Array.isArray(servicesRes.data)) {
          setServices(servicesRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch catalog from backend', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const mapProductToCartItem = (product, quantity, size = null) => {
    if (!product) return null;
    return {
      id: product._id?.toString() || product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      category: product.category,
      vendor: product.vendorId?.storeName || product.vendor || 'Unknown Vendor',
      quantity,
      size,
    };
  };

  // Fetch cart, wishlist, and orders when customer logs in
  useEffect(() => {
    if (authLoading) return;

    if (user && !user.isVendor) {
      const fetchUserData = async () => {
        try {
          const cartRes = await api.getCart();
          const wishlistRes = await api.getWishlist();
          const ordersRes = await api.getUserOrders();
          const bookingsRes = await api.getUserServiceBookings();

          if (bookingsRes.data) {
            const transformedBookings = bookingsRes.data.map(booking => ({
              ...booking,
              id: booking._id?.toString() || booking.id,
              feedback: booking.feedback?.rating
                ? {
                    rating: booking.feedback.rating,
                    comment: booking.feedback.comment || '',
                    createdAt: booking.feedback.createdAt,
                  }
                : null,
            }));
            setServiceBookings(transformedBookings);
          }
          
          if (cartRes.data?.items?.length) {
            const cartItems = cartRes.data.items
              .map((item) => mapProductToCartItem(item.productId, item.quantity, item.size || null))
              .filter(Boolean);
            setCart(cartItems);
          } else {
            setCart([]);
          }

          if (wishlistRes.data && wishlistRes.data.products) {
            const transformedWishlist = wishlistRes.data.products
              .filter(Boolean)
              .map(p => ({
                ...p,
                id: p._id?.toString() || p.id
              }));
            setWishlist(transformedWishlist);
          }

          if (ordersRes.data) {
            // Transform backend orders to match frontend structure
            const transformedOrders = ordersRes.data.map(order => ({
              id: order._id,
              orderNumber: order.orderNumber,
              date: new Date(order.createdAt).toISOString().split('T')[0],
              items: order.items.map(item => ({
                id: item.productId?._id || item.productId || item._id,
                name: item.name || item.productId?.name || 'Product',
                price: item.price,
                qty: item.qty,
                size: item.size,
                vendor: item.vendor,
              })),
              total: order.totalAmount,
              status: order.status,
              itemsCount: order.items.reduce((acc, item) => acc + (item.qty || 0), 0),
              feedback: order.feedback?.rating
                ? {
                    rating: order.feedback.rating,
                    comment: order.feedback.comment || '',
                    createdAt: order.feedback.createdAt,
                  }
                : null,
            }));
            setOrders(transformedOrders);
          }
        } catch (err) {
          console.error('Failed to fetch user data', err);
        }
      };
      fetchUserData();
    } else if (user?.isVendor) {
      const fetchVendorBookings = async () => {
        try {
          const vendorId = user.id || user._id;
          const bookingsRes = await api.getVendorServiceBookings(vendorId);
          const bookings = bookingsRes.data?.bookings || bookingsRes.data || [];
          const transformed = (Array.isArray(bookings) ? bookings : []).map(b => ({
            ...b,
            id: b._id?.toString() || b.id,
            feedback: b.feedback?.rating ? b.feedback : null
          }));
          setServiceBookings(transformed);
        } catch (err) {
          console.error('Failed to fetch vendor service bookings', err);
          setServiceBookings([]);
        }
      };
      fetchVendorBookings();
    } else {
      setCart([]);
      setWishlist([]);
      setOrders([]);
      setServiceBookings([]);
    }
  }, [user, authLoading]);

  // WebSocket: unified connection management
  useEffect(() => {
    if (!user) {
      setSocket(null);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const s = connectSocket(token);
    setSocket(s);

    s.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message);
    });

    return () => {
      s.disconnect();
    };
  }, [user]);

  // WebSocket: listeners for order, booking status, and catalog changes
  useEffect(() => {
    if (!socket || !user) return;

    // Customer specific updates
    if (!user.isVendor) {
      socket.on('order_status_updated', (data) => {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === data.orderId ? { ...order, status: data.status } : order
          )
        );
      });

      socket.on('booking_status_updated', (data) => {
        setServiceBookings((prev) =>
          prev.map((booking) =>
            booking.id === data.bookingId
              ? { ...booking, status: data.status, technician: data.technician }
              : booking
          )
        );
      });
    }

    // Catalog real-time sync for everyone who is logged in
    socket.on('product_added', (product) => {
      setProducts((prev) => {
        if (prev.some((p) => p.id === product.id)) return prev;
        return [...prev, product];
      });
    });

    socket.on('product_updated', (product) => {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? product : p))
      );
    });

    socket.on('product_deleted', (data) => {
      setProducts((prev) => prev.filter((p) => p.id !== data.productId));
      setCart((prev) => prev.filter((item) => item.id !== data.productId));
      setWishlist((prev) => prev.filter((item) => item.id !== data.productId));
    });

    socket.on('service_added', (service) => {
      setServices((prev) => {
        if (prev.some((s) => s.id === service.id)) return prev;
        return [...prev, service];
      });
    });

    socket.on('service_updated', (service) => {
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? service : s))
      );
    });

    socket.on('service_deleted', (data) => {
      setServices((prev) => prev.filter((s) => s.id !== data.serviceId));
    });

    return () => {
      socket.off('order_status_updated');
      socket.off('booking_status_updated');
      socket.off('product_added');
      socket.off('product_updated');
      socket.off('product_deleted');
      socket.off('service_added');
      socket.off('service_updated');
      socket.off('service_deleted');
    };
  }, [socket, user]);

  const addProduct = async (newProduct) => {
    try {
      // Ensure product has vendorId if user is a vendor
      const productData = { ...newProduct };
      if (user && user.isVendor) {
        productData.vendorId = user.id || user._id;
      }
      // Remove id field as backend will generate _id
      delete productData.id;
      
      const response = await api.createProduct(productData);
      const createdProduct = response.data.product;
      if (!createdProduct) {
        throw new Error('Invalid response from server');
      }
      setProducts(prev => {
        if (prev.some(p => p.id === createdProduct.id)) return prev;
        return [...prev, createdProduct];
      });
      return createdProduct;
    } catch (err) {
      console.error('Failed to add product', err);
      showToast('Failed to add product', 'error');
      throw err;
    }
  };

  const updateProduct = async (updatedProduct) => {
    try {
      const productData = { ...updatedProduct };
      const productId = productData.id;
      // Remove id field for backend
      delete productData.id;
      
      const response = await api.updateProduct(productId, productData);
      const updated = response.data.product;
      if (!updated) {
        throw new Error('Invalid response from server');
      }
      setProducts(prev => prev.map(p => p.id === productId ? updated : p));
      return updated;
    } catch (err) {
      console.error('Failed to update product', err);
      showToast('Failed to update product', 'error');
      throw err;
    }
  };

  const deleteProduct = async (id) => {
    try {
      await api.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      setCart(prev => prev.filter(item => item.id !== id));
      setWishlist(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Failed to delete product', err);
      showToast('Failed to delete product', 'error');
      throw err;
    }
  };

  const addService = async (newService) => {
    try {
      const serviceData = { ...newService };
      delete serviceData.id;
      delete serviceData.type;
      delete serviceData.sku;
      delete serviceData.stock;

      const response = await api.createService(serviceData);
      const created = response.data.service;
      setServices((prev) => {
        if (prev.some(s => s.id === created.id)) return prev;
        return [...prev, created];
      });
      return created;
    } catch (err) {
      console.error('Failed to add service', err);
      showToast(err.response?.data?.message || 'Failed to add service', 'error');
      throw err;
    }
  };

  const updateService = async (updatedService) => {
    try {
      const serviceData = { ...updatedService };
      const serviceId = serviceData.id;
      delete serviceData.id;
      delete serviceData.type;
      delete serviceData.sku;
      delete serviceData.stock;

      const response = await api.updateService(serviceId, serviceData);
      const updated = response.data.service;
      setServices((prev) => prev.map((s) => (s.id === serviceId ? updated : s)));
      return updated;
    } catch (err) {
      console.error('Failed to update service', err);
      showToast(err.response?.data?.message || 'Failed to update service', 'error');
      throw err;
    }
  };

  const deleteService = async (id) => {
    try {
      await api.deleteService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to delete service', err);
      showToast(err.response?.data?.message || 'Failed to delete service', 'error');
      throw err;
    }
  };

  const login = (userData, token) => {
    const normalized = {
      ...userData,
      id: userData.id || userData._id,
    };
    setUser(normalized);
    localStorage.setItem('token', token);
    localStorage.setItem('accountType', normalized.isVendor ? 'vendor' : 'user');
  };

  const logout = () => {
    setUser(null);
    setCart([]);
    setWishlist([]);
    setOrders([]);
    setServiceBookings([]);
    localStorage.removeItem('token');
    localStorage.removeItem('accountType');
  };

  const addServiceBooking = async (booking) => {
    if (!user || user.isVendor) {
      showToast('Please login as a customer to book a service.', 'error');
      return { success: false };
    }

    try {
      const response = await api.createServiceBooking(booking);
      const saved = {
        ...response.data.booking,
        id: response.data.booking._id?.toString() || response.data.booking.id,
        feedback: response.data.booking.feedback?.rating ? response.data.booking.feedback : null
      };
      setServiceBookings((prev) => [...prev, saved]);
      return { success: true, booking: saved };
    } catch (err) {
      console.error('Failed to book service', err);
      const message = err.response?.data?.message || 'Failed to book service';
      showToast(message, 'error');
      return { success: false, error: message };
    }
  };

  const updateServiceBookingStatus = async (bookingId, newStatus) => {
    try {
      const response = await api.updateServiceBookingStatus(bookingId, newStatus);
      const updated = response.data.booking;
      setServiceBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? {
          ...b,
          ...updated,
          id: updated._id?.toString() || updated.id,
          feedback: updated.feedback?.rating ? updated.feedback : null
        } : b))
      );
    } catch (err) {
      console.error('Failed to update booking status', err);
      showToast(err.response?.data?.message || 'Failed to update booking', 'error');
    }
  };

  const refreshServiceBookings = useCallback(async () => {
    if (!user) return;
    try {
      if (user.isVendor) {
        const vendorId = user.id || user._id;
        const res = await api.getVendorServiceBookings(vendorId);
        const bookings = res.data?.bookings || res.data || [];
        const transformed = (Array.isArray(bookings) ? bookings : []).map(b => ({
          ...b,
          id: b._id?.toString() || b.id,
          feedback: b.feedback?.rating ? b.feedback : null
        }));
        setServiceBookings(transformed);
      } else {
        const res = await api.getUserServiceBookings();
        const bookings = res.data || [];
        const transformed = bookings.map(b => ({
          ...b,
          id: b._id?.toString() || b.id,
          feedback: b.feedback?.rating ? b.feedback : null
        }));
        setServiceBookings(transformed);
      }
    } catch (err) {
      console.error('Failed to refresh service bookings', err);
    }
  }, [user]);

  const submitOrderFeedback = async (orderId, { rating, comment }) => {
    try {
      const response = await api.submitOrderFeedback(orderId, { rating, comment });
      const feedback = response.data.feedback;
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                feedback: {
                  rating: feedback.rating,
                  comment: feedback.comment || '',
                  createdAt: feedback.createdAt,
                },
              }
            : order
        )
      );
      return { success: true };
    } catch (err) {
      console.error('Failed to submit feedback', err);
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to submit feedback',
      };
    }
  };

  const submitServiceBookingFeedback = async (bookingId, { rating, comment }) => {
    try {
      const response = await api.submitServiceBookingFeedback(bookingId, { rating, comment });
      const feedback = response.data.feedback;
      setServiceBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                feedback: {
                  rating: feedback.rating,
                  comment: feedback.comment || '',
                  createdAt: feedback.createdAt,
                },
              }
            : booking
        )
      );
      return { success: true };
    } catch (err) {
      console.error('Failed to submit booking feedback', err);
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to submit feedback',
      };
    }
  };  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      showToast('Order status updated successfully', 'success');
    } catch (err) {
      console.error('Failed to update order status', err);
      showToast(err.response?.data?.message || 'Failed to update order status', 'error');
    }
  };

  const addOrder = async (orderData) => {
    try {
      // Backend cart has one row per product — merge duplicate lines (e.g. different sizes)
      const qtyByProductId = cart.reduce((acc, item) => {
        const pid = item.id;
        acc[pid] = (acc[pid] || 0) + (Number(item.quantity) || 0);
        return acc;
      }, {});

      for (const [productId, quantity] of Object.entries(qtyByProductId)) {
        try {
          await api.updateCartItem(productId, quantity);
        } catch (err) {
          if (err.response?.status === 404) {
            await api.addToCart(productId, quantity);
          } else {
            throw err;
          }
        }
      }

      const response = await api.createOrder(orderData);

      // Refresh catalog stock after purchase
      const stockUpdates = response.data?.stockUpdates;
      if (stockUpdates?.length) {
        setProducts((prev) =>
          prev.map((p) => {
            const update = stockUpdates.find((u) => u.productId === p.id);
            return update ? { ...p, stock: update.stock } : p;
          })
        );
      } else {
        try {
          const productsRes = await api.fetchProducts();
          if (Array.isArray(productsRes.data)) {
            setProducts(productsRes.data);
          }
        } catch (refreshErr) {
          console.error('Failed to refresh products after order', refreshErr);
        }
      }
      
      // Transform backend response to match frontend structure
      const newOrder = {
        id: response.data.order.id,
        date: new Date().toISOString().split('T')[0],
        items: response.data.order.items.map(item => ({
          id: item.productId?._id || item.productId || item._id,
          name: item.name || item.productId?.name || 'Product',
          price: item.price,
          qty: item.qty,
          size: item.size,
          vendor: item.vendor,
        })),
        total: response.data.order.totalAmount,
        status: response.data.order.status,
        itemsCount: response.data.order.items.reduce((acc, item) => acc + (item.qty || 0), 0),
        feedback: null,
      };

      // Update local state
      setOrders((prev) => [newOrder, ...prev]);

      // Clear cart after successful order
      setCart([]);

      return { success: true, order: newOrder };
    } catch (error) {
      console.error('Failed to create order:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to create order' };
    }
  };

  const updateCartItemSize = (productId, oldSize, newSize) => {
    setCart((prevCart) => {
      const existingNewSizeItem = prevCart.find(i => i.id === productId && i.size === newSize);
      if (existingNewSizeItem) {
        const oldItem = prevCart.find(i => i.id === productId && i.size === oldSize);
        return prevCart.filter(i => !(i.id === productId && i.size === oldSize)).map(i => {
          if (i.id === productId && i.size === newSize) {
            return { ...i, quantity: i.quantity + oldItem.quantity };
          }
          return i;
        });
      } else {
        return prevCart.map(item => {
          if (item.id === productId && item.size === oldSize) {
            return { ...item, size: newSize };
          }
          return item;
        });
      }
    });
  };


  const addToCart = async (product, quantity = 1, size = null) => {

    console.log("the props that i am getting ", product);
    console.log("the props that i am gettting ", quantity);
    console.log("the product that i am gettting ", size);

    if (!user) {
      showToast("Please login first to add items to your cart.", 'error');
      return;
    }

    const availableStock = Number(product.stock) || 0;
    const existingItem = cart.find((item) => item.id === product.id && item.size === size);
    const currentQtyInCart = existingItem ? existingItem.quantity : 0;
    const requestedTotal = currentQtyInCart + quantity;

    if (availableStock <= 0) {
      showToast(`Sorry, ${product.name} is out of stock.`, 'error');
      return;
    }

    if (requestedTotal > availableStock) {
      showToast(`Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${requestedTotal}`, 'error');
      return;
    }

    try {
      await api.addToCart(product._id || product.id, quantity);
      // Update local state optimistically
      if (existingItem) {
        setCart(prevCart => prevCart.map((item) =>
          item.id === product.id && item.size === size ? { ...item, quantity: item.quantity + quantity } : item
        ));
      } else {
        setCart(prevCart => [...prevCart, { ...product, quantity, size }]);
      }
      showToast(`Added ${product.name} to cart.`, 'success');
    } catch (err) {
      console.error('Failed to add to cart', err);
      showToast(err.response?.data?.message || 'Failed to add item to cart', 'error');
    }
  };

  const removeFromCart = async (productId, size = null) => {
    try {
      await api.removeFromCart(productId);
      setCart((prevCart) => prevCart.filter((item) => !(item.id === productId && item.size === size)));
    } catch (err) {
      console.error('Failed to remove from cart', err);
    }
  };

  const updateCartQuantity = async (productId, size = null, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await api.updateCartItem(productId, newQuantity);
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === productId && item.size === size ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (err) {
      console.error('Failed to update cart quantity', err);
      showToast('Failed to update quantity', 'error');
    }
  };

  const toggleWishlist = async (product) => {
    if (!user) {
      showToast("Please login first to add items to your wishlist.", 'error');
      return;
    }

    try {
      const exists = wishlist.find((item) => item.id === product.id);
      if (exists) {
        await api.removeFromWishlist(product._id || product.id);
        setWishlist(prevWishlist => prevWishlist.filter((item) => item.id !== product.id));
      } else {
        await api.addToWishlist(product._id || product.id);
        setWishlist(prevWishlist => [...prevWishlist, product]);
        showToast(`Added ${product.name} to wishlist.`, 'success');
      }
    } catch (err) {
      console.error('Failed to toggle wishlist', err);
      showToast('Failed to update wishlist', 'error');
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!user) {
      showToast("Please login first to remove items from your wishlist.", 'error');
      return;
    }

    try {
      await api.removeFromWishlist(productId);
      setWishlist((prevWishlist) => prevWishlist.filter((item) => item.id !== productId));
    } catch (err) {
      console.error('Failed to remove from wishlist', err);
      showToast('Failed to remove item from wishlist', 'error');
    }
  };

  return (
    <AppContext.Provider value={{ 
      cart, setCart, addToCart, removeFromCart, updateCartQuantity, updateCartItemSize, 
      wishlist, setWishlist, toggleWishlist, removeFromWishlist, 
      user, setUser, login, logout, authLoading, socket,
      serviceBookings, addServiceBooking, updateServiceBookingStatus, refreshServiceBookings, submitServiceBookingFeedback,
      orders, addOrder, submitOrderFeedback, updateOrderStatus,
      products, addProduct, updateProduct, deleteProduct,
      services, addService, updateService, deleteService,
      loading, showToast
    }}>
      {children}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </AppContext.Provider>
  );
};

const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const { message, type } = toast;

  const bgColor = type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-800' : 
                  type === 'info' ? 'bg-blue-50 border-blue-100 text-blue-800' : 
                  'bg-emerald-50 border-emerald-100 text-emerald-800';

  const iconColor = type === 'error' ? 'text-rose-500' :
                    type === 'info' ? 'text-blue-500' :
                    'text-emerald-500';

  const iconSvg = type === 'error' ? (
    <svg className={`h-5 w-5 ${iconColor} shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ) : type === 'info' ? (
    <svg className={`h-5 w-5 ${iconColor} shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ) : (
    <svg className={`h-5 w-5 ${iconColor} shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div className="fixed top-24 right-6 z-[9999] animate-toast-in pointer-events-none">
      <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border ${bgColor} max-w-sm pointer-events-auto`}>
        {iconSvg}
        <span className="text-sm font-bold tracking-tight">{message}</span>
        <button 
          onClick={onClose}
          className="ml-auto p-1 rounded-lg hover:bg-black/5 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export const useAppContext = () => useContext(AppContext);
