import 'package:flutter/material.dart';
import '../utils/theme.dart';

class PaymentMethodsScreen extends StatelessWidget {
  const PaymentMethodsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment Methods'),
        backgroundColor: AppTheme.backgroundColor,
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _buildPaymentOption(
            context,
            'Cash on Delivery',
            'Pay when you receive your order',
            Icons.money,
            true,
          ),
          const SizedBox(height: 16),
          _buildPaymentOption(
            context,
            'Credit/Debit Card',
            'Secure payment with card',
            Icons.credit_card,
            false,
          ),
          const SizedBox(height: 16),
          _buildPaymentOption(
            context,
            'UPI',
            'Pay using UPI ID',
            Icons.account_balance,
            false,
          ),
          const SizedBox(height: 16),
          _buildPaymentOption(
            context,
            'Net Banking',
            'Pay through your bank',
            Icons.account_balance_wallet,
            false,
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentOption(
    BuildContext context,
    String title,
    String subtitle,
    IconData icon,
    bool isDefault,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDefault ? AppTheme.primaryColor : Colors.grey[300]!,
          width: isDefault ? 2 : 1,
        ),
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
              color: isDefault 
                ? AppTheme.primaryColor.withOpacity(0.1)
                : Colors.grey[100],
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              color: isDefault ? AppTheme.primaryColor : Colors.grey[600],
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
          if (isDefault)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'Default',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
    );
  }
}