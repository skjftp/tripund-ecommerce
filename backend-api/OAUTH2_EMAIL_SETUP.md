# OAuth2 Email Setup Guide

## Complete Setup Instructions for TRIPUND Email Notifications

This guide explains how to set up OAuth2 authentication with Gmail API for automated email notifications using your Google Workspace account `orders@tripundlifestyle.com`.

## Part 1: Google Cloud Console Setup

### Step 1: Create Service Account

1. **Go to Google Cloud Console**: https://console.cloud.google.com
2. **Select your project**: `tripund-ecommerce-1755860933`
3. **Navigate to IAM & Admin** → **Service Accounts**
4. **Click "Create Service Account"**
5. **Fill in details**:
   - **Service account name**: `tripund-email-sender`
   - **Service account ID**: `tripund-email-sender` (auto-generated)
   - **Description**: `Service account for sending TRIPUND order and shipping emails`
6. **Click "Create and Continue"**
7. **Skip roles** (click "Continue") - we'll set up domain-wide delegation
8. **Click "Done"**

### Step 2: Create Service Account Key

1. **Click on the created service account** (`tripund-email-sender`)
2. **Go to "Keys" tab**
3. **Click "Add Key"** → **"Create new key"**
4. **Select "JSON"** format
5. **Click "Create"** - this downloads the JSON file
6. **Save the JSON file securely** - you'll need its contents

### Step 3: Enable Gmail API

1. **Go to APIs & Services** → **Library**
2. **Search for "Gmail API"**
3. **Click on "Gmail API"**
4. **Click "Enable"**

### Step 4: Configure OAuth2 Consent Screen (if not done)

1. **Go to APIs & Services** → **OAuth consent screen**
2. **Choose "Internal"** (for Google Workspace)
3. **Fill required fields**:
   - **App name**: TRIPUND Email Service
   - **User support email**: vikash@tripundlifestyle.com
   - **Developer contact**: vikash@tripundlifestyle.com
4. **Save and Continue**

## Part 2: Google Workspace Admin Setup

### Step 5: Enable Domain-Wide Delegation

1. **Go to Google Admin Console**: https://admin.google.com
2. **Sign in as**: vikash@tripundlifestyle.com (admin)
3. **Navigate to Security** → **Access and data control** → **API controls**
4. **Click "Manage Domain Wide Delegation"**
5. **Click "Add new"**
6. **Fill in details**:
   - **Client ID**: Copy from the service account JSON file (`client_id` field)
   - **OAuth Scopes**: `https://www.googleapis.com/auth/gmail.send`
7. **Click "Authorize"**

### Step 6: Verify Service Account Details

From your downloaded JSON file, you'll need these values:
```json
{
  "type": "service_account",
  "project_id": "tripund-ecommerce-1755860933",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "tripund-email-sender@tripund-ecommerce-1755860933.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

## Part 3: Deployment Configuration

### Step 7: Configure Environment Variables

You have two options:

#### Option A: Full JSON (Recommended)
Set the entire service account JSON as an environment variable:

```bash
gcloud run services update tripund-backend \
  --set-env-vars EMAIL_FROM=orders@tripundlifestyle.com \
  --set-env-vars GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"tripund-ecommerce-1755860933",...}' \
  --region=asia-south1
```

#### Option B: Individual Fields
Set individual fields from the JSON:

```bash
gcloud run services update tripund-backend \
  --set-env-vars EMAIL_FROM=orders@tripundlifestyle.com \
  --set-env-vars GOOGLE_PROJECT_ID=tripund-ecommerce-1755860933 \
  --set-env-vars GOOGLE_CLIENT_EMAIL=tripund-email-sender@tripund-ecommerce-1755860933.iam.gserviceaccount.com \
  --set-env-vars GOOGLE_PRIVATE_KEY_ID=your-private-key-id \
  --set-env-vars GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----" \
  --set-env-vars GOOGLE_CLIENT_ID=your-client-id \
  --region=asia-south1
```

**Important**: Replace placeholders with actual values from your JSON file.

### Step 8: Deploy Backend

```bash
cd backend-api
./deploy.sh
```

## Part 4: Testing & Verification

### Step 9: Test Email Sending

1. **Place a test order** on the website
2. **Check Cloud Run logs**:
   ```bash
   gcloud run logs read --service=tripund-backend --region=asia-south1
   ```
3. **Look for these log messages**:
   - Success: `"Order confirmation email sent successfully for order XXX"`
   - Failure: `"Failed to send order confirmation email for order XXX: [error]"`

### Step 10: Test Shipping Email

1. **Go to admin panel**: https://tripundlifestyle-admin.netlify.app
2. **Mark an order as "shipped"**
3. **Check logs** for shipping confirmation email status

## Part 5: Troubleshooting

### Common Issues:

#### 1. "Service account key not found"
- Verify `GOOGLE_SERVICE_ACCOUNT_KEY` environment variable is set
- Check JSON format is correct (no extra spaces/newlines)

#### 2. "Domain-wide delegation not configured"
- Ensure you added the service account client ID to Google Admin Console
- Verify the OAuth scope is exactly: `https://www.googleapis.com/auth/gmail.send`

#### 3. "Gmail API not enabled"
- Enable Gmail API in Google Cloud Console → APIs & Services → Library

#### 4. "Access denied" or "Forbidden"
- Check that domain-wide delegation is properly configured
- Verify the service account has the correct OAuth scopes
- Ensure `orders@tripundlifestyle.com` exists and is active

#### 5. "Private key format error"
- Ensure private key includes proper line breaks (`\n`)
- Check that the entire key is copied including headers/footers

### Debug Steps:

1. **Check service account creation**:
   ```bash
   gcloud iam service-accounts list --project=tripund-ecommerce-1755860933
   ```

2. **Verify Gmail API is enabled**:
   ```bash
   gcloud services list --enabled --project=tripund-ecommerce-1755860933 | grep gmail
   ```

3. **Test with minimal setup**:
   - Start with Option A (full JSON)
   - Verify domain-wide delegation settings
   - Check Cloud Run environment variables

## Part 6: Security Best Practices

1. **Service Account Key Security**:
   - Never commit service account keys to version control
   - Use Cloud Run environment variables for sensitive data
   - Rotate service account keys periodically

2. **Minimal Permissions**:
   - Service account only has Gmail send permission
   - No additional IAM roles assigned
   - Scoped to specific email operations

3. **Monitoring**:
   - Monitor Cloud Run logs for email sending status
   - Set up alerts for email sending failures
   - Track email delivery metrics

## Part 7: Email Templates

The system includes two professional templates:

### Order Confirmation Email Features:
- ✅ Professional TRIPUND branding with gradient headers
- ✅ Complete order details with variant information
- ✅ Responsive design for mobile/desktop
- ✅ Order summary with pricing breakdown
- ✅ Shipping address display
- ✅ Next steps and delivery timeline
- ✅ Support contact information

### Shipping Confirmation Email Features:
- ✅ Shipping confirmation with tracking info
- ✅ Estimated delivery dates
- ✅ Delivery instructions
- ✅ Shipped items with variant details
- ✅ Professional green theme for positive confirmation
- ✅ Social media engagement prompts

## Part 8: Monitoring & Analytics

### Log Messages to Monitor:
```bash
# Success messages
"Order confirmation email sent successfully for order XXX"
"Shipping confirmation email sent successfully for order XXX"
"Email sent successfully to user@example.com via Gmail API"

# Warning messages
"Email service not available, skipping order confirmation email"
"Warning: Failed to initialize OAuth2 email service"

# Error messages
"Failed to send order confirmation email for order XXX: [error]"
"Failed to create Gmail service: [error]"
"Domain-wide delegation not configured: [error]"
```

### Success Verification:
- Customers receive professional HTML emails
- Variant information (color/size) is displayed correctly
- Tracking links work properly in shipping emails
- Emails have proper TRIPUND branding and formatting

---

## Quick Setup Checklist:

- [ ] Create service account in Google Cloud Console
- [ ] Download service account JSON key
- [ ] Enable Gmail API
- [ ] Configure domain-wide delegation in Google Admin
- [ ] Set environment variables in Cloud Run
- [ ] Deploy backend
- [ ] Test order creation (should send confirmation email)
- [ ] Test order shipping (should send shipping email)
- [ ] Monitor logs for success/failure messages

**Support**: If you encounter issues, check the Cloud Run logs first, then verify each setup step above.