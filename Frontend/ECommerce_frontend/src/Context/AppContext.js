import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as api from '../api';

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
            setServiceBookings(bookingsRes.data);
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
            setWishlist(wishlistRes.data.products);
          }

          if (ordersRes.data) {
            // Transform backend orders to match frontend structure
            const transformedOrders = ordersRes.data.map(order => ({
              id: order._id,
              date: new Date(order.createdAt).toISOString().split('T')[0],
              items: order.items.map(item => ({
                id: item.productId._id || item.productId,
                name: item.name,
                price: item.price,
                qty: item.qty,
                size: item.size,
                vendor: item.vendor,
              })),
              total: order.totalAmount,
              status: order.status,
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
          setServiceBookings(Array.isArray(bookings) ? bookings : []);
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

  const addProduct = async (newProduct) => {
    try {
      // Ensure product has vendorId if user is a vendor
      const productData = { ...newProduct };
      if (user && user.isVendor && user._id) {
        productData.vendorId = user._id;
      }
      // Remove id field as backend will generate _id
      delete productData.id;
      
      const response = await api.createProduct(productData);
      const createdProduct = response.data.product;
      if (!createdProduct) {
        throw new Error('Invalid response from server');
      }
      setProducts(prev => [...prev, createdProduct]);
      return createdProduct;
    } catch (err) {
      console.error('Failed to add product', err);
      alert('Failed to add product');
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
      alert('Failed to update product');
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
      alert('Failed to delete product');
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
      setServices((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.error('Failed to add service', err);
      alert(err.response?.data?.message || 'Failed to add service');
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
      alert(err.response?.data?.message || 'Failed to update service');
      throw err;
    }
  };

  const deleteService = async (id) => {
    try {
      await api.deleteService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to delete service', err);
      alert(err.response?.data?.message || 'Failed to delete service');
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
      alert('Please login as a customer to book a service.');
      return { success: false };
    }

    try {
      const response = await api.createServiceBooking(booking);
      const saved = response.data.booking;
      setServiceBookings((prev) => [...prev, saved]);
      return { success: true, booking: saved };
    } catch (err) {
      console.error('Failed to book service', err);
      const message = err.response?.data?.message || 'Failed to book service';
      alert(message);
      return { success: false, error: message };
    }
  };

  const updateServiceBookingStatus = async (bookingId, newStatus) => {
    try {
      const response = await api.updateServiceBookingStatus(bookingId, newStatus);
      const updated = response.data.booking;
      setServiceBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, ...updated } : b))
      );
    } catch (err) {
      console.error('Failed to update booking status', err);
      alert(err.response?.data?.message || 'Failed to update booking');
    }
  };

  const refreshServiceBookings = useCallback(async () => {
    if (!user) return;
    try {
      if (user.isVendor) {
        const vendorId = user.id || user._id;
        const res = await api.getVendorServiceBookings(vendorId);
        setServiceBookings(res.data?.bookings || []);
      } else {
        const res = await api.getUserServiceBookings();
        setServiceBookings(res.data || []);
      }
    } catch (err) {
      console.error('Failed to refresh service bookings', err);
    }
  }, [user]);

  const addOrder = async (orderData) => {
    try {
      for (const item of cart) {
        try {
          await api.updateCartItem(item.id, item.quantity);
        } catch (err) {
          if (err.response?.status === 404) {
            await api.addToCart(item.id, item.quantity);
          } else {
            throw err;
          }
        }
      }

      const response = await api.createOrder(orderData);
      
      // Transform backend response to match frontend structure
      const newOrder = {
        id: response.data.order.id,
        date: new Date().toISOString().split('T')[0],
        items: response.data.order.items,
        total: response.data.order.totalAmount,
        status: response.data.order.status,
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
      alert("Please login first to add items to your cart.");
      return;
    }

    try {
      await api.addToCart(product._id || product.id, quantity);
      // Update local state optimistically
      const existingItem = cart.find((item) => item.id === product.id && item.size === size);
      if (existingItem) {
        setCart(prevCart => prevCart.map((item) =>
          item.id === product.id && item.size === size ? { ...item, quantity: item.quantity + quantity } : item
        ));
        alert(`${product.name} quantity updated in cart!`);
      } else {
        setCart(prevCart => [...prevCart, { ...product, quantity, size }]);
        alert(`${product.name} added to cart!`);
      }
    } catch (err) {
      console.error('Failed to add to cart', err);
      alert('Failed to add item to cart');
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
      alert('Failed to update quantity');
    }
  };

  const toggleWishlist = async (product) => {
    if (!user) {
      alert("Please login first to add items to your wishlist.");
      return;
    }

    try {
      const exists = wishlist.find((item) => item.id === product.id);
      if (exists) {
        await api.removeFromWishlist(product._id || product.id);
        setWishlist(prevWishlist => prevWishlist.filter((item) => item.id !== product.id));
        alert(`${product.name} removed from wishlist!`);
      } else {
        await api.addToWishlist(product._id || product.id);
        setWishlist(prevWishlist => [...prevWishlist, product]);
        alert(`${product.name} added to wishlist!`);
      }
    } catch (err) {
      console.error('Failed to toggle wishlist', err);
      alert('Failed to update wishlist');
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!user) {
      alert("Please login first to remove items from your wishlist.");
      return;
    }

    try {
      await api.removeFromWishlist(productId);
      setWishlist((prevWishlist) => prevWishlist.filter((item) => item.id !== productId));
      alert("Item removed from wishlist!");
    } catch (err) {
      console.error('Failed to remove from wishlist', err);
      alert('Failed to remove item from wishlist');
    }
  };

  return (
    <AppContext.Provider value={{ 
      cart, setCart, addToCart, removeFromCart, updateCartQuantity, updateCartItemSize, 
      wishlist, setWishlist, toggleWishlist, removeFromWishlist, 
      user, setUser, login, logout, authLoading,
      serviceBookings, addServiceBooking, updateServiceBookingStatus, refreshServiceBookings,
      orders, addOrder,
      products, addProduct, updateProduct, deleteProduct,
      services, addService, updateService, deleteService,
      loading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);