import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import '../utils/theme.dart';
import '../utils/indian_states.dart';
import '../models/address.dart';
import '../providers/auth_provider.dart';
import '../providers/address_provider.dart';
import '../widgets/cart_icon_button.dart';
import 'package:fluttertoast/fluttertoast.dart';

class AddressesScreen extends StatefulWidget {
  const AddressesScreen({super.key});

  @override
  State<AddressesScreen> createState() => _AddressesScreenState();
}

class _AddressesScreenState extends State<AddressesScreen> {
  @override
  void initState() {
    super.initState();
    _loadAddresses();
  }
  
  Future<void> _loadAddresses() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final addressProvider = Provider.of<AddressProvider>(context, listen: false);
    
    if (authProvider.isAuthenticated && authProvider.user != null) {
      // Initialize address provider with user ID and load from Firestore
      await addressProvider.initializeForUser(authProvider.user!.id);
    }
  }

  Future<void> _setDefaultAddress(String addressId) async {
    final addressProvider = Provider.of<AddressProvider>(context, listen: false);
    final success = await addressProvider.setDefaultAddress(addressId);
    if (success) {
      Fluttertoast.showToast(
        msg: "Default address updated",
        backgroundColor: Colors.green,
      );
    } else {
      Fluttertoast.showToast(
        msg: "Failed to update default address",
        backgroundColor: Colors.red,
      );
    }
  }
  
  Future<void> _addAddress(Address address) async {
    final addressProvider = Provider.of<AddressProvider>(context, listen: false);
    final success = await addressProvider.addAddress(address);
    if (success) {
      Fluttertoast.showToast(
        msg: "Address added successfully",
        backgroundColor: Colors.green,
      );
    } else {
      Fluttertoast.showToast(
        msg: "Failed to add address",
        backgroundColor: Colors.red,
      );
    }
  }
  
  Future<void> _updateAddress(String addressId, Address address) async {
    final addressProvider = Provider.of<AddressProvider>(context, listen: false);
    final success = await addressProvider.updateAddress(address);
    if (success) {
      Fluttertoast.showToast(
        msg: "Address updated successfully",
        backgroundColor: Colors.green,
      );
    } else {
      Fluttertoast.showToast(
        msg: "Failed to update address",
        backgroundColor: Colors.red,
      );
    }
  }
  
  Future<void> _deleteAddress(String addressId) async {
    final addressProvider = Provider.of<AddressProvider>(context, listen: false);
    final success = await addressProvider.deleteAddress(addressId);
    if (success) {
      Fluttertoast.showToast(
        msg: "Address deleted",
        backgroundColor: Colors.red,
      );
    } else {
      Fluttertoast.showToast(
        msg: "Failed to delete address",
        backgroundColor: Colors.red,
      );
    }
  }

  Future<void> _getCurrentLocation(
    TextEditingController addressLine1Controller,
    TextEditingController cityController,
    TextEditingController pinCodeController,
    Function(String) setSelectedState,
  ) async {
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
      // Get current position
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      // Get address from coordinates
      List<Placemark> placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        
        // Update controllers
        addressLine1Controller.text = [
          place.street,
          place.subLocality,
          place.locality,
        ].where((s) => s != null && s.isNotEmpty).join(', ');
        
        cityController.text = place.locality ?? '';
        pinCodeController.text = place.postalCode ?? '';
        
        // Find matching state
        final stateMatch = IndianStates.states.firstWhere(
          (s) => s.name.toLowerCase() == place.administrativeArea?.toLowerCase(),
          orElse: () => IndianStates.states.first,
        );
        setSelectedState(stateMatch.code);
      }
    } catch (e) {
      Fluttertoast.showToast(
        msg: "Failed to get location: ${e.toString()}",
        backgroundColor: Colors.red,
      );
    } finally {
      Navigator.pop(context); // Remove loading dialog
    }
  }
  
  void _showAddAddressDialog({String? editAddressId}) {
    final addressProvider = Provider.of<AddressProvider>(context, listen: false);
    final isEdit = editAddressId != null;
    final address = isEdit ? addressProvider.getAddressById(editAddressId) : null;
    
    final nameController = TextEditingController(text: address?.name ?? '');
    final phoneController = TextEditingController(text: address?.phone ?? '');
    final addressLine1Controller = TextEditingController(text: address?.line1 ?? '');
    final addressLine2Controller = TextEditingController(text: address?.line2 ?? '');
    final cityController = TextEditingController(text: address?.city ?? '');
    final pinCodeController = TextEditingController(text: address?.postalCode ?? '');
    
    String selectedState = address?.stateCode ?? 'UP';
    String addressType = isEdit ? (address?.name.contains('Work') == true ? 'Work' : 
                                   address?.name.contains('Other') == true ? 'Other' : 'Home') : 'Home';
    
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: Text(isEdit ? 'Edit Address' : 'Add New Address'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // GPS Location Button
                    ElevatedButton.icon(
                      onPressed: () => _getCurrentLocation(
                        addressLine1Controller,
                        cityController,
                        pinCodeController,
                        (state) => setState(() => selectedState = state),
                      ),
                      icon: const Icon(Icons.location_on),
                      label: const Text('Use Current Location'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryColor,
                        minimumSize: const Size(double.infinity, 45),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Divider(),
                    const SizedBox(height: 16),
                    
                    // Address Type
                    Row(
                      children: [
                        Expanded(
                          child: RadioListTile<String>(
                            title: const Text('Home', style: TextStyle(fontSize: 14)),
                            value: 'Home',
                            groupValue: addressType,
                            onChanged: (value) => setState(() => addressType = value!),
                            dense: true,
                            contentPadding: EdgeInsets.zero,
                          ),
                        ),
                        Expanded(
                          child: RadioListTile<String>(
                            title: const Text('Work', style: TextStyle(fontSize: 14)),
                            value: 'Work',
                            groupValue: addressType,
                            onChanged: (value) => setState(() => addressType = value!),
                            dense: true,
                            contentPadding: EdgeInsets.zero,
                          ),
                        ),
                        Expanded(
                          child: RadioListTile<String>(
                            title: const Text('Other', style: TextStyle(fontSize: 14)),
                            value: 'Other',
                            groupValue: addressType,
                            onChanged: (value) => setState(() => addressType = value!),
                            dense: true,
                            contentPadding: EdgeInsets.zero,
                          ),
                        ),
                      ],
                    ),
                    
                    TextField(
                      controller: nameController,
                      decoration: const InputDecoration(
                        labelText: 'Full Name *',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'Phone Number *',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: addressLine1Controller,
                      decoration: const InputDecoration(
                        labelText: 'Address Line 1 *',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: addressLine2Controller,
                      decoration: const InputDecoration(
                        labelText: 'Address Line 2 (Optional)',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: cityController,
                      decoration: const InputDecoration(
                        labelText: 'City *',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 8),
                    
                    // State Dropdown
                    DropdownButtonFormField<String>(
                      value: selectedState,
                      decoration: const InputDecoration(
                        labelText: 'State *',
                        border: OutlineInputBorder(),
                      ),
                      items: IndianStates.states.map((state) {
                        return DropdownMenuItem(
                          value: state.code,
                          child: Text(state.name),
                        );
                      }).toList(),
                      onChanged: (value) => setState(() => selectedState = value!),
                    ),
                    const SizedBox(height: 8),
                    
                    TextField(
                      controller: pinCodeController,
                      keyboardType: TextInputType.number,
                      maxLength: 6,
                      decoration: const InputDecoration(
                        labelText: 'PIN Code *',
                        border: OutlineInputBorder(),
                        counterText: '',
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () {
                    if (nameController.text.isEmpty ||
                        phoneController.text.isEmpty ||
                        addressLine1Controller.text.isEmpty ||
                        cityController.text.isEmpty ||
                        pinCodeController.text.isEmpty) {
                      Fluttertoast.showToast(
                        msg: "Please fill all required fields",
                        backgroundColor: Colors.red,
                      );
                      return;
                    }
                    
                    final selectedStateObj = IndianStates.states.firstWhere(
                      (s) => s.code == selectedState,
                    );
                    
                    final newAddress = Address(
                      id: isEdit ? address!.id : DateTime.now().millisecondsSinceEpoch.toString(),
                      name: '$addressType - ${nameController.text}',
                      line1: addressLine1Controller.text,
                      line2: addressLine2Controller.text.isEmpty ? null : addressLine2Controller.text,
                      city: cityController.text,
                      state: selectedStateObj.name,
                      stateCode: selectedState,
                      postalCode: pinCodeController.text,
                      phone: phoneController.text,
                      isDefault: isEdit ? address!.isDefault : false,
                    );
                    
                    if (isEdit) {
                      _updateAddress(editAddressId!, newAddress);
                    } else {
                      _addAddress(newAddress);
                    }
                    
                    Navigator.of(context).pop();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                  ),
                  child: Text(isEdit ? 'Update' : 'Add'),
                ),
              ],
            );
          },
        );
      },
    );
  }
  
  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    
    // Show login prompt if not authenticated
    if (!authProvider.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(
          title: const Text(
            'My Addresses',
            style: TextStyle(color: Colors.white),
          ),
          backgroundColor: AppTheme.primaryColor,
          foregroundColor: Colors.white,
          iconTheme: const IconThemeData(color: Colors.white),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.lock_outline,
                size: 64,
                color: Colors.grey[400],
              ),
              const SizedBox(height: 16),
              const Text(
                'Login Required',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Please login to manage your addresses',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {
                  Navigator.pushReplacementNamed(context, '/login');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 32,
                    vertical: 12,
                  ),
                ),
                child: const Text(
                  'Login',
                  style: TextStyle(color: Colors.white),
                ),
              ),
            ],
          ),
        ),
      );
    }
    
    return Consumer<AddressProvider>(
      builder: (context, addressProvider, child) {
        final addresses = addressProvider.addresses;
        final isLoading = addressProvider.isLoading;
        
        if (isLoading) {
          return Scaffold(
            appBar: AppBar(
              title: const Text(
                'My Addresses',
                style: TextStyle(color: Colors.white),
              ),
              backgroundColor: AppTheme.primaryColor,
              foregroundColor: Colors.white,
              iconTheme: const IconThemeData(color: Colors.white),
            ),
            body: const Center(
              child: CircularProgressIndicator(),
            ),
          );
        }
        
        return Scaffold(
      appBar: AppBar(
        title: const Text(
          'My Addresses',
          style: TextStyle(color: Colors.white),
        ),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: const [
          CartIconButton(iconColor: Colors.white),
        ],
      ),
      body: addresses.isEmpty 
        ? Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.location_off,
                  size: 64,
                  color: Colors.grey[400],
                ),
                const SizedBox(height: 16),
                Text(
                  'No addresses saved',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Add your delivery addresses here',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[500],
                  ),
                ),
              ],
            ),
          )
        : ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: addresses.length,
            itemBuilder: (context, index) {
              final address = addresses[index];
              return Card(
                elevation: 2,
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: address.isDefault ? AppTheme.primaryColor : Colors.grey[300],
                    child: Icon(
                      address.name.contains('Work') ? Icons.work :
                      address.name.contains('Other') ? Icons.place : Icons.home,
                      color: address.isDefault ? Colors.white : Colors.grey[700],
                    ),
                  ),
                  title: Row(
                    children: [
                      Text(
                        address.name,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      if (address.isDefault) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text(
                            'Default',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 4),
                      Text(address.fullAddress),
                      const SizedBox(height: 4),
                      Text(
                        'Phone: ${address.phone}',
                        style: const TextStyle(fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                  trailing: PopupMenuButton<String>(
                    onSelected: (value) {
                      if (value == 'edit') {
                        _showAddAddressDialog(editAddressId: address.id);
                      } else if (value == 'delete') {
                        showDialog(
                          context: context,
                          builder: (context) => AlertDialog(
                            title: const Text('Delete Address'),
                            content: const Text('Are you sure you want to delete this address?'),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context),
                                child: const Text('Cancel'),
                              ),
                              TextButton(
                                onPressed: () {
                                  _deleteAddress(address.id);
                                  Navigator.pop(context);
                                },
                                child: const Text('Delete', style: TextStyle(color: Colors.red)),
                              ),
                            ],
                          ),
                        );
                      } else if (value == 'default') {
                        _setDefaultAddress(address.id);
                      }
                    },
                    itemBuilder: (context) => [
                      if (!address.isDefault)
                        const PopupMenuItem(
                          value: 'default',
                          child: Text('Set as Default'),
                        ),
                      const PopupMenuItem(
                        value: 'edit',
                        child: Text('Edit'),
                      ),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Text('Delete', style: TextStyle(color: Colors.red)),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddAddressDialog(),
        backgroundColor: AppTheme.primaryColor,
        child: const Icon(Icons.add, color: Colors.white),
      ),
        );
      },
    );
  }
}