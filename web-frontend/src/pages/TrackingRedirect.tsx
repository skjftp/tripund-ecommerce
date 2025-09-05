import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function TrackingRedirect() {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  useEffect(() => {
    if (orderNumber) {
      // Redirect to backend tracking endpoint which will redirect to actual tracking URL
      window.location.href = `https://tripund-backend-665685012221.asia-south1.run.app/api/v1/track/${orderNumber}`;
    } else {
      // Fallback to orders page if no order number
      window.location.href = 'https://tripundlifestyle.com/orders';
    }
  }, [orderNumber]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#96865d] mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Redirecting to your order tracking...</h2>
        <p className="text-gray-600">Please wait while we redirect you to track your order #{orderNumber}</p>
      </div>
    </div>
  );
}