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

// Product APIs
export const fetchProducts = () => API.get('/products');
export const fetchProductById = (id) => API.get(`/products/${id}`);
export const createProduct = (productData) => API.post('/products', productData);
export const updateProduct = (id, productData) => API.put(`/products/${id}`, productData);
export const deleteProduct = (id) => API.delete(`/products/${id}`);

// Cart APIs
export const getCart = () => API.get('/cart');
export const addToCart = (productId, quantity) => API.post('/cart/add', { productId, quantity });
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

export default API;