import 'package:flutter/material.dart';
import 'package:curved_navigation_bar/curved_navigation_bar.dart';
import 'package:flutter_vector_icons/flutter_vector_icons.dart';
import '../utils/theme.dart';
import '../services/update_service.dart';
import 'home_screen.dart';
import 'categories_screen.dart';
import 'cart_screen.dart';
import 'profile_screen.dart';
import 'wishlist_screen.dart';
import 'search_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => MainScreenState();
}

class MainScreenState extends State<MainScreen> with TickerProviderStateMixin {
  int _currentIndex = 0;
  late PageController _pageController;
  late AnimationController _fabAnimationController;
  late Animation<double> _fabAnimation;

  final List<Widget> _screens = [
    const HomeScreen(),
    const CategoriesScreen(),
    const WishlistScreen(),
    const CartScreen(),
    const ProfileScreen(),
  ];

  final List<IconData> _icons = [
    Feather.home,
    Feather.grid,
    Feather.heart,
    Feather.shopping_bag,
    Feather.user,
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    
    _fabAnimationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    _fabAnimation = CurvedAnimation(
      parent: _fabAnimationController,
      curve: Curves.easeInOut,
    );
    
    _fabAnimationController.forward();
    
    // Check for updates after a delay
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          UpdateService().checkForUpdate(context);
        }
      });
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    _fabAnimationController.dispose();
    super.dispose();
  }

  void switchTab(int index) {
    setState(() {
      _currentIndex = index;
      _pageController.jumpToPage(index);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PageView(
        controller: _pageController,
        physics: const NeverScrollableScrollPhysics(),
        children: _screens,
      ),
      bottomNavigationBar: CurvedNavigationBar(
        index: _currentIndex,
        height: 65,
        backgroundColor: Colors.transparent,
        color: Colors.white,
        buttonBackgroundColor: AppTheme.primaryColor,
        animationCurve: Curves.easeInOut,
        animationDuration: const Duration(milliseconds: 400),
        items: _icons.map((icon) {
          int index = _icons.indexOf(icon);
          return Icon(
            icon,
            size: 28,
            color: _currentIndex == index
                ? Colors.white
                : AppTheme.textSecondary,
          );
        }).toList(),
        onTap: (index) {
          setState(() {
            _currentIndex = index;
            _pageController.animateToPage(
              index,
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
            );
          });
          
          // Animate FAB
          _fabAnimationController.reverse().then((_) {
            _fabAnimationController.forward();
          });
        },
      ),
      floatingActionButton: _currentIndex == 0
          ? ScaleTransition(
              scale: _fabAnimation,
              child: FloatingActionButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const SearchScreen(),
                    ),
                  );
                },
                backgroundColor: AppTheme.secondaryColor,
                elevation: 8,
                child: const Icon(
                  Feather.search,
                  color: Colors.white,
                ),
              ),
            )
          : null,
    );
  }
}