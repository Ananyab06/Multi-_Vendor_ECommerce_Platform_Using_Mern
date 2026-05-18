import React from 'react';
import { RotateCcw, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

const ReturnsExchanges = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Returns & Exchanges</h1>
        <p className="mt-2 text-gray-600">
          Our policy for returning or exchanging items purchased on Unibox.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <RotateCcw className="h-6 w-6 text-indigo-600 shrink-0" />
          <h2 className="text-xl font-semibold text-gray-900">30-day return window</h2>
        </div>
        <p className="text-gray-600 leading-relaxed">
          Most products can be returned within 30 days of delivery if they are unused, in
          original packaging, and include all tags and accessories. Items marked as
          non-returnable on the product page are excluded.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-6 w-6 text-indigo-600 shrink-0" />
          <h2 className="text-xl font-semibold text-gray-900">Exchanges</h2>
        </div>
        <p className="text-gray-600 leading-relaxed">
          To exchange an item for a different size or color, start a return from your account
          order history and place a new order for the replacement. If the same item is
          available from the vendor, we will guide you through the exchange process. Price
          differences may apply.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-indigo-600 shrink-0" />
          <h2 className="text-xl font-semibold text-gray-900">How to start a return</h2>
        </div>
        <ol className="list-decimal list-inside space-y-2 text-gray-600 leading-relaxed">
          <li>Sign in and open your order in My Account.</li>
          <li>Select the item(s) you want to return and choose a reason.</li>
          <li>Print the return label if provided, or follow vendor instructions.</li>
          <li>Ship the package within 7 days of approval.</li>
        </ol>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-indigo-600 shrink-0" />
          <h2 className="text-xl font-semibold text-gray-900">Refunds & exceptions</h2>
        </div>
        <p className="text-gray-600 leading-relaxed">
          Refunds are issued to your original payment method within 5–10 business days after
          we receive and inspect the return. Damaged, personalized, or hygiene-related items
          may not be eligible. For defective or wrong items received, contact{' '}
          <a href="mailto:support@unibox.com" className="text-indigo-600 hover:text-indigo-700">
            support@unibox.com
          </a>{' '}
          and we will arrange a free return or replacement.
        </p>
      </section>
    </div>
  );
};

export default ReturnsExchanges;
