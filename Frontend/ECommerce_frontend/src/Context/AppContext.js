import React, { createContext, useState, useContext, useEffect } from 'react';
import { productsDB, servicesDB } from '../data';
import * as api from '../api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [user, setUser] = useState(null); // Auth state
  const [serviceBookings, setServiceBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState(Object.values(productsDB));
  const [services, setServices] = useState(servicesDB);
  const [loading, setLoading] = useState(false);

  // Fetch products from backend on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await api.fetchProducts();
        if (response.data && Array.isArray(response.data)) {
          setProducts(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch products from backend, using local data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Fetch cart, wishlist, and orders when user logs in
  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        try {
          const cartRes = await api.getCart();
          const wishlistRes = await api.getWishlist();
          const ordersRes = await api.getUserOrders();
          
          // Transform backend data to match frontend structure
          if (cartRes.data && cartRes.data.items) {
            const cartItems = cartRes.data.items.map(item => ({
              ...item.productId,
              quantity: item.quantity,
              size: item.size || null,
            }));
            setCart(cartItems);
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
    } else {
      // Clear cart, wishlist, and orders when no user
      setCart([]);
      setWishlist([]);
      setOrders([]);
    }
  }, [user]);

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
      const createdProduct = response.data;
      // Transform backend product to frontend shape
      const frontendProduct = {
        id: createdProduct._id,
        name: createdProduct.name,
        price: createdProduct.price,
        image: createdProduct.image,
        category: createdProduct.category,
        description: createdProduct.description,
        rating: createdProduct.rating || 4.5,
        reviews: createdProduct.reviews || 0,
        stock: createdProduct.stock || 0,
        sizes: createdProduct.sizes || [],
        vendor: user?.companyName || user?.storeName || 'Vendor'
      };
      setProducts(prev => [...prev, frontendProduct]);
      return frontendProduct;
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
      const updated = response.data;
      // Transform backend product to frontend shape
      const frontendProduct = {
        id: updated._id,
        name: updated.name,
        price: updated.price,
        image: updated.image,
        category: updated.category,
        description: updated.description,
        rating: updated.rating || 4.5,
        reviews: updated.reviews || 0,
        stock: updated.stock || 0,
        sizes: updated.sizes || [],
        vendor: user?.companyName || user?.storeName || 'Vendor'
      };
      setProducts(prev => prev.map(p => p.id === productId ? frontendProduct : p));
      return frontendProduct;
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

  const addService = (newService) => {
    setServices(prev => [...prev, { ...newService, id: Date.now() }]);
  };

  const updateService = (updatedService) => {
    setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));
  };

  const deleteService = (id) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setUser(null);
    setCart([]);
    setWishlist([]);
    localStorage.removeItem('token');
  };

  const addServiceBooking = (booking) => {
    setServiceBookings((prev) => [...prev, booking]);
  };

  const updateServiceBookingStatus = (bookingId, newStatus) => {
    setServiceBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
  };

  const addOrder = async (orderData) => {
    try {
      // Call backend to create order
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

  const updateCartQuantity = (productId, size = null, newQuantity) => {
    if (newQuantity < 1) return;
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId && item.size === size ? { ...item, quantity: newQuantity } : item
      )
    );
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
      user, setUser, login, logout, 
      serviceBookings, addServiceBooking, updateServiceBookingStatus,
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