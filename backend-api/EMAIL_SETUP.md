# Email Configuration Setup

## Google Workspace Email Setup

This guide explains how to set up email notifications for TRIPUND using your Google Workspace email `orders@tripundlifestyle.com`.

### 1. Generate App Password for Google Workspace

1. **Sign in to your Google Admin Console** (admin.google.com)
2. **Navigate to Security > Authentication > 2-Step Verification**
3. **Turn on 2-Step Verification** for orders@tripundlifestyle.com account if not already enabled
4. **Go to Security > App passwords**
5. **Generate a new App Password**:
   - Select app: "Mail"
   - Select device: "Other (custom name)" → Enter "TRIPUND Backend"
   - **Copy the 16-character app password** (save it securely)

### 2. Update Environment Variables

Add these variables to your `.env` file:

```bash
# Email Configuration for Google Workspace
EMAIL_FROM=orders@tripundlifestyle.com
EMAIL_PASSWORD=your-16-character-app-password-here
```

**Important**: Use the App Password (16 characters), NOT your regular Google account password.

### 3. Test Email Configuration

You can test the email configuration by creating a test order. The system will automatically send:

1. **Order Confirmation Email** - Sent immediately after order creation
2. **Shipping Confirmation Email** - Sent when order status changes to "shipped"

### 4. Email Templates

The system includes two professional HTML email templates:

#### Order Confirmation Email
- Includes order details, items (with variant info), pricing, and shipping address
- Professional TRIPUND branding with Indian handicraft theme
- Responsive design for mobile/desktop

#### Shipping Confirmation Email
- Includes tracking information (if provided)
- Shipped items list with variant details
- Delivery timeline and instructions
- Professional branding consistent with order confirmation

### 5. Security Considerations

- **Never commit the actual app password** to version control
- App passwords are specific to applications - don't reuse them
- If compromised, revoke and generate new app password
- Consider rotating app passwords periodically

### 6. Troubleshooting

#### Common Issues:

1. **"Authentication failed"**: 
   - Verify 2-Step Verification is enabled
   - Ensure you're using the App Password, not account password
   - Check that EMAIL_FROM matches exact Gmail address

2. **"Connection refused"**:
   - Check internet connectivity
   - Verify SMTP settings (smtp.gmail.com:587)
   - Ensure firewall allows outbound SMTP

3. **Emails not received**:
   - Check spam/junk folders
   - Verify recipient email address
   - Check server logs for sending errors

#### Log Monitoring:

The system logs email sending status:
- Success: "Order confirmation email sent successfully for order XXX"
- Failure: "Failed to send order confirmation email for order XXX: [error]"

### 7. Production Deployment

When deploying to Google Cloud Run, ensure:

1. **Environment variables** are set in Cloud Run service
2. **Outbound SMTP** is allowed (Google Cloud allows Gmail SMTP by default)
3. **Logging** is configured to monitor email sending

#### Set Environment Variables in Cloud Run:

```bash
gcloud run services update tripund-backend \
  --set-env-vars EMAIL_FROM=orders@tripundlifestyle.com \
  --set-env-vars EMAIL_PASSWORD=your-app-password \
  --region=asia-south1
```

### 8. Email Deliverability Best Practices

1. **SPF Record**: Ensure your domain has proper SPF record including Google
2. **DKIM**: Enable DKIM signing in Google Workspace
3. **DMARC**: Set up DMARC policy for domain
4. **Domain Reputation**: Use consistent from address
5. **Content Quality**: Professional templates reduce spam likelihood

### 9. Monitoring & Analytics

Consider implementing:
- Email delivery success/failure tracking
- Customer engagement metrics
- Bounce/complaint handling
- Delivery time monitoring

### 10. Support

For email-related issues:
- Check Google Workspace Admin Console logs
- Monitor Cloud Run logs for email sending errors  
- Test with different recipient providers (Gmail, Outlook, etc.)
- Contact Google Workspace support for deliverability issues

---

**Note**: This setup uses Google's SMTP servers for reliable delivery. The system is designed to handle email sending asynchronously to avoid blocking order processing.