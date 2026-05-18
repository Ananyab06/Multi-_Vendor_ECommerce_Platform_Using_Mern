import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard,Package,ShoppingCart,User,Settings,Bell, Plus,TrendingUp,TrendingDown,DollarSign, 
  Users,Activity,Edit2,Save,CheckCircle,X,Briefcase,Store,ChevronRight,LogOut,ShoppingBag,Trash2,Upload,ImagePlus
} from 'lucide-react';
import { useAppContext } from '../Context/AppContext';
import { useNavigate } from 'react-router-dom';
import { getVendorOrders, uploadImage } from '../api';

const VendorDashboard = () => {
  const { 
    orders: globalOrders, 
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
    setUser: updateGlobalUser
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
        date: new Date(order.createdAt).toISOString().split('T')[0],
        items: (order.vendorItems || order.items).map((item) => ({
          id: item.productId?._id || item.productId,
          name: item.name,
          price: item.price,
          qty: item.qty,
          size: item.size,
          vendor: item.vendor,
          vendorId: item.vendorId,
        })),
        total: order.vendorOrderTotal ?? order.totalAmount,
        status: order.status,
        customer: order.userId?.name || 'Unknown Customer',
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

  const [activeTab, setActiveTab] = useState('dashboard');
  const [inventorySubTab, setInventorySubTab] = useState('all'); // 'all', 'product', 'service'
  const [notifications, setNotifications] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const imageInputRef = useRef(null);
  const [activeToast, setActiveToast] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11

  const prevOrdersCount = useRef(globalOrders.length);

  // Vendor Profile
  const [profile, setProfile] = useState({
    name: currentUser?.name || '',
    storeName: currentUser?.companyName || currentUser?.storeName || 'My Store',
    email: currentUser?.email || '',
    phone: currentUser?.mobile || '',
    description: 'Premium electronics and professional tech services.'
  });

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

    const productRevenue =
      vendorStats.totalRevenue > 0
        ? vendorStats.totalRevenue
        : vendorProductOrders.reduce(
            (sum, order) => sum + (Number(order.total) || 0),
            0
          );

    const vendorBookings = serviceBookings;
    const serviceRevenue = vendorBookings.reduce((sum, booking) => sum + (Number(booking.price) || 0), 0);

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
        .filter((order) => order.date === dateStr)
        .reduce((sum, order) => sum + (Number(order.total) || 0), 0);

      // Get service revenue for this day
      const dailyServiceRevenue = vendorBookings
        .filter(booking => booking.date === dateStr)
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
      revenue: `₹${revenue.toLocaleString()}`,
      orders: (vendorStats.orderCount || vendorProductOrders.length + vendorBookings.length).toLocaleString(),
      visitors: visitors.toLocaleString(),
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

  // Integration with AppContext Orders (Real-time Notification)
  useEffect(() => {
    if (globalOrders.length > prevOrdersCount.current) {
      const newOrder = globalOrders[0];
      const vendorName = profile.storeName?.toLowerCase().trim();
      const hasVendorItems = newOrder.items.some(item => 
        item.vendor?.toLowerCase().trim() === vendorName || products.some(p => p.name === item.name && p.vendor?.toLowerCase().trim() === vendorName)
      );

      if (hasVendorItems) {
        const vendorItems = newOrder.items.filter(item => 
          item.vendor?.toLowerCase().trim() === vendorName || products.some(p => p.name === item.name && p.vendor?.toLowerCase().trim() === vendorName)
        );
        const vendorTotal = vendorItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

        const newNotification = {
          id: Date.now(),
          type: 'order',
          orderId: newOrder.id,
          customer: newOrder.customer?.name || 'Customer',
          items: vendorItems.map(i => `${i.qty}x ${i.name}`).join(', '),
          total: vendorTotal,
          time: 'Just now'
        };

        setNotifications(prev => [newNotification, ...prev].slice(0, 10));
        setActiveToast(newNotification);
        setTimeout(() => setActiveToast(null), 5000); // Hide toast after 5s
      }
    }
    prevOrdersCount.current = globalOrders.length;
  }, [globalOrders, profile.storeName, products]);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
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
      alert('Please upload a JPG, PNG, WEBP, or GIF image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB.');
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

    const hasImage = Boolean(imageFile || itemData.image);
    if (!hasImage) {
      alert('Please upload an image for this listing.');
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
            reviews: itemData.reviews || 0,
            sizes: itemData.sizes || [],
            image: imageUrl,
            vendor: profile.storeName
          });
        } else {
          await addService({
            ...itemData,
            rating: itemData.rating || 4.8,
            reviews: itemData.reviews || 0,
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
      alert(err.response?.data?.message || 'Failed to save item. Please try again.');
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
      stock: 0,
      category: inventorySubTab === 'service' ? 'Services' : 'Electronics',
      description: '',
      image: '',
      rating: 4.5,
      reviews: 0
    });
    setIsAddingItem(true);
  };

  const handleDeleteItem = async (item) => {
    if (window.confirm(`Are you sure you want to delete ${item.name}?`)) {
      setDeletingId(item.id);
      try {
        if (item.type === 'product') {
          await deleteProduct(item.id);
        } else {
          await deleteService(item.id);
        }
      } catch (err) {
        console.error('Failed to delete item', err);
      } finally {
        setDeletingId(null);
      }
    }
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

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateGlobalUser({
      ...currentUser,
      name: profile.name,
      companyName: profile.storeName,
      email: profile.email,
      mobile: profile.phone
    });
    alert('Profile updated successfully! ✨');
  };

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, isPositive }) => (
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
      <div className="mt-4 flex items-center">
        <div className={`flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
          {trendValue}
        </div>
        <span className="text-sm text-gray-400 ml-2 font-medium">{trend}</span>
      </div>
    </div>
  );



  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-[#f8fafc] -mt-8 -mx-4 sm:-mx-6 lg:-mx-8 relative">
      {/* Real-time Order Toast */}
      {activeToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] w-full max-w-md animate-bounce-in">
          <div className="bg-indigo-600 text-white rounded-2xl shadow-2xl p-4 border border-indigo-500 flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-widest opacity-80">New Order Received!</p>
              <p className="font-bold text-sm">{activeToast.customer} just bought {activeToast.items}</p>
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
              {activeTab === 'profile' && 'Vendor Profile'}
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              {activeTab === 'dashboard' && "Here's your business overview for today."}
              {activeTab === 'inventory' && "Manage your products and service listings."}
              {activeTab === 'orders' && "Track and manage customer purchases."}
              {activeTab === 'profile' && "Update your public vendor identity."}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
                <Bell className="h-6 w-6" />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 h-3 w-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </button>
              {/* Notification Dropdown Simulation */}
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all transform origin-top-right z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-50 font-bold text-slate-900">Notifications</div>
                <div className="max-h-60 overflow-y-auto">
                  {notifications.length > 0 ? notifications.map(n => (
                    <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">New Order</span>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-sm font-black text-slate-900 mb-1">{n.customer} placed an order</p>
                      <p className="text-xs text-slate-500 mb-2 line-clamp-1">{n.items}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400">#{n.orderId}</span>
                        <span className="text-sm font-black text-green-600">₹{n.total.toFixed(2)}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center text-slate-400 text-sm">No new alerts</div>
                  )}
                </div>
              </div>
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
                  <div className={`grid ${editingItem?.type === 'service' ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Price (₹)</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        step="0.01"
                        value={editingItem?.price || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-5 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" 
                      />
                    </div>
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
                  </div>
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
                        value={editingItem?.reviews || 0}
                        onChange={(e) => setEditingItem({ ...editingItem, reviews: parseInt(e.target.value) })}
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

        {/* Success Toast for Orders */}
        <div className="fixed bottom-8 right-8 z-50 space-y-3">
          {notifications.map(note => (
            <div key={note.id} className="bg-slate-900 text-white p-5 rounded-2xl shadow-2xl flex items-start gap-4 w-96 animate-fade-in-up border border-slate-800">
              <div className="p-2 bg-indigo-600 rounded-xl">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black">Incoming Order!</p>
                <p className="text-sm text-slate-300 mt-1">{note.message}</p>
              </div>
              <button onClick={() => removeNotification(note.id)} className="text-slate-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard title="Total Revenue" value={stats.revenue} icon={DollarSign} trend="vs last month" trendValue={stats.revenueTrend} isPositive={true} />
                <StatCard title="Orders" value={stats.orders} icon={ShoppingCart} trend="vs last month" trendValue={stats.ordersTrend} isPositive={true} />
                <StatCard title="Visitors" value={stats.visitors} icon={Users} trend="vs last month" trendValue={stats.visitorsTrend} isPositive={true} />
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
                            <p>Products: ₹{data.productRev.toFixed(0)}</p>
                            <p>Services: ₹{data.serviceRev.toFixed(0)}</p>
                            <div className="mt-1 pt-1 border-t border-slate-700 text-emerald-400">Total: ₹{data.revenue.toFixed(0)}</div>
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
                      <th className="px-8 py-5">SKU / ID</th>
                      <th className="px-8 py-5">Price</th>
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
                        <td className="px-8 py-6">
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{item.sku}</span>
                        </td>
                        <td className="px-8 py-6 text-sm font-black text-slate-900">
                          {item.type === 'service' ? 'From ' : ''}₹{Number(item.price || 0).toFixed(2)}
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
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase">Service Active</span>
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
                            <td className="px-8 py-6 text-sm font-black text-indigo-600 tracking-tight">{String(order.id).slice(-8).toUpperCase()}</td>
                            <td className="px-8 py-6">
                              <p className="font-bold text-slate-900">{vendorItems[0]?.name || 'Direct Sale'}</p>
                              <p className="text-xs font-medium text-slate-400">{vendorItems.length} item(s) · {order.customer}</p>
                            </td>
                            <td className="px-8 py-6">
                              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase capitalize">{order.status || 'processing'}</span>
                            </td>
                            <td className="px-8 py-6 text-sm font-black text-slate-900">₹{(order.total ?? vendorTotal).toFixed(2)}</td>
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
                            {booking.status !== 'Completed' && (
                              <p className="text-xs font-medium text-slate-400">Technician: {booking.technician}</p>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                              booking.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 
                              booking.status === 'Confirmed' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-sm font-black text-slate-900">₹{Number(booking.price || 0).toFixed(2)}</td>
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
                                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-emerald-700 transition-colors"
                                >
                                  Mark Complete
                                </button>
                              )}
                              {(booking.status === 'Completed') && (
                                <span className="text-[10px] font-black text-emerald-600 uppercase">Fulfilled ✨</span>
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

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-10 max-w-3xl">
              <div className="flex items-center gap-6 mb-12">
                <div className="relative group">
                  <div className="h-24 w-24 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-105">
                    <Store className="h-12 w-12" />
                  </div>
                  <button className="absolute -bottom-2 -right-2 p-2 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-indigo-600 transition-colors">
                    <Edit2 className="h-4 w-4" />
                  </button>
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
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Support Phone</label>
                    <input 
                      type="tel" 
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" 
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
    </div>
  );
};

export default VendorDashboard;







// *********************** VendorLogin 