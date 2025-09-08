import 'address.dart';

class User {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String? avatar;
  List<Address>? addresses;
  List<dynamic>? cart;
  List<String>? wishlist;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.avatar,
    this.addresses,
    this.cart,
    this.wishlist,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    // Parse addresses if present
    List<Address>? addressList;
    if (json['addresses'] != null) {
      addressList = (json['addresses'] as List)
          .map((addr) => Address.fromJson(addr))
          .toList();
    }
    
    // Parse wishlist
    List<String>? wishlistItems;
    if (json['wishlist'] != null) {
      wishlistItems = List<String>.from(json['wishlist']);
    }

    return User(
      id: json['id'] ?? '',
      name: json['name'] ?? (json['profile'] != null ? '${json['profile']['first_name'] ?? ''} ${json['profile']['last_name'] ?? ''}' : ''),
      email: json['email'] ?? '',
      phone: json['mobile_number'] ?? json['phone'], // Handle both mobile_number (mobile users) and phone (email users)
      avatar: json['avatar'] ?? json['profile']?['avatar'],
      addresses: addressList,
      cart: json['cart'],
      wishlist: wishlistItems,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'avatar': avatar,
      'addresses': addresses?.map((addr) => addr.toJson()).toList(),
      'cart': cart,
      'wishlist': wishlist,
    };
  }
}