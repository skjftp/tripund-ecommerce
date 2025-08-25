#!/bin/bash

echo "WARNING: This will rewrite git history to remove sensitive data"
echo "Make sure you have a backup of your repository"
echo ""
read -p "Do you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted"
    exit 1
fi

echo "Removing sensitive strings from git history..."

# Using git filter-branch to remove sensitive data
git filter-branch --force --index-filter \
'git ls-files -z | xargs -0 sed -i "" \
-e "s/rzp_live_R8hjOfsT9hUkwE/your-razorpay-key-id/g" \
-e "s/eYQYNCRSIv9z5kvGBAgSyyk0/your-razorpay-key-secret/g" \
-e "s/webhook-tripund-678!!/your-webhook-secret/g"' \
--prune-empty --tag-name-filter cat -- --all

echo ""
echo "Git history has been cleaned."
echo ""
echo "IMPORTANT NEXT STEPS:"
echo "1. Force push to remote: git push origin --force --all"
echo "2. Force push tags: git push origin --force --tags"
echo "3. Tell all collaborators to rebase, not merge"
echo "4. Clean up the backup refs: rm -rf .git/refs/original/"
echo "5. Run garbage collection: git gc --prune=now --aggressive"
echo ""
echo "MOST IMPORTANT: Rotate your Razorpay keys immediately!"
echo "Go to Razorpay Dashboard and regenerate your API keys"