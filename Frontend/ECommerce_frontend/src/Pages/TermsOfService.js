import React from 'react';
import { FileText, ShoppingBag, Users, AlertTriangle } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
        <p className="mt-2 text-gray-600">
          Rules and guidelines for using the Unibox marketplace.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-indigo-600 shrink-0" />
          <h2 className="text-xl font-semibold text-gray-900">Acceptance of terms</h2>
        </div>
        <p className="text-gray-600 leading-relaxed">
          By accessing or using Unibox, you agree to these Terms of Service and our Privacy Policy.
          If you do not agree, please do not use the platform.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-6 w-6 text-indigo-600 shrink-0" />
          <h2 className="text-xl font-semibold text-gray-900">Orders & payments</h2>
        </div>
        <p className="text-gray-600 leading-relaxed">
          Product and service listings are provided by independent vendors. Prices, availability,
          and fulfillment are the vendor&apos;s responsibility unless otherwise stated. You agree to
          pay all charges for orders you place, including applicable taxes and shipping fees.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-indigo-600 shrink-0" />
          <h2 className="text-xl font-semibold text-gray-900">User accounts</h2>
        </div>
        <p className="text-gray-600 leading-relaxed">
          You are responsible for maintaining the confidentiality of your account credentials and
          for all activity under your account. Provide accurate information and notify us promptly
          of any unauthorized use.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-indigo-600 shrink-0" />
          <h2 className="text-xl font-semibold text-gray-900">Limitation of liability</h2>
        </div>
        <p className="text-gray-600 leading-relaxed">
          Unibox facilitates transactions between buyers and vendors. We are not liable for indirect,
          incidental, or consequential damages arising from your use of the platform. For disputes,
          contact{' '}
          <a href="mailto:support@unibox.com" className="text-indigo-600 hover:text-indigo-700">
            support@unibox.com
          </a>
          .
        </p>
      </section>
    </div>
  );
};

export default TermsOfService;
