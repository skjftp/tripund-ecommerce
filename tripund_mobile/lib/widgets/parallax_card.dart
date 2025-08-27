import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import 'package:provider/provider.dart';
import '../models/product.dart';
import '../utils/theme.dart';
import '../utils/constants.dart';
import '../providers/wishlist_provider.dart';
import '../providers/cart_provider.dart';

class ParallaxCard extends StatefulWidget {
  final Product product;
  final VoidCallback onTap;

  const ParallaxCard({
    super.key,
    required this.product,
    required this.onTap,
  });

  @override
  State<ParallaxCard> createState() => _ParallaxCardState();
}

class _ParallaxCardState extends State<ParallaxCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  bool _isPressed = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.95,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) {
        setState(() => _isPressed = true);
        _controller.forward();
      },
      onTapUp: (_) {
        setState(() => _isPressed = false);
        _controller.reverse();
        widget.onTap();
      },
      onTapCancel: () {
        setState(() => _isPressed = false);
        _controller.reverse();
      },
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: Colors.white,
                boxShadow: _isPressed
                    ? [
                        BoxShadow(
                          color: AppTheme.primaryColor.withOpacity(0.2),
                          blurRadius: 10,
                          offset: const Offset(0, 5),
                        ),
                      ]
                    : AppTheme.cardShadow,
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Image Container with Badge
                    Expanded(
                      flex: 3,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          Hero(
                            tag: 'product-${widget.product.id}',
                            child: CachedNetworkImage(
                              imageUrl: widget.product.images.isNotEmpty
                                  ? widget.product.images[0]
                                  : 'https://via.placeholder.com/300',
                              fit: BoxFit.cover,
                              placeholder: (context, url) => Shimmer.fromColors(
                                baseColor: Colors.grey[300]!,
                                highlightColor: Colors.grey[100]!,
                                child: Container(color: Colors.white),
                              ),
                              errorWidget: (context, url, error) => Container(
                                color: Colors.grey[200],
                                child: Icon(
                                  Icons.image_not_supported,
                                  color: Colors.grey[400],
                                  size: 40,
                                ),
                              ),
                            ),
                          ),
                          if (widget.product.hasDiscount)
                            Positioned(
                              top: 10,
                              left: 10,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  gradient: AppTheme.goldGradient,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  '${widget.product.discountPercentage.toStringAsFixed(0)}% OFF',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                          // Wishlist button (top right)
                          Positioned(
                            top: 10,
                            right: 10,
                            child: Consumer<WishlistProvider>(
                              builder: (context, wishlistProvider, child) {
                                final isInWishlist = wishlistProvider.isInWishlist(widget.product.id);
                                return GestureDetector(
                                  onTap: () {
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
                                  child: AnimatedContainer(
                                    duration: const Duration(milliseconds: 200),
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: isInWishlist 
                                        ? AppTheme.primaryColor.withOpacity(0.9)
                                        : Colors.white.withOpacity(0.9),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(
                                      isInWishlist ? Icons.favorite : Icons.favorite_border,
                                      size: 20,
                                      color: isInWishlist ? Colors.white : AppTheme.primaryColor,
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                          // Add to Cart button (bottom right)
                          Positioned(
                            bottom: 10,
                            right: 10,
                            child: Consumer<CartProvider>(
                              builder: (context, cartProvider, child) {
                                final isInCart = cartProvider.items.containsKey(widget.product.id);
                                return GestureDetector(
                                  onTap: () {
                                    if (isInCart) {
                                      // Remove from cart
                                      cartProvider.removeItem(widget.product.id);
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                          content: Text('${widget.product.name} removed from cart'),
                                          duration: const Duration(seconds: 1),
                                        ),
                                      );
                                    } else {
                                      // Add to cart
                                      cartProvider.addItem(widget.product);
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                          content: Text('${widget.product.name} added to cart'),
                                          duration: const Duration(seconds: 1),
                                        ),
                                      );
                                    }
                                  },
                                  child: AnimatedContainer(
                                    duration: const Duration(milliseconds: 200),
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: isInCart 
                                        ? Colors.green.withOpacity(0.9)
                                        : Colors.white.withOpacity(0.9),
                                      shape: BoxShape.circle,
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withOpacity(0.1),
                                          blurRadius: 4,
                                          offset: const Offset(0, 2),
                                        ),
                                      ],
                                    ),
                                    child: Icon(
                                      isInCart ? Icons.shopping_cart : Icons.shopping_cart_outlined,
                                      size: 20,
                                      color: isInCart ? Colors.white : AppTheme.primaryColor,
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Product Details
                    Expanded(
                      flex: 2,
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              widget.product.name,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(
                                    fontWeight: FontWeight.w600,
                                    height: 1.2,
                                  ),
                            ),
                            Row(
                              children: [
                                Text(
                                  '${Constants.currency}${widget.product.displayPrice.toStringAsFixed(0)}',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.primaryColor,
                                  ),
                                ),
                                if (widget.product.hasDiscount) ...[
                                  const SizedBox(width: 8),
                                  Text(
                                    '${Constants.currency}${widget.product.price.toStringAsFixed(0)}',
                                    style: TextStyle(
                                      fontSize: 14,
                                      decoration: TextDecoration.lineThrough,
                                      color: AppTheme.textLight,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}