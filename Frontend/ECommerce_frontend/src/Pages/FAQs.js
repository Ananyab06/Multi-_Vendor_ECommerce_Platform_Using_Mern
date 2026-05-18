import React from 'react';

const faqs = [
  {
    question: 'How do I place an order?',
    answer:
      'Browse products or services, add items to your cart, and proceed to checkout. Sign in or create an account to complete your purchase.',
  },
  {
    question: 'Can I order from multiple vendors in one checkout?',
    answer:
      'Yes. Your cart can include items from different vendors. Each vendor may ship separately, and you will receive tracking for each shipment.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We support cash on delivery where available, along with other payment options shown at checkout. Available methods may vary by region and vendor.',
  },
  {
    question: 'How do I track my order?',
    answer:
      'After your order ships, tracking details appear in My Account under your order history. You will also receive email updates when available.',
  },
  {
    question: 'How do I book a service?',
    answer:
      'Visit the Services page, choose a service, pick a date and time slot, and confirm your booking. A verified professional will contact you before the appointment.',
  },
  {
    question: 'How do I become a vendor on Unibox?',
    answer:
      'Use Vendor Register to create a seller account. Once approved, you can list products and manage orders from the Vendor Dashboard.',
  },
  {
    question: 'Who do I contact for help?',
    answer:
      'Email support@unibox.com or call +1 (800) 123-4567. Include your order number for faster assistance with orders, returns, or shipping.',
  },
];

const FAQs = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h1>
        <p className="mt-2 text-gray-600">
          Quick answers about shopping, orders, services, and your account on Unibox.
        </p>
      </header>

      <div className="space-y-6">
        {faqs.map((faq) => (
          <section
            key={faq.question}
            className="border-b border-gray-200 pb-6 last:border-0 last:pb-0"
          >
            <h2 className="text-lg font-semibold text-gray-900">{faq.question}</h2>
            <p className="mt-2 text-gray-600 leading-relaxed">{faq.answer}</p>
          </section>
        ))}
      </div>
    </div>
  );
};

export default FAQs;
