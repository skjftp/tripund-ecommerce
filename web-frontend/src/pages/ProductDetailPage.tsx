import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, ShoppingCart, Truck, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { fetchProductById } from '../store/slices/productSlice';
import { addToCart } from '../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../store/slices/wishlistSlice';
import toast from 'react-hot-toast';
import MetaTags from '../components/MetaTags';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const { currentProduct: product, loading } = useSelector((state: RootState) => state.products);
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
  const isInWishlist = Array.isArray(wishlistItems) ? wishlistItems.some((item) => item.id === product?.id) : false;

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
    }
  }, [dispatch, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-lg" />
              <div>
                <div className="h-8 bg-gray-200 rounded mb-4" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-8" />
                <div className="h-12 bg-gray-200 rounded mb-4" />
                <div className="h-40 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <>
        <MetaTags />
        <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <button
            onClick={() => navigate('/products')}
            className="text-primary-600 hover:text-primary-700"
          >
            Back to Products
          </button>
        </div>
      </div>
      </>
    );
  }

  const handleAddToCart = () => {
    dispatch(addToCart({ product, quantity }));
    toast.success(`Added ${quantity} item(s) to cart!`);
  };

  const handleWishlistToggle = () => {
    if (isInWishlist) {
      dispatch(removeFromWishlist(product.id));
      toast.success('Removed from wishlist');
    } else {
      dispatch(addToWishlist(product));
      toast.success('Added to wishlist!');
    }
  };

  const allImages = product.images || [];
  const price = typeof product.price === 'number' ? product.price : 0;
  const salePrice = typeof product.sale_price === 'number' ? product.sale_price : null;
  const discountPercentage = salePrice && price > 0 ? 
    Math.round(((price - salePrice) / price) * 100) : 0;

  return (
    <>
      <MetaTags 
        title={`${product.name || product.title} - TRIPUND Lifestyle`}
        description={product.short_description || product.description || `Shop ${product.name || product.title} from TRIPUND Lifestyle's collection of premium Indian handicrafts and home decor.`}
        image={product.images?.[0] || 'https://storage.googleapis.com/tripund-product-images/og-image.jpg'}
        url={`https://tripundlifestyle.com/products/${product.id}`}
        type="product"
      />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
        <button
          onClick={() => navigate('/products')}
          className="mb-4 text-gray-600 hover:text-gray-800 flex items-center"
        >
          <ChevronLeft size={20} />
          Back to Products
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="aspect-square relative mb-4">
                <img
                  src={allImages[selectedImage]}
                  alt={product.title}
                  className="w-full h-full object-cover rounded-lg"
                />
                {discountPercentage > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 text-sm rounded">
                    -{discountPercentage}%
                  </div>
                )}
              </div>
              
              {allImages.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${
                        selectedImage === index ? 'border-primary-600' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name || product.title}</h1>
              
              {/* Artisan info removed - not in new structure */}

              <div className="mb-6">
                <span className="text-3xl font-bold text-primary-600">
                  ₹{(salePrice || price).toLocaleString()}
                </span>
                {salePrice && price > salePrice && (
                  <span className="ml-3 text-xl text-gray-500 line-through">
                    ₹{price.toLocaleString()}
                  </span>
                )}
              </div>

              <p className="text-gray-700 mb-6">{product.description}</p>

              {product.attributes && product.attributes.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Specifications</h3>
                  <dl className="grid grid-cols-2 gap-2">
                    {product.attributes.map((attr, index) => (
                      <div key={index}>
                        <dt className="text-gray-600 text-sm">{attr.name}:</dt>
                        <dd className="font-medium">{attr.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <div className="mb-6">
                {product.stock_status === 'in_stock' ? (
                  <span className="text-green-600 font-medium">✓ In Stock</span>
                ) : (
                  <span className="text-red-600 font-medium">Out of Stock</span>
                )}
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center border rounded-md">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={product.stock_status !== 'in_stock'}
                  className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  <ShoppingCart size={20} />
                  <span>Add to Cart</span>
                </button>

                <button
                  onClick={handleWishlistToggle}
                  className="p-3 border rounded-md hover:bg-gray-50"
                >
                  <Heart
                    size={20}
                    className={isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}
                  />
                </button>
              </div>

              <div className="border-t pt-6 space-y-3">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Truck size={20} />
                  <span>Free shipping on orders over ₹5,000</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Shield size={20} />
                  <span>Secure payment & buyer protection</span>
                </div>
              </div>
            </div>
          </div>

          {/* Artisan story section removed - not in new structure */}
        </div>
      </div>
    </div>
    </>
  );
}