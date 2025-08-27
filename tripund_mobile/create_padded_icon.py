#!/usr/bin/env python3
from PIL import Image

# Open the original icon
original = Image.open('/Users/sumitjha/Dropbox/Mac/Documents/Projects/tripund-ecommerce/app_icon.png')

# Get original size
orig_width, orig_height = original.size

# Calculate new size with padding (65% of original size)
scale_factor = 0.65
new_size = (int(orig_width * scale_factor), int(orig_height * scale_factor))

# Resize the original image
resized = original.resize(new_size, Image.Resampling.LANCZOS)

# Create a new image with white background
padded = Image.new('RGBA', (orig_width, orig_height), (255, 255, 255, 255))

# Calculate position to center the resized image
x = (orig_width - new_size[0]) // 2
y = (orig_height - new_size[1]) // 2

# Paste the resized image onto the white background
padded.paste(resized, (x, y), resized if resized.mode == 'RGBA' else None)

# Save the padded icon
padded.save('/Users/sumitjha/Dropbox/Mac/Documents/Projects/tripund-ecommerce/tripund_mobile/assets/images/app_icon_padded.png')
print("Padded icon created successfully!")