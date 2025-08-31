import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { removeFromCartWithSync, updateQuantityWithSync } from '../store/slices/cartSlice';
import { getPublicSettings, calculateShipping, type PublicSettings } from '../services/settings';
import { formatPrice } from '../utils/pricing';
import { calculateCartStateBasedGST, INDIAN_STATES } from '../utils/gst';

export default function CartPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { items, total } = useSelector((state: RootState) => state.cart);
  const [settings, setSettings] = useState<PublicSettings | null>(null);

  useEffect(() => {
    // Fetch dynamic settings on component mount
    getPublicSettings().then(setSettings).catch(console.error);
  }, []);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      dispatch(updateQuantityWithSync(productId, newQuantity));
    }
  };

  const handleRemove = (productId: string, variantId?: string) => {
    if (variantId) {
      dispatch(removeFromCartWithSync({ productId, variantId }));
    } else {
      dispatch(removeFromCartWithSync(productId));
    }
  };

  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <ShoppingBag className="mx-auto text-gray-400 mb-4" size={64} />
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700"
          >
            Continue Shopping
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              {Array.isArray(items) && items.map((item) => (
                <div
                  key={item.product_id}
                  className="p-6 border-b last:border-b-0"
                >
                  {/* Desktop Layout */}
                  <div className="hidden md:flex md:items-center">
                    <img
                      src={item.product.images?.[0] || ''}
                      alt={item.product.name || item.product.title}
                      className="w-24 h-24 object-cover rounded-md"
                    />
                    
                    <div className="flex-1 ml-6">
                      <Link
                        to={`/products/${item.product_id}`}
                        className="text-lg font-semibold hover:text-primary-600"
                      >
                        {item.product.name || item.product.title}
                      </Link>
                      {item.product.variant_info ? (
                        <p className="text-gray-600 text-sm mt-1">
                          {item.product.variant_info.color && `Color: ${item.product.variant_info.color}`}
                          {item.product.variant_info.color && item.product.variant_info.size && ' | '}
                          {item.product.variant_info.size && `Size: ${item.product.variant_info.size}`}
                        </p>
                      ) : (
                        <p className="text-gray-600 text-sm mt-1">
                          {/* No variant info */}
                        </p>
                      )}
                      <p className="text-primary-600 font-semibold mt-2">
                        ₹{item.price.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                        className="p-1 rounded-md border hover:bg-gray-100"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="px-3 py-1 min-w-[40px] text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                        className="p-1 rounded-md border hover:bg-gray-100"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="ml-6 text-right">
                      <p className="font-semibold">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </p>
                      <button
                        onClick={() => handleRemove(item.product_id, item.product.variant_info?.variant_id)}
                        className="text-red-500 hover:text-red-700 mt-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden">
                    <div className="flex gap-4 mb-4">
                      <img
                        src={item.product.images?.[0] || ''}
                        alt={item.product.name || item.product.title}
                        className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/products/${item.product_id}`}
                          className="font-semibold hover:text-primary-600 block leading-tight"
                        >
                          {item.product.name || item.product.title}
                        </Link>
                        {item.product.variant_info && (
                          <p className="text-gray-600 text-sm mt-1 leading-tight">
                            {item.product.variant_info.color && `Color: ${item.product.variant_info.color}`}
                            {item.product.variant_info.color && item.product.variant_info.size && ' | '}
                            {item.product.variant_info.size && `Size: ${item.product.variant_info.size}`}
                          </p>
                        )}
                        <p className="text-primary-600 font-semibold mt-2">
                          ₹{item.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    {/* Mobile Controls Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                          className="p-2 rounded-md border hover:bg-gray-100"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="px-3 py-1 min-w-[50px] text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                          className="p-2 rounded-md border hover:bg-gray-100"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <p className="font-semibold text-lg">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                        <button
                          onClick={() => handleRemove(item.product_id, item.product.variant_info?.variant_id)}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
              
              {/* Free shipping notice */}
              {settings && total < settings.shipping.free_shipping_threshold && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-800">
                    Add ₹{(settings.shipping.free_shipping_threshold - total).toLocaleString()} more to get{' '}
                    <span className="font-semibold">FREE SHIPPING!</span>
                  </p>
                </div>
              )}
              
              <div className="space-y-2 mb-4">
                {/* Note about state selection */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    GST will be calculated based on your delivery state at checkout
                  </p>
                </div>
                
                {/* Calculate GST breakdown from inclusive prices */}
                {(() => {
                  // Using Uttar Pradesh as default for cart display (will be accurate at checkout)
                  const gstBreakdown = calculateCartStateBasedGST(items, 'UP', settings?.payment.tax_rate || 18);
                  const shipping = settings ? calculateShipping(total, settings) : 0;
                  const finalTotal = total + shipping; // Total is already GST-inclusive
                  
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal (excl. GST)</span>
                        <span>₹{formatPrice(gstBreakdown.basePrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">GST ({gstBreakdown.gstRate}%)</span>
                        <span>₹{formatPrice(gstBreakdown.totalGST)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span>
                          {settings ? (
                            shipping === 0 ? (
                              <span className="text-green-600 font-medium">
                                Free
                              </span>
                            ) : (
                              `₹${formatPrice(shipping)}`
                            )
                          ) : (
                            'Calculating...'
                          )}
                        </span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total (incl. GST)</span>
                          <span>₹{formatPrice(finalTotal)}</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-primary-600 text-white py-3 rounded-md hover:bg-primary-700 transition-colors"
              >
                Proceed to Checkout
              </button>

              <Link
                to="/products"
                className="block text-center text-primary-600 hover:text-primary-700 mt-4"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}