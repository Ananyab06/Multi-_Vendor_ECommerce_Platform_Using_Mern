import React, { useRef, useState, useEffect } from 'react';
import { Star, ShoppingCart, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../Context/AppContext';
import { getProductDiscountInfo } from '../utils/discount';

const dynamicBanners = [
  {
    id: 1,
    title: "Starting ₹99 | Budget Store",
    subtitle: "Top Brands · Wide Selection",
    badge: "Unlimited 5% Cashback with Amazon Pay ICICI card",
    bgGradient: "from-sky-100 via-sky-200 to-indigo-100",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop",
    link: "/category/Home%20%26%20Living"
  },
  {
    id: 2,
    title: "Up to 60% off on Smart Electronics",
    subtitle: "Latest Mobiles, Laptops & Audio Gear",
    badge: "No Cost EMI available up to 12 Months",
    bgGradient: "from-[#e3fafc] via-[#c5f6fa] to-[#99e9f2]",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop",
    link: "/category/Electronics"
  },
  {
    id: 3,
    title: "Upgrade Your Wardrobe",
    subtitle: "Styles for Men, Women & Kids",
    badge: "Extra ₹200 off on your first fashion order",
    bgGradient: "from-[#f3f0ff] via-[#e5dbff] to-[#d0bfff]",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop",
    link: "/category/Fashion"
  }
];

const promoCards = [
  {
    title: "Appliances for your home",
    link: "/category/Electronics",
    linkText: "See all offers",
    items: [
      { name: "Air Conditioners", image: "https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=300", offer: "Up to 45% off" },
      { name: "Refrigerators", image: "https://images.unsplash.com/photo-1571175482276-5447b5238506?w=300", offer: "Up to 35% off" },
      { name: "Microwaves", image: "https://images.unsplash.com/photo-1574269661728-8a27d4a5c92c?w=300", offer: "Min 20% off" },
      { name: "Washing Machines", image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=300", offer: "Up to 50% off" }
    ]
  },
  {
    title: "Revamp your home in style",
    link: "/category/Home%20%26%20Living",
    linkText: "Explore home decor",
    items: [
      { name: "Bedsheets", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=300", offer: "Starting ₹199" },
      { name: "Curtains", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300", offer: "Starting ₹299" },
      { name: "Cushions", image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=300", offer: "Under ₹149" },
      { name: "Wall Art", image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=300", offer: "Up to 60% off" }
    ]
  },
  {
    title: "Starting ₹49 | Daily essentials",
    link: "/category/Groceries",
    linkText: "Shop essentials",
    items: [
      { name: "Cleaning Wipes", image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300", offer: "Starting ₹49" },
      { name: "Laundry Detergents", image: "https://images.unsplash.com/photo-1610557892470-76d74cd120a1?w=300", offer: "Up to 30% off" },
      { name: "Kitchen Towels", image: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=300", offer: "Under ₹99" },
      { name: "Soaps & Sanitizers", image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=300", offer: "Buy 1 Get 1 Free" }
    ]
  },
  {
    title: "Top Offers on Beauty & Grooming",
    link: "/category/Beauty",
    linkText: "View all beauty deals",
    items: [
      { name: "Skincare", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300", offer: "Min 15% off" },
      { name: "Hair Care", image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=300", offer: "Up to 40% off" },
      { name: "Makeup", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300", offer: "Starting ₹149" },
      { name: "Fragrances", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=300", offer: "Flat 25% off" }
    ]
  }
];

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
  const { addToCart, toggleWishlist, wishlist, products, user } = useAppContext();
  const navigate = useNavigate();
  const sliderRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (user?.isVendor) {
      navigate('/vendor');
    }
  }, [user, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % dynamicBanners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);
  
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % dynamicBanners.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + dynamicBanners.length) % dynamicBanners.length);
  
  const featuredProducts = products.slice(0, 5);

  const scrollLeft = () => {
    sliderRef.current.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    sliderRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  };

  return (
    <div className="space-y-16">
      {/* Banners Section */}
      <section className="relative overflow-hidden shadow-md h-[340px] md:h-[450px] group w-screen -ml-[calc(50vw-50%)] bg-gray-100">
        <div className="flex w-full h-full transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {dynamicBanners.map((banner) => (
            <div key={banner.id} className={`w-full flex-shrink-0 min-w-full h-full relative bg-gradient-to-r ${banner.bgGradient} flex items-center justify-between px-8 md:px-20`}>
              {/* Left Content */}
              <div className="max-w-lg space-y-4">
                <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Limited Time Offer</span>
                <h1 className="text-3xl md:text-5xl font-black text-gray-950 tracking-tight leading-tight">{banner.title}</h1>
                <p className="text-base md:text-xl font-bold text-gray-700">{banner.subtitle}</p>
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 p-3 rounded-xl inline-flex items-center gap-2 shadow-sm">
                  <span className="bg-yellow-400 text-gray-950 text-[10px] font-black px-2 py-0.5 rounded">PAYBACK</span>
                  <span className="text-xs font-bold text-gray-800">{banner.badge}</span>
                </div>
                <div>
                  <Link to={banner.link} className="inline-block bg-[#3c4f68] hover:bg-[#2d3a4c] text-white font-black text-sm px-6 py-3 rounded-full shadow-lg transition-all transform hover:scale-105">
                    Shop Now
                  </Link>
                </div>
              </div>
              {/* Right Image Container */}
              <div className="hidden md:block w-96 h-72 rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-white transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover saturate-125 hover:scale-110 transition-transform duration-700"
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Navigation Arrows */}
        <button 
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white/90 backdrop-blur-sm p-3 rounded-full text-gray-900 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button 
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white/90 backdrop-blur-sm p-3 rounded-full text-gray-900 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </section>

      {/* Overlapping E-commerce Promo Cards */}
      <section className="relative z-10 -mt-20 md:-mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {promoCards.map((card, index) => (
            <div key={index} className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 flex flex-col h-full hover:shadow-2xl transition-shadow duration-300">
              <h3 className="text-lg font-black text-gray-900 mb-4 tracking-tight leading-snug">{card.title}</h3>
              <div className="grid grid-cols-2 gap-3 flex-grow mb-4">
                {card.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col">
                    <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden mb-1.5 border border-slate-100">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-900 truncate">{item.name}</span>
                    <span className="text-[9px] font-bold text-emerald-600">{item.offer}</span>
                  </div>
                ))}
              </div>
              <Link to={card.link} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors mt-auto pt-2 block border-t border-slate-50">
                {card.linkText} →
              </Link>
            </div>
          ))}
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
            <Link to={`/category/${encodeURIComponent(category.name)}`} key={category.name} className="flex-none w-64 snap-start group relative rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-transparent hover:border-indigo-500/30">
              <div className="aspect-w-3 aspect-h-4">
                <img src={category.image} alt={category.name} className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-0 left-0 p-6 w-full transform group-hover:-translate-y-2 transition-transform duration-300">
                <h3 className="text-xl font-black text-white tracking-wide">{category.name}</h3>
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

        {featuredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-lg font-semibold text-gray-900 mb-2">No products available yet</p>
            <p className="text-gray-500">Check back soon — vendors are adding new listings.</p>
          </div>
        ) : (
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
                  <div className="mt-auto pt-3 flex items-end justify-between gap-2">
                    {(() => {
                      const { hasDiscount, discountPercent, originalPrice } = getProductDiscountInfo(product);
                      return (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1 flex-wrap">
                            {hasDiscount && (
                              <span className="text-red-500 text-xs font-black">-{discountPercent}%</span>
                            )}
                            <span className="text-sm font-black text-indigo-600">
                              ₹{Number(product.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          {hasDiscount && (
                            <p className="text-[9px] text-gray-400 line-through truncate">M.R.P. ₹{Number(originalPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                          )}
                          <p className="text-[8px] text-gray-400 font-bold tracking-tight uppercase">(inc. of all taxes)</p>
                        </div>
                      );
                    })()}
                    {!user?.isVendor && (
                      <button 
                        onClick={() => addToCart(product, 1, product.sizes?.[0])}
                        className="bg-indigo-50 p-2 rounded-xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all duration-300 flex-shrink-0"
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
        )}
      </section>

    </div>
  );
};

export default Home;