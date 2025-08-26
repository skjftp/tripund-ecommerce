class Product {
  final String id;
  final String name;
  final String description;
  final double price;
  final double? salePrice;
  final List<String> images;
  final List<String> categories;
  final String sku;
  final int stock;
  final Map<String, dynamic>? attributes;
  final double? rating;
  final int? reviewCount;

  Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    this.salePrice,
    required this.images,
    required this.categories,
    required this.sku,
    required this.stock,
    this.attributes,
    this.rating,
    this.reviewCount,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] ?? '',
      name: json['name'] ?? json['title'] ?? '',
      description: json['description'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      salePrice: json['sale_price']?.toDouble(),
      images: List<String>.from(json['images'] ?? []),
      categories: List<String>.from(json['categories'] ?? []),
      sku: json['sku'] ?? '',
      stock: json['stock'] ?? 0,
      attributes: json['attributes'],
      rating: json['rating']?.toDouble(),
      reviewCount: json['review_count'],
    );
  }

  double get displayPrice => salePrice ?? price;
  
  double get discountPercentage {
    if (salePrice != null && salePrice! < price) {
      return ((price - salePrice!) / price * 100);
    }
    return 0;
  }

  bool get hasDiscount => salePrice != null && salePrice! < price;
}