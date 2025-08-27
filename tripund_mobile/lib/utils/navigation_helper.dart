import 'package:flutter/material.dart';
import '../screens/main_screen.dart';

class NavigationHelper {
  static final GlobalKey<MainScreenState> mainScreenKey = GlobalKey<MainScreenState>();
  
  static void switchToTab(int index) {
    mainScreenKey.currentState?.switchTab(index);
  }
  
  static void goToHome() {
    switchToTab(0);
  }
  
  static void goToCategories() {
    switchToTab(1);
  }
  
  static void goToWishlist() {
    switchToTab(2);
  }
  
  static void goToCart() {
    switchToTab(3);
  }
  
  static void goToProfile() {
    switchToTab(4);
  }
}