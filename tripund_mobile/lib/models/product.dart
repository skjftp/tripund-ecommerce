class ProductVariant {
  final String id;
  final String color;
  final String size;
  final double price;
  final double? salePrice;
  final String sku;
  final int stockQuantity;
  final List<String>? images;
  final bool available;

  ProductVariant({
    required this.id,
    required this.color,
    required this.size,
    required this.price,
    this.salePrice,
    required this.sku,
    required this.stockQuantity,
    this.images,
    required this.available,
  });

  factory ProductVariant.fromJson(Map<String, dynamic> json) {
    double parsePrice(dynamic value) {
      if (value == null) return 0;
      if (value is int) return value.toDouble();
      if (value is double) return value;
      if (value is String) return double.tryParse(value) ?? 0;
      return 0;
    }

    return ProductVariant(
      id: json['id'] ?? '',
      color: json['color'] ?? '',
      size: json['size'] ?? '',
      price: parsePrice(json['price']),
      salePrice: json['sale_price'] != null ? parsePrice(json['sale_price']) : null,
      sku: json['sku'] ?? '',
      stockQuantity: json['stock_quantity'] ?? 0,
      images: json['images'] != null ? List<String>.from(json['images']) : null,
      available: json['available'] ?? true,
    );
  }

  double get displayPrice => salePrice ?? price;
}

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
  final bool hasVariants;
  final List<ProductVariant>? variants;
  final List<String>? availableColors;
  final List<String>? availableSizes;

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
    this.hasVariants = false,
    this.variants,
    this.availableColors,
    this.availableSizes,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    // Handle price - API returns price in rupees already
    double parsePrice(dynamic value) {
      if (value == null) return 0;
      if (value is int) return value.toDouble();
      if (value is double) return value;
      if (value is String) return double.tryParse(value) ?? 0;
      return 0;
    }
    
    // Parse variants if present
    List<ProductVariant>? variantList;
    if (json['variants'] != null && json['variants'] is List) {
      variantList = (json['variants'] as List)
          .map((v) => ProductVariant.fromJson(v))
          .toList();
    }

    // Parse available colors and sizes
    List<String>? colors;
    if (json['available_colors'] != null) {
      colors = List<String>.from(json['available_colors']);
    }
    List<String>? sizes;
    if (json['available_sizes'] != null) {
      sizes = List<String>.from(json['available_sizes']);
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
      tags: json['tags'] != null ? List<String>.from(json['tags']) : null,
      sku: json['sku'] ?? '',
      stock: json['stock_quantity'] ?? json['stock'] ?? 0,
      attributes: json['attributes'] is List ? null : json['attributes'],
      rating: json['rating']?.toDouble(),
      reviewCount: json['review_count'],
      hasVariants: json['has_variants'] ?? false,
      variants: variantList,
      availableColors: colors,
      availableSizes: sizes,
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
  
  // Get cheapest variant price for display
  double get lowestPrice {
    if (hasVariants && variants != null && variants!.isNotEmpty) {
      double lowest = variants!.first.displayPrice;
      for (var variant in variants!) {
        if (variant.displayPrice < lowest) {
          lowest = variant.displayPrice;
        }
      }
      return lowest;
    }
    return displayPrice;
  }

  // Get variant by color and size
  ProductVariant? getVariant(String? color, String? size) {
    if (!hasVariants || variants == null) return null;
    return variants!.firstWhere(
      (v) => v.color == color && v.size == size,
      orElse: () => variants!.first,
    );
  }
}