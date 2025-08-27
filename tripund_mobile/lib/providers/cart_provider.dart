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
          _items[key] = CartItem(
            id: value['id'],
            productId: value['productId'],
            title: value['title'],
            price: value['price'].toDouble(),
            imageUrl: value['imageUrl'],
            quantity: value['quantity'],
          );
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
        cartData[key] = {
          'id': item.id,
          'productId': item.productId,
          'title': item.title,
          'price': item.price,
          'imageUrl': item.imageUrl,
          'quantity': item.quantity,
        };
      });
      
      final encodedData = json.encode(cartData);
      await prefs.setString(_cartKey, encodedData);
      print('💾 Cart saved: ${_items.length} items');
    } catch (e) {
      print('❌ Error saving cart: $e');
    }
  }

  void addItem(Product product) {
    if (_items.containsKey(product.id)) {
      _items.update(
        product.id,
        (existingItem) => CartItem(
          id: existingItem.id,
          productId: existingItem.productId,
          title: existingItem.title,
          price: existingItem.price,
          imageUrl: existingItem.imageUrl,
          quantity: existingItem.quantity + 1,
        ),
      );
    } else {
      _items.putIfAbsent(
        product.id,
        () => CartItem(
          id: DateTime.now().toString(),
          productId: product.id,
          title: product.name,
          price: product.salePrice ?? product.price,
          imageUrl: product.images.isNotEmpty ? product.images[0] : '',
          quantity: 1,
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

  bool isInCart(String productId) {
    return _items.containsKey(productId);
  }

  int getQuantity(String productId) {
    return _items[productId]?.quantity ?? 0;
  }
}