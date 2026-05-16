
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShieldCheck, Truck, ShoppingCart, Heart } from 'lucide-react';
import { useAppContext } from '../Context/AppContext';
import { fetchProductById } from '../api.js';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, wishlist, products, user } = useAppContext();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      // First try to find in context products (already fetched from backend)
      const found = products.find(p => p.id === id);
      if (found) {
        setProduct(found);
        setSelectedSize(found.sizes && found.sizes.length > 0 ? found.sizes[0] : null);
        setLoading(false);
        return;
      }
      // If not found, fetch from backend using the id (which could be string or number)
      try {
        const response = await fetchProductById(id);
        setProduct(response.data);
        setSelectedSize(response.data.sizes && response.data.sizes.length > 0 ? response.data.sizes[0] : null);
      } catch (error) {
        console.error('Failed to fetch product:', error);
        // Fallback to first product in context (or show error)
        if (products.length > 0) {
          setProduct(products[0]);
          setSelectedSize(products[0].sizes && products[0].sizes.length > 0 ? products[0].sizes[0] : null);
        }
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id, products]);

  const isWishlisted = product ? wishlist.some(item => item.id === product.id) : false;

  const handleAddToCart = () => {
    if (!product) return;
    if (product?.sizes?.length > 0 && !selectedSize) {
      alert("Please select a size first.");
      return;
    }
    addToCart(product, quantity, selectedSize);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto mt-8 bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center">
        <div className="text-lg font-medium text-gray-600">Loading product details...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto mt-8 bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center">
        <div className="text-lg font-medium text-gray-600">Product not found.</div>
        <button onClick={() => navigate('/')} className="mt-4 text-indigo-600 hover:underline">
          Go back to home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 bg-white rounded-3xl p-6 lg:p-12 shadow-sm border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="rounded-2xl overflow-hidden bg-gray-50 aspect-square">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="h-5 w-5 fill-current" />
                <span className="font-bold text-gray-700">{product.rating}</span>
                <span>({product.reviews} reviews)</span>
              </div>
              <span>•</span>
              <span className="text-indigo-600 font-medium">By {product.vendor}</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900">₹{product.price.toFixed(2)}</p>
          </div>

          <p className="text-gray-600 mb-8 leading-relaxed">
            {product.description}
          </p>

          <div className="space-y-6 mb-8">
            {product?.sizes?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Size</h3>
                <div className="flex gap-3">
                  {product.sizes?.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 rounded-lg font-bold border transition-colors ${selectedSize === size ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Quantity</h3>
              <div className="flex items-center border border-gray-200 rounded-lg w-32">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 text-gray-600 hover:bg-gray-50">-</button>
                <span className="flex-1 text-center font-medium">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="px-4 py-2 text-gray-600 hover:bg-gray-50">+</button>
              </div>
              <p className="text-sm text-green-600 mt-2 font-medium">{product.stock} in stock</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-auto">
            {!user?.isVendor && (
              <button 
                onClick={handleAddToCart}
                className="flex-1 bg-indigo-600 text-white py-4 px-8 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex justify-center items-center gap-2"
              >
                <ShoppingCart className="h-5 w-5" /> Add to Cart
              </button>
            )}
            {!user?.isVendor && (
              <button 
                onClick={() => toggleWishlist(product)}
                className={`py-4 px-8 rounded-full font-bold border flex justify-center items-center gap-2 transition-colors ${isWishlisted ? 'border-red-200 bg-red-50 text-red-600' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} /> {isWishlisted ? 'Saved' : 'Wishlist'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-gray-100 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-gray-400" /> Free Delivery
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-gray-400" /> 30-Day Returns
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
