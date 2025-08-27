import 'package:flutter/material.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'dart:math' as math;
import '../utils/theme.dart';
import '../utils/navigation_helper.dart';
import 'main_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _logoController;
  late AnimationController _textController;
  late AnimationController _shimmerController;
  late AnimationController _patternController;
  late Animation<double> _logoAnimation;
  late Animation<double> _textAnimation;
  late Animation<double> _shimmerAnimation;
  late Animation<double> _patternAnimation;

  @override
  void initState() {
    super.initState();
    
    // Logo Animation
    _logoController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    
    _logoAnimation = CurvedAnimation(
      parent: _logoController,
      curve: Curves.elasticOut,
    );
    
    // Text Animation
    _textController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    
    _textAnimation = CurvedAnimation(
      parent: _textController,
      curve: Curves.easeInOut,
    );
    
    // Shimmer Animation
    _shimmerController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat();
    
    _shimmerAnimation = CurvedAnimation(
      parent: _shimmerController,
      curve: Curves.linear,
    );
    
    // Pattern Animation
    _patternController = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    )..repeat();
    
    _patternAnimation = CurvedAnimation(
      parent: _patternController,
      curve: Curves.easeInOut,
    );
    
    // Start animations
    _logoController.forward();
    Future.delayed(const Duration(milliseconds: 500), () {
      _textController.forward();
    });
    
    // Navigate to main screen
    Future.delayed(const Duration(seconds: 3), () {
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (context, animation, secondaryAnimation) =>
              MainScreen(key: NavigationHelper.mainScreenKey),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(
              opacity: animation,
              child: child,
            );
          },
          transitionDuration: const Duration(milliseconds: 800),
        ),
      );
    });
  }

  @override
  void dispose() {
    _logoController.dispose();
    _textController.dispose();
    _shimmerController.dispose();
    _patternController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background with gradient
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  const Color(0xFFFFF8F3),
                  AppTheme.primaryColor.withOpacity(0.05),
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
          
          // Decorative mandala patterns
          Positioned(
            top: -50,
            left: -50,
            child: AnimatedBuilder(
              animation: _patternAnimation,
              builder: (context, child) {
                return Transform.rotate(
                  angle: _patternAnimation.value * 2 * math.pi,
                  child: Opacity(
                    opacity: 0.05,
                    child: Icon(
                      Icons.star,
                      size: 200,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                );
              },
            ),
          ),
          Positioned(
            bottom: -50,
            right: -50,
            child: AnimatedBuilder(
              animation: _patternAnimation,
              builder: (context, child) {
                return Transform.rotate(
                  angle: -_patternAnimation.value * 2 * math.pi,
                  child: Opacity(
                    opacity: 0.05,
                    child: Icon(
                      Icons.star,
                      size: 200,
                      color: AppTheme.secondaryColor,
                    ),
                  ),
                );
              },
            ),
          ),
          
          // Main content
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Animated Logo with glow effect
                ScaleTransition(
                  scale: _logoAnimation,
                  child: Container(
                    width: 220,
                    height: 220,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primaryColor.withOpacity(0.2),
                          blurRadius: 30,
                          spreadRadius: 10,
                        ),
                      ],
                    ),
                    child: ClipOval(
                      child: Container(
                        color: Colors.white,
                        padding: const EdgeInsets.all(20),
                        child: Image.asset(
                          'assets/images/tripund-logo.png',
                          fit: BoxFit.contain,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 60),
                
                // Tagline with elegant animation
                FadeTransition(
                  opacity: _textAnimation,
                  child: SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(0, 0.5),
                      end: Offset.zero,
                    ).animate(_textAnimation),
                    child: Column(
                      children: [
                        // Decorative line
                        Container(
                          width: 80,
                          height: 1,
                          color: AppTheme.primaryColor.withOpacity(0.3),
                        ),
                        const SizedBox(height: 15),
                        
                        // Tagline
                        Text(
                          'Celebrating Indian Artistry',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: AppTheme.primaryColor.withOpacity(0.8),
                                letterSpacing: 1.5,
                                fontWeight: FontWeight.w300,
                              ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Handcrafted with Love',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppTheme.secondaryColor.withOpacity(0.7),
                                fontStyle: FontStyle.italic,
                                letterSpacing: 0.5,
                              ),
                        ),
                        
                        // Decorative line
                        const SizedBox(height: 15),
                        Container(
                          width: 80,
                          height: 1,
                          color: AppTheme.primaryColor.withOpacity(0.3),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 100),
                
                // Elegant loading dots
                FadeTransition(
                  opacity: _textAnimation,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(3, (index) {
                      return AnimatedBuilder(
                        animation: _shimmerAnimation,
                        builder: (context, child) {
                          final delay = index * 0.2;
                          final value = (_shimmerAnimation.value + delay) % 1.0;
                          return Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppTheme.primaryColor.withOpacity(
                                0.3 + (0.7 * math.sin(value * math.pi)),
                              ),
                            ),
                          );
                        },
                      );
                    }),
                  ),
                ),
              ],
            ),
          ),
          
          // Bottom decorative text
          Positioned(
            bottom: 50,
            left: 0,
            right: 0,
            child: FadeTransition(
              opacity: _textAnimation,
              child: Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.auto_awesome,
                      size: 14,
                      color: AppTheme.primaryColor.withOpacity(0.4),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Premium Handicrafts Since 2020',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppTheme.primaryColor.withOpacity(0.4),
                            letterSpacing: 1,
                          ),
                    ),
                    const SizedBox(width: 8),
                    Icon(
                      Icons.auto_awesome,
                      size: 14,
                      color: AppTheme.primaryColor.withOpacity(0.4),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}