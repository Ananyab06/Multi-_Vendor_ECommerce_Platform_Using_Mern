import React from 'react';
import { Shield, Eye, Lock, Mail } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="mt-2 text-gray-600">
          How Unibox collects, uses, and protects your personal information.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Eye className="h-6 w-6 text-indigo-600 shrink-0" />
          <h2 className="text-xl font-semibold text-gray-900">Information we collect</h2>
        </div>
        <p className="text-gray-600 leading-relaxed">
          We collect information you provide when creating an account, placing orders, booking
          services, or contacting support. This may include your name, email, phone number,
          delivery address, and payment-related details processed through our checkout partners.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-indigo-600 shrink-0" />
          <h2 className="text-xl font-semibold text-gray-900">How we use your data</h2>
        </div>
        <p className="text-gray-600 leading-relaxed">
          Your information is used to process orders, deliver products and services, communicate
          order updates, improve our marketplace, and comply with legal obligations. We do not
          sell your personal data to third parties.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Lock className="h-6 w-6 text-indigo-600 shrink-0" />
          <h2 className="text-xl font-semibold text-gray-900">Data security</h2>
        </div>
        <p className="text-gray-600 leading-relaxed">
          We use industry-standard safeguards to protect your data. Access to personal information
          is limited to authorized personnel and service providers who need it to operate the
          platform.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Mail className="h-6 w-6 text-indigo-600 shrink-0" />
          <h2 className="text-xl font-semibold text-gray-900">Your rights & contact</h2>
        </div>
        <p className="text-gray-600 leading-relaxed">
          You may request access, correction, or deletion of your personal data by contacting{' '}
          <a href="mailto:support@unibox.com" className="text-indigo-600 hover:text-indigo-700">
            support@unibox.com
          </a>
          . We may update this policy from time to time; continued use of Unibox constitutes
          acceptance of the revised policy.
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
