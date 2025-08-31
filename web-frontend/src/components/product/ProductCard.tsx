import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
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
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
  const isInWishlist = Array.isArray(wishlistItems) ? wishlistItems.some((item) => item.id === product.id) : false;

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
  const isInStock = product.stock_status === 'in_stock' && product.stock_quantity > 0;

  // List view layout
  if (viewMode === 'list') {
    return (
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
                <button
                  onClick={handleAddToCart}
                  disabled={!isInStock}
                  className="bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <ShoppingCart size={18} />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid view layout (existing code)
  return (
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
          {product.featured && (
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
              {isInStock ? (
                <span className="text-sm text-green-600">In Stock</span>
              ) : (
                <span className="text-sm text-red-600">Out of Stock</span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!isInStock}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <ShoppingCart size={18} />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}