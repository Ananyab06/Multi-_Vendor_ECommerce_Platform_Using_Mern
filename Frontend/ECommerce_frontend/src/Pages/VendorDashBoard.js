import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard,Package,ShoppingCart,User,Settings,Bell, Plus,TrendingUp,TrendingDown,IndianRupee, 
  Users,Activity,Edit2,Save,CheckCircle,X,Briefcase,Store,ChevronRight,LogOut,ShoppingBag,Trash2,Upload,ImagePlus,Check,CheckCheck,Star,MessageSquare
} from 'lucide-react';
import { useAppContext } from '../Context/AppContext';
import { useNavigate } from 'react-router-dom';
import { getVendorOrders, uploadImage, updateOrderStatus, updateVendorProfile } from '../api';


const getNotificationStorageKey = (vendorId) => `unibox-vendor-notifications-${vendorId}`;

const loadStoredNotifications = (vendorId) => {
  try {
    const raw = localStorage.getItem(getNotificationStorageKey(vendorId));
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((n) => ({ ...n, read: Boolean(n.read) }));
  } catch {
    return [];
  }
};

const saveStoredNotifications = (vendorId, notifications) => {
  localStorage.setItem(getNotificationStorageKey(vendorId), JSON.stringify(notifications));
};

const isServiceSlotPassed = (dateStr, slotStr) => {
  try {
    if (!dateStr || !slotStr) return true;
    const [year, month, day] = dateStr.split('-').map(Number);
    const parts = slotStr.split('-');
    if (parts.length < 2) return true;
    const endPart = parts[1].trim();
    const match = endPart.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return true;
    
    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const ampm = match[3].toUpperCase();
    
    if (ampm === 'PM' && hours < 12) {
      hours += 12;
    } else if (ampm === 'AM' && hours === 12) {
      hours = 0;
    }
    
    const appointmentEnd = new Date(year, month - 1, day, hours, minutes, 0, 0);
    const now = new Date();
    return now > appointmentEnd;
  } catch (err) {
    console.error('Error parsing booking slot:', err);
    return true;
  }
};

const VendorDashboard = () => {
  const { 
    user: currentUser,
    authLoading,
    logout,
    products, 
    addProduct,
    updateProduct, 
    deleteProduct, 
    services, 
    serviceBookings,
    updateServiceBookingStatus,
    refreshServiceBookings,
    addService,
    updateService, 
    deleteService,
    setUser: updateGlobalUser,
    socket,
    showToast
  } = useAppContext();
  const navigate = useNavigate();

  // Authorization Guard (wait until session restore finishes)
  useEffect(() => {
    if (authLoading) return;
    if (!currentUser || !currentUser.isVendor) {
      navigate('/');
    }
  }, [currentUser, authLoading, navigate]);

  const [vendorStats, setVendorStats] = useState({ totalRevenue: 0, orderCount: 0 });
  const [vendorOrders, setVendorOrders] = useState([]);

  const vendorId = (currentUser?.id || currentUser?._id)?.toString();

  const loadVendorOrders = React.useCallback(async () => {
    if (!currentUser?.isVendor || !vendorId) return;

    try {
      const response = await getVendorOrders(vendorId);
      const payload = response.data;
      const orders = Array.isArray(payload) ? payload : (payload.orders || []);
      const stats = Array.isArray(payload) ? {} : (payload.stats || {});

      const transformedOrders = orders.map((order) => ({
        id: order._id,
        orderNumber: order.orderNumber,
        date: new Date(order.createdAt).toISOString().split('T')[0],
        items: (order.vendorItems || order.items).map((item) => ({
          id: item.productId?._id || item.productId || item._id,
          name: item.name || item.productId?.name || 'Product',
          price: item.price,
          qty: item.qty,
          size: item.size,
          vendor: item.vendor,
          vendorId: item.vendorId,
        })),
        total: order.vendorOrderTotal ?? order.totalAmount,
        status: order.status,
        customer: order.userId?.name || 'Unknown Customer',
        paymentMethod: order.paymentMethod,
        feedback: order.feedback,
      }));

      setVendorOrders(transformedOrders);
      setVendorStats({
        totalRevenue: stats.totalRevenue ?? 0,
        orderCount: stats.orderCount ?? transformedOrders.length,
        storeName: stats.storeName,
      });

      await refreshServiceBookings();
    } catch (error) {
      console.error('Failed to fetch vendor orders:', error);
      const msg = error.response?.data?.message || error.message;
      if (msg) console.error('Vendor orders API:', msg);
    }
  }, [currentUser, vendorId, refreshServiceBookings]);

  useEffect(() => {
    loadVendorOrders();
    const interval = setInterval(loadVendorOrders, 30000);
    return () => clearInterval(interval);
  }, [loadVendorOrders]);

  const loadVendorOrdersRef = React.useRef(null);
  const refreshServiceBookingsRef = React.useRef(null);
  const updateNotificationsRef = React.useRef(null);

  useEffect(() => {
    loadVendorOrdersRef.current = loadVendorOrders;
    refreshServiceBookingsRef.current = refreshServiceBookings;
    updateNotificationsRef.current = updateNotifications;
  });

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (data) => {
      if (updateNotificationsRef.current) {
        updateNotificationsRef.current((prev) => {
          if (prev.some((n) => n.orderId === data.orderId)) return prev;

          const newNotification = {
            id: `${data.orderId}-${Date.now()}`,
            type: 'order',
            orderId: data.orderId,
            customer: data.customer || 'Customer',
            items: data.items,
            total: data.total,
            time: data.time || 'Just now',
            message: data.message,
            read: false,
            createdAt: new Date().toISOString(),
          };

          setActiveToast(newNotification);
          setTimeout(() => setActiveToast(null), 5000);
          return [newNotification, ...prev];
        });
      }
      if (loadVendorOrdersRef.current) {
        loadVendorOrdersRef.current();
      }
    };

    const handleNewBooking = (data) => {
      if (updateNotificationsRef.current) {
        updateNotificationsRef.current((prev) => {
          if (prev.some((n) => n.bookingId === data.bookingId)) return prev;

          const newNotification = {
            id: `${data.bookingId}-${Date.now()}`,
            type: 'booking',
            bookingId: data.bookingId,
            customer: data.customer || 'Customer',
            items: data.serviceName,
            total: data.price,
            time: data.time || 'Just now',
            message: data.message,
            read: false,
            createdAt: new Date().toISOString(),
          };

          setActiveToast(newNotification);
          setTimeout(() => setActiveToast(null), 5000);
          return [newNotification, ...prev];
        });
      }
      if (refreshServiceBookingsRef.current) {
        refreshServiceBookingsRef.current();
      }
    };

    const handleOrderCancelled = (data) => {
      if (updateNotificationsRef.current) {
        updateNotificationsRef.current((prev) => {
          if (prev.some((n) => n.id.startsWith(`cancel-${data.orderId}`))) return prev;

          const newNotification = {
            id: `cancel-${data.orderId}-${Date.now()}`,
            type: 'cancellation',
            orderId: data.orderId,
            customer: data.customer || 'Customer',
            items: data.items,
            total: data.total || 0,
            time: 'Just now',
            message: `${data.customer} cancelled order #${data.orderId.slice(-6).toUpperCase()}`,
            read: false,
            createdAt: new Date().toISOString(),
          };

          setActiveToast(newNotification);
          setTimeout(() => setActiveToast(null), 5000);
          return [newNotification, ...prev];
        });
      }
      if (loadVendorOrdersRef.current) {
        loadVendorOrdersRef.current();
      }
    };

    socket.on('new_order', handleNewOrder);
    socket.on('new_booking', handleNewBooking);
    socket.on('order_cancelled', handleOrderCancelled);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('new_booking', handleNewBooking);
      socket.off('order_cancelled', handleOrderCancelled);
    };
  }, [socket]);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      await loadVendorOrders();
    } catch (err) {
      console.error('Failed to update order status:', err);
      showToast(err.response?.data?.message || 'Failed to update order status', 'error');
    }
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [inventorySubTab, setInventorySubTab] = useState('all'); // 'all', 'product', 'service'
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationPanelRef = useRef(null);
  const [editingItem, setEditingItem] = useState(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const imageInputRef = useRef(null);
  const [activeToast, setActiveToast] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [cancelOrderModal, setCancelOrderModal] = useState(null);
  const [deleteItemModal, setDeleteItemModal] = useState(null);

  // Vendor Profile
  const [profile, setProfile] = useState({
    name: currentUser?.name || '',
    storeName: currentUser?.companyName || currentUser?.storeName || 'My Store',
    email: currentUser?.email || '',
    phone: currentUser?.mobile || '',
    description: 'Premium electronics and professional tech services.',
    gstNumber: currentUser?.gstNumber || 'NA'
  });

  const [profileErrors, setProfileErrors] = useState({ email: '', phone: '' });

  // Sync profile when currentUser is loaded
  useEffect(() => {
    if (currentUser) {
      setProfile(prev => ({
        ...prev,
        name: currentUser.name || '',
        storeName: currentUser.companyName || currentUser.storeName || 'My Store',
        email: currentUser.email || '',
        phone: currentUser.mobile || '',
        gstNumber: currentUser.gstNumber || 'NA',
      }));
    }
  }, [currentUser]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const handleProfileEmailChange = (val) => {
    setProfile(prev => ({ ...prev, email: val }));
    if (validateEmail(val)) {
      setProfileErrors(prev => ({ ...prev, email: '' }));
    } else {
      setProfileErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    }
  };

  const handleProfilePhoneChange = (val) => {
    const cleanVal = val.replace(/\D/g, '').slice(0, 10);
    setProfile(prev => ({ ...prev, phone: cleanVal }));
    if (validatePhone(cleanVal)) {
      setProfileErrors(prev => ({ ...prev, phone: '' }));
    } else {
      setProfileErrors(prev => ({ ...prev, phone: 'Please enter a valid 10-digit phone number' }));
    }
  };

  const updateNotifications = React.useCallback((updater) => {
    setNotifications((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (vendorId) {
        saveStoredNotifications(vendorId, next);
      }
      return next;
    });
  }, [vendorId]);

  useEffect(() => {
    if (!vendorId) return;
    setNotifications(loadStoredNotifications(vendorId));
  }, [vendorId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationPanelRef.current &&
        !notificationPanelRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  useEffect(() => {
    if (currentUser) {
      setProfile(prev => ({
        ...prev,
        name: currentUser.name || prev.name,
        storeName: currentUser.companyName || currentUser.storeName || prev.storeName,
        email: currentUser.email || prev.email,
        phone: currentUser.mobile || prev.phone,
      }));
    }
  }, [currentUser]);

  const belongsToVendor = (item) => {
    const vendorName = profile.storeName?.toLowerCase().trim();
    if (item.vendorId && vendorId) {
      return item.vendorId.toString() === vendorId;
    }
    return item.vendor?.toLowerCase().trim() === vendorName;
  };

  // Combine products and services for inventory view using useMemo for reactivity
  const inventory = React.useMemo(() => {
    let items = [
      ...products.filter(belongsToVendor).map((p) => ({
        ...p,
        type: 'product',
        sku: `SKU-${String(p.id).slice(-6).toUpperCase()}`,
      })),
      ...services.filter(belongsToVendor).map((s) => ({
        ...s,
        type: 'service',
        sku: `SRV-${String(s.id).slice(-6).toUpperCase()}`,
      })),
    ];
    if (inventorySubTab === 'product') return items.filter((i) => i.type === 'product');
    if (inventorySubTab === 'service') return items.filter((i) => i.type === 'service');
    return items;
  }, [products, services, inventorySubTab, profile.storeName, vendorId]);

  const availableCategories = React.useMemo(() => {
    const pCats = products.map(p => p.category);
    const sCats = services.map(s => s.category);
    return Array.from(new Set([...pCats, ...sCats]));
  }, [products, services]);

  // Dynamic Dashboard Stats
  const stats = React.useMemo(() => {
    const vendorName = profile.storeName?.toLowerCase().trim();
    const vendorProducts = products.filter(p => p.vendor?.toLowerCase().trim() === vendorName);
    const vendorProductNames = new Set(vendorProducts.map(p => p.name));
    
    // Orders from API are already scoped to this vendor
    const vendorProductOrders = vendorOrders;
    const vendorBookings = serviceBookings;

    const activeOrders = vendorProductOrders.filter(
      (order) => order.status !== 'cancelled' && order.status !== 'Cancelled'
    );
    const productRevenue =
      vendorStats.totalRevenue !== undefined && vendorStats.totalRevenue !== null
        ? vendorStats.totalRevenue
        : activeOrders.reduce(
            (sum, order) => sum + (Number(order.total) || 0),
            0
          );

    const activeBookings = vendorBookings.filter(
      (booking) => booking.status !== 'cancelled' && booking.status !== 'Cancelled'
    );
    const serviceRevenue = activeBookings.reduce((sum, booking) => sum + (Number(booking.price) || 0), 0);

    const revenue = productRevenue + serviceRevenue;

    // Mock visitors based on products and orders (starts at 0 for new vendors)
    const visitors = (vendorProducts.length * 5) + (vendorProductOrders.length * 12);

    // Dynamic chart data: group revenue by date for the selected month
    const currentYear = new Date().getFullYear();
    const daysInMonth = new Date(currentYear, selectedMonth + 1, 0).getDate();
    const chartData = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${currentYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Get product revenue for this day
      const dailyProductRevenue = vendorProductOrders
        .filter((order) => order.date === dateStr && order.status !== 'cancelled' && order.status !== 'Cancelled')
        .reduce((sum, order) => sum + (Number(order.total) || 0), 0);

      // Get service revenue for this day
      const dailyServiceRevenue = vendorBookings
        .filter(booking => booking.date === dateStr && booking.status !== 'cancelled' && booking.status !== 'Cancelled')
        .reduce((sum, booking) => sum + (Number(booking.price) || 0), 0);

      const totalDailyRevenue = dailyProductRevenue + dailyServiceRevenue;

      return { 
        day, 
        revenue: totalDailyRevenue,
        productRev: dailyProductRevenue,
        serviceRev: dailyServiceRevenue
      };
    });

    const maxDailyRevenue = Math.max(...chartData.map(d => d.revenue), 100);

    return {
      revenue: `₹${revenue.toLocaleString('en-IN')}`,
      orders: (vendorStats.orderCount || vendorProductOrders.length + vendorBookings.length).toLocaleString('en-IN'),
      visitors: visitors.toLocaleString('en-IN'),
      revenueTrend: revenue > 0 ? "↑ 100%" : "0%",
      ordersTrend: (vendorProductOrders.length + vendorBookings.length) > 0 ? "↑ 100%" : "0%",
      visitorsTrend: visitors > 0 ? "↑ 100%" : "0%",
      rawRevenue: revenue,
      vendorOrders: vendorProductOrders,
      vendorBookings: vendorBookings,
      chartData,
      maxDailyRevenue
    };
  }, [vendorOrders, vendorStats, products, profile.storeName, selectedMonth, serviceBookings]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };



  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatNotificationTime = (n) => {
    if (n.createdAt) {
      return new Date(n.createdAt).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return n.time || '';
  };

  const markAsRead = (id) => {
    updateNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    updateNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    updateNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const [savingItem, setSavingItem] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const resetImageSelection = () => {
    if (imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview('');
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const closeItemModal = () => {
    resetImageSelection();
    setEditingItem(null);
    setIsAddingItem(false);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Please upload a JPG, PNG, WEBP, or GIF image.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be smaller than 5MB.', 'error');
      return;
    }

    if (imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    const itemData = { ...editingItem };

    // Parse prices
    const origPrice = parseFloat(
      itemData.originalPriceInput !== undefined 
        ? itemData.originalPriceInput 
        : (itemData.originalPrice || itemData.price || 0)
    );

    const discInput = itemData.discountedPrice !== undefined
      ? itemData.discountedPrice
      : (itemData.originalPrice && itemData.originalPrice > itemData.price ? itemData.price : 'na');

    const isNa = !discInput || discInput.toString().trim().toLowerCase() === 'na' || parseFloat(discInput) === 0;

    if (isNa) {
      itemData.price = origPrice;
      itemData.originalPrice = origPrice;
    } else {
      const discVal = parseFloat(discInput);
      if (!isNaN(discVal) && discVal > 0) {
        if (discVal > origPrice) {
          showToast('Discounted price cannot be greater than the original price.', 'error');
          return;
        }
        itemData.price = discVal;
        itemData.originalPrice = origPrice;
      } else {
        itemData.price = origPrice;
        itemData.originalPrice = origPrice;
      }
    }

    const hasImage = Boolean(imageFile || itemData.image);
    if (!hasImage) {
      showToast('Please upload an image for this listing.', 'error');
      return;
    }

    setSavingItem(true);
    try {
      let imageUrl = itemData.image;
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await uploadImage(formData);
        imageUrl = uploadRes.data.url;
      }
      itemData.image = imageUrl;

      if (isAddingItem) {
        if (itemData.type === 'product') {
          await addProduct({
            ...itemData,
            rating: itemData.rating || 4.5,
            reviews: itemData.reviews === '' ? 0 : (itemData.reviews || 0),
            sizes: itemData.sizes || [],
            image: imageUrl,
            vendor: profile.storeName
          });
        } else {
          await addService({
            ...itemData,
            rating: itemData.rating || 4.8,
            reviews: itemData.reviews === '' ? 0 : (itemData.reviews || 0),
            image: imageUrl,
            vendor: profile.storeName,
            category: itemData.category || 'Services',
            description: itemData.description || '',
          });
        }
      } else if (itemData.type === 'product') {
        await updateProduct(itemData);
      } else {
        await updateService(itemData);
      }
      closeItemModal();
    } catch (err) {
      console.error('Failed to save item', err);
      showToast(err.response?.data?.message || 'Failed to save item. Please try again.', 'error');
    } finally {
      setSavingItem(false);
    }
  };

  const openAddItemModal = () => {
    resetImageSelection();
    setEditingItem({
      type: inventorySubTab === 'service' ? 'service' : 'product',
      name: '',
      price: 0.00,
      originalPriceInput: '',
      discountedPrice: 'na',
      stock: 0,
      category: inventorySubTab === 'service' ? 'Services' : 'Electronics',
      description: '',
      image: '',
      rating: 4.5,
      reviews: ''
    });
    setIsAddingItem(true);
  };

  const handleDeleteItem = (item) => {
    setDeleteItemModal(item);
  };

  const handleUpdateStock = async (id, newStock) => {
    const product = products.find(p => p.id === id);
    if (product) {
      try {
        await updateProduct({ ...product, stock: Math.max(0, parseInt(newStock) || 0) });
      } catch (err) {
        console.error('Failed to update stock', err);
      }
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    let emailErr = '';
    let phoneErr = '';
    
    if (!validateEmail(profile.email)) {
      emailErr = 'Please enter a valid email address';
    }
    
    if (!validatePhone(profile.phone)) {
      phoneErr = 'Please enter a valid 10-digit phone number';
    }
    
    if (emailErr || phoneErr) {
      setProfileErrors({ email: emailErr, phone: phoneErr });
      return;
    }
    
    setProfileErrors({ email: '', phone: '' });
    
    try {
      const res = await updateVendorProfile({
        name: profile.name,
        storeName: profile.storeName,
        email: profile.email,
        mobile: profile.phone,
        gstNumber: profile.gstNumber
      });
      
      updateGlobalUser({
        ...currentUser,
        name: res.data.vendor.name,
        companyName: res.data.vendor.storeName,
        storeName: res.data.vendor.storeName,
        email: res.data.vendor.email,
        mobile: res.data.vendor.mobile,
        gstNumber: res.data.vendor.gstNumber
      });
      
      showToast('Profile updated successfully! ✨', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to update profile. Please try again.', 'error');
    }
  };

  const StatCard = ({ title, value, icon: Icon }) => (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
        </div>
        <div className="p-4 bg-indigo-50 rounded-2xl">
          <Icon className="h-7 w-7 text-indigo-600" />
        </div>
      </div>
    </div>
  );



  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-[#f8fafc] -mt-8 -mx-4 sm:-mx-6 lg:-mx-8 relative">
      {/* Real-time Order Toast */}
      {activeToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] w-full max-w-md animate-bounce-in">
          <div className={`text-white rounded-2xl shadow-2xl p-4 flex items-center gap-4 ${
            activeToast.type === 'cancellation' ? 'bg-rose-600 border border-rose-500' : 'bg-indigo-600 border border-indigo-500'
          }`}>
            <div className="bg-white/20 p-3 rounded-xl">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-widest opacity-80">
                {activeToast.type === 'cancellation' ? 'Order Cancelled!' : 'New Order Received!'}
              </p>
              <p className="font-bold text-sm">
                {activeToast.type === 'cancellation' 
                  ? `${activeToast.customer} cancelled order #${activeToast.orderId.slice(-6).toUpperCase()}` 
                  : `${activeToast.customer} just bought ${activeToast.items}`}
              </p>
            </div>
            <button onClick={() => setActiveToast(null)} className="p-1 hover:bg-white/10 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-white border-r border-slate-200 shadow-sm z-10">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <Store className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight truncate max-w-[150px]">{profile.storeName}</span>
          </div>
        </div>
        <nav className="space-y-1 px-4">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
            { id: 'inventory', name: 'Products & Services', icon: Package },
            { id: 'orders', name: 'Orders', icon: ShoppingCart },
            { id: 'feedback', name: 'Customer Reviews', icon: MessageSquare },
            { id: 'profile', name: 'Profile Settings', icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-5 py-4 text-sm font-bold rounded-2xl transition-all ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className={`mr-4 h-5 w-5 ${activeTab === item.id ? 'text-white' : 'text-slate-400'}`} />
              {item.name}
            </button>
          ))}
        </nav>

      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto max-w-7xl">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900">
              {activeTab === 'dashboard' && `Welcome Back, ${profile.name}! ✨`}
              {activeTab === 'inventory' && 'Inventory Management'}
              {activeTab === 'orders' && 'Order Fulfillment'}
              {activeTab === 'feedback' && 'Customer Reviews'}
              {activeTab === 'profile' && 'Vendor Profile'}
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              {activeTab === 'dashboard' && "Here's your business overview for today."}
              {activeTab === 'inventory' && "Manage your products and service listings."}
              {activeTab === 'orders' && "Track and manage customer purchases."}
              {activeTab === 'feedback' && "See what customers are saying about your products and services."}
              {activeTab === 'profile' && "Update your public vendor identity."}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative" ref={notificationPanelRef}>
              <button
                type="button"
                onClick={() => setShowNotifications((open) => !open)}
                className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length > 0 ? notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 border-b border-slate-50 transition-colors ${
                        n.read ? 'bg-white' : 'bg-indigo-50/60 border-l-4 border-l-indigo-500'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                          n.type === 'cancellation' ? 'text-rose-600' :
                          n.type === 'booking' ? 'text-emerald-600' :
                          n.read ? 'text-slate-400' : 'text-indigo-600'
                        }`}>
                          {n.type === 'cancellation' ? 'Cancelled' : 
                           n.type === 'booking' ? 'Booking' :
                           n.read ? 'Order' : 'New Order'}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">{formatNotificationTime(n)}</span>
                      </div>
                      <p className="text-sm font-black text-slate-900 mb-1">
                        {n.type === 'cancellation' ? `${n.customer} cancelled the order` : 
                         n.type === 'booking' ? `${n.customer} booked a service` : 
                         `${n.customer} placed an order`}
                      </p>
                      <p className="text-xs text-slate-500 mb-2 line-clamp-2">{n.items}</p>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-400">#{String(n.orderId).slice(-8)}</span>
                        <span className="text-sm font-black text-green-600">₹{Number(n.total).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!n.read && (
                          <button
                            type="button"
                            onClick={() => markAsRead(n.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" /> Mark as read
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteNotification(n.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors ml-auto"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center text-slate-400 text-sm">No notifications</div>
                  )}
                </div>
              </div>
              )}
            </div>
            <button 
              onClick={openAddItemModal}
              className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 gap-2"
            >
              <Plus className="h-5 w-5" />
              {activeTab === 'inventory' ? (
                inventorySubTab === 'product' ? 'Add Product' : 
                inventorySubTab === 'service' ? 'Add Service' : 'Add Item'
              ) : 'New Listing'}
            </button>
          </div>
        </header>

        {/* Edit/Add Modal */}
        {(editingItem || isAddingItem) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-zoom-in max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-indigo-600 text-white flex-shrink-0">
                <h3 className="text-xl font-black">{isAddingItem ? 'Add New Item' : 'Edit Item'}</h3>
                <button type="button" onClick={closeItemModal} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleSaveItem} className="p-8 space-y-6 overflow-y-auto">
                <div className="space-y-4">
                  {isAddingItem && (
                    <div className="flex gap-4 p-1 bg-slate-50 rounded-2xl">
                      <button 
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, type: 'product', category: 'Electronics' })}
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${editingItem?.type === 'product' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
                      >PRODUCT</button>
                      <button 
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, type: 'service', category: 'Services' })}
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${editingItem?.type === 'service' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
                      >SERVICE</button>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{editingItem?.type === 'service' ? 'Service Name' : 'Product Name'}</label>
                    <input 
                      type="text" 
                      required
                      placeholder={editingItem?.type === 'service' ? "e.g., Home Cleaning" : "e.g., Wireless Headphones"}
                      value={editingItem?.name || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Price (₹)</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        step="0.01"
                        value={editingItem?.originalPriceInput !== undefined ? editingItem.originalPriceInput : (editingItem?.originalPrice || editingItem?.price || '')}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEditingItem({ ...editingItem, originalPriceInput: val });
                        }}
                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Discounted Price (₹)</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. 80 or na"
                        value={editingItem?.discountedPrice !== undefined ? editingItem.discountedPrice : (editingItem?.originalPrice && editingItem?.originalPrice > editingItem?.price ? editingItem.price : 'na')}
                        onChange={(e) => setEditingItem({ ...editingItem, discountedPrice: e.target.value })}
                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" 
                      />
                    </div>
                  </div>

                  {(() => {
                    const orig = parseFloat(
                      editingItem?.originalPriceInput !== undefined 
                        ? editingItem.originalPriceInput 
                        : (editingItem?.originalPrice || editingItem?.price || 0)
                    );
                    const discInput = editingItem?.discountedPrice !== undefined
                      ? editingItem.discountedPrice
                      : (editingItem?.originalPrice && editingItem?.originalPrice > editingItem?.price ? editingItem.price : 'na');
                    const isNa = !discInput || discInput.toString().trim().toLowerCase() === 'na' || parseFloat(discInput) === 0;
                    const disc = parseFloat(discInput);
                    if (!isNa && orig > 0 && disc > 0 && disc < orig) {
                      const pct = Math.round(((orig - disc) / orig) * 100);
                      return (
                        <div className="px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-black flex items-center gap-1.5 border border-emerald-100 uppercase tracking-wide">
                          🔥 Calculated Discount: {pct}% off
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {editingItem?.type !== 'service' && (
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                      <select 
                        required
                        value={editingItem?.category || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all"
                      >
                        {['Electronics', 'Fashion', 'Home & Living', 'Beauty', 'Toys', 'Sports', 'Automotive', 'Groceries'].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      {editingItem?.type === 'service' ? 'Service Image' : 'Product Image'}
                    </label>
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4">
                      {(imagePreview || editingItem?.image) ? (
                        <div className="space-y-3">
                          <img
                            src={imagePreview || editingItem.image}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-xl border border-slate-200"
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => imageInputRef.current?.click()}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <Upload className="h-4 w-4" />
                              Change Image
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                resetImageSelection();
                                setEditingItem({ ...editingItem, image: '' });
                              }}
                              className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="w-full flex flex-col items-center justify-center gap-3 py-10 text-slate-500 hover:text-indigo-600 transition-colors"
                        >
                          <div className="p-4 bg-white rounded-2xl shadow-sm">
                            <ImagePlus className="h-8 w-8 text-indigo-500" />
                          </div>
                          <span className="text-sm font-bold">Click to upload image</span>
                          <span className="text-xs text-slate-400">JPG, PNG, WEBP or GIF · Max 5MB</span>
                        </button>
                      )}
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Rating</label>
                      <input 
                        type="number" 
                        required
                        min="0" max="5" step="0.1"
                        value={editingItem?.rating || 4.5}
                        onChange={(e) => setEditingItem({ ...editingItem, rating: parseFloat(e.target.value) })}
                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Reviews</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={editingItem?.reviews !== undefined ? editingItem.reviews : ''}
                        onChange={(e) => setEditingItem({ ...editingItem, reviews: e.target.value === '' ? '' : parseInt(e.target.value) })}
                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" 
                      />
                    </div>
                  </div>
                  {editingItem?.type === 'product' && ['fashion', 'clothing', 'footwear', 'apparel', 'shoes'].some(c => editingItem?.category?.toLowerCase().includes(c)) && (
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Available Sizes (Comma separated)</label>
                      <input 
                        type="text" 
                        required
                        placeholder="S, M, L, XL or 8, 9, 10"
                        value={Array.isArray(editingItem?.sizes) ? editingItem.sizes.join(', ') : editingItem?.sizes || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, sizes: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '') })}
                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" 
                      />
                    </div>
                  )}
                  {editingItem?.type === 'product' && (
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Stock Level</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={editingItem?.stock || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, stock: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" 
                      />
                    </div>
                  )}
                  {editingItem?.type === 'service' && (
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Service Status</label>
                      <select 
                        required
                        value={editingItem?.isActive !== false ? 'active' : 'inactive'}
                        onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.value === 'active' })}
                        className={`w-full px-5 py-3 border rounded-xl font-bold transition-all focus:ring-2 ${
                          editingItem?.isActive !== false
                            ? 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-500'
                            : 'bg-red-50 border-red-200 text-red-700 focus:ring-red-500'
                        }`}
                      >
                        <option value="active" className="text-emerald-700 font-bold">Active</option>
                        <option value="inactive" className="text-red-600 font-bold">Inactive</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                    <textarea 
                      rows="3"
                      required
                      value={editingItem?.description || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                      className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all"
                    ></textarea>
                  </div>
                </div>
                <div className="flex gap-4 pt-4 flex-shrink-0">
                  <button type="button" onClick={closeItemModal} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all">CANCEL</button>
                  <button type="submit" disabled={savingItem} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                    {savingItem ? (
                      <>
                        <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
                        SAVING...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" /> SAVE CHANGES
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="space-y-8">
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <StatCard title="Total Revenue" value={stats.revenue} icon={IndianRupee} />
                <StatCard title="Orders" value={stats.orders} icon={ShoppingCart} />
                <StatCard title="Visitors" value={stats.visitors} icon={Users} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-slate-900">Daily Revenue Analysis</h3>
                    <select 
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="bg-slate-50 border-none rounded-lg text-xs font-bold px-3 py-2 text-slate-500 focus:ring-0"
                    >
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                        <option key={m} value={i}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="h-72 flex items-end justify-between px-2 gap-1 sm:gap-2">
                    {stats.chartData.map((data, i) => {
                      const scaledHeight = (data.revenue / stats.maxDailyRevenue) * 90 + 5; 
                      return (
                        <div key={i} className="flex-1 bg-slate-100/30 h-full rounded-t-lg relative group">
                          <div 
                            className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-700 ${data.revenue > 0 ? 'bg-indigo-500 group-hover:bg-indigo-600 shadow-md' : 'bg-slate-200 opacity-20'}`} 
                            style={{ height: `${scaledHeight}%`, transitionDelay: `${i * 20}ms` }}
                          ></div>
                          <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap shadow-2xl border border-slate-700">
                            <p className="text-indigo-400 mb-1">{data.day} {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][selectedMonth]}</p>
                            <p>Products: ₹{data.productRev.toLocaleString('en-IN')}</p>
                            <p>Services: ₹{data.serviceRev.toLocaleString('en-IN')}</p>
                            <div className="mt-1 pt-1 border-t border-slate-700 text-emerald-400">Total: ₹{data.revenue.toLocaleString('en-IN')}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-6 px-1 text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Day 1</span>
                    <span>Day {Math.floor(stats.chartData.length / 2)}</span>
                    <span>Day {stats.chartData.length}</span>
                  </div>
                </div>


              </div>
            </>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Stock & Availability</h3>
                  <p className="text-sm font-medium text-slate-400 mt-1">Update quantities for your active listings.</p>
                </div>
                <div className="flex p-1 bg-slate-100 rounded-xl">
                  {['all', 'product', 'service'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setInventorySubTab(type)}
                      className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                        inventorySubTab === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <th className="px-8 py-5">Item Details</th>
                      <th className="px-8 py-5 whitespace-nowrap">ID</th>
                      <th className="px-8 py-5">Price</th>
                      <th className="px-8 py-5">Discounted Price</th>
                      <th className="px-8 py-5">Stock Level</th>
                      <th className="px-8 py-5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {inventory.map(item => (
                      <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center">
                            <div className={`h-12 w-12 rounded-2xl mr-4 flex items-center justify-center ${item.type === 'product' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {item.type === 'product' ? <Package className="h-6 w-6" /> : <Briefcase className="h-6 w-6" />}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{item.name}</p>
                              <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">{item.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md whitespace-nowrap">{item.sku}</span>
                        </td>
                        <td className="px-8 py-6 text-sm font-black text-slate-900 whitespace-nowrap">
                          ₹{Number((item.originalPrice && item.originalPrice > item.price) ? item.originalPrice : (item.price || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-8 py-6 text-sm font-bold text-slate-500 whitespace-nowrap">
                          {(() => {
                            if (item.originalPrice && item.originalPrice > item.price) {
                              const pct = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
                              return (
                                <div className="flex flex-col">
                                  <span className="font-black text-emerald-600">₹{Number(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  <span className="text-[10px] font-black uppercase text-emerald-500 mt-0.5">{pct}% OFF</span>
                                </div>
                              );
                            }
                            return <span className="text-slate-400 text-xs italic font-medium">na</span>;
                          })()}
                        </td>
                        <td className="px-8 py-6">
                          {item.type === 'product' ? (
                            <div className="flex items-center gap-3">
                              <input 
                                type="number" 
                                value={item.stock}
                                onChange={(e) => handleUpdateStock(item.id, e.target.value)}
                                className="w-20 px-3 py-2 bg-slate-50 border-none rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all"
                              />
                              <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${item.stock > 10 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(item.stock * 2, 100)}%` }}></div>
                              </div>
                            </div>
                          ) : (
                            <select
                              value={item.isActive !== false ? 'active' : 'inactive'}
                              onChange={async (e) => {
                                const newStatus = e.target.value === 'active';
                                try {
                                  await updateService({ ...item, isActive: newStatus });
                                } catch (err) {
                                  setActiveToast({
                                    id: `service-err-${Date.now()}`,
                                    type: 'error',
                                    message: 'Failed to update service status',
                                    customer: 'System',
                                    items: 'Update error',
                                    total: 0
                                  });
                                  setTimeout(() => setActiveToast(null), 3000);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase cursor-pointer border focus:ring-2 outline-none transition-all ${
                                item.isActive !== false 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500' 
                                  : 'bg-red-50 text-red-600 border-red-200 focus:ring-red-500'
                              }`}
                            >
                              <option value="active" className="bg-white text-emerald-700 font-bold">Active</option>
                              <option value="inactive" className="bg-white text-red-600 font-bold">Inactive</option>
                            </select>
                          )}
                        </td>
                        <td className="px-8 py-6 flex gap-2">
                          <button 
                            onClick={() => {
                              resetImageSelection();
                              setIsAddingItem(false);
                              setEditingItem(item);
                            }}
                            className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            disabled={deletingId === item.id}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingId === item.id ? (
                              <span className="h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin inline-block"></span>
                            ) : (
                              <Trash2 className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-8">
              {/* Product Sales Section */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Product Sales</h3>
                    <p className="text-sm font-medium text-slate-400 mt-1">Manage physical product orders.</p>
                  </div>
                  <span className="px-4 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">{stats.vendorOrders.length} Orders</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        <th className="px-8 py-5">Order ID</th>
                        <th className="px-8 py-5">Item Details</th>
                        <th className="px-8 py-5">Status</th>
                        <th className="px-8 py-5">Revenue</th>
                        <th className="px-8 py-5">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {stats.vendorOrders.length > 0 ? stats.vendorOrders.map(order => {
                        const vendorItems = order.items;
                        const vendorTotal = Number(order.total) || vendorItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
                        
                        return (
                          <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-6 text-sm font-black text-indigo-600 tracking-tight">{order.orderNumber || String(order.id).slice(-8).toUpperCase()}</td>
                            <td className="px-8 py-6">
                              <p className="font-bold text-slate-900">{vendorItems[0]?.name || 'Direct Sale'}</p>
                              <p className="text-xs font-medium text-slate-400">{vendorItems.length} item(s) · {order.customer}</p>
                              {String(order.status).toLowerCase() === 'cancelled' && (order.paymentMethod === 'upi' || order.paymentMethod === 'cc' || order.paymentMethod === 'credit_card') && (
                                <p className="text-[11px] font-bold text-rose-600 mt-1">
                                  Payment will be refunded in 2-3 business days
                                </p>
                              )}
                              </td>
                            <td className="px-8 py-6">
                              <select
                                value={order.status || 'processing'}
                                onChange={(e) => {
                                  const nextStatus = e.target.value;
                                  if (nextStatus === 'cancelled') {
                                    setCancelOrderModal(order);
                                  } else {
                                    handleUpdateOrderStatus(order.id, nextStatus);
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                                  order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                                  order.status === 'shipped' ? 'bg-indigo-100 text-indigo-700' :
                                  order.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                                  'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                                  <option key={status} value={status} className="bg-white text-slate-900 text-xs font-bold lowercase">
                                    {status}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-8 py-6 text-sm font-black text-slate-900">₹{(order.total ?? vendorTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="px-8 py-6 text-sm font-medium text-slate-500">{order.date}</td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-medium italic">No product sales yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Service Bookings Section */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Service Bookings</h3>
                    <p className="text-sm font-medium text-slate-400 mt-1">Track and fulfill service requests.</p>
                  </div>
                  <span className="px-4 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold">{stats.vendorBookings.length} Bookings</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        <th className="px-8 py-5">Booking ID</th>
                        <th className="px-8 py-5">Service Details</th>
                        <th className="px-8 py-5">Status</th>
                        <th className="px-8 py-5">Rate</th>
                        <th className="px-8 py-5">Schedule</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {stats.vendorBookings.length > 0 ? stats.vendorBookings.map(booking => (
                        <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-6 text-sm font-black text-emerald-600 tracking-tight">{booking.id}</td>
                          <td className="px-8 py-6">
                            <p className="font-bold text-slate-900">{booking.name}</p>
                            <p className="text-xs font-medium text-slate-400">
                              Customer: {booking.customer || 'Guest'}
                              {booking.status !== 'Completed' && booking.status !== 'Cancelled' && ` · Technician: ${booking.technician}`}
                            </p>
                            {String(booking.status).toLowerCase() === 'cancelled' && (booking.paymentMethod === 'upi' || booking.paymentMethod === 'cc' || booking.paymentMethod === 'credit_card') && (
                              <p className="text-[11px] font-bold text-rose-600 mt-1">
                                Payment will be refunded in 2-3 business days
                              </p>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                              booking.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 
                              booking.status === 'Confirmed' ? 'bg-indigo-100 text-indigo-700' : 
                              booking.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-sm font-black text-slate-900">₹{Number(booking.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-8 py-6 text-sm font-medium text-slate-500">
                            {booking.date}
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{booking.slot}</p>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-2">
                              {booking.status === 'Pending' && (
                                <button 
                                  onClick={() => updateServiceBookingStatus(booking.id, 'Confirmed')}
                                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-indigo-700 transition-colors"
                                >
                                  Confirm
                                </button>
                              )}
                              {booking.status === 'Confirmed' && (
                                <button 
                                  onClick={() => updateServiceBookingStatus(booking.id, 'Completed')}
                                  disabled={!isServiceSlotPassed(booking.date, booking.slot)}
                                  title={!isServiceSlotPassed(booking.date, booking.slot) ? "Cannot mark complete before slot ends" : "Mark service booking as complete"}
                                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Mark Complete
                                </button>
                              )}
                              {(booking.status === 'Completed') && (
                                <span className="text-[10px] font-black text-emerald-600 uppercase">Fulfilled ✨</span>
                              )}
                              {(booking.status === 'Cancelled') && (
                                <span className="text-[10px] font-black text-rose-600 uppercase">Cancelled ❌</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-medium italic">No service bookings yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Tab */}
          {activeTab === 'feedback' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Customer Feedback & Reviews</h3>
                <p className="text-sm font-medium text-slate-400 mt-1">See what customers are saying about your products and services.</p>
              </div>

              {/* Feedbacks Grid */}
              {(() => {
                const productFeedbacks = vendorOrders
                  .filter(order => order.feedback && order.feedback.rating)
                  .map(order => ({
                    id: order.id,
                    type: 'product',
                    itemName: order.items[0]?.name || 'Product',
                    customer: order.customer,
                    rating: order.feedback.rating,
                    comment: order.feedback.comment,
                    date: order.date
                  }));

                const serviceFeedbacks = serviceBookings
                  .filter(booking => booking.feedback && booking.feedback.rating)
                  .map(booking => ({
                    id: booking.id,
                    type: 'service',
                    itemName: booking.name,
                    customer: booking.customer || 'Guest',
                    rating: booking.feedback.rating,
                    comment: booking.feedback.comment,
                    date: booking.date
                  }));

                const feedbacks = [...productFeedbacks, ...serviceFeedbacks].sort((a, b) => new Date(b.date) - new Date(a.date));

                if (feedbacks.length === 0) {
                  return (
                    <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm">
                      <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="h-8 w-8" />
                      </div>
                      <h4 className="text-lg font-bold text-slate-955 mb-1">No Reviews Yet</h4>
                      <p className="text-slate-400 font-medium max-w-sm mx-auto">When customers rate and review their purchases, they will appear here.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {feedbacks.map((item) => (
                      <div key={item.id} className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              item.type === 'product' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100/50' : 'bg-emerald-50 text-emerald-600 border border-emerald-100/50'
                            }`}>
                              {item.type}
                            </span>
                            <span className="text-xs font-medium text-slate-400">{item.date}</span>
                          </div>

                          <h4 className="font-bold text-slate-900 text-base mb-1 truncate max-w-xs">{item.itemName}</h4>
                          <p className="text-xs text-slate-500 font-medium mb-4">By: {item.customer}</p>

                          <div className="flex gap-0.5 mb-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= item.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                          
                          {item.comment && (
                            <p className="text-sm font-medium italic text-slate-700 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 leading-relaxed">
                              "{item.comment}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-10 max-w-3xl">
              <div className="flex items-center gap-6 mb-12">
                <div className="relative group">
                  <div className="h-24 w-24 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-105">
                    <Store className="h-12 w-12" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">{profile.storeName}</h3>
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-1">Verified Vendor Account</p>
                </div>
              </div>

              <form className="space-y-8" onSubmit={handleSaveProfile}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Full Legal Name</label>
                    <input 
                      type="text" 
                      required
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Public Store Name</label>
                    <input 
                      type="text" 
                      required
                      value={profile.storeName}
                      onChange={(e) => setProfile({...profile, storeName: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Business Email</label>
                    <input 
                      type="email" 
                      required
                      value={profile.email}
                      onChange={(e) => handleProfileEmailChange(e.target.value)}
                      className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-slate-900 focus:ring-2 transition-all ${
                        profileErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-none focus:ring-indigo-500'
                      }`}
                    />
                    {profileErrors.email && (
                      <p className="text-red-500 text-xs font-bold mt-2 ml-1">{profileErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Support Phone</label>
                    <input 
                      type="tel" 
                      value={profile.phone}
                      onChange={(e) => handleProfilePhoneChange(e.target.value)}
                      className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold text-slate-900 focus:ring-2 transition-all ${
                        profileErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-none focus:ring-indigo-500'
                      }`}
                    />
                    {profileErrors.phone && (
                      <p className="text-red-500 text-xs font-bold mt-2 ml-1">{profileErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">GST Number</label>
                    <input 
                      type="text" 
                      value={profile.gstNumber || ''}
                      onChange={(e) => setProfile({...profile, gstNumber: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" 
                      placeholder="Enter GST Number"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">About the Store</label>
                  <textarea 
                    rows="5" 
                    value={profile.description}
                    onChange={(e) => setProfile({...profile, description: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all"
                  ></textarea>
                </div>
                <div className="flex justify-between items-center pt-4">
                   <button 
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center px-10 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black hover:bg-rose-100 transition-all gap-3"
                  >
                    <LogOut className="h-5 w-5" />
                    LOGOUT
                  </button>
                  <button className="flex items-center px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all gap-3">
                    <Save className="h-5 w-5" />
                    SAVE PROFILE
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </main>

      {/* Cancel Order Confirmation Modal */}
      {cancelOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-scale-up">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Cancel Order</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to cancel order <span className="font-semibold text-slate-900">#{cancelOrderModal.orderNumber || String(cancelOrderModal.id).slice(-8).toUpperCase()}</span>? This will restock the products and refund the payment if paid online.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setCancelOrderModal(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                No, Keep Order
              </button>
              <button
                onClick={async () => {
                  const target = cancelOrderModal;
                  setCancelOrderModal(null);
                  await handleUpdateOrderStatus(target.id, 'cancelled');
                }}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors"
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Modal */}
      {deleteItemModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-scale-up">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Item</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete <span className="font-semibold text-slate-900">{deleteItemModal.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteItemModal(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const target = deleteItemModal;
                  setDeleteItemModal(null);
                  try {
                    if (target.type === 'product') {
                      await deleteProduct(target.id);
                    } else {
                      await deleteService(target.id);
                    }
                    showToast('Item deleted successfully.', 'success');
                  } catch (err) {
                    console.error('Failed to delete item', err);
                    showToast('Failed to delete item.', 'error');
                  }
                }}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default VendorDashboard;