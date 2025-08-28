class Category {
  final String id;
  final String name;
  final String slug;
  final String? description;
  final String? image;
  final String? parentId;
  final List<Category>? subcategories;
  final int? productCount;

  Category({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    this.image,
    this.parentId,
    this.subcategories,
    this.productCount,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      description: json['description'],
      image: json['image'],
      parentId: json['parent_id'],
      subcategories: json['children'] != null
          ? (json['children'] as List)
              .map((sub) => Category(
                id: '${json['id']}_${sub['name']}', // Create a unique ID
                name: sub['name'] ?? '',
                slug: sub['name']?.toLowerCase().replaceAll(' ', '-') ?? '',
                productCount: sub['product_count'],
              ))
              .toList()
          : json['subcategories'] != null
              ? (json['subcategories'] as List)
                  .map((sub) => Category.fromJson(sub))
                  .toList()
              : null,
      productCount: json['product_count'],
    );
  }

  // Get emoji icon based on category name
  String get icon {
    final lowerName = name.toLowerCase();
    if (lowerName.contains('divine') || lowerName.contains('spiritual')) {
      return '🕉️';
    } else if (lowerName.contains('wall') || lowerName.contains('decor')) {
      return '🖼️';
    } else if (lowerName.contains('light') || lowerName.contains('lamp')) {
      return '🪔';
    } else if (lowerName.contains('festival') || lowerName.contains('celebration')) {
      return '🎊';
    } else if (lowerName.contains('home') || lowerName.contains('accent')) {
      return '🏠';
    } else if (lowerName.contains('gift') || lowerName.contains('hamper')) {
      return '🎁';
    } else if (lowerName.contains('storage') || lowerName.contains('bag')) {
      return '👜';
    } else {
      return '✨';
    }
  }
}