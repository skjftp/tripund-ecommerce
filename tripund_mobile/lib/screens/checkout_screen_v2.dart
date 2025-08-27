import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'dart:convert';

import '../utils/theme.dart';
import '../utils/indian_states.dart';
import '../models/address.dart';
import '../providers/cart_provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../services/payment_service.dart';

class CheckoutScreenV2 extends StatefulWidget {
  const CheckoutScreenV2({super.key});

  @override
  State<CheckoutScreenV2> createState() => _CheckoutScreenV2State();
}

class _CheckoutScreenV2State extends State<CheckoutScreenV2> {
  final _formKey = GlobalKey<FormState>();
  final _paymentFormKey = GlobalKey<FormState>();
  late ApiService _apiService;
  late PaymentService _paymentService;
  late Razorpay _razorpay;
  
  int _currentStep = 0;
  bool _isProcessing = false;
  String _selectedPaymentMethod = 'online';  // Default to online payment
  String _selectedNativePaymentMethod = 'card';
  bool _useNativePayment = false;
  bool _codEnabled = false;  // COD disabled by default
  double _codLimit = 10000.0;
  
  // Address selection
  List<Address> _savedAddresses = [];
  Address? _selectedAddress;
  bool _useNewAddress = false;
  String _selectedState = 'UP';
  String? _currentOrderId;
  
  // Controllers
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressLine1Controller = TextEditingController();
  final _addressLine2Controller = TextEditingController();
  final _cityController = TextEditingController();
  final _pinCodeController = TextEditingController();
  
  // Payment controllers
  final _cardNumberController = TextEditingController();
  final _cardHolderController = TextEditingController();
  final _expiryController = TextEditingController();
  final _cvvController = TextEditingController();
  final _upiIdController = TextEditingController();
  
  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    _paymentService = PaymentService();
    _initializeServices();
    _initializeRazorpay();
    _loadSavedAddresses();
    _loadPaymentSettings();  // Load payment settings
    _prefillUserData();
  }
  
  Future<void> _initializeServices() async {
    // Initialize API service with auth token if available
    await _apiService.init();
    
    // Also set auth token for payment service if user is authenticated
    final authProvider = context.read<AuthProvider>();
    if (authProvider.isAuthenticated && authProvider.token != null) {
      _paymentService.setAuthToken(authProvider.token!);
    }
  }
  
  void _initializeRazorpay() {
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }
  
  Future<void> _loadPaymentSettings() async {
    try {
      final settings = await _apiService.getPublicSettings();
      if (settings != null && mounted) {
        setState(() {
          _codEnabled = settings['payment']['cod_enabled'] ?? false;
          _codLimit = (settings['payment']['cod_limit'] ?? 10000.0).toDouble();
          // If COD is disabled and it was selected, switch to online
          if (!_codEnabled && _selectedPaymentMethod == 'cod') {
            _selectedPaymentMethod = 'online';
          }
        });
      }
    } catch (e) {
      print('Error loading payment settings: $e');
    }
  }

  Future<void> _loadSavedAddresses() async {
    final prefs = await SharedPreferences.getInstance();
    final addressesJson = prefs.getString('user_addresses');
    if (addressesJson != null) {
      final List<dynamic> decoded = json.decode(addressesJson);
      setState(() {
        _savedAddresses = decoded.map((json) => Address.fromJson(json)).toList();
        
        // Select default address if available
        final defaultAddress = _savedAddresses.firstWhere(
          (addr) => addr.isDefault,
          orElse: () => _savedAddresses.isNotEmpty ? _savedAddresses.first : Address(
            id: '',
            name: '',
            line1: '',
            city: '',
            state: '',
            stateCode: '',
            postalCode: '',
            phone: '',
          ),
        );
        
        if (defaultAddress.id.isNotEmpty) {
          _selectedAddress = defaultAddress;
          _fillAddressFields(defaultAddress);
        } else if (_savedAddresses.isEmpty) {
          _useNewAddress = true;
        }
      });
    } else {
      setState(() {
        _useNewAddress = true;
      });
    }
  }
  
  void _fillAddressFields(Address address) {
    _addressLine1Controller.text = address.line1;
    _addressLine2Controller.text = address.line2 ?? '';
    _cityController.text = address.city;
    _pinCodeController.text = address.postalCode;
    _phoneController.text = address.phone;
    setState(() {
      _selectedState = address.stateCode;
    });
    
    // Extract name from address name (format: "Type - Name")
    final nameParts = address.name.split(' - ');
    if (nameParts.length > 1) {
      _nameController.text = nameParts[1];
    }
  }
  
  void _prefillUserData() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = context.read<AuthProvider>();
      if (authProvider.isAuthenticated && authProvider.user != null) {
        if (_nameController.text.isEmpty) {
          _nameController.text = authProvider.user!.name;
        }
        _emailController.text = authProvider.user!.email;
        if (_phoneController.text.isEmpty) {
          _phoneController.text = authProvider.user!.phone ?? '';
        }
      }
    });
  }
  
  @override
  void dispose() {
    _razorpay.clear();
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _addressLine1Controller.dispose();
    _addressLine2Controller.dispose();
    _cityController.dispose();
    _pinCodeController.dispose();
    _cardNumberController.dispose();
    _cardHolderController.dispose();
    _expiryController.dispose();
    _cvvController.dispose();
    _upiIdController.dispose();
    super.dispose();
  }
  
  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    // Verify payment with backend
    final authProvider = context.read<AuthProvider>();
    if (authProvider.isAuthenticated && authProvider.token != null) {
      _paymentService.setAuthToken(authProvider.token!);
    }
    
    try {
      final verified = await _paymentService.verifyPayment(
        razorpayOrderId: response.orderId ?? '',
        razorpayPaymentId: response.paymentId ?? '',
        razorpaySignature: response.signature ?? '',
        orderId: _currentOrderId ?? '',
      );
      
      if (verified) {
        final cartProvider = context.read<CartProvider>();
        cartProvider.clear();
        setState(() {
          _isProcessing = false;
        });
        
        if (mounted) {
          _showSuccessDialog(_currentOrderId ?? 'N/A');
        }
      } else {
        throw Exception('Payment verification failed');
      }
    } catch (e) {
      setState(() {
        _isProcessing = false;
      });
      Fluttertoast.showToast(
        msg: "Payment verification failed",
        backgroundColor: Colors.red,
      );
    }
  }
  
  void _handlePaymentError(PaymentFailureResponse response) {
    setState(() {
      _isProcessing = false;
    });
    
    // Don't show error if user cancelled
    if (response.code != Razorpay.PAYMENT_CANCELLED) {
      Fluttertoast.showToast(
        msg: "Payment failed: ${response.message}",
        backgroundColor: Colors.red,
      );
    }
  }
  
  void _handleExternalWallet(ExternalWalletResponse response) {
    Fluttertoast.showToast(
      msg: "External wallet: ${response.walletName}",
    );
  }

  Future<void> _getCurrentLocation() async {
    // Check permissions
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      Fluttertoast.showToast(
        msg: "Please enable location services",
        backgroundColor: Colors.orange,
      );
      return;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        Fluttertoast.showToast(
          msg: "Location permission denied",
          backgroundColor: Colors.red,
        );
        return;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      Fluttertoast.showToast(
        msg: "Location permissions are permanently denied",
        backgroundColor: Colors.red,
      );
      return;
    }

    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(),
      ),
    );

    try {
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      List<Placemark> placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        
        _addressLine1Controller.text = [
          place.street,
          place.subLocality,
          place.locality,
        ].where((s) => s != null && s.isNotEmpty).join(', ');
        
        _cityController.text = place.locality ?? '';
        _pinCodeController.text = place.postalCode ?? '';
        
        // Find matching state
        final stateMatch = IndianStates.states.firstWhere(
          (s) => s.name.toLowerCase() == place.administrativeArea?.toLowerCase(),
          orElse: () => IndianStates.states.first,
        );
        setState(() {
          _selectedState = stateMatch.code;
        });
      }
    } catch (e) {
      Fluttertoast.showToast(
        msg: "Failed to get location",
        backgroundColor: Colors.red,
      );
    } finally {
      Navigator.pop(context);
    }
  }
  
  Future<void> _createOrder(String paymentId) async {
    final cartProvider = context.read<CartProvider>();
    
    try {
      // Calculate GST based on selected state
      final gstBreakdown = IndianStates.calculateStateBasedGST(
        cartProvider.totalAmount,
        _selectedState,
      );
      
      final orderData = await _apiService.createOrder(
        items: cartProvider.items.values.map((item) => {
          'product_id': item.productId,  // Use product_id with underscore
          'price': item.price,
          'quantity': item.quantity,
        }).toList(),
        firstName: _nameController.text.split(' ').first,
        lastName: _nameController.text.split(' ').length > 1 
            ? _nameController.text.split(' ').sublist(1).join(' ') 
            : '',
        email: _emailController.text,
        phone: _phoneController.text,
        totals: {
          'subtotal': gstBreakdown.basePrice,
          'cgst': gstBreakdown.cgst,
          'sgst': gstBreakdown.sgst,
          'igst': gstBreakdown.igst,
          'totalGST': gstBreakdown.totalGST,
          'total': cartProvider.totalAmount,
        },
        paymentMethod: _selectedPaymentMethod == 'online' 
          ? (_useNativePayment ? _selectedNativePaymentMethod : 'razorpay')
          : _selectedPaymentMethod,
        address: {
          'line1': _addressLine1Controller.text,
          'line2': _addressLine2Controller.text,
          'city': _cityController.text,
          'state': IndianStates.getStateName(_selectedState),
          'pincode': _pinCodeController.text,
          'paymentId': paymentId,
        },
      );
      
      if (orderData != null) {
        cartProvider.clear();
        setState(() {
          _isProcessing = false;
        });
        
        if (mounted) {
          _showSuccessDialog(orderData['orderId'] ?? 'N/A');
        }
      } else {
        throw Exception('Failed to create order');
      }
    } catch (e) {
      setState(() {
        _isProcessing = false;
      });
      Fluttertoast.showToast(
        msg: "Failed to create order",
        backgroundColor: Colors.red,
      );
    }
  }
  
  void _processNativePayment() async {
    if (!_paymentFormKey.currentState!.validate()) {
      return;
    }
    
    setState(() {
      _isProcessing = true;
    });
    
    // Simulate payment processing
    await Future.delayed(const Duration(seconds: 2));
    
    // Create order with native payment
    await _createOrder('NATIVE_${DateTime.now().millisecondsSinceEpoch}');
  }
  
  void _placeOrder() async {
    final cartProvider = context.read<CartProvider>();
    
    // Validate current step
    if (_currentStep == 0 && !_formKey.currentState!.validate()) {
      Fluttertoast.showToast(
        msg: "Please fill all required fields",
        backgroundColor: Colors.orange,
      );
      return;
    }
    
    setState(() {
      _isProcessing = true;
    });
    
    if (_selectedPaymentMethod == 'cod') {
      // Check COD limit
      if (_codEnabled && cartProvider.totalAmount > _codLimit) {
        setState(() {
          _isProcessing = false;
        });
        Fluttertoast.showToast(
          msg: "Order amount exceeds COD limit of ₹${_codLimit.toStringAsFixed(0)}",
          backgroundColor: Colors.red,
        );
        return;
      }
      await _createOrder('COD_${DateTime.now().millisecondsSinceEpoch}');
    } else if (_selectedPaymentMethod == 'online') {
      if (_useNativePayment) {
        _processNativePayment();
      } else {
        // Razorpay payment - First create order, then payment order
        await _initiateRazorpayPayment();
      }
    }
  }
  
  Future<void> _initiateRazorpayPayment() async {
    final cartProvider = context.read<CartProvider>();
    final authProvider = context.read<AuthProvider>();
    
    try {
      // Calculate GST
      final gstBreakdown = IndianStates.calculateStateBasedGST(
        cartProvider.totalAmount,
        _selectedState,
      );
      
      // First create the order (use guest endpoint if not authenticated)
      print('🔑 Auth status: ${authProvider.isAuthenticated}');
      print('🔑 Auth token: ${authProvider.token}');
      
      final orderData = authProvider.isAuthenticated 
        ? await _apiService.createOrder(
        items: cartProvider.items.values.map((item) => {
          'product_id': item.productId,  // Changed from productId to product_id
          'price': item.price,
          'quantity': item.quantity,
        }).toList(),
        totals: {
          'subtotal': gstBreakdown.basePrice,
          'cgst': gstBreakdown.cgst,
          'sgst': gstBreakdown.sgst,
          'igst': gstBreakdown.igst,
          'totalGST': gstBreakdown.totalGST,
          'total': cartProvider.totalAmount,
        },
        paymentMethod: 'razorpay',
        firstName: _nameController.text.split(' ').first,  // Add firstName
        lastName: _nameController.text.split(' ').length > 1 
            ? _nameController.text.split(' ').sublist(1).join(' ') 
            : '',  // Add lastName
        email: _emailController.text,  // Add email at top level
        phone: _phoneController.text,  // Add phone at top level
        address: {
          'line1': _addressLine1Controller.text,
          'line2': _addressLine2Controller.text,
          'city': _cityController.text,
          'state': IndianStates.getStateName(_selectedState),
          'pincode': _pinCodeController.text,
        },
      )
        : await _apiService.createGuestOrder(
            items: cartProvider.items.values.map((item) => {
              'product_id': item.productId,  // Changed from productId to product_id
              'price': item.price,
              'quantity': item.quantity,
            }).toList(),
            totals: {
              'subtotal': gstBreakdown.basePrice,
              'cgst': gstBreakdown.cgst,
              'sgst': gstBreakdown.sgst,
              'igst': gstBreakdown.igst,
              'totalGST': gstBreakdown.totalGST,
              'total': cartProvider.totalAmount,
            },
            paymentMethod: 'razorpay',
            firstName: _nameController.text.split(' ').first,  // Add firstName for guest
            lastName: _nameController.text.split(' ').length > 1 
                ? _nameController.text.split(' ').sublist(1).join(' ') 
                : '',  // Add lastName for guest
            email: _emailController.text,  // Add email at top level for guest
            phone: _phoneController.text,  // Add phone at top level for guest
            address: {
              'line1': _addressLine1Controller.text,
              'line2': _addressLine2Controller.text,
              'city': _cityController.text,
              'state': IndianStates.getStateName(_selectedState),
              'pincode': _pinCodeController.text,
            },
          );
      
      if (orderData == null) {
        print('❌ orderData is null - order creation failed');
        throw Exception('Failed to create order');
      }
      
      print('✅ Order created successfully: $orderData');
      
      final createdOrder = orderData['order'];
      if (createdOrder == null) {
        print('❌ createdOrder is null in response');
        throw Exception('Invalid order response structure');
      }
      
      final orderId = createdOrder['id'];
      if (orderId == null || orderId.isEmpty) {
        print('❌ Order ID is null or empty');
        throw Exception('Order ID not found in response');
      }
      
      print('📦 Order ID: $orderId');
      
      // Set auth token for payment service if authenticated
      if (authProvider.isAuthenticated && authProvider.token != null) {
        _paymentService.setAuthToken(authProvider.token!);
        print('🔑 Payment service auth token set');
      }
      
      // Then create Razorpay payment order
      print('💳 Creating payment order for amount: ${cartProvider.totalAmount}');
      final paymentOrder = await _paymentService.createPaymentOrder(
        amount: cartProvider.totalAmount,
        orderId: orderId,
      );
      
      if (paymentOrder == null) {
        print('❌ paymentOrder is null - payment order creation failed');
        throw Exception('Failed to create payment order');
      }
      
      print('✅ Payment order created: $paymentOrder');
      
      // Open Razorpay checkout
      var options = {
        'key': paymentOrder['key_id'] ?? 'rzp_test_JbXYMamTEPsCxK', // Use key from backend, fallback to test key
        'amount': paymentOrder['amount'] ?? (cartProvider.totalAmount * 100).toInt(),
        'currency': paymentOrder['currency'] ?? 'INR',
        'name': 'TRIPUND Lifestyle',
        'description': 'Artisan Marketplace Purchase',
        'order_id': paymentOrder['razorpay_order_id'] ?? paymentOrder['order_id'],
        'prefill': {
          'name': _nameController.text,
          'email': _emailController.text,
          'contact': _phoneController.text,
        },
        'theme': {
          'color': '#d4a574',
        },
        'notes': {
          'order_id': orderId,
        },
      };
      
      // Store order ID for use in payment callbacks
      _currentOrderId = orderId;
      
      _razorpay.open(options);
    } catch (e) {
      setState(() {
        _isProcessing = false;
      });
      Fluttertoast.showToast(
        msg: "Failed to initiate payment: ${e.toString()}",
        backgroundColor: Colors.red,
      );
    }
  }
  
  void _showSuccessDialog(String orderId) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green, size: 30),
            SizedBox(width: 10),
            Text('Order Placed!'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Your order has been placed successfully!'),
            const SizedBox(height: 10),
            Text('Order ID: $orderId'),
            const SizedBox(height: 10),
            const Text('You will receive a confirmation email shortly.'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).popUntil((route) => route.isFirst);
            },
            child: const Text('Continue Shopping'),
          ),
        ],
      ),
    );
  }
  
  Widget _buildAddressStep() {
    final cartProvider = context.watch<CartProvider>();
    final gstBreakdown = IndianStates.calculateStateBasedGST(
      cartProvider.totalAmount,
      _selectedState,
    );
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Saved addresses section
          if (_savedAddresses.isNotEmpty) ...[
            const Text(
              'Select Delivery Address',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            
            // Address cards
            ..._savedAddresses.map((address) {
              return RadioListTile<Address>(
                value: address,
                groupValue: _selectedAddress,
                onChanged: (value) {
                  setState(() {
                    _selectedAddress = value;
                    _useNewAddress = false;
                    _fillAddressFields(value!);
                  });
                },
                title: Text(address.name),
                subtitle: Text(address.fullAddress),
                secondary: Icon(
                  address.name.contains('Work') ? Icons.work :
                  address.name.contains('Other') ? Icons.place : Icons.home,
                ),
              );
            }),
            
            // Add new address option
            RadioListTile<bool>(
              value: true,
              groupValue: _useNewAddress,
              onChanged: (value) {
                setState(() {
                  _useNewAddress = true;
                  _selectedAddress = null;
                  // Clear fields
                  _addressLine1Controller.clear();
                  _addressLine2Controller.clear();
                  _cityController.clear();
                  _pinCodeController.clear();
                });
              },
              title: const Text('Add New Address'),
              secondary: const Icon(Icons.add),
            ),
            
            if (_useNewAddress) ...[
              const Divider(height: 32),
              const Text(
                'New Address Details',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
            ],
          ],
          
          // Address form (shown for new address or if no saved addresses)
          if (_useNewAddress || _savedAddresses.isEmpty) ...[
            // GPS Button
            ElevatedButton.icon(
              onPressed: _getCurrentLocation,
              icon: const Icon(Icons.location_on),
              label: const Text('Use Current Location'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                minimumSize: const Size(double.infinity, 48),
              ),
            ),
            const SizedBox(height: 24),
            
            Form(
              key: _formKey,
              child: Column(
                children: [
                  TextFormField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      labelText: 'Full Name',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.person),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter your name';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  
                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'Phone Number',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.phone),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter phone number';
                      }
                      if (value.length != 10) {
                        return 'Please enter valid 10 digit phone number';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'Email',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.email),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter email';
                      }
                      if (!value.contains('@')) {
                        return 'Please enter valid email';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  
                  TextFormField(
                    controller: _addressLine1Controller,
                    decoration: const InputDecoration(
                      labelText: 'Address Line 1',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.home),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter address';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  
                  TextFormField(
                    controller: _addressLine2Controller,
                    decoration: const InputDecoration(
                      labelText: 'Address Line 2 (Optional)',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.home_work),
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _cityController,
                          decoration: const InputDecoration(
                            labelText: 'City',
                            border: OutlineInputBorder(),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Enter city';
                            }
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextFormField(
                          controller: _pinCodeController,
                          keyboardType: TextInputType.number,
                          maxLength: 6,
                          decoration: const InputDecoration(
                            labelText: 'PIN Code',
                            border: OutlineInputBorder(),
                            counterText: '',
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Enter PIN';
                            }
                            if (value.length != 6) {
                              return 'Invalid PIN';
                            }
                            return null;
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  // State dropdown
                  DropdownButtonFormField<String>(
                    value: _selectedState,
                    decoration: const InputDecoration(
                      labelText: 'State',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.map),
                    ),
                    items: IndianStates.states.map((state) {
                      return DropdownMenuItem(
                        value: state.code,
                        child: Text(state.name),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedState = value!;
                      });
                    },
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please select state';
                      }
                      return null;
                    },
                  ),
                ],
              ),
            ),
          ],
          
          // GST Information
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.blue.shade200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.info, color: Colors.blue.shade700, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'GST Information',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.blue.shade700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  'Selected State: ${IndianStates.getStateName(_selectedState)}',
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 8),
                if (gstBreakdown.isInterstate) ...[
                  Text('IGST (18%): ₹${gstBreakdown.igst.toStringAsFixed(2)}'),
                ] else ...[
                  Text('CGST (9%): ₹${gstBreakdown.cgst.toStringAsFixed(2)}'),
                  Text('SGST (9%): ₹${gstBreakdown.sgst.toStringAsFixed(2)}'),
                ],
                const SizedBox(height: 4),
                Text(
                  'Total GST: ₹${gstBreakdown.totalGST.toStringAsFixed(2)}',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildPaymentStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Select Payment Method',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          
          if (_codEnabled)
            _buildPaymentMethodCard(
              'cod',
              'Cash on Delivery',
              Icons.money,
              'Pay when you receive the product (Max: ₹${_codLimit.toStringAsFixed(0)})',
            ),
          const SizedBox(height: 12),
          
          _buildPaymentMethodCard(
            'online',
            'Online Payment',
            Icons.credit_card,
            'Pay securely with Card/UPI/NetBanking',
          ),
          
          if (_selectedPaymentMethod == 'online') ...[
            const SizedBox(height: 24),
            
            // Payment type selector
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[300]!),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Choose Payment Option',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  
                  ListTile(
                    leading: Radio<bool>(
                      value: false,
                      groupValue: _useNativePayment,
                      onChanged: (value) {
                        setState(() {
                          _useNativePayment = value!;
                        });
                      },
                    ),
                    title: const Text('Razorpay'),
                    subtitle: const Text('Quick & secure payment gateway'),
                    onTap: () {
                      setState(() {
                        _useNativePayment = false;
                      });
                    },
                  ),
                  
                  ListTile(
                    leading: Radio<bool>(
                      value: true,
                      groupValue: _useNativePayment,
                      onChanged: (value) {
                        setState(() {
                          _useNativePayment = value!;
                        });
                      },
                    ),
                    title: const Text('Direct Payment'),
                    subtitle: const Text('Enter payment details manually'),
                    onTap: () {
                      setState(() {
                        _useNativePayment = true;
                      });
                    },
                  ),
                ],
              ),
            ),
            
            if (_useNativePayment) ...[
              const SizedBox(height: 24),
              _buildNativePaymentForm(),
            ],
          ],
        ],
      ),
    );
  }
  
  Widget _buildNativePaymentForm() {
    return Form(
      key: _paymentFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Payment method tabs
          DefaultTabController(
            length: 3,
            child: Column(
              children: [
                TabBar(
                  onTap: (index) {
                    setState(() {
                      _selectedNativePaymentMethod = ['card', 'upi', 'netbanking'][index];
                    });
                  },
                  tabs: const [
                    Tab(text: 'Card'),
                    Tab(text: 'UPI'),
                    Tab(text: 'NetBanking'),
                  ],
                  labelColor: AppTheme.primaryColor,
                  unselectedLabelColor: Colors.grey,
                  indicatorColor: AppTheme.primaryColor,
                ),
                const SizedBox(height: 20),
                
                // Card payment form
                if (_selectedNativePaymentMethod == 'card') ...[
                  TextFormField(
                    controller: _cardNumberController,
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(16),
                    ],
                    decoration: const InputDecoration(
                      labelText: 'Card Number',
                      hintText: '1234 5678 9012 3456',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.credit_card),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter card number';
                      }
                      if (value.length != 16) {
                        return 'Card number must be 16 digits';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  
                  TextFormField(
                    controller: _cardHolderController,
                    decoration: const InputDecoration(
                      labelText: 'Card Holder Name',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.person),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter card holder name';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _expiryController,
                          keyboardType: TextInputType.number,
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                            LengthLimitingTextInputFormatter(4),
                          ],
                          decoration: const InputDecoration(
                            labelText: 'Expiry (MM/YY)',
                            hintText: '12/25',
                            border: OutlineInputBorder(),
                            prefixIcon: Icon(Icons.calendar_today),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Enter expiry';
                            }
                            if (value.length != 4) {
                              return 'Invalid format';
                            }
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextFormField(
                          controller: _cvvController,
                          keyboardType: TextInputType.number,
                          obscureText: true,
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                            LengthLimitingTextInputFormatter(3),
                          ],
                          decoration: const InputDecoration(
                            labelText: 'CVV',
                            hintText: '123',
                            border: OutlineInputBorder(),
                            prefixIcon: Icon(Icons.lock),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Enter CVV';
                            }
                            if (value.length != 3) {
                              return 'Invalid CVV';
                            }
                            return null;
                          },
                        ),
                      ),
                    ],
                  ),
                ],
                
                // UPI payment form
                if (_selectedNativePaymentMethod == 'upi') ...[
                  TextFormField(
                    controller: _upiIdController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'UPI ID',
                      hintText: 'yourname@upi',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.account_balance),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter UPI ID';
                      }
                      if (!value.contains('@')) {
                        return 'Invalid UPI ID format';
                      }
                      return null;
                    },
                  ),
                ],
                
                // NetBanking form
                if (_selectedNativePaymentMethod == 'netbanking') ...[
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.amber[50],
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.amber),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.info, color: Colors.amber),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'You will be redirected to your bank\'s secure page',
                            style: TextStyle(color: Colors.amber),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildPaymentMethodCard(String value, String title, IconData icon, String subtitle) {
    final isSelected = _selectedPaymentMethod == value;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedPaymentMethod = value;
        });
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected ? AppTheme.primaryColor : Colors.grey[300]!,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(12),
          color: isSelected ? AppTheme.primaryColor.withOpacity(0.05) : Colors.white,
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: isSelected ? AppTheme.primaryColor : Colors.grey,
              size: 30,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? AppTheme.primaryColor : Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            Radio<String>(
              value: value,
              groupValue: _selectedPaymentMethod,
              onChanged: (newValue) {
                setState(() {
                  _selectedPaymentMethod = newValue!;
                });
              },
              activeColor: AppTheme.primaryColor,
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildOrderReview() {
    final cartProvider = context.watch<CartProvider>();
    final gstBreakdown = IndianStates.calculateStateBasedGST(
      cartProvider.totalAmount,
      _selectedState,
    );
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Order items
          const Text(
            'Order Summary',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          
          ...cartProvider.items.values.map((item) {
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    item.imageUrl,
                    width: 60,
                    height: 60,
                    fit: BoxFit.cover,
                  ),
                ),
                title: Text(item.title),
                subtitle: Text('Qty: ${item.quantity}'),
                trailing: Text(
                  '₹${(item.price * item.quantity).toStringAsFixed(0)}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),
            );
          }),
          
          const SizedBox(height: 16),
          const Divider(),
          
          // Delivery address
          const Text(
            'Delivery Address',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _nameController.text,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                Text('${_addressLine1Controller.text}, ${_addressLine2Controller.text}'),
                Text('${_cityController.text}, ${IndianStates.getStateName(_selectedState)} - ${_pinCodeController.text}'),
                const SizedBox(height: 4),
                Text('Phone: ${_phoneController.text}'),
              ],
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Payment method
          const Text(
            'Payment Method',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: Row(
              children: [
                Icon(
                  _selectedPaymentMethod == 'cod' ? Icons.money : Icons.credit_card,
                  color: AppTheme.primaryColor,
                ),
                const SizedBox(width: 8),
                Text(
                  _selectedPaymentMethod == 'cod' && _codEnabled
                    ? 'Cash on Delivery'
                    : _useNativePayment
                      ? 'Online Payment - $_selectedNativePaymentMethod'
                      : 'Online Payment - Razorpay',
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 16),
          const Divider(),
          
          // Price breakdown
          const Text(
            'Price Details',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Subtotal'),
              Text('₹${gstBreakdown.basePrice.toStringAsFixed(2)}'),
            ],
          ),
          const SizedBox(height: 8),
          
          if (gstBreakdown.isInterstate) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('IGST (18%)', style: TextStyle(color: Colors.grey[600])),
                Text('₹${gstBreakdown.igst.toStringAsFixed(2)}'),
              ],
            ),
          ] else ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('CGST (9%)', style: TextStyle(color: Colors.grey[600])),
                Text('₹${gstBreakdown.cgst.toStringAsFixed(2)}'),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('SGST (9%)', style: TextStyle(color: Colors.grey[600])),
                Text('₹${gstBreakdown.sgst.toStringAsFixed(2)}'),
              ],
            ),
          ],
          
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Shipping'),
              Text('FREE', style: TextStyle(color: Colors.green[600])),
            ],
          ),
          
          const Divider(height: 24),
          
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total Amount',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              Text(
                '₹${cartProvider.totalAmount.toStringAsFixed(2)}',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primaryColor,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  @override
  Widget build(BuildContext context) {
    final cartProvider = context.watch<CartProvider>();
    
    if (cartProvider.items.isEmpty) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Checkout'),
          backgroundColor: AppTheme.primaryColor,
          foregroundColor: Colors.white,
        ),
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.shopping_cart_outlined, size: 64, color: Colors.grey),
              SizedBox(height: 16),
              Text('Your cart is empty'),
            ],
          ),
        ),
      );
    }
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Checkout'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: Theme(
        data: Theme.of(context).copyWith(
          primaryColor: AppTheme.primaryColor,
          colorScheme: ColorScheme.light(primary: AppTheme.primaryColor),
        ),
        child: Stepper(
          type: StepperType.horizontal,
          currentStep: _currentStep,
          onStepTapped: (step) {
            if (step < _currentStep) {
              setState(() {
                _currentStep = step;
              });
            }
          },
          onStepContinue: () {
            if (_currentStep == 0) {
              // Validate address
              if ((_useNewAddress || _savedAddresses.isEmpty) && !_formKey.currentState!.validate()) {
                return;
              }
              setState(() {
                _currentStep = 1;
              });
            } else if (_currentStep == 1) {
              setState(() {
                _currentStep = 2;
              });
            } else if (_currentStep == 2) {
              _placeOrder();
            }
          },
          onStepCancel: () {
            if (_currentStep > 0) {
              setState(() {
                _currentStep--;
              });
            }
          },
          controlsBuilder: (context, details) {
            return Row(
              children: [
                if (_currentStep == 2)
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isProcessing ? null : details.onStepContinue,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryColor,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: _isProcessing
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text('Place Order', style: TextStyle(fontSize: 16)),
                    ),
                  )
                else
                  ElevatedButton(
                    onPressed: details.onStepContinue,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                    ),
                    child: const Text('Continue'),
                  ),
                if (_currentStep > 0) ...[
                  const SizedBox(width: 8),
                  TextButton(
                    onPressed: details.onStepCancel,
                    child: const Text('Back'),
                  ),
                ],
              ],
            );
          },
          steps: [
            Step(
              title: const Text('Address'),
              content: _buildAddressStep(),
              isActive: _currentStep >= 0,
              state: _currentStep > 0 ? StepState.complete : StepState.indexed,
            ),
            Step(
              title: const Text('Payment'),
              content: _buildPaymentStep(),
              isActive: _currentStep >= 1,
              state: _currentStep > 1 ? StepState.complete : StepState.indexed,
            ),
            Step(
              title: const Text('Review'),
              content: _buildOrderReview(),
              isActive: _currentStep >= 2,
              state: _currentStep > 2 ? StepState.complete : StepState.indexed,
            ),
          ],
        ),
      ),
    );
  }
}