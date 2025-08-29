import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/product.dart';
import '../providers/cart_provider.dart';
import '../utils/theme.dart';
import 'package:cached_network_image/cached_network_image.dart';

class VariantSelectionModal extends StatefulWidget {
  final Product product;
  final bool directCheckout;

  const VariantSelectionModal({
    super.key,
    required this.product,
    this.directCheckout = false,
  });

  @override
  State<VariantSelectionModal> createState() => _VariantSelectionModalState();
}

class _VariantSelectionModalState extends State<VariantSelectionModal> {
  String? selectedColor;
  String? selectedSize;
  ProductVariant? selectedVariant;
  int quantity = 1;

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
          selectedColor = cheapest!.color;
          selectedSize = cheapest.size;
          selectedVariant = cheapest;
        });
      }
    }
  }

  void _updateSelectedVariant() {
    if (selectedColor != null && selectedSize != null) {
      setState(() {
        selectedVariant = widget.product.getVariant(selectedColor, selectedSize);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasVariants = widget.product.hasVariants;
    final displayPrice = selectedVariant?.displayPrice ?? widget.product.displayPrice;
    final displayImage = (selectedVariant?.images?.isNotEmpty == true) 
        ? selectedVariant!.images!.first 
        : widget.product.images.isNotEmpty 
            ? widget.product.images.first 
            : '';

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Product info header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Product image
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: CachedNetworkImage(
                    imageUrl: displayImage,
                    width: 80,
                    height: 80,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(
                      color: Colors.grey[200],
                      child: const Center(
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    ),
                    errorWidget: (context, url, error) => Container(
                      color: Colors.grey[200],
                      child: const Icon(Icons.error),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                
                // Product details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.product.name,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '₹${displayPrice.toStringAsFixed(2)}',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                      if (selectedVariant != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          'SKU: ${selectedVariant!.sku}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                
                // Close button
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
          ),
          
          const Divider(height: 1),
          
          // Scrollable content area
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Variant selection
                  if (hasVariants) ...[
                    // Color selection
                    if (widget.product.availableColors != null && widget.product.availableColors!.isNotEmpty) ...[
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Color',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: widget.product.availableColors!.map((color) {
                                final isSelected = selectedColor == color;
                                // Check if this color has available sizes
                                final hasAvailableSizes = widget.product.variants!
                                    .any((v) => v.color == color && v.available);
                                
                                return ChoiceChip(
                                  label: Text(color),
                                  selected: isSelected,
                                  onSelected: hasAvailableSizes ? (selected) {
                                    setState(() {
                                      selectedColor = selected ? color : null;
                                      _updateSelectedVariant();
                                    });
                                  } : null,
                                  backgroundColor: Colors.grey[200],
                                  selectedColor: AppTheme.primaryColor,
                                  labelStyle: TextStyle(
                                    color: isSelected ? Colors.white : Colors.black,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                  ),
                                );
                              }).toList(),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    
                    // Size selection
                    if (widget.product.availableSizes != null && widget.product.availableSizes!.isNotEmpty) ...[
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Size',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: widget.product.availableSizes!.map((size) {
                                final isSelected = selectedSize == size;
                                // Check if this size is available for selected color
                                final isAvailable = selectedColor == null ||
                                    widget.product.variants!.any((v) => 
                                      v.color == selectedColor && v.size == size && v.available
                                    );
                                
                                return ChoiceChip(
                                  label: Text(size),
                                  selected: isSelected,
                                  onSelected: isAvailable ? (selected) {
                                    setState(() {
                                      selectedSize = selected ? size : null;
                                      _updateSelectedVariant();
                                    });
                                  } : null,
                                  backgroundColor: Colors.grey[200],
                                  selectedColor: AppTheme.primaryColor,
                                  labelStyle: TextStyle(
                                    color: isSelected ? Colors.white : Colors.black,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                  ),
                                );
                              }).toList(),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                  ],
                  
                  // Quantity selector
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      children: [
                        const Text(
                          'Quantity',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const Spacer(),
                        Container(
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey[300]!),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              IconButton(
                                icon: const Icon(Icons.remove),
                                onPressed: quantity > 1 
                                  ? () => setState(() => quantity--) 
                                  : null,
                                padding: const EdgeInsets.all(8),
                                constraints: const BoxConstraints(),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                child: Text(
                                  quantity.toString(),
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.add),
                                onPressed: () => setState(() => quantity++),
                                padding: const EdgeInsets.all(8),
                                constraints: const BoxConstraints(),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // Add to cart button
          Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: (hasVariants && selectedVariant == null) ? null : () {
                  final cart = Provider.of<CartProvider>(context, listen: false);
                  
                  // Add to cart with variant info
                  cart.addItem(
                    widget.product.id,
                    widget.product.name,
                    displayPrice,
                    displayImage,
                    quantity: quantity,
                    variantId: selectedVariant?.id,
                    color: selectedVariant?.color,
                    size: selectedVariant?.size,
                    sku: selectedVariant?.sku,
                  );
                  
                  Navigator.pop(context);
                  
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Added ${widget.product.name} to cart'),
                      duration: const Duration(seconds: 2),
                      action: SnackBarAction(
                        label: 'View Cart',
                        onPressed: () {
                          Navigator.pushNamed(context, '/cart');
                        },
                      ),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: Text(
                  hasVariants && selectedVariant == null 
                    ? 'Please select options'
                    : widget.directCheckout ? 'Buy Now' : 'Add to Cart',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}