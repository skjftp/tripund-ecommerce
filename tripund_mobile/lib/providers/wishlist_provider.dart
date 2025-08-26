import 'package:flutter/material.dart';
import '../models/product.dart';

class WishlistProvider extends ChangeNotifier {
  final List<Product> _items = [];

  List<Product> get items => [..._items];

  int get itemCount => _items.length;

  bool isInWishlist(String productId) {
    return _items.any((product) => product.id == productId);
  }

  void addItem(Product product) {
    if (!isInWishlist(product.id)) {
      _items.add(product);
      notifyListeners();
    }
  }

  void removeItem(String productId) {
    _items.removeWhere((product) => product.id == productId);
    notifyListeners();
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
  }
}