import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth APIs
export const registerUser = (userData) => API.post('/auth/register', userData);
export const loginUser = (credentials) => API.post('/auth/login', credentials);
export const getCurrentUser = () => API.get('/auth/me');

// Vendor APIs
export const registerVendor = (vendorData) => API.post('/vendor/register', vendorData);
export const loginVendor = (credentials) => API.post('/vendor/login', credentials);
export const getCurrentVendor = () => API.get('/vendor/me');

// Upload APIs
export const uploadImage = (formData) =>
  API.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// Product APIs
export const fetchProducts = () => API.get('/products');
export const fetchProductById = (id) => API.get(`/products/${id}`);
export const createProduct = (productData) => API.post('/products', productData);
export const updateProduct = (id, productData) => API.put(`/products/${id}`, productData);
export const deleteProduct = (id) => API.delete(`/products/${id}`);

// Service listing APIs
export const fetchServices = () => API.get('/services');
export const fetchServiceById = (id) => API.get(`/services/${id}`);
export const createService = (serviceData) => API.post('/services', serviceData);
export const updateService = (id, serviceData) => API.put(`/services/${id}`, serviceData);
export const deleteService = (id) => API.delete(`/services/${id}`);

// Address APIs
export const getAddresses = () => API.get('/addresses');
export const addAddress = (addressData) => API.post('/addresses', addressData);

// Cart APIs
export const getCart = () => API.get('/cart');
export const addToCart = (productId, quantity) => API.post('/cart/add', { productId, quantity });
export const updateCartItem = (productId, quantity) => API.put('/cart/update', { productId, quantity });
export const removeFromCart = (productId) => API.delete('/cart/remove', { data: { productId } });
export const clearCart = () => API.delete('/cart/clear');

// Wishlist APIs
export const getWishlist = () => API.get('/wishlist');
export const addToWishlist = (productId) => API.post('/wishlist/add', { productId });
export const removeFromWishlist = (productId) => API.delete('/wishlist/remove', { data: { productId } });
export const clearWishlist = () => API.delete('/wishlist/clear');

// Order APIs
export const createOrder = (orderData) => API.post('/orders', orderData);
export const getUserOrders = () => API.get('/orders/user');
export const getVendorOrders = (vendorId) => API.get(`/orders/vendor/${vendorId}`);
export const getAllOrders = () => API.get('/orders/all');
export const updateOrderStatus = (orderId, status) => API.put(`/orders/${orderId}/status`, { status });
export const submitOrderFeedback = (orderId, feedback) =>
  API.post(`/orders/${orderId}/feedback`, feedback);

// Service booking APIs
export const createServiceBooking = (bookingData) => API.post('/bookings', bookingData);
export const getUserServiceBookings = () => API.get('/bookings/user');
export const getVendorServiceBookings = (vendorId) => API.get(`/bookings/vendor/${vendorId}`);
export const updateServiceBookingStatus = (bookingId, status) =>
  API.patch(`/bookings/${bookingId}/status`, { status });

export default API;