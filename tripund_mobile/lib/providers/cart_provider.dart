import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/cart_item.dart';
import '../models/product.dart';

class CartProvider extends ChangeNotifier {
  final Map<String, CartItem> _items = {};
  static const String _cartKey = 'cart_items';

  CartProvider() {
    _loadCart();
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
      print('💾 Cart saved: ${_items.length} items');
    } catch (e) {
      print('❌ Error saving cart: $e');
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