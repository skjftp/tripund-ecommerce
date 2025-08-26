import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

interface ProductVariant {
  id: string;
  color: string;
  size: string;
  price: number;
  sale_price?: number;
  sku: string;
  stock_quantity: number;
  images?: string[];
  available: boolean;
}

interface VariantSelectorProps {
  variants: ProductVariant[];
  availableColors: string[];
  availableSizes: string[];
  basePrice: number;
  onVariantSelect: (variant: ProductVariant | null) => void;
  onImageChange?: (images: string[]) => void;
}

const COLOR_MAP: { [key: string]: string } = {
  'Red': '#FF0000',
  'Blue': '#0000FF',
  'Green': '#00FF00',
  'Black': '#000000',
  'White': '#FFFFFF',
  'Yellow': '#FFFF00',
  'Pink': '#FFC0CB',
  'Purple': '#800080',
  'Orange': '#FFA500',
  'Brown': '#A52A2A',
  'Grey': '#808080',
  'Gray': '#808080',
  'Navy': '#000080',
  'Beige': '#F5F5DC',
  'Maroon': '#800000',
  'Gold': '#FFD700',
  'Silver': '#C0C0C0'
};

export default function ProductVariantSelector({
  variants,
  availableColors,
  availableSizes,
  basePrice,
  onVariantSelect,
  onImageChange
}: VariantSelectorProps) {
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    // Find and select variant based on current selections
    if (variants && variants.length > 0) {
      let variant = null;
      
      if (selectedColor && selectedSize) {
        variant = variants.find(v => v.color === selectedColor && v.size === selectedSize && v.available);
      } else if (selectedColor && !availableSizes.length) {
        variant = variants.find(v => v.color === selectedColor && v.available);
      } else if (selectedSize && !availableColors.length) {
        variant = variants.find(v => v.size === selectedSize && v.available);
      }
      
      setSelectedVariant(variant || null);
      onVariantSelect(variant || null);
      
      // Change images if variant has specific images
      if (variant && variant.images && variant.images.length > 0 && onImageChange) {
        onImageChange(variant.images);
      }
    }
  }, [selectedColor, selectedSize, variants]);

  // Auto-select if only one option
  useEffect(() => {
    if (availableColors.length === 1 && !selectedColor) {
      setSelectedColor(availableColors[0]);
    }
    if (availableSizes.length === 1 && !selectedSize) {
      setSelectedSize(availableSizes[0]);
    }
  }, [availableColors, availableSizes]);

  const getColorHex = (colorName: string): string => {
    return COLOR_MAP[colorName] || '#CCCCCC';
  };

  const isColorAvailable = (color: string): boolean => {
    if (!selectedSize) return true;
    return variants.some(v => v.color === color && v.size === selectedSize && v.available);
  };

  const isSizeAvailable = (size: string): boolean => {
    if (!selectedColor) return true;
    return variants.some(v => v.size === size && v.color === selectedColor && v.available);
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Color Selection */}
      {availableColors.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              Color: {selectedColor && <span className="font-normal">{selectedColor}</span>}
            </label>
            {selectedColor && (
              <button
                onClick={() => setSelectedColor('')}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {availableColors.map(color => {
              const isAvailable = isColorAvailable(color);
              const isSelected = selectedColor === color;
              
              return (
                <button
                  key={color}
                  onClick={() => isAvailable && setSelectedColor(color)}
                  disabled={!isAvailable}
                  className={`
                    relative group
                    ${isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                  `}
                  title={color}
                >
                  <div
                    className={`
                      w-10 h-10 rounded-full border-2 transition-all
                      ${isSelected ? 'border-black scale-110' : 'border-gray-300'}
                      ${isAvailable ? 'hover:scale-105' : ''}
                    `}
                    style={{
                      backgroundColor: getColorHex(color),
                      boxShadow: color.toLowerCase() === 'white' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : ''
                    }}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check 
                          size={20} 
                          className={color.toLowerCase() === 'white' || color.toLowerCase() === 'yellow' ? 'text-black' : 'text-white'}
                        />
                      </div>
                    )}
                    {!isAvailable && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-gray-400 rotate-45" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs mt-1 block text-center">{color}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {availableSizes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              Size: {selectedSize && <span className="font-normal">{selectedSize}</span>}
            </label>
            {selectedSize && (
              <button
                onClick={() => setSelectedSize('')}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {availableSizes.map(size => {
              const isAvailable = isSizeAvailable(size);
              const isSelected = selectedSize === size;
              
              return (
                <button
                  key={size}
                  onClick={() => isAvailable && setSelectedSize(size)}
                  disabled={!isAvailable}
                  className={`
                    px-4 py-2 text-sm border rounded-lg transition-all
                    ${isSelected 
                      ? 'border-black bg-black text-white' 
                      : 'border-gray-300 hover:border-gray-400'
                    }
                    ${!isAvailable ? 'opacity-50 cursor-not-allowed line-through' : 'cursor-pointer'}
                  `}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Price Display */}
      {selectedVariant && selectedVariant.price !== basePrice && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Variant Price:</span>
            <div className="text-right">
              {selectedVariant.sale_price ? (
                <>
                  <span className="text-lg font-semibold text-red-600">
                    {formatPrice(selectedVariant.sale_price)}
                  </span>
                  <span className="text-sm text-gray-500 line-through ml-2">
                    {formatPrice(selectedVariant.price)}
                  </span>
                </>
              ) : (
                <span className="text-lg font-semibold">
                  {formatPrice(selectedVariant.price)}
                </span>
              )}
            </div>
          </div>
          
          {selectedVariant.stock_quantity <= 5 && selectedVariant.stock_quantity > 0 && (
            <p className="text-xs text-orange-600 mt-2">
              Only {selectedVariant.stock_quantity} left in stock
            </p>
          )}
        </div>
      )}

      {/* Out of Stock Message */}
      {selectedColor && selectedSize && !selectedVariant && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">
            This combination is currently out of stock
          </p>
        </div>
      )}
    </div>
  );
}