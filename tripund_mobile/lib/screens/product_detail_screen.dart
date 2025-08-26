import 'package:flutter/material.dart';
import '../models/product.dart';

class ProductDetailScreen extends StatelessWidget {
  final Product product;
  
  const ProductDetailScreen({
    super.key,
    required this.product,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(product.name),
      ),
      body: Center(
        child: Text('Product Detail: ${product.name}'),
      ),
    );
  }
}