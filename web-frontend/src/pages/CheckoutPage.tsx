import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Truck, MapPin, User, ChevronRight } from 'lucide-react';
import { RootState } from '../store';
import { clearCart } from '../store/slices/cartSlice';
import toast from 'react-hot-toast';
import api from '../services/api';
import { getPublicSettings, calculateShipping, calculateTax, type PublicSettings } from '../services/settings';

const checkoutSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.object({
    line1: z.string().min(1, 'Address is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(6, 'Postal code must be 6 digits'),
    country: z.string().optional().default('India'),
  }),
  sameAsBilling: z.boolean(),
  paymentMethod: z.enum(['razorpay', 'cod']),
  notes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, total } = useSelector((state: RootState) => state.cart);
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [settings, setSettings] = useState<PublicSettings | null>(null);

  // Calculate values using dynamic settings
  const shipping = settings ? calculateShipping(total, settings) : 0;
  const tax = settings ? calculateTax(total, settings) : 0;
  const grandTotal = total + shipping + tax;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema) as any,
    defaultValues: {
      sameAsBilling: true,
      paymentMethod: 'razorpay',
      address: {
        country: 'India',
      },
    },
  });

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  useEffect(() => {
    // Fetch dynamic settings on component mount
    getPublicSettings().then(setSettings).catch(console.error);
  }, []);

  useEffect(() => {
    if (user) {
      setValue('firstName', user.profile.first_name);
      setValue('lastName', user.profile.last_name);
      setValue('email', user.email);
      setValue('phone', user.profile.phone);
    }
  }, [user, setValue]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initiateRazorpayPayment = async (orderData: any) => {
    try {
      // Use guest endpoints if not authenticated
      const orderEndpoint = isAuthenticated ? '/orders' : '/guest/orders';
      const paymentEndpoint = isAuthenticated ? '/payment/create-order' : '/guest/payment/create-order';
      const verifyEndpoint = isAuthenticated ? '/payment/verify' : '/guest/payment/verify';
      
      // First create the order in backend
      const orderResponse = await api.post(orderEndpoint, orderData);
      const createdOrder = orderResponse.data.order;

      // Then create the Razorpay order
      const response = await api.post(paymentEndpoint, {
        amount: grandTotal,
        currency: 'INR',
        order_id: createdOrder.id,
      });

      const options = {
        key: response.data.key_id || import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_xxxxx',
        amount: response.data.amount || grandTotal * 100,
        currency: response.data.currency || 'INR',
        name: 'TRIPUND Lifestyle',
        description: 'Artisan Marketplace Purchase',
        order_id: response.data.razorpay_order_id || response.data.order_id,
        handler: async function (response: any) {
          try {
            await api.post(verifyEndpoint, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: createdOrder.id,
            });

            dispatch(clearCart());
            toast.success('Payment successful!');
            navigate(`/order-confirmation/${createdOrder.id}`);
          } catch (error) {
            toast.error('Payment verification failed');
            navigate(`/order-status/${createdOrder.id}?payment=failed`);
          }
        },
        modal: {
          ondismiss: function() {
            // User closed the payment modal without completing payment
            toast('Payment cancelled. Your order is saved and you can complete payment later.');
            navigate(`/order-status/${createdOrder.id}?payment=pending`);
          }
        },
        prefill: {
          name: `${orderData.firstName} ${orderData.lastName}`,
          email: orderData.email,
          contact: orderData.phone,
        },
        theme: {
          color: '#d4a574',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error('Failed to initiate payment');
      setLoading(false);
    }
  };

  const onSubmit = async (data: CheckoutFormData) => {
    setLoading(true);

    // Transform the data to match backend structure
    const orderData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      address: {
        line1: data.address.line1,
        line2: data.address.line2 || '',
        city: data.address.city,
        state: data.address.state,
        postal_code: data.address.postalCode,
        country: data.address.country || 'India'
      },
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      })),
      totals: {
        subtotal: total,
        shipping,
        tax,
        total: grandTotal,
      },
      paymentMethod: data.paymentMethod,
      notes: data.notes || ''
    };

    try {
      if (data.paymentMethod === 'razorpay') {
        await initiateRazorpayPayment(orderData);
      } else {
        // Cash on Delivery - create order directly
        const orderEndpoint = isAuthenticated ? '/orders' : '/guest/orders';
        const orderResponse = await api.post(orderEndpoint, orderData);
        const createdOrder = orderResponse.data.order;
        
        dispatch(clearCart());
        toast.success('Order placed successfully!');
        navigate(`/order-confirmation/${createdOrder.id}`);
      }
    } catch (error) {
      toast.error('Failed to place order');
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, name: 'Shipping', icon: Truck },
    { id: 2, name: 'Payment', icon: CreditCard },
    { id: 3, name: 'Review', icon: ChevronRight },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Checkout</h1>

        {/* Progress Steps - Mobile Optimized */}
        <div className="flex items-center justify-center mb-8 overflow-x-auto">
          <div className="flex items-center min-w-max px-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${
                      currentStep >= step.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    <step.icon size={16} className="sm:w-5 sm:h-5" />
                  </div>
                  <span className={`ml-1 sm:ml-2 text-xs sm:text-sm ${currentStep >= step.id ? 'text-primary-600 font-medium' : 'text-gray-600'}`}>
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 sm:w-16 md:w-24 h-0.5 sm:h-1 mx-2 sm:mx-4 ${
                    currentStep > step.id ? 'bg-primary-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit as any)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <User className="mr-2" size={20} />
                  Contact Information
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      {...register('firstName')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      {...register('lastName')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      {...register('email')}
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      {...register('phone')}
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <MapPin className="mr-2" size={20} />
                  Shipping Address
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 1
                    </label>
                    <input
                      {...register('address.line1')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {errors.address?.line1 && (
                      <p className="text-red-500 text-sm mt-1">{errors.address.line1.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      {...register('address.line2')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        {...register('address.city')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      {errors.address?.city && (
                        <p className="text-red-500 text-sm mt-1">{errors.address.city.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        {...register('address.state')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      {errors.address?.state && (
                        <p className="text-red-500 text-sm mt-1">{errors.address.state.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Postal Code
                      </label>
                      <input
                        {...register('address.postalCode')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      {errors.address?.postalCode && (
                        <p className="text-red-500 text-sm mt-1">{errors.address.postalCode.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <input
                        {...register('address.country')}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="flex items-center">
                    <input
                      {...register('sameAsBilling')}
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      Billing address same as shipping
                    </span>
                  </label>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <CreditCard className="mr-2" size={20} />
                  Payment Method
                </h2>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      {...register('paymentMethod')}
                      type="radio"
                      value="razorpay"
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <div className="ml-3">
                      <p className="font-medium">Pay with Razorpay</p>
                      <p className="text-sm text-gray-600">
                        Credit/Debit Card, UPI, Netbanking, Wallets
                      </p>
                    </div>
                  </label>
                  {settings?.payment?.cod_enabled && (
                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        {...register('paymentMethod')}
                        type="radio"
                        value="cod"
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <div className="ml-3">
                        <p className="font-medium">Cash on Delivery</p>
                        <p className="text-sm text-gray-600">
                          Pay when you receive your order {settings?.payment?.cod_charges > 0 && `(+₹${settings.payment.cod_charges} handling charge)`}
                        </p>
                      </div>
                    </label>
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Notes (Optional)
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Any special instructions for your order..."
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
                
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.product_id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.product.title} x {item.quantity}
                      </span>
                      <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>
                      {shipping === 0 ? (
                        <span className="text-green-600 font-medium">
                          Free {settings && total >= settings.shipping.free_shipping_threshold && 
                          `(Order above ₹${settings.shipping.free_shipping_threshold})`}
                        </span>
                      ) : (
                        `₹${shipping}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (GST 18%)</span>
                    <span>₹{tax.toLocaleString()}</span>
                  </div>
                  {watch('paymentMethod') === 'cod' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">COD Charges</span>
                      <span>₹50</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>
                      ₹{(grandTotal + (watch('paymentMethod') === 'cod' ? 50 : 0)).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || items.length === 0}
                  className="w-full bg-primary-600 text-white py-3 rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Processing...' : 'Place Order'}
                </button>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  By placing this order, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}