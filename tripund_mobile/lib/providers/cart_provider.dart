import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/cart_item.dart';
import '../models/product.dart';
import '../services/api_service.dart';

class CartProvider extends ChangeNotifier {
  final Map<String, CartItem> _items = {};
  static const String _cartKey = 'cart_items';
  final ApiService _apiService = ApiService();

  CartProvider() {
    _loadCart();
    _loadCartFromBackend();
  }

  Map<String, CartItem> get items => _items;

  int get itemCount => _items.length;

  double get totalAmount {
    double total = 0.0;
    _items.forEach((key, item) {
      total += item.price * item.quantity;
    });
    return total;
  }

  Future<void> _loadCart() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cartData = prefs.getString(_cartKey);
      
      if (cartData != null && cartData.isNotEmpty) {
        final Map<String, dynamic> decodedData = json.decode(cartData);
        
        _items.clear();
        decodedData.forEach((key, value) {
          _items[key] = CartItem.fromJson(value);
        });
        
        print('✅ Cart loaded: ${_items.length} items');
        notifyListeners();
      } else {
        print('📭 No saved cart data found');
      }
    } catch (e) {
      print('❌ Error loading cart: $e');
    }
  }

  Future<void> _saveCart() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      
      final Map<String, Map<String, dynamic>> cartData = {};
      _items.forEach((key, item) {
        cartData[key] = item.toJson();
      });
      
      final encodedData = json.encode(cartData);
      await prefs.setString(_cartKey, encodedData);
      print('💾 Cart saved locally: ${_items.length} items');
      
      // Sync with backend
      await _syncCartWithBackend();
    } catch (e) {
      print('❌ Error saving cart: $e');
    }
  }
  
  Future<void> _loadCartFromBackend() async {
    try {
      // Check if user is authenticated
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      
      if (token == null) {
        print('⚠️ User not authenticated, skipping backend cart load');
        return;
      }
      
      // Get user profile which includes cart
      print('📥 Loading cart from backend...');
      final profile = await _apiService.getProfile();
      
      if (profile != null && profile.cart != null) {
        final List<dynamic> backendCart = profile.cart!;
        
        if (backendCart.isNotEmpty) {
          print('📦 Found ${backendCart.length} items in backend cart');
          
          // Merge backend cart with local cart
          for (var item in backendCart) {
            final productId = item['product_id'];
            final variantId = item['variant_id'];
            final cartItemId = CartItem.generateId(productId, variantId);
            
            // Only add if not already in local cart
            if (!_items.containsKey(cartItemId)) {
              _items[cartItemId] = CartItem(
                id: cartItemId,
                productId: productId,
                title: item['name'] ?? '',
                price: (item['price'] ?? 0).toDouble(),
                imageUrl: item['image'] ?? '',
                quantity: item['quantity'] ?? 1,
                variantId: variantId,
                color: item['color'],
                size: item['size'],
                sku: item['sku'],
              );
            }
          }
          
          await _saveCart();
          notifyListeners();
          print('✅ Cart loaded from backend and merged with local cart');
        }
      }
    } catch (e) {
      print('❌ Error loading cart from backend: $e');
    }
  }
  
  Future<void> _syncCartWithBackend() async {
    try {
      // Check if user is authenticated
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      
      if (token == null) {
        print('⚠️ User not authenticated, skipping backend sync');
        return;
      }
      
      // Prepare cart data for backend
      final List<Map<String, dynamic>> cartItems = [];
      _items.forEach((key, item) {
        cartItems.add({
          'product_id': item.productId,
          'name': item.title,
          'image': item.imageUrl,
          'quantity': item.quantity,
          'price': item.price,
          'variant_id': item.variantId,
          'color': item.color,
          'size': item.size,
        });
      });
      
      // Send to backend
      print('🔄 Syncing cart with backend: ${cartItems.length} items');
      final success = await _apiService.updateCart(cartItems);
      
      if (success) {
        print('✅ Cart synced with backend successfully');
      } else {
        print('⚠️ Failed to sync cart with backend');
      }
    } catch (e) {
      print('❌ Error syncing cart with backend: $e');
    }
  }

  void addItem(
    String productId,
    String title,
    double price,
    String imageUrl, {
    int quantity = 1,
    String? variantId,
    String? color,
    String? size,
    String? sku,
  }) {
    final cartItemId = CartItem.generateId(productId, variantId);
    
    if (_items.containsKey(cartItemId)) {
      _items.update(
        cartItemId,
        (existingItem) => CartItem(
          id: existingItem.id,
          productId: existingItem.productId,
          title: existingItem.title,
          price: existingItem.price,
          imageUrl: existingItem.imageUrl,
          quantity: existingItem.quantity + quantity,
          variantId: existingItem.variantId,
          color: existingItem.color,
          size: existingItem.size,
          sku: existingItem.sku,
        ),
      );
    } else {
      _items.putIfAbsent(
        cartItemId,
        () => CartItem(
          id: cartItemId,
          productId: productId,
          title: title,
          price: price,
          imageUrl: imageUrl,
          quantity: quantity,
          variantId: variantId,
          color: color,
          size: size,
          sku: sku,
        ),
      );
    }
    _saveCart();
    notifyListeners();
  }

  void removeItem(String productId) {
    _items.remove(productId);
    _saveCart();
    notifyListeners();
  }

  void updateQuantity(String productId, int quantity) {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    
    if (_items.containsKey(productId)) {
      _items.update(
        productId,
        (existingItem) => CartItem(
          id: existingItem.id,
          productId: existingItem.productId,
          title: existingItem.title,
          price: existingItem.price,
          imageUrl: existingItem.imageUrl,
          quantity: quantity,
          variantId: existingItem.variantId,
          color: existingItem.color,
          size: existingItem.size,
          sku: existingItem.sku,
        ),
      );
      _saveCart();
      notifyListeners();
    }
  }

  void clear() {
    _items.clear();
    _saveCart();
    notifyListeners();
  }

  bool isInCart(String productId, {String? variantId}) {
    final cartItemId = CartItem.generateId(productId, variantId);
    return _items.containsKey(cartItemId);
  }

  int getQuantity(String productId, {String? variantId}) {
    final cartItemId = CartItem.generateId(productId, variantId);
    return _items[cartItemId]?.quantity ?? 0;
  }
  
  // Add convenient method for Product objects
  void addProduct(Product product, {int quantity = 1, ProductVariant? variant}) {
    final price = variant?.displayPrice ?? product.displayPrice;
    final imageUrl = (variant?.images?.isNotEmpty == true) 
        ? variant!.images!.first 
        : product.images.isNotEmpty 
            ? product.images.first 
            : '';
    
    addItem(
      product.id,
      product.name,
      price,
      imageUrl,
      quantity: quantity,
      variantId: variant?.id,
      color: variant?.color,
      size: variant?.size,
      sku: variant?.sku ?? product.sku,
    );
  }
}