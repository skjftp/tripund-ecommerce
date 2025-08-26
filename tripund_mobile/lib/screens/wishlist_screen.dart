import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../providers/wishlist_provider.dart';
import '../providers/cart_provider.dart';
import '../utils/theme.dart';
import '../utils/constants.dart';
import 'product_detail_screen.dart';

class WishlistScreen extends StatelessWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Wishlist'),
        centerTitle: true,
        backgroundColor: AppTheme.backgroundColor,
        elevation: 0,
        actions: [
          Consumer<WishlistProvider>(
            builder: (context, wishlistProvider, child) {
              if (wishlistProvider.itemCount > 0) {
                return IconButton(
                  icon: const Icon(Icons.delete_sweep),
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Clear Wishlist'),
                        content: const Text('Are you sure you want to remove all items from your wishlist?'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.of(ctx).pop(),
                            child: const Text('Cancel'),
                          ),
                          ElevatedButton(
                            onPressed: () {
                              wishlistProvider.clear();
                              Navigator.of(ctx).pop();
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Wishlist cleared!')),
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.red,
                            ),
                            child: const Text('Clear All', style: TextStyle(color: Colors.white)),
                          ),
                        ],
                      ),
                    );
                  },
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
      body: Consumer<WishlistProvider>(
        builder: (context, wishlistProvider, child) {
          if (wishlistProvider.items.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.favorite_outline,
                    size: 100,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Your wishlist is empty',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          color: Colors.grey[600],
                        ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Add items you love to your wishlist',
                    style: TextStyle(color: Colors.grey[500]),
                  ),
                  const SizedBox(height: 30),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.of(context).popUntil((route) => route.isFirst);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 40,
                        vertical: 15,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(30),
                      ),
                    ),
                    child: const Text(
                      'Start Shopping',
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                ],
              ),
            );
          }

          return Column(
            children: [
              // Items count header
              Container(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Text(
                      '${wishlistProvider.itemCount} item${wishlistProvider.itemCount == 1 ? '' : 's'}',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                    ),
                  ],
                ),
              ),
              
              Expanded(
                child: AnimationLimiter(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: wishlistProvider.items.length,
                    itemBuilder: (context, index) {
                      final product = wishlistProvider.items[index];
                      
                      return AnimationConfiguration.staggeredList(
                        position: index,
                        duration: const Duration(milliseconds: 375),
                        child: SlideAnimation(
                          verticalOffset: 50.0,
                          child: FadeInAnimation(
                            child: Dismissible(
                              key: Key(product.id),
                              direction: DismissDirection.endToStart,
                              background: Container(
                                alignment: Alignment.centerRight,
                                padding: const EdgeInsets.only(right: 20),
                                margin: const EdgeInsets.only(bottom: 16),
                                decoration: BoxDecoration(
                                  color: Colors.red,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: const Icon(
                                  Icons.delete,
                                  color: Colors.white,
                                  size: 30,
                                ),
                              ),
                              onDismissed: (direction) {
                                wishlistProvider.removeItem(product.id);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('${product.name} removed from wishlist'),
                                    action: SnackBarAction(
                                      label: 'UNDO',
                                      onPressed: () {
                                        wishlistProvider.addItem(product);
                                      },
                                    ),
                                  ),
                                );
                              },
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 16),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(20),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.05),
                                      blurRadius: 10,
                                      offset: const Offset(0, 5),
                                    ),
                                  ],
                                ),
                                child: InkWell(
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => ProductDetailScreen(
                                          product: product,
                                        ),
                                      ),
                                    );
                                  },
                                  borderRadius: BorderRadius.circular(20),
                                  child: Padding(
                                    padding: const EdgeInsets.all(12),
                                    child: Row(
                                      children: [
                                        // Product Image
                                        Container(
                                          width: 100,
                                          height: 100,
                                          decoration: BoxDecoration(
                                            borderRadius: BorderRadius.circular(15),
                                            color: Colors.grey[200],
                                          ),
                                          child: ClipRRect(
                                            borderRadius: BorderRadius.circular(15),
                                            child: CachedNetworkImage(
                                              imageUrl: product.images.isNotEmpty 
                                                  ? product.images[0] 
                                                  : 'https://via.placeholder.com/100',
                                              fit: BoxFit.cover,
                                              placeholder: (context, url) => Container(
                                                color: Colors.grey[200],
                                                child: const Center(
                                                  child: CircularProgressIndicator(),
                                                ),
                                              ),
                                              errorWidget: (context, url, error) => Container(
                                                color: Colors.grey[200],
                                                child: const Icon(Icons.error),
                                              ),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        // Product Details
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                product.name,
                                                style: Theme.of(context)
                                                    .textTheme
                                                    .titleMedium
                                                    ?.copyWith(
                                                      fontWeight: FontWeight.bold,
                                                    ),
                                                maxLines: 2,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                              const SizedBox(height: 8),
                                              Row(
                                                children: [
                                                  if (product.salePrice != null && product.salePrice! < product.price)
                                                    Text(
                                                      '${Constants.currency}${product.price.toStringAsFixed(0)}',
                                                      style: TextStyle(
                                                        fontSize: 14,
                                                        color: Colors.grey[600],
                                                        decoration: TextDecoration.lineThrough,
                                                      ),
                                                    ),
                                                  if (product.salePrice != null && product.salePrice! < product.price)
                                                    const SizedBox(width: 8),
                                                  Text(
                                                    '${Constants.currency}${(product.salePrice ?? product.price).toStringAsFixed(0)}',
                                                    style: TextStyle(
                                                      fontSize: 18,
                                                      fontWeight: FontWeight.bold,
                                                      color: AppTheme.primaryColor,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              if (product.salePrice != null && product.salePrice! < product.price)
                                                Text(
                                                  '${(((product.price - product.salePrice!) / product.price) * 100).toStringAsFixed(0)}% off',
                                                  style: const TextStyle(
                                                    fontSize: 12,
                                                    color: Colors.green,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                            ],
                                          ),
                                        ),
                                        // Action Buttons
                                        Column(
                                          children: [
                                            // Remove from wishlist
                                            IconButton(
                                              onPressed: () {
                                                wishlistProvider.removeItem(product.id);
                                                ScaffoldMessenger.of(context).showSnackBar(
                                                  SnackBar(
                                                    content: Text('${product.name} removed from wishlist'),
                                                  ),
                                                );
                                              },
                                              icon: const Icon(
                                                Icons.favorite,
                                                color: Colors.red,
                                              ),
                                            ),
                                            const SizedBox(height: 8),
                                            // Add to cart
                                            Consumer<CartProvider>(
                                              builder: (context, cartProvider, child) {
                                                return ElevatedButton(
                                                  onPressed: () {
                                                    cartProvider.addItem(product);
                                                    ScaffoldMessenger.of(context).showSnackBar(
                                                      SnackBar(
                                                        content: Text('${product.name} added to cart'),
                                                        action: SnackBarAction(
                                                          label: 'VIEW CART',
                                                          onPressed: () {
                                                            Navigator.of(context).pushNamed('/cart');
                                                          },
                                                        ),
                                                      ),
                                                    );
                                                  },
                                                  style: ElevatedButton.styleFrom(
                                                    backgroundColor: AppTheme.primaryColor,
                                                    shape: RoundedRectangleBorder(
                                                      borderRadius: BorderRadius.circular(20),
                                                    ),
                                                    minimumSize: const Size(80, 36),
                                                    padding: const EdgeInsets.symmetric(
                                                      horizontal: 12,
                                                      vertical: 8,
                                                    ),
                                                  ),
                                                  child: const Text(
                                                    'Add to Cart',
                                                    style: TextStyle(
                                                      color: Colors.white,
                                                      fontSize: 12,
                                                      fontWeight: FontWeight.bold,
                                                    ),
                                                  ),
                                                );
                                              },
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}