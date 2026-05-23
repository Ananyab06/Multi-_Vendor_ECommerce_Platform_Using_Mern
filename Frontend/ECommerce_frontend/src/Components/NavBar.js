import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, User, Search as SearchIcon, Menu, X, ShoppingBag } from 'lucide-react';
import { useAppContext } from '../Context/AppContext';

const Navbar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { cart, wishlist, user, products } = useAppContext();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    if (val.trim().length > 0) {
      const query = val.toLowerCase();
      const filtered = (products || [])
        .filter(p => p.name?.toLowerCase().includes(query) || p.category?.toLowerCase().includes(query))
        .slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  if (location.pathname === '/vendor') {
    return null;
  }

  return (
    <nav className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={user?.isVendor ? "/vendor" : "/"} className="flex-shrink-0 flex items-center gap-2">
              <ShoppingBag className="h-8 w-8 text-[#3c4f68]" />
              <span className="font-bold text-xl text-gray-900 tracking-tight">Unibox</span>
            </Link>
          </div>
          
          <div className="flex-1 flex items-center justify-center px-2 lg:ml-6 lg:justify-end">
            <div ref={searchRef} className="max-w-lg w-full lg:max-w-xs relative">
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#3c4f68] focus:border-[#3c4f68] sm:text-sm transition-all duration-300"
                  placeholder="Search products & services..."
                  type="search"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => {
                    if (searchQuery.trim().length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                />
              </form>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden max-h-72 overflow-y-auto">
                  {suggestions.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        navigate(`/product/${p.id}`);
                        setSearchQuery('');
                        setShowSuggestions(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#3c4f68]/5 transition-colors text-left border-b border-gray-50 last:border-b-0"
                    >
                      <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{p.category} · ₹{Number(p.price || 0).toFixed(2)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="hidden lg:ml-6 lg:flex lg:items-center space-x-6">
            {!user?.isVendor && <Link to="/services" className="text-gray-600 hover:text-[#3c4f68] font-medium transition-colors">Services</Link>}
            <div className="h-6 w-px bg-gray-200"></div>
            {!user?.isVendor && (
              <>
                <Link to={user ? "/wishlist" : "/login"} className="text-gray-500 hover:text-[#3c4f68] transition-colors relative">
                  <Heart className="h-6 w-6" />
                  {wishlist.length > 0 && <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">{wishlist.length}</span>}
                </Link>
                <Link to={user ? "/cart" : "/login"} className="text-gray-500 hover:text-[#3c4f68] transition-colors relative">
                  <ShoppingCart className="h-6 w-6" />
                  {cartCount > 0 && <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-[#3c4f68] rounded-full">{cartCount}</span>}
                </Link>
              </>
            )}
            
            {user ? (
              <Link to="/profile" className="text-gray-500 hover:text-[#3c4f68] transition-colors mr-2 flex items-center gap-2">
                <User className="h-6 w-6" />
                <span className="text-sm font-bold text-gray-900">{user.name}</span>
              </Link>
            ) : (
              <div className="flex space-x-2">
                <Link to="/login" className="text-sm font-bold text-gray-700 hover:text-[#3c4f68] px-3 py-2 transition-colors">Login</Link>
                <Link to="/register" className="text-sm font-bold text-gray-700 hover:text-[#3c4f68] px-3 py-2 transition-colors">Sign Up</Link>
              </div>
            )}
          </div>

          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#3c4f68]"
            >
              {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Dark Sub-navbar - Centered and Spaced out */}
      <div className="bg-[#3c4f68] text-white text-sm py-4 border-t border-gray-700/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-2 font-bold">
          <Link to="/category/Electronics" className="hover:text-gray-300 transition-colors">Electronics</Link>
          <Link to="/category/Fashion" className="hover:text-gray-300 transition-colors">Fashion</Link>
          <Link to="/category/Home%20%26%20Living" className="hover:text-gray-300 transition-colors">Home & Living</Link>
          <Link to="/category/Beauty" className="hover:text-gray-300 transition-colors">Beauty</Link>
          <Link to="/category/Sports" className="hover:text-gray-300 transition-colors">Sports</Link>
          <Link to="/category/Toys" className="hover:text-gray-300 transition-colors">Toys</Link>
          <Link to="/category/Groceries" className="hover:text-gray-300 transition-colors">Groceries</Link>
          <Link to="/category/Automotive" className="hover:text-gray-300 transition-colors">Automotive</Link>          {!user?.isVendor && <Link to="/services" className="hover:text-gray-300 transition-colors font-medium">Services</Link>}
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {!user?.isVendor && <Link to="/services" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-indigo-800 hover:bg-indigo-50 hover:border-indigo-500">Services</Link>}
            {!user?.isVendor && <Link to={user ? "/wishlist" : "/login"} className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-indigo-800 hover:bg-indigo-50 hover:border-indigo-500">Wishlist ({wishlist.length})</Link>}
            {!user?.isVendor && <Link to={user ? "/cart" : "/login"} className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-indigo-800 hover:bg-indigo-50 hover:border-indigo-500">Cart ({cartCount})</Link>}
            {user ? (
              <Link to="/profile" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-indigo-800 hover:bg-indigo-50 hover:border-indigo-500">Profile</Link>
            ) : (
              <>
                <Link to="/login" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-indigo-800 hover:bg-indigo-50 hover:border-indigo-500">Login</Link>
                <Link to="/register" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-indigo-800 hover:bg-indigo-50 hover:border-indigo-500">Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;