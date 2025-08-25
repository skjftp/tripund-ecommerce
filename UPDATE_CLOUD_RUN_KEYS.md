# How to Update Razorpay Keys in Google Cloud Run

## Method 1: Using Google Cloud Console (Recommended - Easier)

### Step 1: Access Cloud Run Service
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project: `tripund-ecommerce-1755860933`
3. Navigate to **Cloud Run** from the menu
4. Click on your service: `tripund-backend`

### Step 2: Edit Environment Variables
1. Click on **"EDIT & DEPLOY NEW REVISION"** button at the top
2. Scroll down to **"Variables & Secrets"** tab
3. Under **Environment Variables**, you'll see all existing variables
4. **ONLY UPDATE THESE THREE**:
   - `RAZORPAY_KEY_ID` → Update with your new key
   - `RAZORPAY_KEY_SECRET` → Update with your new secret
   - `RAZORPAY_WEBHOOK_SECRET` → Update with your new webhook secret
5. **DO NOT MODIFY** other variables like:
   - `FIREBASE_PROJECT_ID`
   - `JWT_SECRET`
   - `CORS_ORIGIN`
   - `STORAGE_BUCKET`
6. Click **"DEPLOY"** at the bottom

## Method 2: Using gcloud CLI (For Terminal Users)

### Step 1: First, Check Current Environment Variables
```bash
# View current service configuration
gcloud run services describe tripund-backend \
  --region=asia-south1 \
  --format="export" > current-config.yaml

# Check current env variables (to make sure we don't lose any)
gcloud run services describe tripund-backend \
  --region=asia-south1 \
  --format="value(spec.template.spec.containers[0].env[].name)"
```

### Step 2: Update ONLY Razorpay Keys
```bash
# Update the service with ONLY the changed Razorpay keys
# This command ONLY updates the specified variables, leaving others intact
gcloud run services update tripund-backend \
  --region=asia-south1 \
  --update-env-vars \
RAZORPAY_KEY_ID="your-new-razorpay-key-id",\
RAZORPAY_KEY_SECRET="your-new-razorpay-secret",\
RAZORPAY_WEBHOOK_SECRET="your-new-webhook-secret"
```

**IMPORTANT**: Replace the placeholder values with your actual new keys from Razorpay!

### Step 3: Verify the Update
```bash
# Check that the service is running
gcloud run services describe tripund-backend \
  --region=asia-south1 \
  --format="value(status.url)"

# Test the health endpoint
curl https://tripund-backend-665685012221.asia-south1.run.app/api/v1/health
```

## Method 3: Using Secret Manager (Most Secure - Recommended for Production)

### Step 1: Create Secrets in Secret Manager
```bash
# Create secrets for sensitive data
echo -n "your-new-razorpay-key-id" | gcloud secrets create razorpay-key-id --data-file=-
echo -n "your-new-razorpay-secret" | gcloud secrets create razorpay-key-secret --data-file=-
echo -n "your-new-webhook-secret" | gcloud secrets create razorpay-webhook-secret --data-file=-
```

### Step 2: Grant Cloud Run Access to Secrets
```bash
# Get the service account email
gcloud run services describe tripund-backend \
  --region=asia-south1 \
  --format="value(spec.template.spec.serviceAccountName)"

# Grant access (replace SERVICE_ACCOUNT_EMAIL with the output from above)
gcloud secrets add-iam-policy-binding razorpay-key-id \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding razorpay-key-secret \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding razorpay-webhook-secret \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/secretmanager.secretAccessor"
```

### Step 3: Update Cloud Run to Use Secrets
```bash
gcloud run services update tripund-backend \
  --region=asia-south1 \
  --update-secrets \
RAZORPAY_KEY_ID=razorpay-key-id:latest,\
RAZORPAY_KEY_SECRET=razorpay-key-secret:latest,\
RAZORPAY_WEBHOOK_SECRET=razorpay-webhook-secret:latest
```

## Important Notes

### What NOT to Change:
- `FIREBASE_PROJECT_ID` - Keep as is
- `JWT_SECRET` - Keep as is  
- `CORS_ORIGIN` - Keep as is
- `STORAGE_BUCKET` - Keep as is
- `PORT` - Keep as is
- `GIN_MODE` - Keep as is

### After Updating:
1. Test a payment flow to ensure new keys work
2. Check Cloud Run logs for any errors:
   ```bash
   gcloud run logs read --service=tripund-backend --region=asia-south1 --limit=50
   ```
3. Monitor your Razorpay dashboard for successful API calls

### Rollback if Needed:
If something goes wrong, you can rollback to the previous revision:
```bash
# List all revisions
gcloud run revisions list --service=tripund-backend --region=asia-south1

# Rollback to a previous revision (replace REVISION_NAME)
gcloud run services update-traffic tripund-backend \
  --region=asia-south1 \
  --to-revisions=REVISION_NAME=100
```

## Verification Checklist

After updating, verify:
- [ ] Cloud Run service is still running (green check in console)
- [ ] Health endpoint responds: `curl https://tripund-backend-665685012221.asia-south1.run.app/api/v1/health`
- [ ] No errors in Cloud Run logs
- [ ] Test a payment with new keys (in test mode first)
- [ ] Other features still work (login, product listing, etc.)

## Need Help?

If you encounter issues:
1. Check Cloud Run logs for specific errors
2. Verify the new keys are correct in Razorpay dashboard
3. Ensure the keys are in the correct format (no extra spaces)
4. Try Method 1 (Console) if CLI isn't working

Remember: ONLY update the three Razorpay-related variables. All other environment variables should remain unchanged!