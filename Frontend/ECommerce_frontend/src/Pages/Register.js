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
  const [gstNumber, setGstNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { login } = useAppContext();

  const setAccountType = (type) => {
    if (type === 'vendor') {
      setSearchParams({ type: 'vendor' });
    } else {
      setSearchParams({});
    }
    setErrors({});
  };

  useEffect(() => {
    setName('');
    setEmail('');
    setIdentifier('');
    setPassword('');
    setCompanyName('');
    setGstNumber('');
    setErrors({});
  }, [accountType]);

  const handleNameChange = (e) => {
    const val = e.target.value.replace(/[^A-Za-z\s]/g, '');
    setName(val);
    if (errors.name) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.name;
        return next;
      });
    }
  };

  const handleCompanyNameChange = (e) => {
    const val = e.target.value;
    setCompanyName(val);
    if (errors.companyName) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.companyName;
        return next;
      });
    }
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (errors.email) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.email;
        return next;
      });
    }
  };

  const handleIdentifierChange = (e) => {
    const val = e.target.value;
    setIdentifier(val);
    if (errors.identifier) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.identifier;
        return next;
      });
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (errors.password || errors.form) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.password;
        delete next.form;
        return next;
      });
    }
  };

  const handleNameBlur = () => {
    if (!name.trim()) {
      setErrors((prev) => ({ ...prev, name: 'Full Name is required.' }));
    } else if (!/^[A-Za-z\s]+$/.test(name.trim())) {
      setErrors((prev) => ({ ...prev, name: 'Name should only contain alphabets.' }));
    }
  };

  const handleCompanyNameBlur = () => {
    if (isVendor && !companyName.trim()) {
      setErrors((prev) => ({ ...prev, companyName: 'Company Name is required.' }));
    }
  };

  const handleEmailBlur = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrors((prev) => ({ ...prev, email: 'Email address is required.' }));
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address.' }));
    }
  };

  const handleIdentifierBlur = () => {
    const trimmedId = identifier.trim();
    if (isVendor && !trimmedId) {
      setErrors((prev) => ({ ...prev, identifier: 'Mobile number is required.' }));
    } else if (trimmedId && !/^[0-9]{10}$/.test(trimmedId)) {
      setErrors((prev) => ({ ...prev, identifier: 'Please enter a valid 10-digit mobile number.' }));
    }
  };

  const handlePasswordBlur = () => {
    if (!password) {
      setErrors((prev) => ({ ...prev, password: 'Password is required.' }));
    } else if (password.length < 6) {
      setErrors((prev) => ({ ...prev, password: 'Password must be at least 6 characters long.' }));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Full Name is required.';
    } else if (!/^[A-Za-z\s]+$/.test(name.trim())) {
      newErrors.name = 'Name should only contain alphabets.';
    }

    if (isVendor && !companyName.trim()) {
      newErrors.companyName = 'Company Name is required.';
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    const trimmedId = identifier.trim();
    if (isVendor && !trimmedId) {
      newErrors.identifier = 'Mobile number is required.';
    } else if (trimmedId && !/^[0-9]{10}$/.test(trimmedId)) {
      newErrors.identifier = 'Please enter a valid 10-digit mobile number.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      if (accountType === 'vendor') {
        const vendorData = {
          name: name.trim(),
          email: trimmedEmail,
          password,
          storeName: companyName.trim(),
          mobile: trimmedId,
          gstNumber: gstNumber.trim() || 'NA',
        };
        const response = await registerVendor(vendorData);
        const { token, vendor } = response.data;
        login({ ...vendor, id: vendor.id || vendor._id, isVendor: true }, token);
        navigate('/vendor');
      } else {
        const userData = {
          name: name.trim() || 'User',
          email: trimmedEmail,
          password,
          role: 'user',
          ...(trimmedId ? { mobile: trimmedId } : {}),
        };
        const response = await registerUser(userData);
        const { token, user } = response.data;
        login(user, token);
        navigate('/');
      }
    } catch (err) {
      console.error('Registration failed', err);
      const errorMsg = err.response?.data?.message || 'Registration failed';
      const lowerMsg = errorMsg.toLowerCase();
      if (lowerMsg.includes('email') || lowerMsg.includes('already exists') || lowerMsg.includes('registered')) {
        if (lowerMsg.includes('mobile') || lowerMsg.includes('phone')) {
          setErrors((prev) => ({ ...prev, identifier: errorMsg }));
        } else {
          setErrors((prev) => ({ ...prev, email: errorMsg }));
        }
      } else if (lowerMsg.includes('company') || lowerMsg.includes('store')) {
        setErrors((prev) => ({ ...prev, companyName: errorMsg }));
      } else if (lowerMsg.includes('name')) {
        setErrors((prev) => ({ ...prev, name: errorMsg }));
      } else if (lowerMsg.includes('password')) {
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
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="John Doe"
            value={name}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            autoComplete="off"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500 font-medium">{errors.name}</p>
          )}
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
              onChange={handleCompanyNameChange}
              onBlur={handleCompanyNameBlur}
              autoComplete="off"
            />
            {errors.companyName && (
              <p className="mt-1 text-sm text-red-500 font-medium">{errors.companyName}</p>
            )}
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
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            autoComplete="off"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500 font-medium">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mobile Number{isVendor ? '' : ' (Optional)'}
          </label>
          <input
            type="tel"
            required={isVendor}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="Enter 10-digit mobile number"
            value={identifier}
            onChange={handleIdentifierChange}
            onBlur={handleIdentifierBlur}
            autoComplete="off"
          />
          {errors.identifier && (
            <p className="mt-1 text-sm text-red-500 font-medium">{errors.identifier}</p>
          )}
        </div>

        {isVendor && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GST Number (Optional, default is NA)
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors uppercase"
              placeholder="e.g. 06AAZHR8370R1ZQ or NA"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              autoComplete="off"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input
            type="password"
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="Create a password"
            value={password}
            onChange={handlePasswordChange}
            onBlur={handlePasswordBlur}
            autoComplete="new-password"
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