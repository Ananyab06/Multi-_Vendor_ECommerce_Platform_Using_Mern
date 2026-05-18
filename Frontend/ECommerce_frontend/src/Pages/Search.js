import React, { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Calendar } from 'lucide-react';
import { useAppContext } from '../Context/AppContext';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { addToCart, toggleWishlist, wishlist, products, services, user } = useAppContext();
  const [searchType, setSearchType] = React.useState('all'); // 'all', 'product', 'service'

  const searchResults = useMemo(() => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    
    let filteredProducts = products.filter(
      p => p.name.toLowerCase().includes(lowerQuery) || p.category.toLowerCase().includes(lowerQuery)
    ).map(p => ({ ...p, type: 'product' }));

    let filteredServices = services.filter(
      s => s.name.toLowerCase().includes(lowerQuery)
    ).map(s => ({ ...s, type: 'service' }));

    if (searchType === 'product') return filteredProducts;
    if (searchType === 'service') return filteredServices;
    return [...filteredProducts, ...filteredServices];
  }, [query, products, services, searchType]);

  return (
    <div className="max-w-7xl mx-auto mt-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Results</h1>
          <p className="text-gray-500">
            Showing {searchResults.length} results for "{query}"
          </p>
        </div>
        <div className="flex p-1 bg-gray-100 rounded-xl">
          {['all', 'product', 'service'].map((type) => (
            <button
              key={type}
              onClick={() => setSearchType(type)}
              className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                searchType === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {type}s
            </button>
          ))}
        </div>
      </div>

      {searchResults.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {searchResults.map((item) => {
            const isWishlisted = item.type === 'product' && wishlist.some(i => i.id === item.id);
            const isProduct = item.type === 'product';
            
            return (
              <div key={`${item.type}-${item.id}`} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 group relative flex flex-col h-full">
                {isProduct && !user?.isVendor && (
                  <button 
                    onClick={(e) => { e.preventDefault(); toggleWishlist(item); }}
                    className="absolute top-6 right-6 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                  >
                    <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                )}
                
                <Link to={isProduct ? `/product/${item.id}` : '/services'} className="block relative aspect-square overflow-hidden rounded-xl mb-4 bg-gray-100 flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {!isProduct && (
                    <div className="absolute top-2 left-2 bg-teal-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">Service</div>
                  )}
                </Link>

                <div className="flex flex-col flex-grow">
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-600">{item.rating}</span>
                  </div>
                  <Link to={isProduct ? `/product/${item.id}` : '/services'}>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 hover:text-indigo-600 transition-colors">{item.name}</h3>
                  </Link>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{isProduct ? 'Sold by' : 'Provided by'} {item.vendor}</p>
                  <div className="mt-auto pt-3 flex items-center justify-between">
                    <p className="text-lg font-bold text-indigo-600">
                      {!isProduct ? 'From ' : ''}₹{Number(item.price || 0).toFixed(2)}
                    </p>
                    {isProduct ? (
                      !user?.isVendor && (
                        <button 
                          onClick={() => addToCart(item, 1, item.sizes?.[0])}
                          className="bg-indigo-50 p-2 rounded-full text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors"
                          title="Add to Cart"
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </button>
                      )
                    ) : (
                      <Link to="/services" className="bg-teal-50 p-2 rounded-full text-teal-600 hover:bg-teal-600 hover:text-white transition-colors">
                        <Calendar className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-500">Try adjusting your search terms to see more products and services.</p>
        </div>
      )}
    </div>
  );
};

export default Search;



