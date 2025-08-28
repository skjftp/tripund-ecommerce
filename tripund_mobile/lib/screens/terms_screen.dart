import 'package:flutter/material.dart';
import '../utils/theme.dart';
import '../widgets/cart_icon_button.dart';

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Terms & Conditions'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        actions: const [
          CartIconButton(iconColor: Colors.white),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Terms & Conditions',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Last updated: ${DateTime.now().year}',
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 20),
            _buildSection(
              '1. Introduction',
              'Welcome to TRIPUND Lifestyle. These terms and conditions govern your use of our mobile application and services.',
            ),
            _buildSection(
              '2. Products',
              'All products displayed on our app are authentic handmade Indian handicrafts. Product images are representative and actual items may vary slightly due to their handmade nature.',
            ),
            _buildSection(
              '3. Orders & Payment',
              'By placing an order, you agree to provide accurate and complete information. We accept various payment methods including cards, UPI, and Cash on Delivery (subject to limits).',
            ),
            _buildSection(
              '4. Shipping & Delivery',
              'We aim to deliver within 5-7 business days. Delivery times may vary based on location and product availability. Shipping charges are calculated at checkout.',
            ),
            _buildSection(
              '5. Returns & Refunds',
              'We offer a 7-day return policy from the date of delivery. Items must be unused and in original packaging. Refunds will be processed within 7-10 business days after receipt of returned items.',
            ),
            _buildSection(
              '6. Privacy',
              'Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.',
            ),
            _buildSection(
              '7. Intellectual Property',
              'All content, including images, text, and designs, is the property of TRIPUND Lifestyle and protected by intellectual property laws.',
            ),
            _buildSection(
              '8. Limitation of Liability',
              'TRIPUND Lifestyle shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our services.',
            ),
            _buildSection(
              '9. Contact Information',
              'For any questions regarding these terms, please contact us at:\nEmail: support@tripundlifestyle.com\nPhone: +91 1234567890',
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
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            content,
            style: TextStyle(
              color: Colors.grey[700],
              fontSize: 14,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}