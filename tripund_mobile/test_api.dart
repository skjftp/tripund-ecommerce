import 'package:dio/dio.dart';

void main() async {
  final dio = Dio(
    BaseOptions(
      baseUrl: 'https://tripund-backend-665685012221.asia-south1.run.app/api/v1',
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
      },
    ),
  );

  try {
    print('Testing products endpoint...');
    final response = await dio.get('/products', queryParameters: {'limit': 5});
    print('Response status: ${response.statusCode}');
    print('Response data type: ${response.data.runtimeType}');
    
    if (response.data is Map) {
      final data = response.data as Map;
      print('Keys in response: ${data.keys.toList()}');
      print('Has products field: ${data.containsKey('products')}');
      
      if (data.containsKey('products')) {
        final products = data['products'];
        print('Products type: ${products.runtimeType}');
        print('Number of products: ${(products as List).length}');
        
        if (products.isNotEmpty) {
          final firstProduct = products[0];
          print('First product keys: ${firstProduct.keys.toList()}');
          print('First product name: ${firstProduct['name']}');
          print('First product stock_quantity: ${firstProduct['stock_quantity']}');
        }
      }
    }
    
    print('\nTesting featured products...');
    final featuredResponse = await dio.get('/products', queryParameters: {
      'featured': true,
      'limit': 8,
    });
    print('Featured response status: ${featuredResponse.statusCode}');
    final featuredData = featuredResponse.data as Map;
    final featuredProducts = featuredData['products'] as List;
    print('Number of featured products: ${featuredProducts.length}');
    
  } catch (e) {
    print('Error: $e');
  }
}