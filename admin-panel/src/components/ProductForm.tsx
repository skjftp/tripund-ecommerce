import { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUpload from './ImageUpload';
import ProductVariantManager from './ProductVariantManager';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchCategories } from '../store/slices/categoriesSlice';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any;
  onSubmit: (product: any) => void;
}

interface ProductAttribute {
  name: string;
  value: string;
}

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

interface FormData {
  sku: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  sale_price: number | string;
  manage_stock: boolean;
  stock_quantity: number;
  stock_status: string;
  featured: boolean;
  status: string;
  categories: string[];
  subcategories: string[];
  tags: string[];
  images: string[];
  attributes: ProductAttribute[];
  dimensions: { length: number; width: number; height: number; unit: string };
  weight: { value: number; unit: string };
  has_variants: boolean;
  variants: ProductVariant[];
  available_colors: string[];
  available_sizes: string[];
}

export default function ProductForm({ isOpen, onClose, product, onSubmit }: ProductFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { categories: dbCategories } = useSelector((state: RootState) => state.categories);
  
  const getInitialFormData = (): FormData => ({
    sku: '',
    name: '',
    slug: '',
    description: '',
    short_description: '',
    price: 0,
    sale_price: '',
    manage_stock: true,
    stock_quantity: 0,
    stock_status: 'in_stock',
    featured: false,
    status: 'active',
    categories: [],
    subcategories: [],
    tags: [],
    images: [],
    attributes: [
      { name: 'Material', value: '' },
      { name: 'Origin', value: 'India' },
      { name: 'Handmade', value: 'Yes' }
    ],
    dimensions: { length: 0, width: 0, height: 0, unit: 'cm' },
    weight: { value: 0, unit: 'g' },
    has_variants: false,
    variants: [],
    available_colors: [],
    available_sizes: []
  });

  const [formData, setFormData] = useState(getInitialFormData());
  const [tagInput, setTagInput] = useState('');
  const [availableSubcategories, setAvailableSubcategories] = useState<{[key: string]: string[]}>({});

  // Fetch categories when component mounts
  useEffect(() => {
    if (dbCategories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, dbCategories.length]);

  // Update available subcategories when categories change
  useEffect(() => {
    const subcatMap: {[key: string]: string[]} = {};
    dbCategories.forEach(cat => {
      if (cat.children && cat.children.length > 0) {
        subcatMap[cat.slug] = cat.children.map(child => child.name);
      }
    });
    setAvailableSubcategories(subcatMap);
  }, [dbCategories]);

  // Update form data when product changes or modal opens
  useEffect(() => {
    if (isOpen && product) {
      setFormData({
        sku: product.sku || '',
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        short_description: product.short_description || '',
        price: product.price || 0,
        sale_price: product.sale_price || '',
        manage_stock: product.manage_stock ?? true,
        stock_quantity: product.stock_quantity || 0,
        stock_status: product.stock_status || 'in_stock',
        featured: product.featured || false,
        status: product.status || 'active',
        categories: product.categories || [],
        subcategories: product.subcategories || [],
        tags: product.tags || [],
        images: product.images || [],
        attributes: product.attributes?.length > 0 ? product.attributes : [
          { name: 'Material', value: '' },
          { name: 'Origin', value: 'India' },
          { name: 'Handmade', value: 'Yes' }
        ],
        dimensions: product.dimensions || { length: 0, width: 0, height: 0, unit: 'cm' },
        weight: product.weight || { value: 0, unit: 'g' },
        has_variants: product.has_variants || false,
        variants: product.variants || [],
        available_colors: product.available_colors || [],
        available_sizes: product.available_sizes || []
      });
    } else if (isOpen && !product) {
      setFormData(getInitialFormData());
    }
  }, [isOpen, product]);

  // Use dynamic categories from database instead of hardcoded list
  const categories = dbCategories.map(category => ({
    value: category.slug,
    label: category.name
  }));
  
  // Sort categories by order if available, otherwise alphabetically
  const sortedCategories = categories.sort((a, b) => {
    const categoryA = dbCategories.find(c => c.slug === a.value);
    const categoryB = dbCategories.find(c => c.slug === b.value);
    const orderA = categoryA?.order || 999;
    const orderB = categoryB?.order || 999;
    return orderA - orderB;
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate slug from name
    if (field === 'name') {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleAttributeChange = (index: number, field: 'name' | 'value', value: string) => {
    const newAttributes = [...formData.attributes];
    newAttributes[index] = { ...newAttributes[index], [field]: value };
    setFormData(prev => ({ ...prev, attributes: newAttributes }));
  };

  const addAttribute = () => {
    setFormData(prev => ({
      ...prev,
      attributes: [...prev.attributes, { name: '', value: '' }]
    }));
  };

  const removeAttribute = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_: ProductAttribute, i: number) => i !== index)
    }));
  };

  const handleImagesChange = (images: string[]) => {
    setFormData(prev => ({ ...prev, images }));
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((tag: string) => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.sku?.trim()) {
      toast.error('SKU is required');
      return;
    }

    if (!formData.name?.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (!formData.price || formData.price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    if (formData.sale_price && Number(formData.sale_price) >= formData.price) {
      toast.error('Sale price must be less than regular price');
      return;
    }

    if (formData.categories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }

    if (formData.stock_quantity < 0) {
      toast.error('Stock quantity cannot be negative');
      return;
    }

    if (formData.images.length === 0) {
      toast.error('Please upload at least one product image');
      return;
    }

    // Format data for API
    const submitData = {
      ...formData,
      sku: formData.sku.trim(),
      name: formData.name.trim(),
      slug: formData.slug?.trim() || formData.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
      price: parseFloat(formData.price.toString()),
      sale_price: formData.sale_price ? parseFloat(formData.sale_price.toString()) : null,
      stock_quantity: parseInt(formData.stock_quantity.toString()) || 0,
      images: formData.images,
      subcategories: formData.subcategories,
      dimensions: {
        ...formData.dimensions,
        length: parseFloat(formData.dimensions.length.toString()) || 0,
        width: parseFloat(formData.dimensions.width.toString()) || 0,
        height: parseFloat(formData.dimensions.height.toString()) || 0
      },
      weight: {
        ...formData.weight,
        value: parseFloat(formData.weight.value.toString()) || 0
      },
      attributes: formData.attributes.filter((attr: ProductAttribute) => attr.name.trim() && attr.value.trim()),
      tags: formData.tags.filter((tag: string) => tag.trim())
    };

    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU *
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="TLSSKU001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Beautiful Handcrafted Product"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug (URL-friendly name)
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => handleInputChange('slug', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="beautiful-handcrafted-product"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Detailed product description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Short Description
            </label>
            <textarea
              value={formData.short_description}
              onChange={(e) => handleInputChange('short_description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={2}
              placeholder="Brief description for product cards..."
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Regular Price (₹) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sale Price (₹)
              </label>
              <input
                type="number"
                value={formData.sale_price}
                onChange={(e) => handleInputChange('sale_price', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="0"
                step="0.01"
                placeholder="Optional sale price"
              />
            </div>
          </div>

          {/* Inventory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Status
              </label>
              <select
                value={formData.stock_status}
                onChange={(e) => handleInputChange('stock_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="on_backorder">On Backorder</option>
              </select>
            </div>
          </div>

          {/* Product Variants */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Product Variants</h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.has_variants}
                  onChange={(e) => handleInputChange('has_variants', e.target.checked)}
                  className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm">Enable variants (colors/sizes)</span>
              </label>
            </div>
            
            {formData.has_variants && (
              <ProductVariantManager
                basePrice={formData.price}
                baseSKU={formData.sku}
                variants={formData.variants}
                onChange={(variants, colors, sizes) => {
                  setFormData(prev => ({
                    ...prev,
                    variants,
                    available_colors: colors,
                    available_sizes: sizes
                  }));
                }}
              />
            )}
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {sortedCategories.map(category => (
                <label key={category.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(category.value)}
                    onChange={(e) => {
                      const newCategories = e.target.checked
                        ? [...formData.categories, category.value]
                        : formData.categories.filter((c: string) => c !== category.value);
                      handleInputChange('categories', newCategories);
                      // Clear subcategories if category is unchecked
                      if (!e.target.checked && availableSubcategories[category.value]) {
                        const removedSubcats = availableSubcategories[category.value];
                        handleInputChange('subcategories', 
                          formData.subcategories.filter((s: string) => !removedSubcats.includes(s))
                        );
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">{category.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Subcategories */}
          {formData.categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcategories
              </label>
              {formData.categories.map(category => {
                const subcats = availableSubcategories[category];
                if (!subcats || subcats.length === 0) return null;
                
                return (
                  <div key={category} className="mb-3">
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      {sortedCategories.find(c => c.value === category)?.label || category}:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pl-4">
                      {subcats.map(subcat => (
                        <label key={subcat} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.subcategories.includes(subcat)}
                            onChange={(e) => {
                              const newSubcategories = e.target.checked
                                ? [...formData.subcategories, subcat]
                                : formData.subcategories.filter((s: string) => s !== subcat);
                              handleInputChange('subcategories', newSubcategories);
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">{subcat}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Featured */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="featured"
              checked={formData.featured}
              onChange={(e) => handleInputChange('featured', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="featured" className="text-sm font-medium text-gray-700">
              Featured Product
            </label>
          </div>

          {/* Images */}
          <ImageUpload
            images={formData.images}
            onImagesChange={handleImagesChange}
            maxImages={10}
            label="Product Images"
          />

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-gray-400 hover:text-gray-600"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Add a tag..."
              />
              <button
                type="button"
                onClick={handleTagAdd}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Add
              </button>
            </div>
          </div>

          {/* Attributes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Attributes
            </label>
            {formData.attributes.map((attr: ProductAttribute, index: number) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                <input
                  type="text"
                  value={attr.name}
                  onChange={(e) => handleAttributeChange(index, 'name', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Attribute name"
                />
                <input
                  type="text"
                  value={attr.value}
                  onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Attribute value"
                />
                <button
                  type="button"
                  onClick={() => removeAttribute(index)}
                  className="text-red-600 hover:text-red-700 px-3 py-2"
                >
                  <Minus size={18} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addAttribute}
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
            >
              <Plus size={18} />
              <span>Add Attribute</span>
            </button>
          </div>

          {/* Dimensions & Weight */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dimensions (L × W × H)
              </label>
              <div className="grid grid-cols-4 gap-2">
                <input
                  type="number"
                  value={formData.dimensions.length}
                  onChange={(e) => handleInputChange('dimensions', { ...formData.dimensions, length: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Length"
                  min="0"
                  step="0.1"
                />
                <input
                  type="number"
                  value={formData.dimensions.width}
                  onChange={(e) => handleInputChange('dimensions', { ...formData.dimensions, width: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Width"
                  min="0"
                  step="0.1"
                />
                <input
                  type="number"
                  value={formData.dimensions.height}
                  onChange={(e) => handleInputChange('dimensions', { ...formData.dimensions, height: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Height"
                  min="0"
                  step="0.1"
                />
                <select
                  value={formData.dimensions.unit}
                  onChange={(e) => handleInputChange('dimensions', { ...formData.dimensions, unit: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="cm">cm</option>
                  <option value="mm">mm</option>
                  <option value="in">in</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={formData.weight.value}
                  onChange={(e) => handleInputChange('weight', { ...formData.weight, value: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Weight"
                  min="0"
                  step="0.1"
                />
                <select
                  value={formData.weight.unit}
                  onChange={(e) => handleInputChange('weight', { ...formData.weight, unit: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="oz">oz</option>
                  <option value="lb">lb</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              {product ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}