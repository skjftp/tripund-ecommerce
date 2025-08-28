import 'package:flutter/material.dart';
import '../utils/theme.dart';
import '../widgets/cart_icon_button.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('About TRIPUND'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        actions: const [
          CartIconButton(),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.primaryColor.withOpacity(0.1),
                ),
                child: Center(
                  child: Text(
                    'T',
                    style: TextStyle(
                      fontSize: 60,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
            const Center(
              child: Text(
                'TRIPUND Lifestyle',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Center(
              child: Text(
                'Authentic Indian Handicrafts',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                ),
              ),
            ),
            const SizedBox(height: 30),
            _buildSection(
              'Our Story',
              'TRIPUND Lifestyle was founded with a vision to bring authentic Indian handicrafts to homes across the nation. We work directly with skilled artisans from various parts of India, ensuring fair trade practices and preserving traditional craftsmanship.',
            ),
            _buildSection(
              'Our Mission',
              'To celebrate and preserve India\'s rich cultural heritage by making traditional handicrafts accessible to modern homes, while supporting the livelihoods of talented artisans.',
            ),
            _buildSection(
              'What We Offer',
              'Our curated collection includes:\n• Festival decorations and torans\n• Wall décor and paintings\n• Traditional lighting and diyas\n• Home accents and showpieces\n• Divine collections and spiritual items\n• Storage solutions and bags\n• Unique gifting options',
            ),
            _buildSection(
              'Why Choose TRIPUND?',
              '• 100% Authentic handmade products\n• Direct from artisans\n• Fair trade practices\n• Quality assured\n• Secure payment options\n• Pan-India delivery\n• Easy returns',
            ),
            _buildSection(
              'Our Values',
              '• Authenticity: Every product tells a story\n• Quality: Handpicked for excellence\n• Sustainability: Supporting traditional crafts\n• Trust: Transparent business practices\n• Service: Customer satisfaction is our priority',
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Connect With Us',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Icon(Icons.email, color: AppTheme.primaryColor, size: 20),
                      const SizedBox(width: 8),
                      const Text('support@tripundlifestyle.com'),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.phone, color: AppTheme.primaryColor, size: 20),
                      const SizedBox(width: 8),
                      const Text('+91 1234567890'),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.language, color: AppTheme.primaryColor, size: 20),
                      const SizedBox(width: 8),
                      const Text('www.tripundlifestyle.com'),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 30),
            Center(
              child: Text(
                'Version 1.0.21',
                style: TextStyle(
                  color: Colors.grey[500],
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            content,
            style: TextStyle(
              color: Colors.grey[700],
              fontSize: 15,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}