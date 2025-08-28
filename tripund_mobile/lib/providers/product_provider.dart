import 'package:flutter/material.dart';
import '../models/product.dart';
import '../models/category.dart';
import '../services/api_service.dart';

class ProductProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  List<Product> _products = [];
  List<Product> _featuredProducts = [];
  List<Product> _wishlist = [];
  List<Category> _categories = [];
  
  bool _isLoading = false;
  bool _hasMore = true;
  int _currentOffset = 0;
  static const int _limit = 20;
  
  String _error = '';
  String? _selectedCategory;
  String? _selectedType;
  String? _searchQuery;

  // Getters
  List<Product> get products => _products;
  List<Product> get featuredProducts => _featuredProducts;
  List<Product> get wishlist => _wishlist;
  List<Category> get categories => _categories;
  bool get isLoading => _isLoading;
  bool get hasMore => _hasMore;
  String get error => _error;
  String? get selectedCategory => _selectedCategory;
  String? get searchQuery => _searchQuery;

  ProductProvider() {
    loadInitialData();
  }

  Future<void> loadInitialData() async {
    await Future.wait([
      loadProducts(),
      loadFeaturedProducts(),
      loadCategories(),
    ]);
  }

  Future<void> loadProducts({bool refresh = false, String? type}) async {
    if (_isLoading) return;
    
    if (refresh) {
      _currentOffset = 0;
      _hasMore = true;
      _products.clear();
    }
    
    _isLoading = true;
    _error = '';
    notifyListeners();

    try {
      final typeToUse = type ?? _selectedType;
      print('🚀 Provider: Calling API with category: $_selectedCategory, type: $typeToUse');
      final products = await _apiService.getProducts(
        limit: _limit,
        offset: _currentOffset,
        category: _selectedCategory,
        search: _searchQuery,
        type: typeToUse,
      );
      
      print('📊 Provider: Received ${products.length} products from API');
      if (products.isEmpty) {
        _hasMore = false;
        print('⚠️ No products returned from API');
      } else {
        if (refresh) {
          _products = products;
          print('🔄 Replaced products list with ${_products.length} products');
        } else {
          _products.addAll(products);
          print('➕ Added to products list, total: ${_products.length}');
        }
        _currentOffset += _limit;
      }
    } catch (e) {
      _error = 'Failed to load products: $e';
    } finally {
      _isLoading = false;
      print('🔔 Provider: Calling notifyListeners with ${_products.length} products');
      notifyListeners();
    }
  }

  Future<void> loadMoreProducts() async {
    if (!_hasMore || _isLoading) return;
    await loadProducts();
  }

  Future<void> refreshProducts() async {
    await loadProducts(refresh: true);
  }

  Future<void> loadFeaturedProducts() async {
    try {
      final featured = await _apiService.getFeaturedProducts();
      _featuredProducts = featured;
      notifyListeners();
    } catch (e) {
      print('Error loading featured products: $e');
    }
  }

  Future<void> loadCategories() async {
    try {
      _categories = await _apiService.getCategories();
      notifyListeners();
    } catch (e) {
      print('Error loading categories: $e');
    }
  }

  Future<void> selectCategory(String? categoryId, {String? type}) async {
    if (_selectedCategory == categoryId && _selectedType == type) return;
    
    print('🔍 Provider: Selecting category: $categoryId, type: $type');
    _selectedCategory = categoryId;
    _selectedType = type;
    _searchQuery = null;
    print('🔍 Provider: About to load products with type: $type');
    await loadProducts(refresh: true, type: type);
  }

  Future<void> searchProducts(String query) async {
    if (_searchQuery == query) return;
    
    _searchQuery = query;
    _selectedCategory = null;
    await loadProducts(refresh: true);
  }

  Future<void> clearFilters() async {
    _selectedCategory = null;
    _selectedType = null;
    _searchQuery = null;
    await loadProducts(refresh: true);
  }

  // Wishlist Management
  Future<void> loadWishlist() async {
    try {
      _wishlist = await _apiService.getWishlist();
      notifyListeners();
    } catch (e) {
      print('Error loading wishlist: $e');
    }
  }

  Future<bool> toggleWishlist(Product product) async {
    final isInWishlist = _wishlist.any((p) => p.id == product.id);
    
    if (isInWishlist) {
      final success = await _apiService.removeFromWishlist(product.id);
      if (success) {
        _wishlist.removeWhere((p) => p.id == product.id);
        notifyListeners();
      }
      return success;
    } else {
      final success = await _apiService.addToWishlist(product.id);
      if (success) {
        _wishlist.add(product);
        notifyListeners();
      }
      return success;
    }
  }

  bool isInWishlist(String productId) {
    return _wishlist.any((p) => p.id == productId);
  }

  // Get products by category
  List<Product> getProductsByCategory(String categoryId) {
    return _products.where((p) => p.categories.contains(categoryId)).toList();
  }

  // Get single product
  Product? getProduct(String id) {
    try {
      return _products.firstWhere((p) => p.id == id);
    } catch (e) {
      return null;
    }
  }
}