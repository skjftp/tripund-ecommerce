#!/bin/bash

echo "Fixing categories by removing duplicate 'id' field..."

# Categories that have duplicate id field (based on your data)
CATEGORIES_WITH_ID=(
  "XdMdptha70B4ZettYEK8"
  "aoxrDJhayadevoWckAVS"
  "dPzXS4lFmUPW7Ydpjayt"
  "kKuFHqXmtZrvhdT1FSXH"
  "yKnQpl6qUDgMH4pNGX3D"
)

for DOC_ID in "${CATEGORIES_WITH_ID[@]}"
do
  echo "Removing 'id' field from category: $DOC_ID"
  
  # Use gcloud firestore to update the document
  gcloud firestore documents update "categories/$DOC_ID" \
    --project="tripund-ecommerce-1755860933" \
    --field-paths="id" \
    --delete-field 2>/dev/null
  
  if [ $? -eq 0 ]; then
    echo "  ✓ Successfully removed 'id' field from $DOC_ID"
  else
    echo "  ✗ Failed to update $DOC_ID"
  fi
done

echo ""
echo "Done! All categories should now work properly."