class User {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String? avatar;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.avatar,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      avatar: json['avatar'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'avatar': avatar,
    };
  }
}