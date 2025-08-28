import 'package:flutter/material.dart';
import '../utils/theme.dart';
import '../widgets/cart_icon_button.dart';

class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Privacy Policy'),
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
              'Privacy Policy',
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
              '1. Information We Collect',
              'We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us. This includes your name, email address, phone number, shipping address, and payment information.',
            ),
            _buildSection(
              '2. How We Use Your Information',
              'We use the information we collect to:\n• Process and deliver your orders\n• Send order confirmations and updates\n• Respond to your inquiries\n• Improve our services\n• Send promotional communications (with your consent)',
            ),
            _buildSection(
              '3. Information Sharing',
              'We do not sell, trade, or rent your personal information to third parties. We may share your information with:\n• Payment processors to complete transactions\n• Shipping partners to deliver your orders\n• Service providers who assist in our operations',
            ),
            _buildSection(
              '4. Data Security',
              'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.',
            ),
            _buildSection(
              '5. Your Rights',
              'You have the right to:\n• Access your personal information\n• Correct inaccurate data\n• Request deletion of your data\n• Opt-out of marketing communications',
            ),
            _buildSection(
              '6. Cookies',
              'Our app may use cookies and similar tracking technologies to improve your experience and analyze usage patterns.',
            ),
            _buildSection(
              '7. Children\'s Privacy',
              'Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13.',
            ),
            _buildSection(
              '8. Updates to This Policy',
              'We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.',
            ),
            _buildSection(
              '9. Contact Us',
              'If you have questions about this privacy policy, please contact us at:\nEmail: privacy@tripundlifestyle.com\nPhone: +91 1234567890',
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