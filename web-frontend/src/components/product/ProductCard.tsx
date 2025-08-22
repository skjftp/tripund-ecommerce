import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { Product } from '../../types';
import { addToCart } from '../../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../../store/slices/wishlistSlice';
import { RootState } from '../../store';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
  const isInWishlist = Array.isArray(wishlistItems) ? wishlistItems.some((item) => item.id === product.id) : false;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(addToCart({ product, quantity: 1 }));
    toast.success('Added to cart!');
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isInWishlist) {
      dispatch(removeFromWishlist(product.id));
      toast.success('Removed from wishlist');
    } else {
      dispatch(addToWishlist(product));
      toast.success('Added to wishlist!');
    }
  };

  const discountPercentage = product.discount || 
    Math.round(((product.price.original - product.price.current) / product.price.original) * 100);

  return (
    <Link to={`/products/${product.id}`} className="group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
        <div className="relative aspect-square">
          <img
            src={product.images.main}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {discountPercentage > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-sm rounded">
              -{discountPercentage}%
            </div>
          )}
          {product.featured && (
            <div className="absolute top-2 right-2 bg-primary-600 text-white px-2 py-1 text-sm rounded">
              Featured
            </div>
          )}
          <button
            onClick={handleWishlistToggle}
            className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            <Heart
              size={20}
              className={isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}
            />
          </button>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2">
            {product.title}
          </h3>
          
          {product.artisan && (
            <p className="text-sm text-gray-500 mb-2">
              by {product.artisan.name} • {product.artisan.location}
            </p>
          )}

          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xl font-bold text-primary-600">
                {product.price.currency}{product.price.current.toLocaleString()}
              </span>
              {product.price.original > product.price.current && (
                <span className="ml-2 text-sm text-gray-500 line-through">
                  {product.price.currency}{product.price.original.toLocaleString()}
                </span>
              )}
            </div>
            {product.inventory.in_stock ? (
              <span className="text-sm text-green-600">In Stock</span>
            ) : (
              <span className="text-sm text-red-600">Out of Stock</span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!product.inventory.in_stock}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            <ShoppingCart size={18} />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </Link>
  );
}