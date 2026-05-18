import React, { useState } from 'react';
import { Calendar, CheckCircle2, Star, X } from 'lucide-react';
import { useAppContext } from '../Context/AppContext';

const timeSlots = [
  '09:00 AM - 11:00 AM',
  '12:00 PM - 02:00 PM',
  '03:00 PM - 05:00 PM',
  '06:00 PM - 08:00 PM',
];

const Services = () => {
  const [bookingModal, setBookingModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { serviceBookings, addServiceBooking, services, user } = useAppContext();
  const today = new Date().toISOString().split('T')[0];

  const handleBook = (service) => {
    if (!user || user.isVendor) {
      alert('Please login as a customer to book a service.');
      return;
    }
    setBookingModal(service);
  };

  const confirmBooking = async (e) => {
    e.preventDefault();
    if (!user || user.isVendor) {
      alert('Please login as a customer to book a service.');
      return;
    }

    const formData = new FormData(e.target);
    const date = formData.get('date');
    const slot = formData.get('slot');
    const address = formData.get('address');

    setSubmitting(true);
    const result = await addServiceBooking({
      serviceName: bookingModal.name,
      vendor: bookingModal.vendor,
      price: bookingModal.price,
      date,
      slot,
      address,
    });
    setSubmitting(false);

    if (result.success) {
      alert(
        `Successfully booked: ${bookingModal.name} on ${date} at ${slot}! Our technician will contact you shortly.`
      );
      setBookingModal(null);
    }
  };

  return (
    <div className="space-y-16">
      <section className="relative rounded-3xl overflow-hidden bg-teal-900 text-white">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80"
            alt="Services Hero"
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-24 sm:py-32 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Professional Services at Your Doorstep
          </h1>
          <p className="mt-6 text-xl max-w-2xl mx-auto text-teal-100">
            Book verified experts for home cleaning, repairs, and maintenance. Satisfaction guaranteed.
          </p>
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
            const isBooked = serviceBookings.find((b) => b.name === service.name);

            return (
              <div key={service.id} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group relative">
                {isBooked && (
                  <div
                    className={`absolute top-6 right-6 z-10 px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1 ${
                      isBooked.status === 'Pending'
                        ? 'bg-amber-100 text-amber-700'
                        : isBooked.status === 'Confirmed'
                        ? 'bg-teal-100 text-teal-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <CheckCircle2 className="h-3 w-3" /> {isBooked.status}
                  </div>
                )}
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
                    <span className="text-lg font-bold text-teal-700">₹{service.price}</span>
                    {isBooked ? (
                      <span className="flex items-center gap-2 bg-gray-100 text-gray-500 px-4 py-2 rounded-full text-sm font-bold">
                        Booked
                      </span>
                    ) : (
                      <button
                        onClick={() => handleBook(service)}
                        className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-teal-700 transition-colors"
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
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition-colors mt-4 disabled:opacity-50"
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
