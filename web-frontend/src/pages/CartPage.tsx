import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { RootState } from '../store';
import { removeFromCart, updateQuantity } from '../store/slices/cartSlice';

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, total } = useSelector((state: RootState) => state.cart);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      dispatch(updateQuantity({ productId, quantity: newQuantity }));
    }
  };

  const handleRemove = (productId: string) => {
    dispatch(removeFromCart(productId));
  };

  if (items.length === 0) {
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
              {items.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center p-6 border-b last:border-b-0"
                >
                  <img
                    src={item.product.images.main}
                    alt={item.product.title}
                    className="w-24 h-24 object-cover rounded-md"
                  />
                  
                  <div className="flex-1 ml-6">
                    <Link
                      to={`/products/${item.product_id}`}
                      className="text-lg font-semibold hover:text-primary-600"
                    >
                      {item.product.title}
                    </Link>
                    <p className="text-gray-600 text-sm mt-1">
                      {item.product.artisan?.name && `by ${item.product.artisan.name}`}
                    </p>
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
                      onClick={() => handleRemove(item.product_id)}
                      className="text-red-500 hover:text-red-700 mt-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>{total > 5000 ? 'Free' : '₹500'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>₹{Math.round(total * 0.18).toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>
                    ₹{(total + (total > 5000 ? 0 : 500) + Math.round(total * 0.18)).toLocaleString()}
                  </span>
                </div>
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