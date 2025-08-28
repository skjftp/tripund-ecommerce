class CartItem {
  final String id;
  final String productId;
  final String title;
  final double price;
  final String imageUrl;
  final int quantity;
  final String? variantId;
  final String? color;
  final String? size;
  final String? sku;

  CartItem({
    required this.id,
    required this.productId,
    required this.title,
    required this.price,
    required this.imageUrl,
    required this.quantity,
    this.variantId,
    this.color,
    this.size,
    this.sku,
  });
  
  // Create unique ID for cart item including variant
  static String generateId(String productId, String? variantId) {
    if (variantId != null && variantId.isNotEmpty) {
      return '${productId}_$variantId';
    }
    return productId;
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'productId': productId,
      'title': title,
      'price': price,
      'imageUrl': imageUrl,
      'quantity': quantity,
      'variantId': variantId,
      'color': color,
      'size': size,
      'sku': sku,
    };
  }
  
  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      id: json['id'],
      productId: json['productId'],
      title: json['title'],
      price: json['price'].toDouble(),
      imageUrl: json['imageUrl'],
      quantity: json['quantity'],
      variantId: json['variantId'],
      color: json['color'],
      size: json['size'],
      sku: json['sku'],
    );
  }
}