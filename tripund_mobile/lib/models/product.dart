class Product {
  final String id;
  final String name;
  final String description;
  final String? shortDescription;
  final double price;
  final double? salePrice;
  final List<String> images;
  final List<String> categories;
  final List<String>? tags;
  final String sku;
  final int stock;
  final Map<String, dynamic>? attributes;
  final double? rating;
  final int? reviewCount;

  Product({
    required this.id,
    required this.name,
    required this.description,
    this.shortDescription,
    required this.price,
    this.salePrice,
    required this.images,
    required this.categories,
    this.tags,
    required this.sku,
    required this.stock,
    this.attributes,
    this.rating,
    this.reviewCount,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    // Handle price conversion - API returns price in paise/cents as int
    double parsePrice(dynamic value) {
      if (value == null) return 0;
      if (value is int) return value.toDouble() / 100; // Convert from paise to rupees
      if (value is double) return value / 100;
      return 0;
    }
    
    return Product(
      id: json['id'] ?? '',
      name: json['name'] ?? json['title'] ?? '',
      description: json['description'] ?? '',
      shortDescription: json['short_description'],
      price: parsePrice(json['price']),
      salePrice: json['sale_price'] != null ? parsePrice(json['sale_price']) : null,
      images: List<String>.from(json['images'] ?? []),
      categories: List<String>.from(json['categories'] ?? []),
      tags: List<String>.from(json['tags'] ?? []),
      sku: json['sku'] ?? '',
      stock: json['stock_quantity'] ?? json['stock'] ?? 0,
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