import 'address.dart';

class User {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String? avatar;
  List<Address>? addresses;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.avatar,
    this.addresses,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    // Parse addresses if present
    List<Address>? addressList;
    if (json['addresses'] != null) {
      addressList = (json['addresses'] as List)
          .map((addr) => Address.fromJson(addr))
          .toList();
    }

    return User(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      avatar: json['avatar'],
      addresses: addressList,
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
    };
  }
}