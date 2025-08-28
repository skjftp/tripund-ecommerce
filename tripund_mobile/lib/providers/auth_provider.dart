import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/user.dart';
import '../models/address.dart';
import '../utils/constants.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  User? _user;
  String? _token;
  bool _isLoading = false;

  User? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _token != null;

  AuthProvider() {
    _loadUserFromPrefs();
  }

  Future<void> _loadUserFromPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
    
    if (_token != null) {
      final userJson = prefs.getString('user');
      if (userJson != null) {
        _user = User.fromJson(json.decode(userJson));
      }
      // Sync token with ApiService
      ApiService().setAuthToken(_token);
    }
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse('${Constants.apiUrl}/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _token = data['token'];
        _user = User.fromJson(data['user']);

        // Save to preferences
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', _token!);
        await prefs.setString('user', json.encode(data['user']));

        // Sync token with ApiService
        ApiService().setAuthToken(_token);

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(String name, String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse('${Constants.apiUrl}/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'name': name,
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 201) {
        // Auto login after registration
        return await login(email, password);
      } else {
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _user = null;
    _token = null;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('user');

    // Clear token from ApiService
    ApiService().clearAuthToken();

    notifyListeners();
  }

  // Update user addresses locally
  void updateUserAddresses(List<Address> addresses) {
    if (_user != null) {
      _user!.addresses = addresses;
      notifyListeners();
      
      // Also save to SharedPreferences
      final prefs = SharedPreferences.getInstance();
      prefs.then((p) {
        p.setString('user', json.encode(_user!.toJson()));
      });
    }
  }

  // Refresh user profile from backend
  Future<void> refreshUserProfile() async {
    if (_token != null && isAuthenticated) {
      try {
        final apiService = ApiService();
        final user = await apiService.getProfile();
        if (user != null) {
          _user = user;
          
          // Save updated user data
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('user', json.encode(user.toJson()));
          
          notifyListeners();
        }
      } catch (e) {
        print('Error refreshing user profile: $e');
      }
    }
  }
  
  // Check auth state and refresh user data
  Future<void> checkAuthState() async {
    if (_token != null) {
      try {
        final apiService = ApiService();
        final user = await apiService.getProfile();
        if (user != null) {
          _user = user;
          
          // Save updated user data
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('user', json.encode(user.toJson()));
          
          notifyListeners();
        }
      } catch (e) {
        print('Error refreshing user data: $e');
      }
    }
  }
}