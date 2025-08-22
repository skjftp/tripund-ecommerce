#!/bin/bash

echo "Fixing TypeScript import errors for Netlify build..."

cd web-frontend

# Fix type imports
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/import { RootState }/import type { RootState }/g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/import { AppDispatch }/import type { AppDispatch }/g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/import { Product }/import type { Product }/g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/import { User/import type { User/g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/import { Order }/import type { Order }/g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/import { CartItem/import type { CartItem/g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/import { AuthResponse }/import type { AuthResponse }/g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/import { ReactNode }/import type { ReactNode }/g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/import { PayloadAction }/import type { PayloadAction }/g'

# Fix mixed imports
sed -i '' 's/import { RootState, AppDispatch }/import type { RootState, AppDispatch }/g' src/pages/*.tsx
sed -i '' 's/import { Product, /import type { Product } from '"'"'..\/types'"'"';\nimport { /g' src/components/product/*.tsx
sed -i '' 's/import { User, AuthResponse }/import type { User, AuthResponse }/g' src/store/slices/authSlice.ts
sed -i '' 's/import { CartItem, Product }/import type { CartItem, Product }/g' src/store/slices/cartSlice.ts

echo "TypeScript import fixes applied!"