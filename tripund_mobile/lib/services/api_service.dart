import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/constants.dart';
import '../models/product.dart';
import '../models/category.dart';
import '../models/user.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

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

  String? _authToken;

  // Initialize with token if available
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _authToken = prefs.getString('auth_token');
    if (_authToken != null) {
      _dio.options.headers['Authorization'] = 'Bearer $_authToken';
    }
  }

  // Set auth token
  void setAuthToken(String token) {
    _authToken = token;
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  // Clear auth token
  void clearAuthToken() {
    _authToken = null;
    _dio.options.headers.remove('Authorization');
  }

  // Products
  Future<List<Product>> getProducts({
    int limit = 20,
    int offset = 0,
    String? category,
    String? search,
  }) async {
    try {
      final queryParams = {
        'limit': limit,
        'offset': offset,
        if (category != null) 'category': category,
        if (search != null) 'search': search,
      };

      print('Fetching products with params: $queryParams');
      final response = await _dio.get('/products', queryParameters: queryParams);
      print('Response status: ${response.statusCode}');
      print('Response data type: ${response.data.runtimeType}');
      
      if (response.statusCode == 200) {
        final data = response.data;
        print('Response has products field: ${data.containsKey('products')}');
        final List<dynamic> products = data['products'] ?? [];
        print('Found ${products.length} products');
        
        final List<Product> parsedProducts = [];
        for (var json in products) {
          try {
            parsedProducts.add(Product.fromJson(json));
          } catch (e) {
            print('Error parsing product: $e');
            print('Product JSON: $json');
          }
        }
        print('Successfully parsed ${parsedProducts.length} products');
        return parsedProducts;
      }
      return [];
    } catch (e) {
      print('Error fetching products: $e');
      print('Error details: ${e.toString()}');
      return [];
    }
  }

  Future<Product?> getProduct(String id) async {
    try {
      final response = await _dio.get('/products/$id');
      
      if (response.statusCode == 200) {
        return Product.fromJson(response.data);
      }
      return null;
    } catch (e) {
      print('Error fetching product: $e');
      return null;
    }
  }

  Future<List<Product>> getFeaturedProducts() async {
    try {
      print('Fetching featured products...');
      final response = await _dio.get('/products', queryParameters: {
        'featured': true,
        'limit': 8,
      });
      
      print('Featured products response status: ${response.statusCode}');
      if (response.statusCode == 200) {
        final data = response.data;
        print('Featured response has products field: ${data.containsKey('products')}');
        final List<dynamic> products = data['products'] ?? [];
        print('Found ${products.length} featured products');
        
        final List<Product> parsedProducts = [];
        for (var json in products) {
          try {
            parsedProducts.add(Product.fromJson(json));
          } catch (e) {
            print('Error parsing featured product: $e');
          }
        }
        print('Successfully parsed ${parsedProducts.length} featured products');
        return parsedProducts;
      }
      return [];
    } catch (e) {
      print('Error fetching featured products: $e');
      print('Error details: ${e.toString()}');
      return [];
    }
  }

  // Categories
  Future<List<Category>> getCategories() async {
    try {
      final response = await _dio.get('/categories');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['categories'] ?? [];
        return data.map((json) => Category.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching categories: $e');
      return [];
    }
  }

  // Auth
  Future<Map<String, dynamic>?> login(String email, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });
      
      if (response.statusCode == 200) {
        final token = response.data['token'];
        final user = response.data['user'];
        
        // Save token
        setAuthToken(token);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', token);
        
        return {
          'token': token,
          'user': user,
        };
      }
      return null;
    } catch (e) {
      print('Error logging in: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    required String phone,
  }) async {
    try {
      final response = await _dio.post('/auth/register', data: {
        'first_name': firstName,
        'last_name': lastName,
        'email': email,
        'password': password,
        'phone': phone,
      });
      
      if (response.statusCode == 201) {
        // Auto login after registration
        return await login(email, password);
      }
      return null;
    } catch (e) {
      print('Error registering: $e');
      return null;
    }
  }

  Future<void> logout() async {
    clearAuthToken();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user');
  }

  // Profile
  Future<User?> getProfile() async {
    try {
      final response = await _dio.get('/profile');
      
      if (response.statusCode == 200) {
        return User.fromJson(response.data);
      }
      return null;
    } catch (e) {
      print('Error fetching profile: $e');
      return null;
    }
  }

  Future<bool> updateProfile(Map<String, dynamic> data) async {
    try {
      final response = await _dio.put('/profile', data: data);
      return response.statusCode == 200;
    } catch (e) {
      print('Error updating profile: $e');
      return false;
    }
  }

  // Cart & Orders
  Future<Map<String, dynamic>?> createOrder({
    required List<Map<String, dynamic>> items,
    required Map<String, dynamic> address,
    required String paymentMethod,
    Map<String, dynamic>? totals,
  }) async {
    try {
      final response = await _dio.post('/orders', data: {
        'items': items,
        'address': address,
        'paymentMethod': paymentMethod,
        if (totals != null) 'totals': totals,
      });
      
      if (response.statusCode == 200) {
        return response.data;
      }
      return null;
    } catch (e) {
      print('Error creating order: $e');
      return null;
    }
  }

  Future<List<dynamic>> getOrders() async {
    try {
      final response = await _dio.get('/orders');
      
      if (response.statusCode == 200) {
        return response.data['orders'] ?? [];
      }
      return [];
    } catch (e) {
      print('Error fetching orders: $e');
      return [];
    }
  }

  // Wishlist
  Future<List<Product>> getWishlist() async {
    try {
      final response = await _dio.get('/wishlist');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['products'] ?? [];
        return data.map((json) => Product.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching wishlist: $e');
      return [];
    }
  }

  Future<bool> addToWishlist(String productId) async {
    try {
      final response = await _dio.post('/wishlist/$productId');
      return response.statusCode == 200;
    } catch (e) {
      print('Error adding to wishlist: $e');
      return false;
    }
  }

  Future<bool> removeFromWishlist(String productId) async {
    try {
      final response = await _dio.delete('/wishlist/$productId');
      return response.statusCode == 200;
    } catch (e) {
      print('Error removing from wishlist: $e');
      return false;
    }
  }

  // App Version Check
  Future<Map<String, dynamic>?> checkAppVersion() async {
    try {
      final response = await _dio.get('/app/version');
      
      if (response.statusCode == 200) {
        return response.data;
      }
      return null;
    } catch (e) {
      print('Error checking app version: $e');
      // Return mock data for now
      return {
        'version': '1.0.0',
        'build_number': 1,
        'download_url': 'https://github.com/skjftp/tripund-ecommerce/releases/download/v1.0.0/app-release.apk',
        'release_notes': '• New features and improvements\n• Bug fixes\n• Performance enhancements',
        'force_update': false,
      };
    }
  }
}