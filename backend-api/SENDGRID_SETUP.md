# SendGrid Email Integration Setup

This document explains how to set up SendGrid for email delivery in the TRIPUND backend.

## Overview

The TRIPUND backend uses SendGrid for reliable email delivery of:
- Order confirmation emails
- Shipping confirmation emails
- Other transactional notifications

## Prerequisites

1. **SendGrid Account**: Sign up at [sendgrid.com](https://sendgrid.com)
2. **API Key**: Create an API key with "Mail Send" permissions
3. **Sender Authentication**: Verify your sending email domain/address

## Setup Steps

### 1. Create SendGrid Account
1. Go to [SendGrid](https://sendgrid.com) and create an account
2. Complete email verification
3. Choose a plan (Free tier includes 100 emails/day)

### 2. Create API Key
1. In SendGrid dashboard, go to **Settings** > **API Keys**
2. Click **Create API Key**
3. Choose **Restricted Access**
4. Give it a name like "TRIPUND Production API Key"
5. Under **Mail Send**, select **Full Access**
6. Click **Create & View**
7. **Copy the API key** (you won't see it again!)

### 3. Authenticate Sender Email
Choose one method:

#### Option A: Single Sender Verification (Recommended for testing)
1. Go to **Settings** > **Sender Authentication** > **Single Sender Verification**
2. Add `orders@tripundlifestyle.com` (or your desired sender email)
3. Verify the email address via the confirmation email

#### Option B: Domain Authentication (Recommended for production)
1. Go to **Settings** > **Sender Authentication** > **Authenticate Your Domain**
2. Enter `tripundlifestyle.com`
3. Follow DNS configuration instructions
4. Wait for DNS verification (may take up to 48 hours)

### 4. Configure Environment Variables

Add these to your `.env` file:

```bash
# Email Configuration with SendGrid
EMAIL_FROM=orders@tripundlifestyle.com
EMAIL_FROM_NAME=TRIPUND Lifestyle  
SENDGRID_API_KEY=SG.your-actual-sendgrid-api-key-here
```

### 5. Verify Integration

The backend will automatically use SendGrid when:
1. `SENDGRID_API_KEY` is set in environment variables
2. The sender email (`EMAIL_FROM`) is verified in SendGrid
3. Orders are created or updated to "shipped" status

## Email Templates

The backend includes built-in HTML email templates for:

### Order Confirmation Email
- Professional design with TRIPUND branding
- Order details, items, pricing, and shipping address  
- Variant information (color/size) for applicable products
- Customer support information
- Sent automatically when an order is created

### Shipping Confirmation Email
- Shipping notification with tracking information
- Delivered items list
- Delivery timeline and instructions
- Contact information for support
- Sent automatically when order status changes to "shipped"

## Template Customization

Email templates are embedded in the code at:
- `internal/services/email_sendgrid.go`

To customize templates:
1. Edit the HTML templates in the `renderOrderConfirmationTemplate()` and `renderShippingConfirmationTemplate()` functions
2. Maintain responsive design and brand consistency
3. Test templates with various order scenarios (variants, multiple items, etc.)
4. Redeploy the backend after changes

## Monitoring & Analytics

### SendGrid Dashboard
Monitor email performance at **Activity** in SendGrid dashboard:
- Delivery rates
- Opens and clicks  
- Bounces and spam reports
- Suppression management

### Backend Logs
Email sending is logged with details:
```
SendGrid: Preparing to send email to Customer Name <customer@email.com> with subject: Order Confirmation - ORD123 | TRIPUND Lifestyle
SendGrid SUCCESS: Email sent to customer@email.com. Status: 202
```

## Troubleshooting

### Common Issues

**"Unauthorized" (401 Error)**
- Check API key is correct and has Mail Send permissions
- Ensure API key is properly set in environment variables

**"Forbidden" (403 Error)**  
- Verify sender email is authenticated in SendGrid
- Check that sender domain is verified (for domain authentication)

**"Bad Request" (400 Error)**
- Review email template HTML for syntax errors
- Ensure recipient email addresses are valid
- Check that required fields (to, from, subject) are present

**Emails Not Delivered**
- Check SendGrid Activity dashboard for delivery status
- Verify recipient email address is valid and not suppressed
- Check spam folders
- Review reputation score in SendGrid dashboard

### Debug Mode

Enable detailed logging by setting log level in backend:
```bash
GIN_MODE=debug
```

### Testing Emails

For development/testing:
1. Use SendGrid's Email Testing feature
2. Send test emails to your own verified addresses
3. Use tools like [Mail Tester](https://www.mail-tester.com/) to check spam scores

## Production Considerations

### Security
- Never commit API keys to version control
- Use environment variables or secret management
- Rotate API keys regularly
- Use least-privilege permissions (only Mail Send)

### Compliance
- Include unsubscribe links for marketing emails (not required for transactional)
- Follow CAN-SPAM and GDPR guidelines
- Monitor suppression lists and honor opt-outs

### Scale & Performance  
- SendGrid Free: 100 emails/day
- Paid plans available for higher volumes
- Consider implementing queue system for high-volume scenarios

### Backup Strategy
- Keep fallback email service configured (SMTP)
- Monitor delivery rates and have alerting in place
- Regular backup of suppression lists and templates

## Support

- **SendGrid Support**: Available in SendGrid dashboard
- **Documentation**: [SendGrid API Docs](https://docs.sendgrid.com/)
- **TRIPUND Backend Issues**: Check application logs and Cloud Run logs

---

Last Updated: August 29, 2025  
Version: 1.0  
Platform: TRIPUND E-Commerce Backend