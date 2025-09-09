import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, AlertTriangle, Bell } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { Product } from '../../types';
import { addToCartWithSync } from '../../store/slices/cartSlice';
import { addToWishlistWithSync, removeFromWishlistWithSync } from '../../store/slices/wishlistSlice';
import { RootState, AppDispatch } from '../../store';
import ImageCarousel from '../common/ImageCarousel';
import { toProperCase } from '../../utils/textUtils';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
}

export default function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const isInWishlist = Array.isArray(wishlistItems) ? wishlistItems.some((item) => item.id === product.id) : false;
  
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [requestNotes, setRequestNotes] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  
  // Check if product is out of stock
  const isOutOfStock = () => {
    if (product.has_variants && product.variants && product.variants.length > 0) {
      // For variant products, out of stock if ALL variants are out of stock
      return !product.variants.some(variant => variant.stock_quantity > 0 && variant.available);
    } else {
      // For simple products, check main stock
      return (product.stock_quantity || 0) <= 0;
    }
  };
  
  const outOfStock = isOutOfStock();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(addToCartWithSync(product, 1));
    toast.success('Added to cart!');
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isInWishlist) {
      dispatch(removeFromWishlistWithSync(product.id));
      toast.success('Removed from wishlist');
    } else {
      dispatch(addToWishlistWithSync(product));
      toast.success('Added to wishlist!');
    }
  };

  const handleStockRequest = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login to request this product');
      navigate('/login');
      return;
    }

    setSubmittingRequest(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://tripund-backend-665685012221.asia-south1.run.app/api/v1'}/stock-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity: requestQuantity,
          notes: requestNotes,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Stock request submitted! We\'ll notify you when available.');
        setShowRequestModal(false);
        setRequestNotes('');
        setRequestQuantity(1);
      } else {
        toast.error(result.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Stock request error:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Calculate prices based on variants if available
  let price = typeof product.price === 'number' ? product.price : 0;
  let salePrice = typeof product.sale_price === 'number' ? product.sale_price : null;
  
  // If product has variants, show the cheapest variant price
  if (product.has_variants && product.variants && product.variants.length > 0) {
    // Find the cheapest available variant
    const availableVariants = product.variants.filter(v => v.available);
    if (availableVariants.length > 0) {
      // Find minimum price considering both regular and sale prices
      const minVariant = availableVariants.reduce((min, variant) => {
        const variantEffectivePrice = variant.sale_price || variant.price;
        const minEffectivePrice = min.sale_price || min.price;
        return variantEffectivePrice < minEffectivePrice ? variant : min;
      });
      
      price = minVariant.price;
      salePrice = minVariant.sale_price || null;
    }
  }
  
  const discountPercentage = salePrice && price > 0 ? 
    Math.round(((price - salePrice) / price) * 100) : 0;

  const displayPrice = salePrice || price;
  
  // Show "From" prefix if product has multiple price points
  const showFromPrefix = product.has_variants && product.variants && 
    product.variants.some(v => v.available && (v.price !== price || v.sale_price !== salePrice));
  // Check if product is in stock (improved logic)
  const isInStock = (() => {
    if (product.has_variants && product.variants && product.variants.length > 0) {
      // For variant products, in stock if ANY variant has stock
      return product.variants.some(variant => variant.stock_quantity > 0 && variant.available);
    } else {
      // For simple products, check main stock
      return (product.stock_quantity || 0) > 0;
    }
  })();

  // List view layout
  if (viewMode === 'list') {
    return (
      <>
      <Link to={`/products/${product.id}`} className="group block">
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow flex">
          <div className="relative w-48 h-48 bg-gray-100 flex-shrink-0">
            <ImageCarousel 
              images={product.images || []} 
              productName={product.name}
              className="absolute inset-0 w-full h-full"
            />
            {discountPercentage > 0 && (
              <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-sm rounded z-10">
                -{discountPercentage}%
              </div>
            )}
          </div>
          
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {toProperCase(product.name || '')}
              </h3>
              <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                {product.short_description || product.description}
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xl font-bold text-primary-600">
                  {showFromPrefix && 'From '}₹{displayPrice ? displayPrice.toLocaleString() : '0'}
                </span>
                {salePrice && price > 0 && (
                  <span className="ml-2 text-sm text-gray-500 line-through">
                    ₹{price.toLocaleString()}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleWishlistToggle}
                  className="bg-white p-2 rounded-full shadow-md hover:shadow-lg transition-shadow"
                >
                  <Heart
                    size={20}
                    className={isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}
                  />
                </button>
                {!outOfStock ? (
                  <button
                    onClick={handleAddToCart}
                    className="bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors flex items-center space-x-2"
                  >
                    <ShoppingCart size={18} />
                    <span>Add to Cart</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowRequestModal(true)}
                    className="bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors flex items-center space-x-2"
                  >
                    <Bell size={18} />
                    <span>Request</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Stock Request Modal for List View */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h3>
            <p className="text-gray-600 mb-4 text-sm">Request when available</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setRequestQuantity(Math.max(1, requestQuantity - 1))}
                    className="w-8 h-8 border rounded-md flex items-center justify-center text-sm hover:bg-gray-50"
                  >-</button>
                  <span className="text-lg font-medium w-8 text-center">{requestQuantity}</span>
                  <button
                    onClick={() => setRequestQuantity(requestQuantity + 1)}
                    className="w-8 h-8 border rounded-md flex items-center justify-center text-sm hover:bg-gray-50"
                  >+</button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
                <textarea
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="Any specific requirements..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowRequestModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
              >Cancel</button>
              <button
                onClick={handleStockRequest}
                disabled={submittingRequest}
                className="flex-1 py-2 px-4 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:bg-orange-300 flex items-center justify-center space-x-2 text-sm"
              >
                {submittingRequest ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Bell size={14} />
                    <span>Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
    );
  }

  // Grid view layout (existing code)
  return (
    <>
    <Link to={`/products/${product.id}`} className="group h-full">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow h-full flex flex-col">
        {/* Fixed aspect ratio container for image */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <ImageCarousel 
            images={product.images || []} 
            productName={product.name}
            className="absolute inset-0 w-full h-full"
          />
          {discountPercentage > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-sm rounded z-10">
              -{discountPercentage}%
            </div>
          )}
          {outOfStock && (
            <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 text-sm rounded z-10 flex items-center gap-1">
              <AlertTriangle size={14} />
              Out of Stock
            </div>
          )}
          {!outOfStock && product.featured && (
            <div className="absolute top-2 right-2 bg-primary-600 text-white px-2 py-1 text-sm rounded z-10">
              Featured
            </div>
          )}
          <button
            onClick={handleWishlistToggle}
            className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-md hover:shadow-lg transition-shadow z-10"
          >
            <Heart
              size={20}
              className={isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}
            />
          </button>
        </div>

        {/* Content section with flex-grow */}
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2 min-h-[3.5rem]">
            {toProperCase(product.name || '')}
          </h3>
          
          <p className="text-sm text-gray-500 mb-2 line-clamp-2 min-h-[2.5rem]">
            {product.short_description || product.description}
          </p>

          {/* Push price section to bottom */}
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xl font-bold text-primary-600">
                  {showFromPrefix && 'From '}₹{displayPrice ? displayPrice.toLocaleString() : '0'}
                </span>
                {salePrice && price > 0 && (
                  <span className="ml-2 text-sm text-gray-500 line-through">
                    ₹{price.toLocaleString()}
                  </span>
                )}
              </div>
              {!outOfStock ? (
                <span className="text-sm text-green-600">In Stock</span>
              ) : (
                <span className="text-sm text-red-600">Out of Stock</span>
              )}
            </div>

            {!outOfStock ? (
              <button
                onClick={handleAddToCart}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
              >
                <ShoppingCart size={18} />
                <span>Add to Cart</span>
              </button>
            ) : (
              <button
                onClick={() => setShowRequestModal(true)}
                className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Bell size={18} />
                <span>Request when available</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>

    {/* Stock Request Modal */}
    {showRequestModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-sm w-full p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h3>
          <p className="text-gray-600 mb-4 text-sm">Request when available</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setRequestQuantity(Math.max(1, requestQuantity - 1))}
                  className="w-8 h-8 border rounded-md flex items-center justify-center text-sm hover:bg-gray-50"
                >
                  -
                </button>
                <span className="text-lg font-medium w-8 text-center">{requestQuantity}</span>
                <button
                  onClick={() => setRequestQuantity(requestQuantity + 1)}
                  className="w-8 h-8 border rounded-md flex items-center justify-center text-sm hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                placeholder="Any specific requirements..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                rows={2}
              />
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => setShowRequestModal(false)}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleStockRequest}
              disabled={submittingRequest}
              className="flex-1 py-2 px-4 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:bg-orange-300 flex items-center justify-center space-x-2 text-sm"
            >
              {submittingRequest ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Bell size={14} />
                  <span>Submit</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}