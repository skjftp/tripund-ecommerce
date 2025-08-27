class Address {
  final String id;
  final String name;
  final String line1;
  final String? line2;
  final String city;
  final String state;
  final String stateCode;
  final String postalCode;
  final String country;
  final String phone;
  final bool isDefault;
  final double? latitude;
  final double? longitude;

  Address({
    required this.id,
    required this.name,
    required this.line1,
    this.line2,
    required this.city,
    required this.state,
    required this.stateCode,
    required this.postalCode,
    this.country = 'India',
    required this.phone,
    this.isDefault = false,
    this.latitude,
    this.longitude,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'line1': line1,
      'line2': line2,
      'city': city,
      'state': state,
      'stateCode': stateCode,
      'postalCode': postalCode,
      'country': country,
      'phone': phone,
      'isDefault': isDefault,
      'latitude': latitude,
      'longitude': longitude,
    };
  }

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      line1: json['line1'] ?? '',
      line2: json['line2'],
      city: json['city'] ?? '',
      state: json['state'] ?? '',
      stateCode: json['stateCode'] ?? '',
      postalCode: json['postalCode'] ?? '',
      country: json['country'] ?? 'India',
      phone: json['phone'] ?? '',
      isDefault: json['isDefault'] ?? false,
      latitude: json['latitude']?.toDouble(),
      longitude: json['longitude']?.toDouble(),
    );
  }

  String get fullAddress {
    final parts = [
      line1,
      if (line2 != null && line2!.isNotEmpty) line2,
      city,
      '$state - $postalCode',
      country,
    ];
    return parts.where((p) => p != null && p.isNotEmpty).join(', ');
  }

  Address copyWith({
    String? id,
    String? name,
    String? line1,
    String? line2,
    String? city,
    String? state,
    String? stateCode,
    String? postalCode,
    String? country,
    String? phone,
    bool? isDefault,
    double? latitude,
    double? longitude,
  }) {
    return Address(
      id: id ?? this.id,
      name: name ?? this.name,
      line1: line1 ?? this.line1,
      line2: line2 ?? this.line2,
      city: city ?? this.city,
      state: state ?? this.state,
      stateCode: stateCode ?? this.stateCode,
      postalCode: postalCode ?? this.postalCode,
      country: country ?? this.country,
      phone: phone ?? this.phone,
      isDefault: isDefault ?? this.isDefault,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
    );
  }
}