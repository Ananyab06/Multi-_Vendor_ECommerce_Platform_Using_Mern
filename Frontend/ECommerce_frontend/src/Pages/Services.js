import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Star, X } from 'lucide-react';
import { useAppContext } from '../Context/AppContext';
// import serviceHeroImg from '../banners/service5.jfif';

const timeSlots = [
  '09:00 AM - 11:00 AM',
  '12:00 PM - 02:00 PM',
  '03:00 PM - 05:00 PM',
  '06:00 PM - 08:00 PM',
];

const Services = () => {
  const [bookingModal, setBookingModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { serviceBookings, addServiceBooking, services, user, showToast } = useAppContext();
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash?.startsWith('#service-')) return;
    const el = document.querySelector(hash);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [services]);

  const handleBook = (service) => {
    if (!user || user.isVendor) {
      showToast('Please login as a customer to book a service.', 'error');
      return;
    }
    setBookingModal(service);
  };

  const confirmBooking = async (e) => {
    e.preventDefault();
    if (!user || user.isVendor) {
      showToast('Please login as a customer to book a service.', 'error');
      return;
    }

    const formData = new FormData(e.target);
    const date = formData.get('date');
    const slot = formData.get('slot');
    const address = formData.get('address');
    const paymentMethod = formData.get('paymentMethod');

    setSubmitting(true);
    const result = await addServiceBooking({
      serviceName: bookingModal.name,
      vendor: bookingModal.vendor,
      price: bookingModal.price,
      date,
      slot,
      address,
      paymentMethod,
    });
    setSubmitting(false);

    if (result.success) {
      showToast(`Successfully booked: ${bookingModal.name} on ${date} at ${slot}!`, 'success');
      setBookingModal(null);
    }
  };

  return (
    <div className="space-y-16">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 bg-white rounded-3xl p-6 lg:p-12 shadow-sm border border-slate-100">
          {/* Left Column */}
          <div className="flex-1 space-y-8">
            <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl lg:text-5xl leading-tight">
              Expert Professional Services
            </h1>
            <div className="flex items-center gap-2 text-lg font-medium text-slate-600">
              <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              <span className="text-slate-900 font-bold">4.9</span> (25.5M bookings near you)
            </div>
            
            {/* Mock Categories */}
            <div className="flex gap-6 pt-6 border-t border-slate-100 overflow-x-auto pb-4 scrollbar-hide">
              {[
                { name: 'Cleaning', icon: '🧹' },
                { name: 'Plumbing', icon: '🔧' },
                { name: 'Repairs', icon: '🔨' },
                { name: 'AC Service', icon: '❄️' },
                { name: 'and more...', icon: '✨' },
              ].map((cat, index) => (
                <div key={index} className="flex flex-col items-center gap-3 text-center flex-shrink-0">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-3xl shadow-sm border border-slate-100">
                    {cat.icon}
                  </div>
                  <span className="text-sm font-bold text-slate-700">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none relative rounded-2xl overflow-hidden shadow-2xl">
            <img
              // src={serviceHeroImg}
              alt="Professional Services"
              className="w-full h-[350px] object-cover"
            />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-8 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Top Services</h2>
          <p className="text-gray-600">Choose from a wide range of professional services trusted by thousands of customers.</p>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-lg font-semibold text-gray-900 mb-2">No services available yet</p>
            <p className="text-gray-500">Check back soon — vendors are adding new services.</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service) => {
            const isBooked = serviceBookings.find(
              (b) =>
                b.name === service.name &&
                b.status !== 'Cancelled' &&
                b.status !== 'cancelled' &&
                b.status !== 'Completed' &&
                b.status !== 'completed'
            );

            return (
              <div id={`service-${service.id}`} key={service.id} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group relative">
                {isBooked ? (
                  <div
                    className={`absolute top-6 right-6 z-10 px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1 ${
                      isBooked.status === 'Pending'
                        ? 'bg-amber-100 text-amber-700'
                        : isBooked.status === 'Confirmed'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <CheckCircle2 className="h-3 w-3" /> {isBooked.status}
                  </div>
                ) : service.isActive === false ? (
                  <div className="absolute top-6 right-6 z-10 px-3 py-1 rounded-full text-xs font-bold shadow-sm bg-rose-100 text-rose-700">
                    Inactive
                  </div>
                ) : null}
                <div className="relative aspect-video overflow-hidden rounded-xl mb-4">
                  <img src={service.image} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-600">{service.rating} ({service.reviews})</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{service.name}</h3>
                  <p className="text-xs font-semibold text-indigo-600 mb-2">By {service.vendor || 'Independent Pro'}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <CheckCircle2 className="h-4 w-4 text-green-500" /> Verified Professionals
                  </div>
                  {isBooked && (
                    <div className="text-xs text-gray-500 mb-2 bg-gray-50 p-2 rounded">
                      Booked for {isBooked.date} ({isBooked.slot})
                    </div>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-lg font-bold text-indigo-600">₹{service.price}</span>
                    {isBooked ? (
                      <span className="flex items-center gap-2 bg-gray-100 text-gray-500 px-4 py-2 rounded-full text-sm font-bold">
                        Booked
                      </span>
                    ) : service.isActive === false ? (
                      <span className="flex items-center gap-2 bg-rose-50 text-rose-500 px-4 py-2 rounded-full text-sm font-bold">
                        Inactive
                      </span>
                    ) : (
                      <button
                        onClick={() => handleBook(service)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-indigo-700 transition-colors"
                      >
                        <Calendar className="h-4 w-4" /> Book
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </section>

      {bookingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md relative">
            <button
              onClick={() => setBookingModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Book Service</h3>
            <p className="text-indigo-600 font-semibold mb-6">{bookingModal.name}</p>

            <form onSubmit={confirmBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
                <input
                  type="date"
                  name="date"
                  required
                  min={today}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
                <select name="slot" required className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">Select a time slot</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  name="address"
                  required
                  rows="3"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400"
                  placeholder="Enter your full address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select name="paymentMethod" required className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="credit_card">Credit / Debit Card</option>
                  <option value="upi">UPI</option>
                  <option value="cash">Cash on Delivery</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors mt-4 disabled:opacity-50"
              >
                {submitting ? 'Booking...' : 'Confirm Booking'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
