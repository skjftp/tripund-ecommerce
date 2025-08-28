import 'package:flutter/material.dart';
import '../utils/theme.dart';
import '../widgets/cart_icon_button.dart';

class FAQScreen extends StatelessWidget {
  const FAQScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final faqs = [
      {
        'question': 'How long does delivery take?',
        'answer': 'We deliver within 5-7 business days across India. Express delivery options are available for select locations.',
      },
      {
        'question': 'What payment methods do you accept?',
        'answer': 'We accept all major credit/debit cards, UPI, net banking, and Cash on Delivery (COD) for orders up to ₹10,000.',
      },
      {
        'question': 'Do you ship internationally?',
        'answer': 'Currently, we only ship within India. International shipping will be available soon.',
      },
      {
        'question': 'What is your return policy?',
        'answer': 'We offer a 7-day return policy for all products. Items must be unused and in their original packaging.',
      },
      {
        'question': 'How do I track my order?',
        'answer': 'Once your order is shipped, you will receive a tracking link via email and SMS.',
      },
      {
        'question': 'Are your products handmade?',
        'answer': 'Yes, all our products are authentic handmade Indian handicrafts crafted by skilled artisans.',
      },
      {
        'question': 'How can I contact customer support?',
        'answer': 'You can reach us at support@tripundlifestyle.com or call us at +91 1234567890 during business hours.',
      },
      {
        'question': 'Do you offer bulk orders?',
        'answer': 'Yes, we accept bulk orders for corporate gifting and events. Please contact us for special pricing.',
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Frequently Asked Questions'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        actions: const [
          CartIconButton(),
        ],
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: faqs.length,
        itemBuilder: (context, index) {
          final faq = faqs[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ExpansionTile(
              tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              title: Text(
                faq['question']!,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              children: [
                Text(
                  faq['answer']!,
                  style: TextStyle(
                    color: Colors.grey[700],
                    fontSize: 14,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}