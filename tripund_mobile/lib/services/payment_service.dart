import 'package:dio/dio.dart';
import '../utils/constants.dart';

class PaymentService {
  final Dio _dio = Dio(
    BaseOptions(
      baseUrl: Constants.apiUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
      },
    ),
  );

  void setAuthToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  Future<Map<String, dynamic>?> createPaymentOrder({
    required double amount,
    required String orderId,
    String currency = 'INR',
  }) async {
    try {
      print('💳 PaymentService: Creating payment order');
      print('💳 Amount: $amount, OrderID: $orderId, Currency: $currency');
      print('💳 Auth header: ${_dio.options.headers['Authorization']}');
      
      final response = await _dio.post('/payment/create-order', data: {
        'amount': amount,
        'currency': currency,
        'order_id': orderId,
      });
      
      print('💳 Payment response status: ${response.statusCode}');
      print('💳 Payment response data: ${response.data}');
      
      if (response.statusCode == 200) {
        return response.data;
      }
      return null;
    } catch (e) {
      print('❌ Error creating payment order: $e');
      if (e is DioException) {
        print('❌ Payment error status: ${e.response?.statusCode}');
        print('❌ Payment error data: ${e.response?.data}');
      }
      return null;
    }
  }

  Future<bool> verifyPayment({
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String razorpaySignature,
    required String orderId,
  }) async {
    try {
      final response = await _dio.post('/payment/verify', data: {
        'razorpay_order_id': razorpayOrderId,
        'razorpay_payment_id': razorpayPaymentId,
        'razorpay_signature': razorpaySignature,
        'order_id': orderId,
      });
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error verifying payment: $e');
      return false;
    }
  }
}