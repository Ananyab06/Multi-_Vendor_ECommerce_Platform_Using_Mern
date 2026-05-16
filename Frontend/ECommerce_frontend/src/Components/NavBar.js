import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, Search as SearchIcon, Menu, X, ShoppingBag } from 'lucide-react';
import { useAppContext } from '../Context/AppContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { cart, wishlist, user } = useAppContext();
  const navigate = useNavigate();

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <ShoppingBag className="h-8 w-8 text-indigo-600" />
              <span className="font-bold text-xl text-gray-900 tracking-tight">Unibox</span>
            </Link>
          </div>
          
          <div className="flex-1 flex items-center justify-center px-2 lg:ml-6 lg:justify-end">
            <form onSubmit={handleSearch} className="max-w-lg w-full lg:max-w-xs relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-300"
                placeholder="Search products & services..."
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          <div className="hidden lg:ml-6 lg:flex lg:items-center space-x-6">
            <Link to="/vendor-login" className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold hover:bg-indigo-100 transition-all border border-indigo-100">Sell</Link>
            {!user?.isVendor && <Link to="/services" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">Services</Link>}
            <div className="h-6 w-px bg-gray-200"></div>
            {!user?.isVendor && (
              <>
                <Link to="/wishlist" className="text-gray-500 hover:text-indigo-600 transition-colors relative">
                  <Heart className="h-6 w-6" />
                  {wishlist.length > 0 && <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">{wishlist.length}</span>}
                </Link>
                <Link to="/cart" className="text-gray-500 hover:text-indigo-600 transition-colors relative">
                  <ShoppingCart className="h-6 w-6" />
                  {cartCount > 0 && <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-indigo-600 rounded-full">{cartCount}</span>}
                </Link>
              </>
            )}
            
            {user ? (
              <Link to="/profile" className="text-gray-500 hover:text-indigo-600 transition-colors mr-2 flex items-center gap-2">
                <User className="h-6 w-6" />
                <span className="text-sm font-bold text-gray-900">{user.name}</span>
              </Link>
            ) : (
              <div className="flex space-x-2">
                <Link to="/login" className="text-sm font-bold text-gray-700 hover:text-indigo-600 px-3 py-2">Login</Link>
                <Link to="/register" className="text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-full transition-colors">Sign Up</Link>
              </div>
            )}
          </div>

          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link to="/vendor-login" className="block pl-3 pr-4 py-2 border-l-4 border-indigo-500 text-base font-bold text-indigo-700 bg-indigo-50">Sell on Unibox</Link>
            {!user?.isVendor && <Link to="/services" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-indigo-800 hover:bg-indigo-50 hover:border-indigo-500">Services</Link>}
            {!user?.isVendor && <Link to="/wishlist" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-indigo-800 hover:bg-indigo-50 hover:border-indigo-500">Wishlist ({wishlist.length})</Link>}
            {!user?.isVendor && <Link to="/cart" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-indigo-800 hover:bg-indigo-50 hover:border-indigo-500">Cart ({cartCount})</Link>}
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