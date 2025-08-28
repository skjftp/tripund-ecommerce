import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import '../providers/product_provider.dart';
import '../models/category.dart';
import '../widgets/parallax_card.dart';
import '../widgets/cart_icon_button.dart';
import '../utils/theme.dart';
import 'product_detail_screen.dart';

class CategoryProductsScreen extends StatefulWidget {
  final Category category;
  
  const CategoryProductsScreen({
    super.key,
    required this.category,
  });

  @override
  State<CategoryProductsScreen> createState() => _CategoryProductsScreenState();
}

class _CategoryProductsScreenState extends State<CategoryProductsScreen> {
  String? _selectedSubcategoryId;
  String? _selectedSubcategoryName;
  
  @override
  void initState() {
    super.initState();
    // Load products for this category using slug
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProductProvider>().selectCategory(widget.category.slug);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.category.name),
        backgroundColor: AppTheme.backgroundColor,
        actions: const [
          CartIconButton(iconColor: Colors.black),
          SizedBox(width: 8),
        ],
      ),
      body: Consumer<ProductProvider>(
        builder: (context, provider, child) {
          // Use the products from provider which are already filtered by category
          var products = provider.products;
          
          // Apply subcategory filter if selected
          if (_selectedSubcategoryName != null) {
            products = products.where((product) {
              return product.subcategories != null && 
                     product.subcategories!.contains(_selectedSubcategoryName);
            }).toList();
          }
          
          if (provider.isLoading && products.isEmpty) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }
          
          if (products.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.inventory_2_outlined,
                    size: 80,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No products in this category',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            );
          }
          
          return RefreshIndicator(
            onRefresh: () => provider.refreshProducts(),
            child: Column(
              children: [
                // Subcategory filter chips
                if (widget.category.subcategories != null && widget.category.subcategories!.isNotEmpty)
                  Container(
                    height: 50,
                    color: Colors.white,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      itemCount: widget.category.subcategories!.length + 1,
                      itemBuilder: (context, index) {
                        if (index == 0) {
                          // 'All' option
                          final isSelected = _selectedSubcategoryName == null;
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: FilterChip(
                              label: const Text('All'),
                              selected: isSelected,
                              onSelected: (selected) {
                                setState(() {
                                  _selectedSubcategoryId = null;
                                  _selectedSubcategoryName = null;
                                });
                              },
                              selectedColor: AppTheme.primaryColor.withOpacity(0.2),
                              checkmarkColor: AppTheme.primaryColor,
                              labelStyle: TextStyle(
                                color: isSelected ? AppTheme.primaryColor : Colors.black87,
                                fontSize: 13,
                              ),
                            ),
                          );
                        }
                        final subcategory = widget.category.subcategories![index - 1];
                        final isSelected = _selectedSubcategoryName == subcategory.name;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: FilterChip(
                            label: Text(subcategory.name),
                            selected: isSelected,
                            onSelected: (selected) {
                              setState(() {
                                _selectedSubcategoryId = selected ? subcategory.id : null;
                                _selectedSubcategoryName = selected ? subcategory.name : null;
                              });
                            },
                            selectedColor: AppTheme.primaryColor.withOpacity(0.2),
                            checkmarkColor: AppTheme.primaryColor,
                            labelStyle: TextStyle(
                              color: isSelected ? AppTheme.primaryColor : Colors.black87,
                              fontSize: 13,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                if (widget.category.subcategories != null && widget.category.subcategories!.isNotEmpty)
                  const Divider(height: 1),
                Expanded(
                  child: GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.7,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                    ),
                    itemCount: products.length,
                    itemBuilder: (context, index) {
                      final product = products[index];
                      return AnimationConfiguration.staggeredGrid(
                        position: index,
                        duration: const Duration(milliseconds: 375),
                        columnCount: 2,
                        child: ScaleAnimation(
                          child: FadeInAnimation(
                            child: ParallaxCard(
                              product: product,
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
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}