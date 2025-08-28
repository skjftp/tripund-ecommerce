import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../utils/theme.dart';
import '../widgets/cart_icon_button.dart';
import 'faq_screen.dart';
import 'terms_screen.dart';
import 'privacy_screen.dart';
import 'about_screen.dart';

class HelpSupportScreen extends StatelessWidget {
  const HelpSupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Help & Support'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        actions: const [
          CartIconButton(iconColor: Colors.white),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _buildHelpSection(
            context,
            'Frequently Asked Questions',
            'Find answers to common questions',
            Icons.help_outline,
            Colors.blue,
            () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const FAQScreen()),
              );
            },
          ),
          const SizedBox(height: 16),
          _buildHelpSection(
            context,
            'Contact Us',
            'Get in touch with our support team',
            Icons.email_outlined,
            Colors.green,
            () => _launchEmail(),
          ),
          const SizedBox(height: 16),
          _buildHelpSection(
            context,
            'Call Support',
            '+91 1234567890',
            Icons.phone_outlined,
            Colors.orange,
            () => _makePhoneCall(),
          ),
          const SizedBox(height: 16),
          _buildHelpSection(
            context,
            'Terms & Conditions',
            'View our terms of service',
            Icons.description_outlined,
            Colors.purple,
            () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const TermsScreen()),
              );
            },
          ),
          const SizedBox(height: 16),
          _buildHelpSection(
            context,
            'Privacy Policy',
            'Learn about our privacy practices',
            Icons.privacy_tip_outlined,
            Colors.red,
            () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const PrivacyScreen()),
              );
            },
          ),
          const SizedBox(height: 16),
          _buildHelpSection(
            context,
            'About TRIPUND',
            'Learn more about us',
            Icons.info_outline,
            Colors.indigo,
            () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const AboutScreen()),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildHelpSection(
    BuildContext context,
    String title,
    String subtitle,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                color: color,
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              color: Colors.grey[400],
              size: 16,
            ),
          ],
        ),
      ),
    );
  }

  void _launchEmail() async {
    final Uri emailUri = Uri(
      scheme: 'mailto',
      path: 'support@tripundlifestyle.com',
      query: 'subject=Support Request',
    );
    if (await canLaunchUrl(emailUri)) {
      await launchUrl(emailUri);
    }
  }

  void _makePhoneCall() async {
    final Uri phoneUri = Uri(
      scheme: 'tel',
      path: '+911234567890',
    );
    if (await canLaunchUrl(phoneUri)) {
      await launchUrl(phoneUri);
    }
  }
}