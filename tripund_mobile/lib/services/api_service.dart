import 'dart:convert';
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
    _authToken = prefs.getString('token') ?? prefs.getString('auth_token');
    if (_authToken != null) {
      _dio.options.headers['Authorization'] = 'Bearer $_authToken';
      print('🔐 ApiService initialized with auth token');
    }
  }

  // Set auth token - called when user logs in
  void setAuthToken(String? token) {
    _authToken = token;
    if (token != null) {
      _dio.options.headers['Authorization'] = 'Bearer $token';
      print('🔐 Auth token set in ApiService');
    } else {
      _dio.options.headers.remove('Authorization');
      print('🔓 Auth token removed from ApiService');
    }
  }

  // Clear auth token
  void clearAuthToken() {
    _authToken = null;
    _dio.options.headers.remove('Authorization');
  }

  // Ensure auth token is current before each request
  Future<void> _ensureAuthToken() async {
    final prefs = await SharedPreferences.getInstance();
    final currentToken = prefs.getString('token') ?? prefs.getString('auth_token');
    
    if (currentToken != _authToken) {
      setAuthToken(currentToken);
    }
  }

  // Products
  Future<List<Product>> getProducts({
    int limit = 20,
    int offset = 0,
    String? category,
    String? search,
    String? type,
  }) async {
    try {
      await _ensureAuthToken();
      
      final queryParams = {
        'limit': limit,
        if (offset > 0) 'offset': offset,
        if (category != null && category.isNotEmpty) 'category': category,
        if (search != null && search.isNotEmpty) 'search': search,
        if (type != null && type.isNotEmpty) 'type': type,
      };

      print('📡 API Request: GET /products with params: $queryParams');
      final response = await _dio.get('/products', queryParameters: queryParams);
      print('✅ API Response status: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        print('📋 Full API Response: ${response.data}');
        final List<dynamic> products = response.data['products'] ?? [];
        print('📦 API returned ${products.length} products');
        if (products.isNotEmpty) {
          print('🏷️ First product: ${products[0]['name']} - Categories: ${products[0]['categories']}');
        }
        return products.map((json) => Product.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('💥 Error fetching products: $e');
      return [];
    }
  }

  Future<Product?> getProduct(String id) async {
    try {
      await _ensureAuthToken();
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
      await _ensureAuthToken();
      final response = await _dio.get('/products', queryParameters: {
        'featured': true,
        'limit': 8,
      });
      
      if (response.statusCode == 200) {
        final List<dynamic> products = response.data['products'] ?? [];
        return products.map((json) => Product.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching featured products: $e');
      return [];
    }
  }

  // Categories
  Future<List<Category>> getCategories() async {
    try {
      await _ensureAuthToken();
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
        
        // Save token and update ApiService
        setAuthToken(token);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', token);
        await prefs.setString('auth_token', token); // Save with both keys for compatibility
        
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
    await prefs.remove('token');
    await prefs.remove('user');
  }

  // Profile
  Future<User?> getProfile() async {
    try {
      await _ensureAuthToken();
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
      await _ensureAuthToken();
      final response = await _dio.put('/profile', data: data);
      return response.statusCode == 200;
    } catch (e) {
      print('Error updating profile: $e');
      return false;
    }
  }
  
  // Address management
  Future<bool> updateAddresses(List<Map<String, dynamic>> addresses) async {
    try {
      print('ApiService: updateAddresses called with ${addresses.length} addresses');
      await _ensureAuthToken();
      print('ApiService: Auth token ensured, making PUT request to /profile');
      
      // Log the exact data being sent
      final requestData = {
        'addresses': addresses,
      };
      print('ApiService: Request data being sent: ${json.encode(requestData)}');
      
      // Update user with new addresses
      final response = await _dio.put('/profile', data: requestData);
      
      print('ApiService: Response status: ${response.statusCode}');
      print('ApiService: Response data: ${response.data}');
      
      return response.statusCode == 200;
    } catch (e) {
      print('ApiService: Error updating addresses: $e');
      if (e is DioException) {
        print('ApiService: DioException details:');
        print('  Status code: ${e.response?.statusCode}');
        print('  Response data: ${e.response?.data}');
        print('  Request data: ${e.requestOptions.data}');
      }
      return false;
    }
  }

  // Cart & Orders
  Future<Map<String, dynamic>?> createGuestOrder({
    required List<Map<String, dynamic>> items,
    required Map<String, dynamic> address,
    required String paymentMethod,
    required String firstName,
    required String lastName,
    required String email,
    required String phone,
    Map<String, dynamic>? totals,
  }) async {
    try {
      print('📦 Creating GUEST order at: ${_dio.options.baseUrl}/guest/orders');
      
      // For guest orders, we should NOT have auth header
      final guestDio = Dio(
        BaseOptions(
          baseUrl: Constants.apiUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
          headers: {
            'Content-Type': 'application/json',
          },
        ),
      );
      
      final response = await guestDio.post('/guest/orders', data: {
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'phone': phone,
        'items': items,
        'address': address,
        'paymentMethod': paymentMethod,
        if (totals != null) 'totals': totals,
      });
      
      print('📦 Guest order response status: ${response.statusCode}');
      print('📦 Guest order response data: ${response.data}');
      
      // Backend returns 201 for successful creation
      if (response.statusCode == 200 || response.statusCode == 201) {
        print('✅ Guest order created successfully');
        return response.data;
      }
      print('❌ Unexpected status code: ${response.statusCode}');
      return null;
    } catch (e) {
      print('❌ Error creating guest order: $e');
      if (e is DioException) {
        print('❌ Response status: ${e.response?.statusCode}');
        print('❌ Response data: ${e.response?.data}');
        print('❌ Request URL: ${e.requestOptions.uri}');
        print('❌ Request data sent: ${e.requestOptions.data}');
      }
      return null;
    }
  }
  
  Future<Map<String, dynamic>?> createOrder({
    required List<Map<String, dynamic>> items,
    required Map<String, dynamic> address,
    required String paymentMethod,
    required String firstName,
    required String lastName,
    required String email,
    required String phone,
    Map<String, dynamic>? totals,
  }) async {
    try {
      // Ensure we have the latest auth token
      await _ensureAuthToken();
      
      print('📦 Creating AUTH order at: ${_dio.options.baseUrl}/orders');
      print('📦 Auth header: ${_dio.options.headers['Authorization']}');
      
      final response = await _dio.post('/orders', data: {
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'phone': phone,
        'items': items,
        'address': address,
        'paymentMethod': paymentMethod,
        if (totals != null) 'totals': totals,
      });
      
      print('📦 Order response status: ${response.statusCode}');
      print('📦 Order response data: ${response.data}');
      
      // Backend returns 201 for successful creation, not 200
      if (response.statusCode == 200 || response.statusCode == 201) {
        print('✅ Auth order created successfully');
        return response.data;
      }
      print('❌ Unexpected status code: ${response.statusCode}');
      return null;
    } catch (e) {
      print('❌ Error creating auth order: $e');
      if (e is DioException) {
        print('❌ Response status: ${e.response?.statusCode}');
        print('❌ Response data: ${e.response?.data}');
        print('❌ Request URL: ${e.requestOptions.uri}');
        print('❌ Request data sent: ${e.requestOptions.data}');
      }
      return null;
    }
  }

  Future<List<dynamic>> getOrders() async {
    try {
      await _ensureAuthToken();
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
      await _ensureAuthToken();
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
      await _ensureAuthToken();
      final response = await _dio.post('/wishlist/$productId');
      return response.statusCode == 200;
    } catch (e) {
      print('Error adding to wishlist: $e');
      return false;
    }
  }

  Future<bool> removeFromWishlist(String productId) async {
    try {
      await _ensureAuthToken();
      final response = await _dio.delete('/wishlist/$productId');
      return response.statusCode == 200;
    } catch (e) {
      print('Error removing from wishlist: $e');
      return false;
    }
  }

  // Settings
  Future<Map<String, dynamic>?> getPublicSettings() async {
    try {
      final response = await _dio.get('/settings/public');
      
      if (response.statusCode == 200) {
        return response.data['settings'];
      }
      return null;
    } catch (e) {
      print('Error fetching public settings: $e');
      // Return default settings if API fails
      return {
        'payment': {
          'cod_enabled': false,  // Default to false for safety
          'cod_limit': 10000.0,
          'tax_rate': 18.0,
          'prepaid_discount': 5.0,
        },
        'shipping': {
          'free_shipping_threshold': 5000.0,
          'standard_shipping_rate': 100.0,
          'express_shipping_rate': 200.0,
        },
        'general': {
          'currency': 'INR',
        },
      };
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
  
  // Content
  Future<Map<String, dynamic>?> getContent(String type) async {
    try {
      final response = await _dio.get('/content/$type');
      
      if (response.statusCode == 200) {
        return response.data;
      }
      return null;
    } catch (e) {
      print('Error fetching $type content: $e');
      return null;
    }
  }
}