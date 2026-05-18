import React, { useState, useEffect } from 'react';
import { Trash2, CreditCard, MapPin, CheckCircle, Truck, Wallet } from 'lucide-react';
import { useAppContext } from '../Context/AppContext';
import { useNavigate } from 'react-router-dom';

const initialAddressForm = { name: '', street: '', city: '', state: '', zip: '' };
const initialPaymentForm = { cardNumber: '', expiryDate: '', cvv: '', upiId: '' };

const formatCardNumber = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
};

const formatExpiryDate = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const validatePaymentForm = (method, data) => {
  const errors = {};

  if (method === 'cc') {
    const cardDigits = data.cardNumber.replace(/\s/g, '');
    if (!cardDigits) {
      errors.cardNumber = 'Card number is required';
    } else if (!/^\d{16}$/.test(cardDigits)) {
      errors.cardNumber = 'Enter a valid 16-digit card number';
    }

    const expiry = data.expiryDate.trim();
    if (!expiry) {
      errors.expiryDate = 'Expiry date is required';
    } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
      errors.expiryDate = 'Use MM/YY format';
    } else {
      const [month, year] = expiry.split('/').map(Number);
      const expiryEnd = new Date(2000 + year, month, 0, 23, 59, 59);
      if (expiryEnd < new Date()) {
        errors.expiryDate = 'Card has expired';
      }
    }

    const cvv = data.cvv.trim();
    if (!cvv) {
      errors.cvv = 'CVV is required';
    } else if (!/^\d{3,4}$/.test(cvv)) {
      errors.cvv = 'Enter a valid 3 or 4-digit CVV';
    }
  }

  if (method === 'upi') {
    const upiId = data.upiId.trim();
    if (!upiId) {
      errors.upiId = 'UPI ID is required';
    } else if (!/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/.test(upiId)) {
      errors.upiId = 'Enter a valid UPI ID (e.g. username@bank)';
    }
  }

  return errors;
};

const validateAddressForm = (data) => {
  const errors = {};
  const name = data.name.trim();
  const street = data.street.trim();
  const city = data.city.trim();
  const state = data.state.trim();
  const zip = data.zip.trim();

  if (!name) {
    errors.name = 'Full name is required';
  } else if (name.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  } else if (!/^[a-zA-Z\s.'-]+$/.test(name)) {
    errors.name = 'Name can only contain letters';
  }

  if (!street) {
    errors.street = 'Street address is required';
  } else if (street.length < 5) {
    errors.street = 'Enter a complete street address (min. 5 characters)';
  } else if (!/[a-zA-Z]/.test(street) || !/\d/.test(street)) {
    errors.street = 'Include house/building number and street name';
  }

  if (!city) {
    errors.city = 'City is required';
  } else if (city.length < 2) {
    errors.city = 'City must be at least 2 characters';
  } else if (!/^[a-zA-Z\s]+$/.test(city)) {
    errors.city = 'City can only contain letters';
  }

  if (!state) {
    errors.state = 'State is required';
  } else if (state.length < 2) {
    errors.state = 'State must be at least 2 characters';
  } else if (!/^[a-zA-Z\s]+$/.test(state)) {
    errors.state = 'State can only contain letters';
  }

  if (!zip) {
    errors.zip = 'PIN code is required';
  } else if (!/^[1-9][0-9]{5}$/.test(zip)) {
    errors.zip = 'Enter a valid 6-digit PIN code';
  }

  return errors;
};

const PaymentField = ({ label, name, value, onChange, error, placeholder, className = '', ...inputProps }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${name}-error` : undefined}
      className={`mt-1 w-full p-3 border rounded-lg bg-white transition-colors focus:outline-none focus:ring-2 ${
        error ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-indigo-500'
      } ${className}`}
      {...inputProps}
    />
    {error && (
      <p id={`${name}-error`} className="mt-1 text-sm text-red-600" role="alert">
        {error}
      </p>
    )}
  </div>
);

const AddressField = ({ label, name, value, onChange, error, placeholder, ...inputProps }) => (
  <div>
    <label htmlFor={name} className="sr-only">{label}</label>
    <input
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${name}-error` : undefined}
      className={`w-full p-3 border rounded-xl transition-colors ${
        error ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-indigo-500'
      } focus:outline-none focus:ring-2`}
      {...inputProps}
    />
    {error && (
      <p id={`${name}-error`} className="mt-1 text-sm text-red-600" role="alert">
        {error}
      </p>
    )}
  </div>
);

const Cart = () => {
  const { cart, removeFromCart, updateCartQuantity, updateCartItemSize, setCart, addOrder, user, products } = useAppContext();
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart', 'address', 'payment', 'success'
  const [addresses, setAddresses] = useState([
    { id: 1, name: 'John Doe', street: '123 Main St, Apt 4B', city: 'New York', state: 'NY', zip: '10001' }
  ]);
  const [selectedAddress, setSelectedAddress] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cc'); // 'cc', 'upi', 'cod'
  const [addressForm, setAddressForm] = useState(initialAddressForm);
  const [addressErrors, setAddressErrors] = useState({});
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
  const [paymentErrors, setPaymentErrors] = useState({});
  const navigate = useNavigate();

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleAddressFieldChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'zip' ? value.replace(/\D/g, '').slice(0, 6) : value;
    setAddressForm((prev) => ({ ...prev, [name]: nextValue }));
    if (addressErrors[name]) {
      setAddressErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    const errors = validateAddressForm(addressForm);
    if (Object.keys(errors).length > 0) {
      setAddressErrors(errors);
      return;
    }

    const newAddr = {
      id: Date.now(),
      name: addressForm.name.trim(),
      street: addressForm.street.trim(),
      city: addressForm.city.trim(),
      state: addressForm.state.trim(),
      zip: addressForm.zip.trim(),
    };
    setAddresses([...addresses, newAddr]);
    setSelectedAddress(newAddr.id);
    setAddressForm(initialAddressForm);
    setAddressErrors({});
  };

  const handlePaymentFieldChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;

    if (name === 'cardNumber') nextValue = formatCardNumber(value);
    else if (name === 'expiryDate') nextValue = formatExpiryDate(value);
    else if (name === 'cvv') nextValue = value.replace(/\D/g, '').slice(0, 4);
    else if (name === 'upiId') nextValue = value.trim().toLowerCase();

    setPaymentForm((prev) => ({ ...prev, [name]: nextValue }));
    if (paymentErrors[name]) {
      setPaymentErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setPaymentErrors({});
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    const errors = validatePaymentForm(paymentMethod, paymentForm);
    if (Object.keys(errors).length > 0) {
      setPaymentErrors(errors);
      return;
    }
    setPaymentErrors({});

    const cardDigits = paymentForm.cardNumber.replace(/\s/g, '');
    if (paymentMethod === 'cc' && cardDigits === '0000000000000000') {
      alert('Payment Failed: Your card was declined. Please try again with a different card.');
      navigate('/');
      return;
    }

    const selectedAddr = addresses.find((addr) => addr.id === selectedAddress);

    const newOrder = {
      id: `ORD-${Math.floor(Math.random() * 10000)}`,
      date: (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })(),
      total: total,
      status: 'Processing',
      customer: {
        name: user?.name || 'Guest User',
        email: user?.email || 'guest@example.com'
      },
      itemsCount: cart.reduce((acc, item) => acc + item.quantity, 0),
      items: cart.map(i => ({ id: i.id, name: i.name, qty: i.quantity, price: i.price, size: i.size, vendor: i.vendor }))
    };

    const orderData = {
      shippingAddress: {
        street: selectedAddr?.street || '',
        city: selectedAddr?.city || '',
        state: selectedAddr?.state || '',
        zipCode: selectedAddr?.zip || '',
        country: 'India',
      },
      paymentMethod: paymentMethod,
    };

    const result = await addOrder(orderData);
    if (result.success) {
      setCheckoutStep('success');
    } else {
      alert(`Order failed: ${result.error}`);
    }
  };

  useEffect(() => {
    if (checkoutStep === 'success') {
      const timer = setTimeout(() => {
        navigate('/');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [checkoutStep, navigate]);

  if (checkoutStep === 'success') {
    const isCashOnDelivery = paymentMethod === 'cod';

    return (
      <div className="max-w-xl mx-auto bg-white p-12 rounded-3xl shadow-sm border border-gray-100 mt-16 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
          {isCashOnDelivery ? 'Successfully Ordered!' : 'Payment Successful!'}
        </h2>
        <p className="text-gray-500 text-lg mb-8">
          {isCashOnDelivery
            ? 'Your order has been placed. Pay when your delivery arrives.'
            : 'Your order has been placed and is being processed.'}
        </p>
        <p className="text-sm text-gray-400">Redirecting to home page in a few seconds...</p>
      </div>
    );
  }

  if (checkoutStep === 'payment') {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mt-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><CreditCard /> Payment Gateway</h2>
        <div className="mb-8 p-4 bg-indigo-50 rounded-xl text-indigo-900 font-bold flex justify-between items-center text-lg">
          <span>Amount to Pay</span>
          <span>₹{total.toFixed(2)}</span>
        </div>

        <form onSubmit={handleCheckout} className="space-y-8" noValidate>
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Select Payment Method</h3>
            
            <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'cc' ? 'border-indigo-600 bg-indigo-50/50' : 'hover:bg-gray-50'}`}>
              <input type="radio" name="paymentMethod" value="cc" checked={paymentMethod === 'cc'} onChange={() => handlePaymentMethodChange('cc')} className="w-4 h-4 text-indigo-600" />
              <CreditCard className="ml-3 h-5 w-5 text-gray-500" />
              <span className="ml-2 font-medium text-gray-900">Credit / Debit Card</span>
            </label>
            
            <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'upi' ? 'border-indigo-600 bg-indigo-50/50' : 'hover:bg-gray-50'}`}>
              <input type="radio" name="paymentMethod" value="upi" checked={paymentMethod === 'upi'} onChange={() => handlePaymentMethodChange('upi')} className="w-4 h-4 text-indigo-600" />
              <Wallet className="ml-3 h-5 w-5 text-gray-500" />
              <span className="ml-2 font-medium text-gray-900">UPI</span>
            </label>

            <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-indigo-600 bg-indigo-50/50' : 'hover:bg-gray-50'}`}>
              <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => handlePaymentMethodChange('cod')} className="w-4 h-4 text-indigo-600" />
              <Truck className="ml-3 h-5 w-5 text-gray-500" />
              <span className="ml-2 font-medium text-gray-900">Cash on Delivery</span>
            </label>
          </div>

          {paymentMethod === 'cc' && (
            <div className="space-y-4 p-6 border rounded-xl bg-gray-50">
              <PaymentField
                label="Card Number"
                name="cardNumber"
                value={paymentForm.cardNumber}
                onChange={handlePaymentFieldChange}
                error={paymentErrors.cardNumber}
                placeholder="0000 0000 0000 0000"
                inputMode="numeric"
                autoComplete="cc-number"
              />
              <div className="grid grid-cols-2 gap-4">
                <PaymentField
                  label="Expiry Date"
                  name="expiryDate"
                  value={paymentForm.expiryDate}
                  onChange={handlePaymentFieldChange}
                  error={paymentErrors.expiryDate}
                  placeholder="MM/YY"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                />
                <PaymentField
                  label="CVV"
                  name="cvv"
                  type="password"
                  value={paymentForm.cvv}
                  onChange={handlePaymentFieldChange}
                  error={paymentErrors.cvv}
                  placeholder="123"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                />
              </div>
            </div>
          )}

          {paymentMethod === 'upi' && (
            <div className="space-y-4 p-6 border rounded-xl bg-gray-50">
              <PaymentField
                label="UPI ID"
                name="upiId"
                value={paymentForm.upiId}
                onChange={handlePaymentFieldChange}
                error={paymentErrors.upiId}
                placeholder="username@bank"
                autoComplete="off"
              />
            </div>
          )}

          {paymentMethod === 'cod' && (
            <div className="p-6 border rounded-xl bg-blue-50 text-blue-800 text-sm">
              You can pay via Cash or UPI when the delivery executive arrives.
            </div>
          )}

          <div className="pt-4 flex gap-4">
            <button type="button" onClick={() => setCheckoutStep('address')} className="flex-1 py-4 bg-gray-100 text-gray-800 rounded-full font-bold hover:bg-gray-200">Back</button>
            <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 shadow-md transition-transform hover:-translate-y-0.5">Pay Now</button>
          </div>
        </form>
      </div>
    );
  }

  if (checkoutStep === 'address') {
    return (
      <div className="max-w-4xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><MapPin /> Select Address</h2>
          
          <div className="space-y-4">
            {addresses.map((addr) => (
              <label key={addr.id} className={`block p-4 border-2 rounded-2xl cursor-pointer transition-all ${selectedAddress === addr.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                <div className="flex items-start gap-3">
                  <input type="radio" name="address" checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} className="mt-1 text-indigo-600" />
                  <div>
                    <p className="font-bold text-gray-900">{addr.name}</p>
                    <p className="text-gray-600 text-sm mt-1">{addr.street}</p>
                    <p className="text-gray-600 text-sm">{addr.city}, {addr.state} {addr.zip}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Add New Address</h3>
          <form onSubmit={handleAddAddress} className="space-y-4" noValidate>
            <AddressField
              label="Full Name"
              name="name"
              value={addressForm.name}
              onChange={handleAddressFieldChange}
              error={addressErrors.name}
              placeholder="Full Name"
              autoComplete="name"
            />
            <AddressField
              label="Street Address"
              name="street"
              value={addressForm.street}
              onChange={handleAddressFieldChange}
              error={addressErrors.street}
              placeholder="Street Address (e.g. 42 MG Road, Apt 3B)"
              autoComplete="street-address"
            />
            <div className="grid grid-cols-2 gap-4">
              <AddressField
                label="City"
                name="city"
                value={addressForm.city}
                onChange={handleAddressFieldChange}
                error={addressErrors.city}
                placeholder="City"
                autoComplete="address-level2"
              />
              <AddressField
                label="State"
                name="state"
                value={addressForm.state}
                onChange={handleAddressFieldChange}
                error={addressErrors.state}
                placeholder="State"
                autoComplete="address-level1"
              />
            </div>
            <AddressField
              label="PIN Code"
              name="zip"
              value={addressForm.zip}
              onChange={handleAddressFieldChange}
              error={addressErrors.zip}
              placeholder="PIN Code"
              inputMode="numeric"
              autoComplete="postal-code"
            />
            <button type="submit" className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors">Save Address</button>
          </form>

          <div className="mt-8 pt-8 border-t">
            <button 
              onClick={() => setCheckoutStep('payment')}
              className="w-full py-4 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 shadow-md transition-transform hover:-translate-y-0.5"
            >
              Deliver Here & Proceed
            </button>
            <button 
              onClick={() => setCheckoutStep('cart')}
              className="w-full mt-4 py-3 text-gray-600 font-medium hover:text-gray-900"
            >
              Back to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
      
      {cart.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-lg">Your cart is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {cart.map((item, index) => (
              <div key={`${item.id}-${item.size || index}`} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-xl" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-indigo-600 font-bold">₹{item.price.toFixed(2)}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border rounded-lg bg-gray-50">
                        <button 
                          onClick={() => updateCartQuantity(item.id, item.size, item.quantity - 1)}
                          className="px-3 py-1 text-gray-600 hover:text-indigo-600 hover:bg-gray-200 rounded-l-lg transition-colors"
                        >-</button>
                        <span className="px-3 py-1 font-medium text-gray-900 border-x bg-white">{item.quantity}</span>
                        <button 
                          onClick={() => updateCartQuantity(item.id, item.size, item.quantity + 1)}
                          className="px-3 py-1 text-gray-600 hover:text-indigo-600 hover:bg-gray-200 rounded-r-lg transition-colors"
                        >+</button>
                      </div>
                      {item.size && (() => {
                        const product = products.find(p => p.id === item.id);
                        return product?.sizes?.length > 0 ? (
                          <select
                            value={item.size}
                            onChange={(e) => updateCartItemSize(item.id, item.size, e.target.value)}
                            className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md border-none outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                          >
                            {product.sizes.map(s => (
                              <option key={s} value={s}>Size: {s}</option>
                            ))}
                          </select>
                        ) : item.size ? (
                          <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md">Size: {item.size}</span>
                        ) : null;
                      })()}
                    </div>
                    <button onClick={() => removeFromCart(item.id, item.size)} className="text-red-500 hover:text-red-700 p-2 bg-red-50 rounded-full hover:bg-red-100 transition-colors">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit sticky top-24">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-3 text-gray-600 mb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
            <button 
              onClick={() => setCheckoutStep('address')}
              className="w-full py-4 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-transform hover:-translate-y-0.5 shadow-md"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
