import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import '../providers/product_provider.dart';
import '../widgets/parallax_card.dart';
import '../utils/theme.dart';
import 'product_detail_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  bool _isSearching = false;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    // Auto-focus the search field when screen opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _performSearch(String query) {
    setState(() {
      _searchQuery = query;
      _isSearching = query.isNotEmpty;
    });
    if (query.isNotEmpty) {
      context.read<ProductProvider>().searchProducts(query);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: TextField(
          controller: _searchController,
          focusNode: _focusNode,
          onChanged: _performSearch,
          decoration: InputDecoration(
            hintText: 'Search for handicrafts...',
            hintStyle: TextStyle(color: AppTheme.textSecondary),
            border: InputBorder.none,
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear, color: Colors.grey),
                    onPressed: () {
                      _searchController.clear();
                      _performSearch('');
                      _focusNode.requestFocus();
                    },
                  )
                : null,
          ),
          style: const TextStyle(fontSize: 16, color: Colors.black),
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (!_isSearching) {
      // Show popular searches when not searching
      return SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Popular Searches',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                _buildSuggestionChip('Wall Hangings'),
                _buildSuggestionChip('Brass Idols'),
                _buildSuggestionChip('Paintings'),
                _buildSuggestionChip('Torans'),
                _buildSuggestionChip('Diyas'),
                _buildSuggestionChip('Gift Sets'),
                _buildSuggestionChip('Storage Boxes'),
                _buildSuggestionChip('Lanterns'),
              ],
            ),
            const SizedBox(height: 32),
            Text(
              'Browse Categories',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Consumer<ProductProvider>(
              builder: (context, provider, child) {
                final categories = provider.categories;
                return Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: categories.map((category) {
                    return ActionChip(
                      label: Text(category.name),
                      onPressed: () {
                        _searchController.text = category.name;
                        _performSearch(category.name);
                      },
                      backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                      labelStyle: TextStyle(color: AppTheme.primaryColor),
                    );
                  }).toList(),
                );
              },
            ),
          ],
        ),
      );
    }

    // Show search results
    return Consumer<ProductProvider>(
      builder: (context, provider, child) {
        final products = provider.products.where((product) {
          final query = _searchQuery.toLowerCase();
          return product.name.toLowerCase().contains(query) ||
              product.description.toLowerCase().contains(query);
        }).toList();

        if (provider.isLoading) {
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
                  'No products found for "$_searchQuery"',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Try searching for something else',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[500],
                  ),
                ),
              ],
            ),
          );
        }

        return CustomScrollView(
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.all(20),
              sliver: SliverToBoxAdapter(
                child: Text(
                  '${products.length} results for "$_searchQuery"',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 0.75,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
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
                                  builder: (context) => ProductDetailScreen(product: product),
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                    );
                  },
                  childCount: products.length,
                ),
              ),
            ),
            const SliverPadding(padding: EdgeInsets.only(bottom: 20)),
          ],
        );
      },
    );
  }

  Widget _buildSuggestionChip(String label) {
    return ActionChip(
      label: Text(label),
      onPressed: () {
        _searchController.text = label;
        _performSearch(label);
      },
      backgroundColor: Colors.grey[200],
      labelStyle: TextStyle(color: AppTheme.textPrimary),
    );
  }
}