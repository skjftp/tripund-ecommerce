import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { RootState } from '../store';
import { removeFromWishlist, clearWishlist } from '../store/slices/wishlistSlice';
import { addToCart } from '../store/slices/cartSlice';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);

  const handleRemove = (productId: string) => {
    dispatch(removeFromWishlist(productId));
    toast.success('Removed from wishlist');
  };

  const handleAddToCart = (product: any) => {
    dispatch(addToCart({ product, quantity: 1 }));
    toast.success('Added to cart!');
  };

  const handleClearWishlist = () => {
    if (window.confirm('Are you sure you want to clear your wishlist?')) {
      dispatch(clearWishlist());
      toast.success('Wishlist cleared');
    }
  };

  if (!Array.isArray(wishlistItems) || wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Heart className="mx-auto text-gray-400 mb-4" size={64} />
          <h2 className="text-2xl font-bold mb-4">Your wishlist is empty</h2>
          <p className="text-gray-600 mb-8">
            Save your favorite items here to purchase them later.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700"
          >
            Explore Products
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Wishlist</h1>
            <p className="text-gray-600 mt-1">{wishlistItems.length} items saved</p>
          </div>
          <button
            onClick={handleClearWishlist}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Clear Wishlist
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.isArray(wishlistItems) && wishlistItems.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <Link to={`/products/${product.id}`} className="block relative aspect-square">
                <img
                  src={product.images?.[0] || ''}
                  alt={product.name || product.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                {product.sale_price && product.price > product.sale_price && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-sm rounded">
                    -{Math.round(((product.price - product.sale_price) / product.price) * 100)}%
                  </div>
                )}
              </Link>

              <div className="p-4">
                <Link to={`/products/${product.id}`}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2 hover:text-primary-600">
                    {product.name || product.title}
                  </h3>
                </Link>

                {/* Artisan info removed - not in new structure */}

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xl font-bold text-primary-600">
                      ₹{(product.sale_price || product.price).toLocaleString()}
                    </span>
                    {product.sale_price && product.price > product.sale_price && (
                      <span className="ml-2 text-sm text-gray-500 line-through">
                        ₹{product.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock_status !== 'in_stock'}
                    className="flex-1 bg-primary-600 text-white py-2 px-3 rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm"
                  >
                    <ShoppingCart size={16} className="mr-1" />
                    {product.stock_status === 'in_stock' ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                  <button
                    onClick={() => handleRemove(product.id)}
                    className="p-2 border border-gray-300 rounded-md hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Share Your Wishlist</h2>
          <p className="text-gray-600 mb-4">
            Share your wishlist with friends and family so they know exactly what you'd love!
          </p>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Share on Facebook
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
              Share on WhatsApp
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}