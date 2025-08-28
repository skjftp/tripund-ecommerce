import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/address.dart';
import '../models/user.dart';
import '../services/api_service.dart';

class AddressProvider extends ChangeNotifier {
  FirebaseFirestore? _firestore;
  List<Address> _addresses = [];
  bool _isLoading = false;
  String? _currentUserId;
  bool _firebaseAvailable = false;
  final ApiService _apiService = ApiService();

  AddressProvider() {
    _initializeFirestore();
  }

  void _initializeFirestore() {
    try {
      _firestore = FirebaseFirestore.instance;
      _firebaseAvailable = true;
      print('AddressProvider: Firestore initialized');
    } catch (e) {
      print('AddressProvider: Firestore not available: $e');
      _firebaseAvailable = false;
    }
  }

  List<Address> get addresses => [..._addresses];
  bool get isLoading => _isLoading;
  
  Address? get defaultAddress {
    try {
      return _addresses.firstWhere((addr) => addr.isDefault);
    } catch (_) {
      return _addresses.isNotEmpty ? _addresses.first : null;
    }
  }

  // Initialize addresses for a user
  Future<void> initializeForUser(String userId) async {
    if (_currentUserId == userId) return;
    
    _currentUserId = userId;
    await loadAddresses();
  }

  // Load addresses from backend API and Firestore
  Future<void> loadAddresses() async {
    if (_currentUserId == null) {
      print('AddressProvider: Cannot load - no user ID');
      return;
    }

    _isLoading = true;
    notifyListeners();

    // Try to load from backend API first
    try {
      print('AddressProvider: Loading addresses from backend API...');
      final user = await _apiService.getProfile();
      if (user != null && user.addresses != null) {
        _addresses = user.addresses!;
        print('AddressProvider: Loaded ${_addresses.length} addresses from backend API');
      } else {
        print('AddressProvider: No addresses found in backend API');
      }
    } catch (e) {
      print('AddressProvider: Error loading from backend API: $e');
    }

    // If no addresses from API and Firestore is available, try Firestore
    if (_addresses.isEmpty && _firebaseAvailable && _firestore != null) {
      try {
        print('AddressProvider: Trying to load from Firestore...');
        // Get user document
        final userDoc = await _firestore!
            .collection('users')
            .doc(_currentUserId)
            .get();

        if (userDoc.exists) {
          final data = userDoc.data();
          if (data != null && data['addresses'] != null) {
            final addressList = (data['addresses'] as List)
                .map((addr) => Address.fromJson(addr))
                .toList();
            
            _addresses = addressList;
            print('AddressProvider: Loaded ${_addresses.length} addresses from Firestore');
          } else {
            print('AddressProvider: No addresses in Firestore document');
          }
        } else {
          // Create user document if it doesn't exist
          print('AddressProvider: Creating new Firestore document...');
          await _firestore!
              .collection('users')
              .doc(_currentUserId)
              .set({
            'id': _currentUserId,
            'addresses': [],
            'createdAt': FieldValue.serverTimestamp(),
            'updatedAt': FieldValue.serverTimestamp(),
          });
          print('AddressProvider: Created new user document in Firestore');
        }
      } catch (e) {
        print('AddressProvider: Error with Firestore: $e');
      }
    }

    _isLoading = false;
    notifyListeners();
  }

  // Add a new address
  Future<bool> addAddress(Address address) async {
    print('AddressProvider: addAddress called');
    print('AddressProvider: Current user ID: $_currentUserId');
    print('AddressProvider: Firebase available: $_firebaseAvailable');
    print('AddressProvider: Firestore instance: $_firestore');
    
    if (_currentUserId == null || !_firebaseAvailable || _firestore == null) {
      print('AddressProvider: Cannot add - Firebase not available or no user');
      return false;
    }

    try {
      // Generate unique ID if not provided
      final newAddress = address.copyWith(
        id: address.id.isEmpty ? DateTime.now().millisecondsSinceEpoch.toString() : address.id,
      );

      print('AddressProvider: New address to add: ${newAddress.toJson()}');

      // If this is the first address or it's marked as default, make it default
      if (_addresses.isEmpty || newAddress.isDefault) {
        // Set all existing addresses to non-default
        _addresses = _addresses.map((addr) => addr.copyWith(isDefault: false)).toList();
      }

      _addresses.add(newAddress);
      print('AddressProvider: Total addresses after adding: ${_addresses.length}');
      
      // Save to Firestore
      await _saveAddressesToFirestore();
      
      notifyListeners();
      print('AddressProvider: Address added successfully');
      return true;
    } catch (e) {
      print('AddressProvider: Error adding address: $e');
      print('AddressProvider: Stack trace: ${StackTrace.current}');
      return false;
    }
  }

  // Update an existing address
  Future<bool> updateAddress(Address address) async {
    if (_currentUserId == null || !_firebaseAvailable || _firestore == null) {
      print('AddressProvider: Cannot update - Firebase not available or no user');
      return false;
    }

    try {
      final index = _addresses.indexWhere((addr) => addr.id == address.id);
      if (index == -1) {
        print('AddressProvider: Address not found for update');
        return false;
      }

      // If setting as default, unset other defaults
      if (address.isDefault) {
        _addresses = _addresses.map((addr) => 
          addr.id == address.id ? addr : addr.copyWith(isDefault: false)
        ).toList();
      }

      _addresses[index] = address;
      
      // Save to Firestore
      await _saveAddressesToFirestore();
      
      notifyListeners();
      print('AddressProvider: Address updated successfully');
      return true;
    } catch (e) {
      print('AddressProvider: Error updating address: $e');
      return false;
    }
  }

  // Delete an address
  Future<bool> deleteAddress(String addressId) async {
    if (_currentUserId == null || !_firebaseAvailable || _firestore == null) {
      print('AddressProvider: Cannot delete - Firebase not available or no user');
      return false;
    }

    try {
      final wasDefault = _addresses.firstWhere(
        (addr) => addr.id == addressId,
        orElse: () => Address(
          id: '', name: '', line1: '', city: '', 
          state: '', stateCode: '', postalCode: '', phone: ''
        ),
      ).isDefault;

      _addresses.removeWhere((addr) => addr.id == addressId);
      
      // If deleted address was default and there are other addresses, make the first one default
      if (wasDefault && _addresses.isNotEmpty) {
        _addresses[0] = _addresses[0].copyWith(isDefault: true);
      }
      
      // Save to Firestore
      await _saveAddressesToFirestore();
      
      notifyListeners();
      print('AddressProvider: Address deleted successfully');
      return true;
    } catch (e) {
      print('AddressProvider: Error deleting address: $e');
      return false;
    }
  }

  // Set an address as default
  Future<bool> setDefaultAddress(String addressId) async {
    if (_currentUserId == null || !_firebaseAvailable || _firestore == null) {
      print('AddressProvider: Cannot set default - Firebase not available or no user');
      return false;
    }

    try {
      _addresses = _addresses.map((addr) {
        if (addr.id == addressId) {
          return addr.copyWith(isDefault: true);
        } else {
          return addr.copyWith(isDefault: false);
        }
      }).toList();
      
      // Save to Firestore
      await _saveAddressesToFirestore();
      
      notifyListeners();
      print('AddressProvider: Default address set successfully');
      return true;
    } catch (e) {
      print('AddressProvider: Error setting default address: $e');
      return false;
    }
  }

  // Save addresses to Firestore and Backend API
  Future<void> _saveAddressesToFirestore() async {
    if (_currentUserId == null) {
      print('AddressProvider: Cannot save - no user ID');
      return;
    }

    final addressData = _addresses.map((addr) => addr.toJson()).toList();
    print('AddressProvider: Attempting to save ${_addresses.length} addresses');
    print('AddressProvider: Address data: ${addressData.toString()}');
    
    // Try to save to backend API first (primary storage)
    try {
      print('AddressProvider: Saving to backend API...');
      final success = await _apiService.updateAddresses(addressData);
      if (success) {
        print('AddressProvider: Successfully saved addresses to backend API');
      } else {
        print('AddressProvider: Failed to save addresses to backend API');
      }
    } catch (e) {
      print('AddressProvider: Error saving to backend API: $e');
    }
    
    // Also try to save to Firestore if available (secondary storage)
    if (_firebaseAvailable && _firestore != null) {
      try {
        print('AddressProvider: Attempting to save to Firestore...');
        
        await _firestore!
            .collection('users')
            .doc(_currentUserId)
            .update({
          'addresses': addressData,
          'updatedAt': FieldValue.serverTimestamp(),
        });
        
        print('AddressProvider: Successfully saved addresses to Firestore');
      } catch (e) {
        print('AddressProvider: Error saving to Firestore: $e');
        // If update fails, try set (in case document doesn't exist)
        try {
          await _firestore!
              .collection('users')
              .doc(_currentUserId)
              .set({
            'id': _currentUserId,
            'addresses': addressData,
            'createdAt': FieldValue.serverTimestamp(),
            'updatedAt': FieldValue.serverTimestamp(),
          }, SetOptions(merge: true));
          
          print('AddressProvider: Created user document in Firestore with addresses');
        } catch (e2) {
          print('AddressProvider: Error creating Firestore document: $e2');
        }
      }
    } else {
      print('AddressProvider: Firestore not available, skipping Firestore save');
    }
  }

  // Get address by ID
  Address? getAddressById(String id) {
    try {
      return _addresses.firstWhere((addr) => addr.id == id);
    } catch (_) {
      return null;
    }
  }

  // Clear all addresses (for logout)
  void clearAddresses() {
    _addresses = [];
    _currentUserId = null;
    notifyListeners();
  }

  @override
  void dispose() {
    clearAddresses();
    super.dispose();
  }
}