import 'package:flutter/material.dart';
import '../utils/theme.dart';

class CategoryChip extends StatefulWidget {
  final String name;
  final String icon;
  final int index;
  final VoidCallback? onTap;

  const CategoryChip({
    super.key,
    required this.name,
    required this.icon,
    required this.index,
    this.onTap,
  });

  @override
  State<CategoryChip> createState() => _CategoryChipState();
}

class _CategoryChipState extends State<CategoryChip>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 150),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.9,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = [
      AppTheme.primaryColor,
      AppTheme.secondaryColor,
      AppTheme.accentColor,
      const Color(0xFF9C27B0),
      const Color(0xFF2196F3),
      const Color(0xFF4CAF50),
    ];

    final color = colors[widget.index % colors.length];

    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) {
        _controller.reverse();
        widget.onTap?.call();
      },
      onTapCancel: () => _controller.reverse(),
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: Container(
              width: 80,
              margin: const EdgeInsets.only(right: 12),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          color.withOpacity(0.8),
                          color,
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: color.withOpacity(0.3),
                          blurRadius: 10,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Text(
                        widget.icon,
                        style: const TextStyle(fontSize: 28),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.name,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary,
                        ),
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}