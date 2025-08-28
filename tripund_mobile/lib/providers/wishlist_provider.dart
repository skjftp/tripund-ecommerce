import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/product.dart';
import '../services/api_service.dart';

class WishlistProvider extends ChangeNotifier {
  final List<Product> _items = [];
  final ApiService _apiService = ApiService();
  
  WishlistProvider() {
    _loadWishlistFromBackend();
  }

  List<Product> get items => [..._items];

  int get itemCount => _items.length;

  bool isInWishlist(String productId) {
    return _items.any((product) => product.id == productId);
  }
  
  Future<void> _loadWishlistFromBackend() async {
    try {
      // Check if user is authenticated
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      
      if (token == null) {
        print('⚠️ User not authenticated, skipping wishlist backend load');
        return;
      }
      
      // Get user profile which includes wishlist
      print('📥 Loading wishlist from backend...');
      final profile = await _apiService.getProfile();
      
      if (profile != null && profile.wishlist != null) {
        final List<String> backendWishlist = profile.wishlist!;
        
        if (backendWishlist.isNotEmpty) {
          print('❤️ Found ${backendWishlist.length} items in backend wishlist');
          
          // For now, we just store product IDs
          // In a full implementation, we'd fetch product details
          for (var productId in backendWishlist) {
            if (!isInWishlist(productId)) {
              // We need to fetch product details
              // For now, create a minimal product
              final product = Product(
                id: productId,
                name: 'Loading...',
                description: '',
                price: 0,
                images: [],
                categories: [],
                sku: '',
                stock: 0,
              );
              _items.add(product);
            }
          }
          
          notifyListeners();
          print('✅ Wishlist loaded from backend');
          
          // TODO: Fetch actual product details for wishlist items
        }
      }
    } catch (e) {
      print('❌ Error loading wishlist from backend: $e');
    }
  }

  Future<void> _syncWithBackend() async {
    try {
      // Check if user is authenticated
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      
      if (token == null) {
        print('⚠️ User not authenticated, skipping wishlist backend sync');
        return;
      }
      
      // Get product IDs
      final List<String> productIds = _items.map((product) => product.id).toList();
      
      // Send to backend
      print('🔄 Syncing wishlist with backend: ${productIds.length} items');
      final success = await _apiService.updateWishlist(productIds);
      
      if (success) {
        print('✅ Wishlist synced with backend successfully');
      } else {
        print('⚠️ Failed to sync wishlist with backend');
      }
    } catch (e) {
      print('❌ Error syncing wishlist with backend: $e');
    }
  }

  void addItem(Product product) {
    if (!isInWishlist(product.id)) {
      _items.add(product);
      notifyListeners();
      _syncWithBackend();
    }
  }

  void removeItem(String productId) {
    _items.removeWhere((product) => product.id == productId);
    notifyListeners();
    _syncWithBackend();
  }

  void toggleWishlist(Product product) {
    if (isInWishlist(product.id)) {
      removeItem(product.id);
    } else {
      addItem(product);
    }
  }

  void clear() {
    _items.clear();
    notifyListeners();
    _syncWithBackend();
  }
}