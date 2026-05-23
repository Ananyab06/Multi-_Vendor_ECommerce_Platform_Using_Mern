import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../Context/AppContext';
import { loginUser, loginVendor } from '../api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^[0-9]{10}$/;

const isValidIdentifier = (value) =>
  EMAIL_REGEX.test(value.trim()) || MOBILE_REGEX.test(value.trim());

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

const Login = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const accountType = searchParams.get('type') === 'vendor' ? 'vendor' : 'user';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { login, user, authLoading } = useAppContext();

  const setAccountType = (type) => {
    if (type === 'vendor') {
      setSearchParams({ type: 'vendor' });
    } else {
      setSearchParams({});
    }
    setErrors({});
  };

  useEffect(() => {
    if (authLoading) return;
    if (user?.isVendor) {
      navigate('/vendor');
    } else if (user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const handleIdentifierChange = (e) => {
    setIdentifier(e.target.value);
    if (errors.identifier) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.identifier;
        return next;
      });
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password || errors.form) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.password;
        delete next.form;
        return next;
      });
    }
  };

  const handleIdentifierBlur = () => {
    const trimmedId = identifier.trim();
    if (trimmedId && !isValidIdentifier(trimmedId)) {
      setErrors((prev) => ({
        ...prev,
        identifier: 'Please enter a valid email address or 10-digit mobile number.',
      }));
    }
  };

  const handlePasswordBlur = () => {
    if (!password) {
      setErrors((prev) => ({
        ...prev,
        password: 'Password is required.',
      }));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const trimmedId = identifier.trim();
    const newErrors = {};

    if (!trimmedId) {
      newErrors.identifier = 'Email or Mobile Number is required.';
    } else if (!isValidIdentifier(trimmedId)) {
      newErrors.identifier = 'Please enter a valid email address or 10-digit mobile number.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const credentials = { identifier: trimmedId, password };
      if (accountType === 'vendor') {
        const response = await loginVendor(credentials);
        const { token, vendor } = response.data;
        const vendorWithFlag = { ...vendor, id: vendor.id || vendor._id, isVendor: true };
        login(vendorWithFlag, token);
        navigate('/vendor');
      } else {
        const response = await loginUser(credentials);
        const { token, user: userData } = response.data;
        login(userData, token);
        navigate('/');
      }
    } catch (err) {
      console.error('Login failed', err);
      const errorMsg = err.response?.data?.message || 'Invalid credentials';
      const lowerMsg = errorMsg.toLowerCase();
      if (lowerMsg.includes('user') || lowerMsg.includes('email') || lowerMsg.includes('mobile') || lowerMsg.includes('identifier') || lowerMsg.includes('found')) {
        setErrors((prev) => ({ ...prev, identifier: errorMsg }));
      } else if (lowerMsg.includes('password') || lowerMsg.includes('credential')) {
        setErrors((prev) => ({ ...prev, password: errorMsg }));
      } else {
        setErrors((prev) => ({ ...prev, form: errorMsg }));
      }
    } finally {
      setLoading(false);
    }
  };

  const isVendor = accountType === 'vendor';

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      <div className="text-center mb-2">
        <h2 className="text-3xl font-extrabold text-gray-900">Welcome Back</h2>
        <p className="text-gray-500 mt-2">
          {isVendor ? 'Sign in to your vendor dashboard' : 'Sign in to your UniBox account'}
        </p>
      </div>

      <AccountTypeToggle accountType={accountType} onChange={setAccountType} />

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email or Mobile Number
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder={isVendor ? 'vendor@example.com or 9876543210' : 'john@example.com or 9876543210'}
            value={identifier}
            onChange={handleIdentifierChange}
            onBlur={handleIdentifierBlur}
            autoComplete="username"
          />
          {errors.identifier ? (
            <p className="mt-1 text-sm text-red-500 font-medium">{errors.identifier}</p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">Use your registered email or 10-digit mobile number</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input
            type="password"
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="Enter your password"
            value={password}
            onChange={handlePasswordChange}
            onBlur={handlePasswordBlur}
            autoComplete="current-password"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500 font-medium">{errors.password}</p>
          )}
        </div>

        {errors.form && (
          <div className="p-3 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-200">
            {errors.form}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing In...' : isVendor ? 'Sign In as Vendor' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link
            to={isVendor ? '/register?type=vendor' : '/register'}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            {isVendor ? 'Register as vendor' : 'Create account'}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

