import React from 'react';
import { Truck, Package, MapPin, Clock } from 'lucide-react';

const ShippingPolicy = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Shipping Policy</h1>
        <p className="mt-2 text-gray-600">
          How we deliver your orders across the Unibox marketplace.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Truck className="h-6 w-6 text-indigo-600 shrink-0" />
          <h2 className="text-xl font-semibold text-gray-900">Delivery times</h2>
        </div>
        <p className="text-gray-600 leading-relaxed">
          Standard delivery typically takes 3–7 business days after your order is confirmed.
          Express shipping (where offered by the vendor) may arrive in 1–3 business days.
          Delivery estimates are shown at checkout and may vary by vendor and location.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-indigo-600 shrink-0" />
          <h2 className="text-xl font-semibold text-gray-900">Order processing</h2>
        </div>
        <p className="text-gray-600 leading-relaxed">
          Vendors usually process orders within 1–2 business days. You will receive an email
          with tracking information once your package ships. Multivendor orders may ship in
          separate packages at different times.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <MapPin className="h-6 w-6 text-indigo-600 shrink-0" />
          <h2 className="text-xl font-semibold text-gray-900">Shipping areas & fees</h2>
        </div>
        <p className="text-gray-600 leading-relaxed">
          We ship to addresses within our supported regions. Shipping fees are calculated at
          checkout based on item weight, vendor location, and destination. Free shipping may
          apply when vendors offer promotions that meet their minimum order value.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-indigo-600 shrink-0" />
          <h2 className="text-xl font-semibold text-gray-900">Delays & lost packages</h2>
        </div>
        <p className="text-gray-600 leading-relaxed">
          Weather, holidays, or carrier issues may cause delays. If your tracking shows no
          movement for 7+ business days after shipment, contact us at{' '}
          <a href="mailto:support@unibox.com" className="text-indigo-600 hover:text-indigo-700">
            support@unibox.com
          </a>{' '}
          with your order number and we will help resolve the issue.
        </p>
      </section>
    </div>
  );
};

export default ShippingPolicy;
