import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../Context/AppContext';
import { registerUser, registerVendor } from '../api';

const AccountTypeToggle = ({ accountType, onChange }) => (
  <div className="flex rounded-full bg-gray-100 p-1 mb-8">
    <button
      type="button"
      onClick={() => onChange('user')}
      className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-colors ${
        accountType === 'user'
          ? 'bg-white text-indigo-700 shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      Customer
    </button>
    <button
      type="button"
      onClick={() => onChange('vendor')}
      className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-colors ${
        accountType === 'vendor'
          ? 'bg-white text-indigo-700 shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      Vendor
    </button>
  </div>
);

const Register = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const accountType = searchParams.get('type') === 'vendor' ? 'vendor' : 'user';
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAppContext();

  const setAccountType = (type) => {
    if (type === 'vendor') {
      setSearchParams({ type: 'vendor' });
    } else {
      setSearchParams({});
    }
  };

  useEffect(() => {
    setName('');
    setEmail('');
    setIdentifier('');
    setPassword('');
    setCompanyName('');
  }, [accountType]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (accountType === 'vendor') {
        const vendorData = {
          name: name.trim(),
          email: email.trim(),
          password,
          storeName: companyName.trim(),
          mobile: identifier,
        };
        const response = await registerVendor(vendorData);
        const { token, vendor } = response.data;
        login({ ...vendor, id: vendor.id || vendor._id, isVendor: true }, token);
        navigate('/vendor');
      } else {
        const userData = {
          name: name || 'User',
          email: email || identifier,
          password,
          role: 'user',
        };
        const response = await registerUser(userData);
        const { token, user } = response.data;
        login(user, token);
        navigate('/');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Registration failed';
      alert(`Registration failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const isVendor = accountType === 'vendor';

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      <div className="text-center mb-2">
        <h2 className="text-3xl font-extrabold text-gray-900">Create Account</h2>
        <p className="text-gray-500 mt-2">
          {isVendor ? 'Start selling on UniBox' : 'Join UniBox today'}
        </p>
      </div>

      <AccountTypeToggle accountType={accountType} onChange={setAccountType} />

      <form onSubmit={handleRegister} className="space-y-6" autoComplete="off">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            required
            pattern="[A-Za-z\s]+"
            title="Name should only contain alphabets"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value.replace(/[^A-Za-z\s]/g, ''))}
            autoComplete="off"
          />
        </div>

        {isVendor && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="Tech Haven LLC"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              autoComplete="off"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isVendor ? 'Business Email' : 'Email Address'}
          </label>
          <input
            type="email"
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder={isVendor ? 'vendor@example.com' : 'john@example.com'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mobile Number{isVendor ? '' : ' (Optional)'}
          </label>
          <input
            type="tel"
            required={isVendor}
            pattern="[0-9]{10}"
            title="Please enter a valid 10-digit mobile number"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="Enter 10-digit mobile number"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input
            type="password"
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
        >
          {loading ? 'Registering...' : isVendor ? 'Register as Vendor' : 'Register'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            to={isVendor ? '/login?type=vendor' : '/login'}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
