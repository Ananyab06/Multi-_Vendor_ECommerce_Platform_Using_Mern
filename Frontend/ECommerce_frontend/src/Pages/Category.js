
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Filter } from 'lucide-react';
import { useAppContext } from '../Context/AppContext';
import { getProductDiscountInfo } from '../utils/discount';

const normalizeCategory = (value) => (value || '').trim().toLowerCase();
const normalizeSize = (value) => String(value || '').trim().toUpperCase();

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '8', '9', '10', '11', '12'];

const Category = () => {
  const { name: rawName } = useParams();
  const categoryName = decodeURIComponent(rawName || '');
  const { addToCart, toggleWishlist, wishlist, products, user } = useAppContext();

  const [maxPrice, setMaxPrice] = useState(10000);
  const [selectedSize, setSelectedSize] = useState('');

  const categoryProducts = useMemo(() => {
    if (normalizeCategory(categoryName) === 'all') return products;
    const target = normalizeCategory(categoryName);
    return products.filter((p) => normalizeCategory(p.category) === target);
  }, [categoryName, products]);

  const priceSliderMax = useMemo(() => {
    if (categoryProducts.length === 0) return 10000;
    const highest = Math.max(...categoryProducts.map((p) => p.price));
    return Math.max(10000, Math.ceil(highest / 1000) * 1000);
  }, [categoryProducts]);

  useEffect(() => {
    setSelectedSize('');
    setMaxPrice(priceSliderMax);
  }, [categoryName]);

  useEffect(() => {
    setMaxPrice(priceSliderMax);
  }, [priceSliderMax]);

  const availableSizes = useMemo(() => {
    const sizes = new Set();
    categoryProducts.forEach((p) => {
      (p.sizes || []).forEach((s) => {
        const normalized = normalizeSize(s);
        if (normalized) sizes.add(normalized);
      });
    });
    return Array.from(sizes).sort(
      (a, b) => (SIZE_ORDER.indexOf(a) === -1 ? 99 : SIZE_ORDER.indexOf(a)) -
                (SIZE_ORDER.indexOf(b) === -1 ? 99 : SIZE_ORDER.indexOf(b)) || a.localeCompare(b)
    );
  }, [categoryProducts]);

  const filteredProducts = useMemo(() => {
    const targetSize = normalizeSize(selectedSize);
    return categoryProducts.filter((p) => {
      const matchesPrice = p.price <= maxPrice;
      const productSizes = (p.sizes || []).map(normalizeSize);
      const matchesSize = !targetSize || productSizes.includes(targetSize);
      return matchesPrice && matchesSize;
    });
  }, [categoryProducts, maxPrice, selectedSize]);
  return (
    <div className="flex flex-col md:flex-row gap-8 mt-8">
      {/* Sidebar Filters */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Filters</h2>
          </div>
          
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Max Price: ₹{maxPrice}</h3>
            <input
              type="range"
              min="0"
              max={priceSliderMax}
              step={priceSliderMax > 10000 ? 500 : 100}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>₹0</span>
              <span>₹{priceSliderMax.toLocaleString('en-IN')}+</span>
            </div>
          </div>

          {availableSizes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Size</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSize('')}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    selectedSize === '' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-600'
                  }`}
                >
                  All
                </button>
                {availableSizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      selectedSize === size ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-600'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => { setMaxPrice(priceSliderMax); setSelectedSize(''); }}
            className="w-full mt-8 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{categoryName === 'all' ? 'All Products' : categoryName}</h1>
        <p className="text-gray-500 mb-8">
          Showing {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''}
          {selectedSize ? ` in size ${normalizeSize(selectedSize)}` : ''}
        </p>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const isWishlisted = wishlist.some(item => item.id === product.id);
              return (
                <div key={product.id} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 group relative flex flex-col h-full">
                  {!user?.isVendor && (
                    <button 
                      onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
                      className="absolute top-6 right-6 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                    >
                      <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>
                  )}
                  <Link to={`/product/${product.id}`} className="block relative aspect-square overflow-hidden rounded-xl mb-4 bg-gray-100 flex-shrink-0">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </Link>
                  <div className="flex flex-col flex-grow">
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-gray-600">{product.rating}</span>
                    </div>
                    <Link to={`/product/${product.id}`}>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 hover:text-indigo-600 transition-colors">{product.name}</h3>
                    </Link>
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
                                ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your filters to see more results.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Category;
