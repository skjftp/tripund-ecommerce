class CartItem {
  final String id;
  final String productId;
  final String title;
  final double price;
  final String imageUrl;
  final int quantity;

  CartItem({
    required this.id,
    required this.productId,
    required this.title,
    required this.price,
    required this.imageUrl,
    required this.quantity,
  });
}