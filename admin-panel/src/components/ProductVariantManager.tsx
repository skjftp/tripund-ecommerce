import { useState, useEffect, useRef } from 'react';
import { Plus, X, Trash2, Upload } from 'lucide-react';

interface ProductVariant {
  id: string;
  color: string;
  size: string;
  price: number;
  sale_price?: number;
  sku: string;
  stock_quantity: number;
  images: string[];
  available: boolean;
}

interface VariantManagerProps {
  basePrice: number;
  baseSKU: string;
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[], colors: string[], sizes: string[]) => void;
}

const PREDEFINED_COLORS = [
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Green', hex: '#00FF00' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Pink', hex: '#FFC0CB' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Brown', hex: '#A52A2A' },
  { name: 'Grey', hex: '#808080' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Maroon', hex: '#800000' },
  { name: 'Gold', hex: '#FFD700' },
  { name: 'Silver', hex: '#C0C0C0' }
];

const PREDEFINED_SIZES = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
  'Free Size', 'One Size',
  '28', '30', '32', '34', '36', '38', '40', '42',
  'Small', 'Medium', 'Large', 'Extra Large'
];

export default function ProductVariantManager({ 
  basePrice, 
  baseSKU, 
  variants: initialVariants, 
  onChange 
}: VariantManagerProps) {
  // Use refs to store variant data to prevent recreating objects
  const variantDataRef = useRef<Map<string, Partial<ProductVariant>>>(new Map());
  
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [customColor, setCustomColor] = useState('');
  const [customSize, setCustomSize] = useState('');
  const [bulkPriceMode, setBulkPriceMode] = useState<'same' | 'different'>('same');
  const [bulkPrice, setBulkPrice] = useState(basePrice);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Initialize from existing variants
  useEffect(() => {
    if (initialVariants && initialVariants.length > 0) {
      const colors = [...new Set(initialVariants.map(v => v.color).filter(Boolean))];
      const sizes = [...new Set(initialVariants.map(v => v.size).filter(Boolean))];
      
      // Store existing variant data
      initialVariants.forEach(variant => {
        const key = `${variant.color || ''}-${variant.size || ''}`;
        variantDataRef.current.set(key, {
          price: variant.price,
          sale_price: variant.sale_price,
          sku: variant.sku,
          stock_quantity: variant.stock_quantity,
          images: variant.images,
          available: variant.available
        });
      });
      
      setSelectedColors(colors);
      setSelectedSizes(sizes);
    }
  }, []);

  // Generate variant combinations
  const generateVariantCombinations = () => {
    const combinations: Array<{ color: string; size: string }> = [];
    
    if (selectedColors.length > 0 && selectedSizes.length === 0) {
      selectedColors.forEach(color => {
        combinations.push({ color, size: '' });
      });
    } else if (selectedSizes.length > 0 && selectedColors.length === 0) {
      selectedSizes.forEach(size => {
        combinations.push({ color: '', size });
      });
    } else if (selectedColors.length > 0 && selectedSizes.length > 0) {
      selectedColors.forEach(color => {
        selectedSizes.forEach(size => {
          combinations.push({ color, size });
        });
      });
    }
    
    return combinations;
  };

  // Build variants from combinations
  const buildVariants = (): ProductVariant[] => {
    const combinations = generateVariantCombinations();
    
    return combinations.map(({ color, size }) => {
      const key = `${color}-${size}`;
      const existingData = variantDataRef.current.get(key) || {};
      const variantId = baseSKU + 
        (color ? `-${color.toLowerCase().replace(/\s+/g, '-')}` : '') +
        (size ? `-${size.toLowerCase().replace(/\s+/g, '-')}` : '');
      
      return {
        id: variantId,
        color,
        size,
        price: existingData.price ?? (bulkPriceMode === 'same' ? bulkPrice : basePrice),
        sale_price: existingData.sale_price,
        sku: existingData.sku || variantId,
        stock_quantity: existingData.stock_quantity || 0,
        images: existingData.images || [],
        available: existingData.available !== undefined ? existingData.available : true
      };
    });
  };

  // Update parent when colors/sizes change
  useEffect(() => {
    const newVariants = buildVariants();
    onChange(newVariants, selectedColors, selectedSizes);
  }, [selectedColors, selectedSizes, bulkPriceMode, bulkPrice, updateTrigger]);

  const addColor = (color: string) => {
    if (color && !selectedColors.includes(color)) {
      setSelectedColors(prev => [...prev, color]);
    }
  };

  const removeColor = (color: string) => {
    setSelectedColors(prev => prev.filter(c => c !== color));
    // Clean up variant data for removed color
    variantDataRef.current.forEach((_, key) => {
      if (key.startsWith(`${color}-`)) {
        variantDataRef.current.delete(key);
      }
    });
  };

  const addSize = (size: string) => {
    if (size && !selectedSizes.includes(size)) {
      setSelectedSizes(prev => [...prev, size]);
    }
  };

  const removeSize = (size: string) => {
    setSelectedSizes(prev => prev.filter(s => s !== size));
    // Clean up variant data for removed size
    variantDataRef.current.forEach((_, key) => {
      if (key.endsWith(`-${size}`)) {
        variantDataRef.current.delete(key);
      }
    });
  };

  const updateVariantField = (color: string, size: string, field: string, value: any) => {
    const key = `${color}-${size}`;
    const existing = variantDataRef.current.get(key) || {};
    variantDataRef.current.set(key, {
      ...existing,
      [field]: value
    });
    // Trigger re-render
    setUpdateTrigger(prev => prev + 1);
  };

  const getColorHex = (colorName: string) => {
    const color = PREDEFINED_COLORS.find(c => c.name === colorName);
    return color?.hex || '#CCCCCC';
  };

  const currentVariants = buildVariants();

  return (
    <div className="space-y-6">
      {/* Color Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Colors
        </label>
        <div className="space-y-3">
          {/* Predefined Colors */}
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_COLORS.map(color => (
              <button
                key={color.name}
                type="button"
                onClick={() => addColor(color.name)}
                disabled={selectedColors.includes(color.name)}
                className={`px-3 py-1 text-xs rounded-full border flex items-center gap-2 ${
                  selectedColors.includes(color.name)
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'hover:bg-gray-50'
                }`}
              >
                <span 
                  className="w-3 h-3 rounded-full border border-gray-300"
                  style={{ backgroundColor: color.hex }}
                />
                {color.name}
              </button>
            ))}
          </div>
          
          {/* Custom Color Input */}
          <div className="flex gap-2">
            <input
              type="text"
              id="custom-color-input"
              name="customColor"
              autoComplete="off"
              placeholder="Add custom color..."
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (customColor) {
                    addColor(customColor);
                    setCustomColor('');
                  }
                }
              }}
              className="flex-1 px-3 py-1 text-sm border rounded-lg"
            />
            <button
              type="button"
              onClick={() => {
                if (customColor) {
                  addColor(customColor);
                  setCustomColor('');
                }
              }}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add
            </button>
          </div>
          
          {/* Selected Colors */}
          {selectedColors.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
              {selectedColors.map(color => (
                <span
                  key={color}
                  className="px-3 py-1 text-sm bg-white rounded-full border flex items-center gap-2"
                >
                  <span 
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: getColorHex(color) }}
                  />
                  {color}
                  <button
                    type="button"
                    onClick={() => removeColor(color)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Size Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sizes
        </label>
        <div className="space-y-3">
          {/* Predefined Sizes */}
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_SIZES.map(size => (
              <button
                key={size}
                type="button"
                onClick={() => addSize(size)}
                disabled={selectedSizes.includes(size)}
                className={`px-3 py-1 text-xs rounded-lg border ${
                  selectedSizes.includes(size)
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'hover:bg-gray-50'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
          
          {/* Custom Size Input */}
          <div className="flex gap-2">
            <input
              type="text"
              id="custom-size-input"
              name="customSize"
              autoComplete="off"
              placeholder="Add custom size..."
              value={customSize}
              onChange={(e) => setCustomSize(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (customSize) {
                    addSize(customSize);
                    setCustomSize('');
                  }
                }
              }}
              className="flex-1 px-3 py-1 text-sm border rounded-lg"
            />
            <button
              type="button"
              onClick={() => {
                if (customSize) {
                  addSize(customSize);
                  setCustomSize('');
                }
              }}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add
            </button>
          </div>
          
          {/* Selected Sizes */}
          {selectedSizes.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
              {selectedSizes.map(size => (
                <span
                  key={size}
                  className="px-3 py-1 text-sm bg-white rounded-lg border flex items-center gap-2"
                >
                  {size}
                  <button
                    type="button"
                    onClick={() => removeSize(size)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pricing Mode */}
      {currentVariants.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pricing Mode
          </label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="pricingMode"
                value="same"
                checked={bulkPriceMode === 'same'}
                onChange={() => setBulkPriceMode('same')}
                className="text-blue-500"
              />
              <span className="text-sm">Same price for all variants</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="pricingMode"
                value="different"
                checked={bulkPriceMode === 'different'}
                onChange={() => setBulkPriceMode('different')}
                className="text-blue-500"
              />
              <span className="text-sm">Different prices per variant</span>
            </label>
          </div>
          
          {bulkPriceMode === 'same' && (
            <div className="flex gap-2 items-center">
              <label className="text-sm">Price for all variants:</label>
              <input
                type="number"
                id="bulk-price-input"
                name="bulkPrice"
                autoComplete="off"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(parseFloat(e.target.value) || 0)}
                className="w-32 px-3 py-1 text-sm border rounded-lg"
                min="0"
                step="0.01"
              />
            </div>
          )}
        </div>
      )}

      {/* Variants Table */}
      {currentVariants.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Variant Details ({currentVariants.length} variants)
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Variant</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Price</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Sale Price</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Stock</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Available</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentVariants.map((variant, index) => {
                  const variantKey = `${variant.color}-${variant.size}`;
                  return (
                    <tr key={variantKey}>
                      <td className="px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          {variant.color && (
                            <>
                              <span 
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: getColorHex(variant.color) }}
                              />
                              <span>{variant.color}</span>
                            </>
                          )}
                          {variant.color && variant.size && <span>/</span>}
                          {variant.size && <span>{variant.size}</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          id={`variant-sku-${variantKey}`}
                          name={`variant-sku-${variantKey}`}
                          autoComplete="off"
                          value={variant.sku}
                          onChange={(e) => updateVariantField(variant.color, variant.size, 'sku', e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          id={`variant-price-${variantKey}`}
                          name={`variant-price-${variantKey}`}
                          autoComplete="off"
                          value={variant.price}
                          onChange={(e) => updateVariantField(variant.color, variant.size, 'price', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-sm border rounded"
                          min="0"
                          step="0.01"
                          disabled={bulkPriceMode === 'same'}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          id={`variant-sale-price-${variantKey}`}
                          name={`variant-sale-price-${variantKey}`}
                          autoComplete="off"
                          value={variant.sale_price || ''}
                          onChange={(e) => updateVariantField(variant.color, variant.size, 'sale_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="w-20 px-2 py-1 text-sm border rounded"
                          min="0"
                          step="0.01"
                          placeholder="Optional"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          id={`variant-stock-${variantKey}`}
                          name={`variant-stock-${variantKey}`}
                          autoComplete="off"
                          value={variant.stock_quantity}
                          onChange={(e) => updateVariantField(variant.color, variant.size, 'stock_quantity', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-sm border rounded"
                          min="0"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          id={`variant-available-${variantKey}`}
                          name={`variant-available-${variantKey}`}
                          checked={variant.available}
                          onChange={(e) => updateVariantField(variant.color, variant.size, 'available', e.target.checked)}
                          className="rounded text-blue-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}