import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, XCircle, Package, ShoppingBag } from 'lucide-react';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  orderId: string;
  onClose: () => void;
  onShopMore: () => void;
  onViewOrders: () => void;
}

interface PaymentFailedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
}

interface PaymentCancelledModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export function PaymentSuccessModal({ isOpen, orderId, onClose, onShopMore, onViewOrders }: PaymentSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>
        
        {/* Success Message */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-green-600 mb-3">
            Payment Successful!
          </h2>
          <p className="text-gray-600 mb-4">
            Thank you for your order
          </p>
          
          {/* Order ID */}
          <div className="bg-gray-100 rounded-lg p-3 mb-4">
            <span className="text-gray-500 text-sm">Order ID: </span>
            <span className="font-bold text-gray-800">{orderId}</span>
          </div>
          
          <p className="text-sm text-gray-500">
            You will receive an order confirmation email shortly.
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              onClose();
              onViewOrders();
            }}
            className="flex items-center justify-center space-x-2 px-4 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
          >
            <Package size={18} />
            <span className="font-semibold">View Orders</span>
          </button>
          
          <button
            onClick={() => {
              onClose();
              onShopMore();
            }}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ShoppingBag size={18} />
            <span className="font-semibold">Shop More</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function PaymentFailedModal({ isOpen, onClose, onRetry }: PaymentFailedModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        {/* Failed Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
        </div>
        
        {/* Failed Message */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-red-600 mb-3">
            Payment Failed
          </h2>
          <p className="text-gray-600 mb-4">
            There was an issue processing your payment. Please try again.
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            Continue Shopping
          </button>
          
          <button
            onClick={() => {
              onClose();
              onRetry();
            }}
            className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

export function PaymentCancelledModal({ isOpen, onClose, onRetry }: PaymentCancelledModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        {/* Cancelled Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-orange-600" />
          </div>
        </div>
        
        {/* Cancelled Message */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-orange-600 mb-3">
            Payment Cancelled
          </h2>
          <p className="text-gray-600 mb-4">
            You cancelled the payment. You can try again or continue shopping.
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            Continue Shopping
          </button>
          
          <button
            onClick={() => {
              onClose();
              onRetry();
            }}
            className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}