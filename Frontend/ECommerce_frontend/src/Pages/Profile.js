import React, { useState } from 'react';
import { Download, Package, Wrench, User, LogOut, ChevronDown, ChevronUp, MessageSquare, Star, X } from 'lucide-react';
import { useAppContext } from '../Context/AppContext';
import { useNavigate } from 'react-router-dom';

const isDelivered = (status) => String(status || '').toLowerCase() === 'delivered';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [feedbackOrder, setFeedbackOrder] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  
  // Pagination states
  const [ordersPage, setOrdersPage] = useState(1);
  const [servicesPage, setServicesPage] = useState(1);
  const ITEMS_PER_PAGE = 3;

  const { user, logout, serviceBookings, orders, submitOrderFeedback } = useAppContext();
  const navigate = useNavigate();

  const downloadInvoice = (id) => {
    alert(`Downloading invoice for ${id}...`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleOrder = (id) => {
    if (expandedOrder === id) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(id);
    }
  };

  const openFeedbackModal = (order, e) => {
    e.stopPropagation();
    setFeedbackOrder(order);
    setFeedbackRating(5);
    setFeedbackComment('');
  };

  const closeFeedbackModal = () => {
    setFeedbackOrder(null);
    setFeedbackRating(5);
    setFeedbackComment('');
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackOrder) return;

    setSubmittingFeedback(true);
    const result = await submitOrderFeedback(feedbackOrder.id, {
      rating: feedbackRating,
      comment: feedbackComment,
    });
    setSubmittingFeedback(false);

    if (result.success) {
      alert('Thank you for your feedback!');
      closeFeedbackModal();
    } else {
      alert(result.error || 'Failed to submit feedback');
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-4">Please log in to view your profile</h2>
        <button onClick={() => navigate('/login')} className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold">Log In</button>
      </div>
    );
  }

  // Calculate paginated data
  const totalOrderPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const paginatedOrders = orders.slice((ordersPage - 1) * ITEMS_PER_PAGE, ordersPage * ITEMS_PER_PAGE);

  const totalServicePages = Math.ceil(serviceBookings.length / ITEMS_PER_PAGE);
  const paginatedServices = serviceBookings.slice((servicesPage - 1) * ITEMS_PER_PAGE, servicesPage * ITEMS_PER_PAGE);

  return (
    <div className="max-w-5xl mx-auto mt-8">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-indigo-900 px-8 py-12 text-white flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <User className="h-12 w-12 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{user.name}</h1>
              <p className="text-indigo-200 mt-1">{user.email || 'user@example.com'} | {user.mobile || '+1 234 567 8900'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition-colors">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b px-8 bg-gray-50/50">
          <button
            onClick={() => { setActiveTab('orders'); setExpandedOrder(null); }}
            className={`py-4 px-6 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'orders' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Package className="h-5 w-5" /> Order History
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`py-4 px-6 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'services' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Wrench className="h-5 w-5" /> Service History
          </button>
        </div>
          {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex justify-between items-center">
                Your Orders
                <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Total: {orders.length}</span>
              </h2>
              {orders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">You have no past orders.</p>
              ) : (
                <>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {paginatedOrders.map((order) => (
                      <div key={order.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        <div 
                          onClick={() => toggleOrder(order.id)} 
                          className="p-6 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <div className="mb-4 sm:mb-0 flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-bold text-gray-900">{order.id}</span>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide capitalize ${
                                isDelivered(order.status) ? 'bg-green-100 text-green-700' :
                                order.status === 'cancelled' || order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                order.status === 'shipped' || order.status === 'Shipped' ? 'bg-indigo-100 text-indigo-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-gray-500 text-sm">Placed on {order.date} • {order.itemsCount} Items</p>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap justify-end">
                            <span className="text-xl font-bold text-gray-900">₹{order.total.toFixed(2)}</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); downloadInvoice(order.id); }}
                              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-full transition-colors"
                            >
                              <Download className="h-4 w-4" /> Invoice
                            </button>
                            {isDelivered(order.status) && !order.feedback && (
                              <button
                                onClick={(e) => openFeedbackModal(order, e)}
                                className="flex items-center gap-2 text-teal-700 hover:text-teal-900 font-medium bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-full transition-colors"
                              >
                                <MessageSquare className="h-4 w-4" /> Give Feedback
                              </button>
                            )}
                            {expandedOrder === order.id ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                          </div>
                        </div>
                        
                        {expandedOrder === order.id && (
                          <div className="px-6 pb-6 pt-2 bg-gray-50 border-t border-gray-100">
                            <h4 className="font-semibold text-gray-900 mb-3">Order Items:</h4>
                            <ul className="space-y-3">
                              {order.items.map((item, idx) => (
                                <li key={idx} className="flex justify-between items-center text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-gray-200 text-gray-700 rounded text-xs px-2 py-1 font-medium">{item.qty}x</span>
                                    <span className="text-gray-700">{item.name} {item.size ? `(Size: ${item.size})` : ''}</span>
                                  </div>
                                  <span className="font-medium text-gray-900">₹{(item.price * item.qty).toFixed(2)}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between font-bold text-gray-900">
                              <span>Total:</span>
                              <span>₹{order.total.toFixed(2)}</span>
                            </div>
                            {order.feedback && (
                              <div className="mt-4 p-4 bg-teal-50 rounded-xl border border-teal-100">
                                <p className="text-sm font-bold text-teal-800 mb-2">Your Feedback</p>
                                <div className="flex items-center gap-1 mb-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-4 w-4 ${
                                        star <= order.feedback.rating
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                {order.feedback.comment && (
                                  <p className="text-sm text-gray-700">{order.feedback.comment}</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                   {/* Pagination Controls */}
                  {totalOrderPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <button 
                        onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                        disabled={ordersPage === 1}
                        className="px-4 py-2 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-sm font-medium text-gray-600 mx-2">
                        Page {ordersPage} of {totalOrderPages}
                      </span>
                      <button 
                        onClick={() => setOrdersPage(p => Math.min(totalOrderPages, p + 1))}
                        disabled={ordersPage === totalOrderPages}
                        className="px-4 py-2 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'services' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex justify-between items-center">
                Service Requests
                <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Total: {serviceBookings.length}</span>
              </h2>
              {serviceBookings.length === 0 ? (
                <p className="text-gray-500 text-center py-8">You have no booked services.</p>
              ) : (
                <>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {paginatedServices.map((service) => (
                      <div key={service.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="mb-4 sm:mb-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold text-gray-900">{service.name}</span>
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold tracking-wide">{service.status}</span>
                          </div>
                          <p className="text-gray-500 text-sm">Date: {service.date} ({service.slot}) • Tech: {service.technician}</p>
                        </div>
                        <div className="flex items-center gap-6">
                           <span className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">ID: {service.id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalServicePages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <button 
                        onClick={() => setServicesPage(p => Math.max(1, p - 1))}
                        disabled={servicesPage === 1}
                        className="px-4 py-2 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-sm font-medium text-gray-600 mx-2">
                        Page {servicesPage} of {totalServicePages}
                      </span>
                      <button 
                        onClick={() => setServicesPage(p => Math.min(totalServicePages, p + 1))}
                        disabled={servicesPage === totalServicePages}
                        className="px-4 py-2 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {feedbackOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md relative shadow-xl">
            <button
              type="button"
              onClick={closeFeedbackModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">Rate Your Order</h3>
            <p className="text-sm text-gray-500 mb-6">Order #{String(feedbackOrder.id).slice(-8)}</p>

            <form onSubmit={handleSubmitFeedback} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= feedbackRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                            </div>
              </div>
              <div>
                <label htmlFor="feedback-comment" className="block text-sm font-semibold text-gray-700 mb-2">
                  Comments (optional)
                </label>
                <textarea
                  id="feedback-comment"
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Tell us about your delivery experience..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={submittingFeedback}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;