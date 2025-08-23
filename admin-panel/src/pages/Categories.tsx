import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  initializeCategories,
} from '../store/slices/categoriesSlice';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  ChevronRight,
  Folder,
  FolderOpen,
  RefreshCw,
  Database,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import CategoryForm from '../components/CategoryForm';

interface SubCategory {
  name: string;
  product_count: number;
}

interface Category {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  children: SubCategory[];
  order: number;
  created_at: string;
  updated_at: string;
}

export default function Categories() {
  const dispatch = useDispatch<AppDispatch>();
  const { categories, loading, error } = useSelector((state: RootState) => state.categories);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleInitializeCategories = async () => {
    if (window.confirm('This will initialize the default TRIPUND categories. Continue?')) {
      setIsInitializing(true);
      try {
        await dispatch(initializeCategories()).unwrap();
        await dispatch(fetchCategories()).unwrap();
        toast.success('Categories initialized successfully');
      } catch (error) {
        toast.error('Failed to initialize categories');
      } finally {
        setIsInitializing(false);
      }
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowAddModal(true);
  };

  const handleSubmitCategory = async (categoryData: any) => {
    try {
      if (editingCategory) {
        await dispatch(updateCategory({ 
          id: editingCategory.id, 
          updates: categoryData 
        })).unwrap();
        toast.success('Category updated successfully');
      } else {
        await dispatch(createCategory(categoryData)).unwrap();
        toast.success('Category created successfully');
      }
      setShowAddModal(false);
      setEditingCategory(null);
      dispatch(fetchCategories());
    } catch (error) {
      toast.error(`Failed to ${editingCategory ? 'update' : 'create'} category`);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await dispatch(deleteCategory(categoryId)).unwrap();
        toast.success('Category deleted successfully');
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  const handleRefresh = () => {
    dispatch(fetchCategories());
  };

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          category.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const CategoryRow = ({ category }: { category: Category }) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children.length > 0;

    return (
      <>
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
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
                    className="w-10 h-10 object-cover rounded-lg mr-3"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3"
                  style={{ display: category.image ? 'none' : 'flex' }}
                >
                  {isExpanded ? <FolderOpen size={20} className="text-gray-500" /> : <Folder size={20} className="text-gray-500" />}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{category.name}</div>
                  <div className="text-xs text-gray-500">SKU: {category.sku}</div>
                </div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {category.slug}
          </td>
          <td className="px-6 py-4 text-sm text-gray-900">
            {category.description || '-'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center text-sm text-gray-900">
              <Package size={16} className="mr-2 text-gray-400" />
              {category.children.reduce((sum, child) => sum + child.product_count, 0)} products
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {category.order}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleEditCategory(category)}
                className="text-blue-600 hover:text-blue-900"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => handleDeleteCategory(category.id)}
                className="text-red-600 hover:text-red-900"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </td>
        </tr>
        {isExpanded && hasChildren && (
          <tr>
            <td colSpan={6} className="px-6 pb-4">
              <div className="ml-12 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Subcategories</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {category.children.map((child, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="text-sm font-medium text-gray-900">{child.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {child.product_count} products
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </td>
          </tr>
        )}
      </>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Manage product categories dynamically from database</p>
        </div>
        <div className="flex items-center space-x-3">
          {categories.length === 0 && !loading && (
            <button
              onClick={handleInitializeCategories}
              disabled={isInitializing}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Database size={20} />
              <span>{isInitializing ? 'Initializing...' : 'Initialize Categories'}</span>
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 admin-button"
          >
            <Plus size={20} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="text-red-600 mr-2" size={20} />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search categories by name or SKU..."
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
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Products
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order
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
                  Loading categories from database...
                </td>
              </tr>
            ) : filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">
                  <div className="flex flex-col items-center">
                    <Folder className="text-gray-400 mb-3" size={48} />
                    <p className="text-gray-500 mb-2">No categories found</p>
                    {categories.length === 0 && (
                      <p className="text-sm text-gray-400">
                        Click "Initialize Categories" to load the default TRIPUND categories
                      </p>
                    )}
                  </div>
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
      {categories.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Total Categories</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{categories.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Total Subcategories</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {categories.reduce((sum, cat) => sum + cat.children.length, 0)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Total Products</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {categories.reduce((sum, cat) => 
                sum + cat.children.reduce((childSum, child) => childSum + child.product_count, 0), 0
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="text-blue-600 mt-0.5" size={20} />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-900">Dynamic Categories</h4>
            <p className="mt-1 text-sm text-blue-700">
              Categories are now loaded dynamically from the database. Changes made here will reflect
              across the entire platform. The categories follow the TRIPUND product hierarchy with SKU codes.
            </p>
          </div>
        </div>
      </div>

      {/* Category Form Modal */}
      <CategoryForm
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        onSubmit={handleSubmitCategory}
      />
    </div>
  );
}