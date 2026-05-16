import React, { useRef } from 'react';
import { Star, ShoppingCart, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../Context/AppContext';

const categories = [
  { name: 'Electronics', image: 'https://img.freepik.com/premium-photo/futuristic-gadgets-showcase-lineup-sleek-modern-technological-devices_977107-682.jpg?w=1060' },
  { name: 'Fashion', image: 'https://tse2.mm.bing.net/th/id/OIP.Dq4JuVt1wk-es2fayGfDCgHaJK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3' },
  { name: 'Home & Living', image: 'https://www.thespruce.com/thmb/c1xl6ax-LRVnZwNPZSUR09SPlhg=/3000x0/filters:no_upscale():max_bytes(150000):strip_icc()/minimalist-living-room-ideas-5213203-hero-d27f8dcfa0b84706adbbd28ea0e1b48d.jpg' },
  { name: 'Beauty', image: 'https://tse4.mm.bing.net/th/id/OIP.zCE8yImN4KW8LY5EitNlNQHaFj?r=0&rs=1&pid=ImgDetMain&o=7&rm=3' },
  { name: 'Sports', image: 'https://tse3.mm.bing.net/th/id/OIP.kifHUsQaPnHcR1uP4a4sjQEkDV?r=0&rs=1&pid=ImgDetMain&o=7&rm=3' },
  { name: 'Toys', image: 'https://www.designer-daily.com/wp-content/uploads/2013/08/m32.jpg?is-pending-load=1' },
  { name: 'Groceries', image: 'https://th.bing.com/th/id/OIP.Afan5T48odnZGchgV1uT9gHaHa?w=200&h=201&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3' },
  { name: 'Automotive', image: 'https://tse1.mm.bing.net/th/id/OIP.b83_paFNBJ3g6WgQM-E6vgHaE6?r=0&rs=1&pid=ImgDetMain&o=7&rm=3' },
];

const Home = () => {
  const { addToCart, toggleWishlist, wishlist, products, services, user } = useAppContext();
  const [activeTab, setActiveTab] = React.useState('products');
  const sliderRef = useRef(null);
  
  const featuredProducts = products.slice(0, 5);
  const topServices = services.slice(0, 4);

  const scrollLeft = () => {
    sliderRef.current.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    sliderRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-indigo-900 text-white">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80"
            alt="Hero Background"
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-indigo-900/80 to-transparent"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-24 sm:py-32 lg:px-8 flex flex-col items-start">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl max-w-2xl">
            {user?.isVendor ? 'Grow Your Business with UniBox' : 'Discover Exceptional Products for Your Lifestyle'}
          </h1>
          <p className="mt-6 text-xl max-w-xl text-indigo-100">
            {user?.isVendor 
              ? 'Manage your products, track sales, and connect with customers. Build your online store and reach more buyers today.'
              : 'Shop the latest trends, newest electronics, and premium services all in one place. Experience seamless shopping today.'
            }
          </p>
          {!user?.isVendor && (
            <div className="mt-10 flex gap-4">
              <a href="#products" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-indigo-900 bg-white hover:bg-indigo-50 transition-colors shadow-lg hover:shadow-xl">
                Shop Now
              </a>
              <Link to="/services" className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-base font-medium rounded-full text-white hover:bg-white/10 transition-colors">
                Explore Services
              </Link>
            </div>
          )}
          {user?.isVendor && (
            <div className="mt-10 flex gap-4">
              <Link to="/vendor-login" className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-base font-medium rounded-full text-white hover:bg-white/10 transition-colors">
                Manage Store
              </Link>
            </div>
          )}
        </div>
      </section>
      
       {/* Categories Section (Slider) */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Shop by Category</h2>
          <div className="flex gap-2">
            <button onClick={scrollLeft} className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button onClick={scrollRight} className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
        <div ref={sliderRef} className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {categories.map((category) => (
            <Link to={`/category/${category.name}`} key={category.name} className="flex-none w-64 snap-start group relative rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300">
              <div className="aspect-w-3 aspect-h-4">
                <img src={category.image} alt={category.name} className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 p-6 w-full">
                <h3 className="text-xl font-bold text-white">{category.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section id="featured-products" className="scroll-mt-24">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Featured Products</h2>
            <p className="text-slate-500 font-medium mt-1">Handpicked premium items for you.</p>
          </div>
          <Link 
            to="/category/all" 
            className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-2 group"
          >
            View All Products
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {featuredProducts.map((product) => {
            const isWishlisted = wishlist.some(item => item.id === product.id);
            return (
              <div key={product.id} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group relative flex flex-col h-full">
                {!user?.isVendor && (
                  <button 
                    onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
                    className="absolute top-6 right-6 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                  >
                    <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                )}
                <Link to={`/product/${product.id}`} className="block relative aspect-square overflow-hidden rounded-xl mb-4 bg-gray-100 flex-shrink-0">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </Link>
                <div className="flex flex-col flex-grow">
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold text-gray-600">{product.rating}</span>
                  </div>
                  <Link to={`/product/${product.id}`}>
                    <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 hover:text-indigo-600 transition-colors">{product.name}</h3>
                  </Link>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sold by {product.vendor}</p>
                  <div className="mt-auto pt-3 flex items-center justify-between">
                    <p className="text-lg font-black text-indigo-600">₹{Number(product.price || 0).toFixed(2)}</p>
                    {!user?.isVendor && (
                      <button 
                        onClick={() => addToCart(product, 1, product.sizes?.[0])}
                        className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all duration-300"
                        title="Add to Cart"
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};

export default Home;



