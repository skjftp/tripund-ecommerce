import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import 'package:carousel_slider/carousel_slider.dart';
import '../models/product.dart';
import '../utils/theme.dart';
import '../utils/constants.dart';
import '../providers/cart_provider.dart';
import '../providers/wishlist_provider.dart';
import '../widgets/cart_icon_button.dart';
import '../widgets/variant_selection_modal.dart';

class ProductDetailScreen extends StatefulWidget {
  final Product product;
  
  const ProductDetailScreen({
    super.key,
    required this.product,
  });

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int _currentImageIndex = 0;
  ProductVariant? _selectedVariant;
  String? _selectedColor;
  String? _selectedSize;
  
  @override
  void initState() {
    super.initState();
    _selectCheapestVariant();
  }
  
  void _selectCheapestVariant() {
    if (widget.product.hasVariants && widget.product.variants != null && widget.product.variants!.isNotEmpty) {
      // Find the cheapest available variant
      ProductVariant? cheapest;
      double lowestPrice = double.infinity;
      
      for (var variant in widget.product.variants!) {
        if (variant.available && variant.displayPrice < lowestPrice) {
          lowestPrice = variant.displayPrice;
          cheapest = variant;
        }
      }
      
      if (cheapest != null) {
        setState(() {
          _selectedColor = cheapest!.color;
          _selectedSize = cheapest.size;
          _selectedVariant = cheapest;
        });
      }
    }
  }
  
  double _getDisplayPrice() {
    if (_selectedVariant != null) {
      return _selectedVariant!.displayPrice;
    }
    return widget.product.displayPrice;
  }
  
  double _getOriginalPrice() {
    if (_selectedVariant != null) {
      return _selectedVariant!.price;
    }
    return widget.product.price;
  }
  
  bool _hasDiscount() {
    if (_selectedVariant != null) {
      return _selectedVariant!.salePrice != null && _selectedVariant!.salePrice! < _selectedVariant!.price;
    }
    return widget.product.hasDiscount;
  }
  
  double _getDiscountPercentage() {
    if (_selectedVariant != null && _selectedVariant!.salePrice != null && _selectedVariant!.salePrice! < _selectedVariant!.price) {
      return ((_selectedVariant!.price - _selectedVariant!.salePrice!) / _selectedVariant!.price * 100);
    }
    return widget.product.discountPercentage;
  }
  
  void _updateSelectedVariant() {
    if (_selectedColor != null && _selectedSize != null) {
      setState(() {
        _selectedVariant = widget.product.getVariant(_selectedColor, _selectedSize);
      });
    }
  }
  
  Color _getColorFromName(String colorName) {
    final colorMap = {
      'red': Colors.red,
      'blue': Colors.blue,
      'green': Colors.green,
      'yellow': Colors.yellow,
      'orange': Colors.orange,
      'purple': Colors.purple,
      'pink': Colors.pink,
      'brown': Colors.brown,
      'grey': Colors.grey,
      'gray': Colors.grey,
      'black': Colors.black,
      'white': Colors.white,
      'navy': const Color(0xFF000080),
      'teal': Colors.teal,
      'cyan': Colors.cyan,
      'indigo': Colors.indigo,
      'lime': Colors.lime,
      'amber': Colors.amber,
      'gold': const Color(0xFFFFD700),
      'silver': const Color(0xFFC0C0C0),
      'beige': const Color(0xFFF5F5DC),
      'maroon': const Color(0xFF800000),
      'olive': const Color(0xFF808000),
      'coral': const Color(0xFFFF7F50),
      'turquoise': const Color(0xFF40E0D0),
      'violet': const Color(0xFFEE82EE),
      'khaki': const Color(0xFFF0E68C),
      'crimson': const Color(0xFFDC143C),
      'lavender': const Color(0xFFE6E6FA),
      'plum': const Color(0xFFDDA0DD),
      'mint': const Color(0xFF98FB98),
      'ivory': const Color(0xFFFFFFF0),
      'pearl': const Color(0xFFFAF0E6),
    };
    
    String normalizedColor = colorName.toLowerCase().trim();
    
    // Check for multi-word colors
    if (normalizedColor.contains('dark')) {
      String baseColor = normalizedColor.replaceAll('dark', '').trim();
      Color? base = colorMap[baseColor];
      if (base != null) {
        return Color.alphaBlend(Colors.black.withOpacity(0.3), base);
      }
    }
    if (normalizedColor.contains('light')) {
      String baseColor = normalizedColor.replaceAll('light', '').trim();
      Color? base = colorMap[baseColor];
      if (base != null) {
        return Color.alphaBlend(Colors.white.withOpacity(0.5), base);
      }
    }
    
    return colorMap[normalizedColor] ?? Colors.grey;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.of(context).pop(),
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: const Icon(Icons.arrow_back, color: Colors.black),
          ),
        ),
        actions: [
          const CartIconButton(iconColor: Colors.black),
          Consumer<WishlistProvider>(
            builder: (context, wishlistProvider, child) {
              final isInWishlist = wishlistProvider.isInWishlist(widget.product.id);
              return IconButton(
                onPressed: () {
                  wishlistProvider.toggleWishlist(widget.product);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        isInWishlist 
                          ? '${widget.product.name} removed from wishlist'
                          : '${widget.product.name} added to wishlist',
                      ),
                      duration: const Duration(seconds: 1),
                    ),
                  );
                },
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 10,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Icon(
                    isInWishlist ? Icons.favorite : Icons.favorite_border,
                    color: isInWishlist ? AppTheme.primaryColor : Colors.black,
                  ),
                ),
              );
            },
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: Column(
        children: [
          // Product Images Carousel
          Expanded(
            flex: 4,
            child: Stack(
              children: [
                CarouselSlider(
                  options: CarouselOptions(
                    height: double.infinity,
                    viewportFraction: 1.0,
                    enableInfiniteScroll: widget.product.images.length > 1,
                    onPageChanged: (index, reason) {
                      setState(() => _currentImageIndex = index);
                    },
                  ),
                  items: widget.product.images.map((imageUrl) {
                    return Hero(
                      tag: 'product-${widget.product.id}',
                      child: Container(
                        width: double.infinity,
                        child: CachedNetworkImage(
                          imageUrl: imageUrl,
                          fit: BoxFit.contain,
                          placeholder: (context, url) => Container(
                            color: Colors.grey[100],
                            child: const Center(
                              child: CircularProgressIndicator(),
                            ),
                          ),
                          errorWidget: (context, url, error) => Container(
                            color: Colors.grey[100],
                            child: const Icon(Icons.image_not_supported, size: 100),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
                if (widget.product.images.length > 1)
                  Positioned(
                    bottom: 20,
                    left: 0,
                    right: 0,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: widget.product.images.asMap().entries.map((entry) {
                        return Container(
                          width: 8,
                          height: 8,
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: _currentImageIndex == entry.key
                                ? AppTheme.primaryColor
                                : Colors.grey.withOpacity(0.5),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                if (_hasDiscount())
                  Positioned(
                    top: 20,
                    left: 20,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        gradient: AppTheme.goldGradient,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '${_getDiscountPercentage().toStringAsFixed(0)}% OFF',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          // Product Details
          Expanded(
            flex: 6,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(30),
                  topRight: Radius.circular(30),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 20,
                    offset: Offset(0, -5),
                  ),
                ],
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Product Name
                    Text(
                      widget.product.name,
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Pricing
                    Row(
                      children: [
                        Text(
                          '${Constants.currency}${_getDisplayPrice().toStringAsFixed(0)}',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primaryColor,
                          ),
                        ),
                        if (_hasDiscount()) ...[
                          const SizedBox(width: 12),
                          Text(
                            '${Constants.currency}${_getOriginalPrice().toStringAsFixed(0)}',
                            style: TextStyle(
                              fontSize: 18,
                              decoration: TextDecoration.lineThrough,
                              color: AppTheme.textLight,
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 20),
                    // Variant Selection
                    if (widget.product.hasVariants && widget.product.availableColors != null && widget.product.availableColors!.isNotEmpty) ...[
                      Text(
                        'Color',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 50,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: widget.product.availableColors!.length,
                          itemBuilder: (context, index) {
                            final color = widget.product.availableColors![index];
                            final isSelected = _selectedColor == color;
                            return GestureDetector(
                              onTap: () {
                                setState(() {
                                  _selectedColor = color;
                                  _updateSelectedVariant();
                                });
                              },
                              child: Column(
                                children: [
                                  Container(
                                    margin: const EdgeInsets.only(right: 12),
                                    width: 50,
                                    height: 50,
                                    decoration: BoxDecoration(
                                      color: _getColorFromName(color),
                                      border: Border.all(
                                        color: isSelected 
                                          ? AppTheme.primaryColor 
                                          : Colors.grey.shade400,
                                        width: isSelected ? 3 : 1,
                                      ),
                                      shape: BoxShape.circle,
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withOpacity(0.1),
                                          blurRadius: 4,
                                          offset: const Offset(0, 2),
                                        ),
                                        if (isSelected) BoxShadow(
                                          color: AppTheme.primaryColor.withOpacity(0.3),
                                          blurRadius: 8,
                                          offset: const Offset(0, 2),
                                        ),
                                      ],
                                    ),
                                    child: _getColorFromName(color) == Colors.white 
                                      ? Icon(
                                          isSelected ? Icons.check : null,
                                          color: Colors.black87,
                                          size: 20,
                                        )
                                      : Icon(
                                          isSelected ? Icons.check : null,
                                          color: Colors.white,
                                          size: 20,
                                        ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],
                    
                    // Size Selection
                    if (widget.product.hasVariants && widget.product.availableSizes != null && widget.product.availableSizes!.isNotEmpty) ...[
                      Text(
                        'Size',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: widget.product.availableSizes!.map((size) {
                          final isSelected = _selectedSize == size;
                          final variant = widget.product.getVariant(_selectedColor, size);
                          final isAvailable = (variant?.available ?? false) && (variant?.stockQuantity ?? 0) > 0;
                          final isOutOfStock = variant != null && (variant.stockQuantity <= 0 || !variant.available);
                          
                          return GestureDetector(
                            onTap: isAvailable ? () {
                              setState(() {
                                _selectedSize = size;
                                _updateSelectedVariant();
                              });
                            } : null,
                            child: Container(
                              width: 60,
                              height: 45,
                              decoration: BoxDecoration(
                                color: isSelected 
                                  ? AppTheme.primaryColor 
                                  : isAvailable ? Colors.white : Colors.grey.shade100,
                                border: Border.all(
                                  color: isSelected 
                                    ? AppTheme.primaryColor 
                                    : isAvailable ? Colors.grey.shade300 : Colors.grey.shade200,
                                  width: isSelected ? 2 : 1,
                                ),
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: isSelected ? [
                                  BoxShadow(
                                    color: AppTheme.primaryColor.withOpacity(0.3),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ] : [],
                              ),
                              child: Center(
                                child: Text(
                                  size,
                                  style: TextStyle(
                                    color: isSelected 
                                      ? Colors.white 
                                      : isAvailable ? Colors.black87 : Colors.grey.shade400,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                    fontSize: 14,
                                    decoration: isAvailable ? null : TextDecoration.lineThrough,
                                  ),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 20),
                    ],
                    // Short Description
                    if (widget.product.shortDescription != null) ...[
                      Text(
                        'About',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        widget.product.shortDescription!,
                        style: TextStyle(
                          fontSize: 16,
                          height: 1.5,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],
                    // Full Description
                    Text(
                      'Description',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      widget.product.description,
                      style: TextStyle(
                        fontSize: 14,
                        height: 1.6,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 100), // Space for floating button
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      // Floating Add to Cart/Wishlist Button
      floatingActionButton: Consumer2<CartProvider, WishlistProvider>(
        builder: (context, cartProvider, wishlistProvider, child) {
          final isInCart = cartProvider.items.containsKey(widget.product.id);
          final isInWishlist = wishlistProvider.isInWishlist(widget.product.id);
          
          // Check if selected variant is out of stock
          bool isOutOfStock = false;
          if (widget.product.hasVariants && _selectedVariant != null) {
            isOutOfStock = (_selectedVariant!.stockQuantity <= 0 || !_selectedVariant!.available);
          } else if (!widget.product.hasVariants) {
            isOutOfStock = widget.product.stock <= 0;
          }
          
          return Container(
            width: MediaQuery.of(context).size.width - 40,
            height: 56,
            margin: const EdgeInsets.symmetric(horizontal: 20),
            child: ElevatedButton(
              onPressed: isOutOfStock 
                ? () {
                    // Add to wishlist if out of stock
                    if (isInWishlist) {
                      wishlistProvider.removeItem(widget.product.id);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('${widget.product.name} removed from wishlist'),
                          duration: const Duration(seconds: 1),
                        ),
                      );
                    } else {
                      wishlistProvider.addItem(widget.product);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('${widget.product.name} added to wishlist. We\'ll notify you when it\'s back in stock!'),
                          duration: const Duration(seconds: 2),
                        ),
                      );
                    }
                  }
                : () {
                    if (isInCart) {
                      cartProvider.removeItem(widget.product.id);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('${widget.product.name} removed from cart'),
                          duration: const Duration(seconds: 1),
                        ),
                      );
                    } else {
                      if (widget.product.hasVariants && _selectedVariant == null) {
                        // Show variant selection modal if no variant selected
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (context) => VariantSelectionModal(
                            product: widget.product,
                          ),
                        );
                      } else {
                        // Add to cart with selected variant
                        cartProvider.addItem(
                          widget.product.id,
                          widget.product.name,
                          _getDisplayPrice(),
                          widget.product.images.isNotEmpty ? widget.product.images[0] : '',
                        );
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('${widget.product.name} added to cart'),
                            duration: const Duration(seconds: 1),
                          ),
                        );
                      }
                    }
                  },
              style: ElevatedButton.styleFrom(
                backgroundColor: isOutOfStock 
                  ? (isInWishlist ? Colors.orange : Colors.grey)
                  : (isInCart ? Colors.green : AppTheme.primaryColor),
                foregroundColor: Colors.white,
                elevation: 8,
                shadowColor: isOutOfStock 
                  ? Colors.grey.withOpacity(0.3)
                  : (isInCart ? Colors.green : AppTheme.primaryColor).withOpacity(0.3),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    isOutOfStock 
                      ? (isInWishlist ? Icons.favorite : Icons.favorite_border)
                      : (isInCart ? Icons.check_circle : Icons.shopping_cart),
                    size: 24,
                  ),
                  const SizedBox(width: 12),
                  Text(
                    isOutOfStock 
                      ? (isInWishlist ? 'In Wishlist' : 'Out of Stock - Add to Wishlist')
                      : (isInCart ? 'Remove from Cart' : 'Add to Cart'),
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }
}