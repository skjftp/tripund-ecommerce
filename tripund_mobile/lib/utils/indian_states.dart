// Indian states and GST calculation utilities

class IndianState {
  final String code;
  final String name;

  const IndianState({required this.code, required this.name});
}

class GSTBreakdown {
  final double basePrice;
  final double cgst;
  final double sgst;
  final double igst;
  final double totalGST;
  final double gstRate;
  final bool isInterstate;

  GSTBreakdown({
    required this.basePrice,
    required this.cgst,
    required this.sgst,
    required this.igst,
    required this.totalGST,
    required this.gstRate,
    required this.isInterstate,
  });
}

class IndianStates {
  static const String businessState = 'UP'; // Tripund is registered in Uttar Pradesh
  
  static const List<IndianState> states = [
    IndianState(code: 'AP', name: 'Andhra Pradesh'),
    IndianState(code: 'AR', name: 'Arunachal Pradesh'),
    IndianState(code: 'AS', name: 'Assam'),
    IndianState(code: 'BR', name: 'Bihar'),
    IndianState(code: 'CG', name: 'Chhattisgarh'),
    IndianState(code: 'GA', name: 'Goa'),
    IndianState(code: 'GJ', name: 'Gujarat'),
    IndianState(code: 'HR', name: 'Haryana'),
    IndianState(code: 'HP', name: 'Himachal Pradesh'),
    IndianState(code: 'JK', name: 'Jammu and Kashmir'),
    IndianState(code: 'JH', name: 'Jharkhand'),
    IndianState(code: 'KA', name: 'Karnataka'),
    IndianState(code: 'KL', name: 'Kerala'),
    IndianState(code: 'MP', name: 'Madhya Pradesh'),
    IndianState(code: 'MH', name: 'Maharashtra'),
    IndianState(code: 'MN', name: 'Manipur'),
    IndianState(code: 'ML', name: 'Meghalaya'),
    IndianState(code: 'MZ', name: 'Mizoram'),
    IndianState(code: 'NL', name: 'Nagaland'),
    IndianState(code: 'OD', name: 'Odisha'),
    IndianState(code: 'PB', name: 'Punjab'),
    IndianState(code: 'RJ', name: 'Rajasthan'),
    IndianState(code: 'SK', name: 'Sikkim'),
    IndianState(code: 'TN', name: 'Tamil Nadu'),
    IndianState(code: 'TG', name: 'Telangana'),
    IndianState(code: 'TR', name: 'Tripura'),
    IndianState(code: 'UK', name: 'Uttarakhand'),
    IndianState(code: 'UP', name: 'Uttar Pradesh'),
    IndianState(code: 'WB', name: 'West Bengal'),
    // Union Territories
    IndianState(code: 'AN', name: 'Andaman and Nicobar Islands'),
    IndianState(code: 'CH', name: 'Chandigarh'),
    IndianState(code: 'DH', name: 'Dadra and Nagar Haveli and Daman and Diu'),
    IndianState(code: 'DL', name: 'Delhi'),
    IndianState(code: 'LA', name: 'Ladakh'),
    IndianState(code: 'LD', name: 'Lakshadweep'),
    IndianState(code: 'PY', name: 'Puducherry'),
  ];

  static GSTBreakdown calculateStateBasedGST(
    double gstInclusivePrice,
    String stateCode, {
    double gstRate = 18,
  }) {
    // Calculate base price from GST-inclusive price
    final basePrice = (gstInclusivePrice * 100) / (100 + gstRate);
    final totalGST = gstInclusivePrice - basePrice;
    
    // Check if it's interstate transaction
    final isInterstate = stateCode != businessState;
    
    double cgst = 0;
    double sgst = 0;
    double igst = 0;
    
    if (isInterstate) {
      // Interstate - apply IGST
      igst = totalGST;
    } else {
      // Intrastate - split equally between CGST and SGST
      cgst = totalGST / 2;
      sgst = totalGST / 2;
    }
    
    return GSTBreakdown(
      basePrice: basePrice,
      cgst: cgst,
      sgst: sgst,
      igst: igst,
      totalGST: totalGST,
      gstRate: gstRate,
      isInterstate: isInterstate,
    );
  }

  static GSTBreakdown calculateCartStateBasedGST(
    List<CartItem> items,
    String stateCode, {
    double gstRate = 18,
  }) {
    final totalWithGST = items.fold<double>(
      0,
      (sum, item) => sum + (item.product.price * item.quantity),
    );
    return calculateStateBasedGST(totalWithGST, stateCode, gstRate: gstRate);
  }

  static String getStateName(String code) {
    final state = states.firstWhere(
      (s) => s.code == code,
      orElse: () => const IndianState(code: '', name: ''),
    );
    return state.name;
  }
}

class CartItem {
  final dynamic product;
  final int quantity;
  
  CartItem({required this.product, required this.quantity});
}