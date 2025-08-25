import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import ImageUpload from './ImageUpload';

interface SubCategory {
  name: string;
  product_count?: number;
}

interface Category {
  id?: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  landscape_image?: string;
  children?: SubCategory[];
  order?: number;
  created_at?: string;
  updated_at?: string;
}

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
  onSubmit: (data: Category) => void;
}

export default function CategoryForm({
  isOpen,
  onClose,
  category,
  onSubmit,
}: CategoryFormProps) {
  const [formData, setFormData] = useState<Category>({
    sku: '',
    name: '',
    slug: '',
    description: '',
    image: '',
    landscape_image: '',
    children: [],
    order: 0,
  });

  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [newSubcategory, setNewSubcategory] = useState('');
  const [categoryImages, setCategoryImages] = useState<string[]>([]);
  const [landscapeImages, setLandscapeImages] = useState<string[]>([]);

  useEffect(() => {
    if (category) {
      setFormData(category);
      setSubcategories(category.children?.map(c => c.name) || []);
      setCategoryImages(category.image ? [category.image] : []);
      setLandscapeImages(category.landscape_image ? [category.landscape_image] : []);
    } else {
      setFormData({
        sku: '',
        name: '',
        slug: '',
        description: '',
        image: '',
        landscape_image: '',
        children: [],
        order: 0,
      });
      setSubcategories([]);
      setCategoryImages([]);
      setLandscapeImages([]);
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const categoryData = {
      ...formData,
      image: categoryImages[0] || '',
      landscape_image: landscapeImages[0] || '',
      children: subcategories.map(name => ({ name, product_count: 0 })),
    };
    onSubmit(categoryData);
  };

  const handleImagesChange = (images: string[]) => {
    setCategoryImages(images);
    setFormData({ ...formData, image: images[0] || '' });
  };

  const handleLandscapeImagesChange = (images: string[]) => {
    setLandscapeImages(images);
    setFormData({ ...formData, landscape_image: images[0] || '' });
  };

  const handleAddSubcategory = () => {
    if (newSubcategory.trim()) {
      setSubcategories([...subcategories, newSubcategory.trim()]);
      setNewSubcategory('');
    }
  };

  const handleRemoveSubcategory = (index: number) => {
    setSubcategories(subcategories.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {category ? 'Edit Category' : 'Add New Category'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value;
                const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                setFormData({ ...formData, name, slug });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              required
            />
          </div>

          <div className="mb-4">
            <ImageUpload
              images={categoryImages}
              onImagesChange={handleImagesChange}
              maxImages={1}
              label="Category Image (Square - for tiles)"
            />
          </div>

          <div className="mb-4">
            <ImageUpload
              images={landscapeImages}
              onImagesChange={handleLandscapeImagesChange}
              maxImages={1}
              label="Landscape Image (Wide - for carousel & banners)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Used in hero carousel and category page headers on desktop. If not provided, square image will be used.
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subcategories
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSubcategory}
                onChange={(e) => setNewSubcategory(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubcategory();
                  }
                }}
                placeholder="Enter subcategory name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={handleAddSubcategory}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {subcategories.map((subcat, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <span>{subcat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubcategory(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              {category ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}