import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Image,
  Package,
  ChevronRight,
  Folder,
  FolderOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: string;
  children?: Category[];
  product_count: number;
  is_featured: boolean;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    const mockCategories: Category[] = [
      {
        id: '1',
        name: 'Textiles',
        slug: 'textiles',
        description: 'Traditional and modern textile products',
        image: '/api/placeholder/200/200',
        product_count: 156,
        is_featured: true,
        status: 'active',
        created_at: '2023-01-15',
        updated_at: '2024-01-20',
        children: [
          {
            id: '11',
            name: 'Sarees',
            slug: 'sarees',
            parent_id: '1',
            product_count: 45,
            is_featured: false,
            status: 'active',
            created_at: '2023-01-15',
            updated_at: '2024-01-20',
          },
          {
            id: '12',
            name: 'Scarves',
            slug: 'scarves',
            parent_id: '1',
            product_count: 32,
            is_featured: false,
            status: 'active',
            created_at: '2023-01-15',
            updated_at: '2024-01-20',
          },
          {
            id: '13',
            name: 'Bedding',
            slug: 'bedding',
            parent_id: '1',
            product_count: 28,
            is_featured: false,
            status: 'active',
            created_at: '2023-01-15',
            updated_at: '2024-01-20',
          },
        ],
      },
      {
        id: '2',
        name: 'Pottery',
        slug: 'pottery',
        description: 'Handcrafted ceramic and clay products',
        image: '/api/placeholder/200/200',
        product_count: 89,
        is_featured: true,
        status: 'active',
        created_at: '2023-01-15',
        updated_at: '2024-01-20',
        children: [
          {
            id: '21',
            name: 'Dinnerware',
            slug: 'dinnerware',
            parent_id: '2',
            product_count: 34,
            is_featured: false,
            status: 'active',
            created_at: '2023-01-15',
            updated_at: '2024-01-20',
          },
          {
            id: '22',
            name: 'Decorative',
            slug: 'decorative',
            parent_id: '2',
            product_count: 55,
            is_featured: false,
            status: 'active',
            created_at: '2023-01-15',
            updated_at: '2024-01-20',
          },
        ],
      },
      {
        id: '3',
        name: 'Jewelry',
        slug: 'jewelry',
        description: 'Traditional and contemporary jewelry',
        image: '/api/placeholder/200/200',
        product_count: 120,
        is_featured: true,
        status: 'active',
        created_at: '2023-01-15',
        updated_at: '2024-01-20',
      },
      {
        id: '4',
        name: 'Woodwork',
        slug: 'woodwork',
        description: 'Hand-carved wooden artifacts',
        image: '/api/placeholder/200/200',
        product_count: 67,
        is_featured: false,
        status: 'active',
        created_at: '2023-01-15',
        updated_at: '2024-01-20',
      },
      {
        id: '5',
        name: 'Metalwork',
        slug: 'metalwork',
        description: 'Brass, copper, and silver artifacts',
        image: '/api/placeholder/200/200',
        product_count: 45,
        is_featured: false,
        status: 'active',
        created_at: '2023-01-15',
        updated_at: '2024-01-20',
      },
    ];
    setCategories(mockCategories);
    setLoading(false);
  }, []);

  const filteredCategories = categories.filter((category) => {
    const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        setCategories(categories.filter(c => c.id !== id));
        toast.success('Category deleted successfully');
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  const CategoryRow = ({ category, level = 0 }: { category: Category; level?: number }) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children.length > 0;

    return (
      <>
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(category.id)}
                  className="mr-2 text-gray-400 hover:text-gray-600"
                >
                  <ChevronRight
                    size={16}
                    className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </button>
              )}
              <div className="flex items-center">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-10 h-10 rounded-lg object-cover mr-3"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                    {isExpanded ? <FolderOpen size={20} className="text-gray-500" /> : <Folder size={20} className="text-gray-500" />}
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium text-gray-900">{category.name}</div>
                  <div className="text-sm text-gray-500">/{category.slug}</div>
                </div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {category.description || '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center text-sm text-gray-900">
              <Package size={16} className="mr-2 text-gray-400" />
              {category.product_count} products
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(category.status)}`}>
              {category.status}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            {category.is_featured && (
              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                Featured
              </span>
            )}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setEditingCategory(category)}
                className="text-blue-600 hover:text-blue-900"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => handleDelete(category.id)}
                className="text-red-600 hover:text-red-900"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </td>
        </tr>
        {isExpanded && hasChildren && category.children?.map((child) => (
          <CategoryRow key={child.id} category={child} level={level + 1} />
        ))}
      </>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Manage product categories and hierarchy</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 admin-button"
        >
          <Plus size={20} />
          <span>Add Category</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Products
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Featured
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Loading categories...
                </td>
              </tr>
            ) : filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No categories found
                </td>
              </tr>
            ) : (
              filteredCategories.map((category) => (
                <CategoryRow key={category.id} category={category} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">
            {categories.length}
          </div>
          <div className="text-sm text-gray-600">Total Categories</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">
            {categories.filter(c => c.is_featured).length}
          </div>
          <div className="text-sm text-gray-600">Featured Categories</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">
            {categories.reduce((sum, cat) => sum + cat.product_count, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Products</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">
            {categories.filter(c => c.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Active Categories</div>
        </div>
      </div>
    </div>
  );
}