import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import '../providers/product_provider.dart';
import '../widgets/parallax_card.dart';
import '../widgets/cart_icon_button.dart';
import '../utils/theme.dart';
import '../utils/constants.dart';
import 'product_detail_screen.dart';

class ShopScreen extends StatefulWidget {
  const ShopScreen({super.key});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String? _selectedCategoryId;
  String? _selectedCategorySlug;
  String? _selectedSubcategoryId;
  String? _selectedSubcategoryName;
  double _minPrice = 0;
  double _maxPrice = 10000;
  RangeValues _priceRange = const RangeValues(0, 10000);
  String _sortBy = 'newest';
  bool _showFilters = false;

  @override
  void initState() {
    super.initState();
    // Load all products
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadFilteredProducts();
    });
  }
  
  Future<void> _loadFilteredProducts() async {
    print('🎯 Shop: Loading filtered products - Category: $_selectedCategorySlug, Subcategory: $_selectedSubcategoryName');
    final provider = context.read<ProductProvider>();
    if (_selectedCategorySlug != null) {
      // Use API filtering with category slug and type for subcategory
      await provider.selectCategory(
        _selectedCategorySlug, 
        type: _selectedSubcategoryName?.toLowerCase().replaceAll(' ', '-')
      );
    } else if (_searchQuery.isNotEmpty) {
      await provider.searchProducts(_searchQuery);
    } else {
      await provider.loadProducts(refresh: true);
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  // Removed _getFilteredProducts - now using API filtering from provider directly

  void _resetFilters() {
    setState(() {
      _searchQuery = '';
      _searchController.clear();
      _selectedCategoryId = null;
      _selectedCategorySlug = null;
      _selectedSubcategoryId = null;
      _selectedSubcategoryName = null;
      _priceRange = const RangeValues(0, 10000);
      _sortBy = 'newest';
    });
    _loadFilteredProducts();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Shop'),
        backgroundColor: Colors.white,
        elevation: 1,
        actions: [
          IconButton(
            icon: Icon(
              _showFilters ? Icons.filter_list_off : Icons.filter_list,
              color: _showFilters ? AppTheme.primaryColor : Colors.black,
            ),
            onPressed: () {
              setState(() {
                _showFilters = !_showFilters;
              });
            },
          ),
          const CartIconButton(iconColor: Colors.black),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search products...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        setState(() {
                          _searchController.clear();
                          _searchQuery = '';
                        });
                      },
                    )
                  : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey[300]!),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: AppTheme.primaryColor),
                ),
                filled: true,
                fillColor: Colors.grey[50],
              ),
              onChanged: (value) {
                setState(() {
                  _searchQuery = value;
                });
              },
            ),
          ),
          
          // Filters Section
          if (_showFilters)
            Container(
              color: Colors.white,
              child: Column(
                children: [
                  const Divider(height: 1),
                  // Category Filter
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Consumer<ProductProvider>(
                      builder: (context, provider, child) {
                        final categories = provider.categories;
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Category',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 8),
                            SizedBox(
                              height: 35,
                              child: ListView.builder(
                                scrollDirection: Axis.horizontal,
                                itemCount: categories.length + 1, // +1 for 'All' option
                                itemBuilder: (context, index) {
                                  if (index == 0) {
                                    // 'All' option
                                    final isSelected = _selectedCategoryId == null;
                                    return Padding(
                                      padding: const EdgeInsets.only(right: 8),
                                      child: FilterChip(
                                        label: const Text('All'),
                                        selected: isSelected,
                                        onSelected: (selected) {
                                          setState(() {
                                            _selectedCategoryId = null;
                                            _selectedCategorySlug = null;
                                            _selectedSubcategoryId = null;
                                            _selectedSubcategoryName = null;
                                          });
                                          _loadFilteredProducts();
                                        },
                                        selectedColor: AppTheme.primaryColor.withOpacity(0.2),
                                        checkmarkColor: AppTheme.primaryColor,
                                        labelStyle: TextStyle(
                                          color: isSelected ? AppTheme.primaryColor : Colors.black87,
                                          fontSize: 12,
                                        ),
                                      ),
                                    );
                                  }
                                  final category = categories[index - 1];
                                  final isSelected = _selectedCategoryId == category.id;
                                  return Padding(
                                    padding: const EdgeInsets.only(right: 8),
                                    child: FilterChip(
                                      label: Text(category.name),
                                      selected: isSelected,
                                      onSelected: (selected) {
                                        setState(() {
                                          _selectedCategoryId = selected ? category.id : null;
                                          _selectedSubcategoryId = null; // Reset subcategory
                                        });
                                      },
                                      selectedColor: AppTheme.primaryColor.withOpacity(0.2),
                                      checkmarkColor: AppTheme.primaryColor,
                                      labelStyle: TextStyle(
                                        color: isSelected ? AppTheme.primaryColor : Colors.black87,
                                        fontSize: 12,
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ),
                  
                  // Subcategory Filter (shows only when category is selected)
                  if (_selectedCategoryId != null)
                    Consumer<ProductProvider>(
                      builder: (context, provider, child) {
                        final selectedCategory = provider.categories.firstWhere(
                          (cat) => cat.id == _selectedCategoryId,
                          orElse: () => provider.categories.first,
                        );
                        
                        if (selectedCategory.subcategories == null || 
                            selectedCategory.subcategories!.isEmpty) {
                          return const SizedBox.shrink();
                        }
                        
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Subcategory',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(height: 8),
                              SizedBox(
                                height: 40,
                                child: ListView.builder(
                                  scrollDirection: Axis.horizontal,
                                  itemCount: selectedCategory.subcategories!.length + 1,
                                  itemBuilder: (context, index) {
                                    if (index == 0) {
                                      final isSelected = _selectedSubcategoryId == null;
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
                                            _loadFilteredProducts();
                                          },
                                          selectedColor: AppTheme.primaryColor.withOpacity(0.2),
                                          checkmarkColor: AppTheme.primaryColor,
                                          labelStyle: TextStyle(
                                            color: isSelected ? AppTheme.primaryColor : Colors.black87,
                                            fontSize: 12,
                                          ),
                                        ),
                                      );
                                    }
                                    final subcategory = selectedCategory.subcategories![index - 1];
                                    final isSelected = _selectedSubcategoryId == subcategory.id;
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
                                          _loadFilteredProducts();
                                        },
                                        selectedColor: AppTheme.primaryColor.withOpacity(0.2),
                                        checkmarkColor: AppTheme.primaryColor,
                                        labelStyle: TextStyle(
                                          color: isSelected ? AppTheme.primaryColor : Colors.black87,
                                          fontSize: 12,
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
                  
                  // Price Range Filter
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Price Range',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                            Text(
                              '${Constants.currency}${_priceRange.start.toInt()} - ${Constants.currency}${_priceRange.end.toInt()}',
                              style: TextStyle(
                                color: AppTheme.primaryColor,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        RangeSlider(
                          values: _priceRange,
                          min: _minPrice,
                          max: _maxPrice,
                          activeColor: AppTheme.primaryColor,
                          inactiveColor: Colors.grey[300],
                          onChanged: (values) {
                            setState(() {
                              _priceRange = values;
                            });
                          },
                        ),
                      ],
                    ),
                  ),
                  
                  // Sort Options
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Sort By',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 8),
                        SizedBox(
                          height: 35,
                          child: ListView(
                            scrollDirection: Axis.horizontal,
                            children: [
                              _buildSortChip('newest', 'Newest'),
                              _buildSortChip('price_low', 'Price: Low to High'),
                              _buildSortChip('price_high', 'Price: High to Low'),
                              _buildSortChip('name', 'Name: A to Z'),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Reset Filters Button
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: _resetFilters,
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(color: AppTheme.primaryColor),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: Text(
                          'Reset Filters',
                          style: TextStyle(color: AppTheme.primaryColor),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            ),
          
          // Products Grid
          Expanded(
            child: Consumer<ProductProvider>(
              builder: (context, provider, child) {
                // Use provider's products which are already filtered by API
                var products = provider.products;
                print('🛍️ Shop: Displaying ${products.length} products from provider');
                
                // Apply local price range filter
                if (_priceRange.start > 0 || _priceRange.end < 10000) {
                  products = products.where((product) {
                    return product.price >= _priceRange.start && product.price <= _priceRange.end;
                  }).toList();
                }
                
                // Apply local sorting
                switch (_sortBy) {
                  case 'price_low':
                    products.sort((a, b) => a.price.compareTo(b.price));
                    break;
                  case 'price_high':
                    products.sort((a, b) => b.price.compareTo(a.price));
                    break;
                  case 'name':
                    products.sort((a, b) => a.name.compareTo(b.name));
                    break;
                  case 'newest':
                  default:
                    // Already sorted by newest from API
                    break;
                }
                
                if (provider.isLoading && products.isEmpty) {
                  return const Center(child: CircularProgressIndicator());
                }
                
                if (products.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.search_off,
                          size: 80,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _searchQuery.isNotEmpty 
                            ? 'No products found for "$_searchQuery"'
                            : 'No products found',
                          style: TextStyle(
                            fontSize: 18,
                            color: Colors.grey[600],
                          ),
                        ),
                        if (_searchQuery.isNotEmpty || _selectedCategoryId != null || 
                            _priceRange.start > 0 || _priceRange.end < 10000)
                          Padding(
                            padding: const EdgeInsets.only(top: 16),
                            child: TextButton(
                              onPressed: _resetFilters,
                              child: Text(
                                'Clear filters',
                                style: TextStyle(color: AppTheme.primaryColor),
                              ),
                            ),
                          ),
                      ],
                    ),
                  );
                }
                
                return AnimationLimiter(
                  child: GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.75,
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
                );
              },
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildSortChip(String value, String label) {
    final isSelected = _sortBy == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (selected) {
          setState(() {
            _sortBy = value;
          });
        },
        selectedColor: AppTheme.primaryColor.withOpacity(0.2),
        labelStyle: TextStyle(
          color: isSelected ? AppTheme.primaryColor : Colors.black87,
          fontSize: 12,
        ),
      ),
    );
  }
}