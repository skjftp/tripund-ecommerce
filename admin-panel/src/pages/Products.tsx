import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Package,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { productAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import ProductForm from '../components/ProductForm';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  short_description?: string;
  price: number;
  sale_price?: number;
  stock_quantity: number;
  stock_status: string;
  status: string;
  featured: boolean;
  images: string[];
  categories: string[];
  attributes: { name: string; value: string }[];
  created_at: string;
  updated_at: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://tripund-backend-rafqv5m7ga-el.a.run.app/api/v1';

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = async (category?: string, status?: string) => {
    try {
      setLoading(true);
      // Build query parameters
      let queryParams = 'limit=50';
      
      // Add status filter (default to 'all' for admin)
      if (status && status !== 'all') {
        queryParams += `&status=${status}`;
      } else if (!status || status === 'all') {
        queryParams += '&status=all';
      }
      
      // Add category filter
      if (category && category !== 'all') {
        queryParams += `&category=${category}`;
      }
      
      const response = await api.get(`/products?${queryParams}`);
      const fetchedProducts = response.data.products || [];
      setProducts(fetchedProducts);
      console.log(`Loaded ${fetchedProducts.length} products with filters - Category: ${category || 'all'}, Status: ${status || 'all'}`);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products when component mounts
  useEffect(() => {
    fetchProducts(selectedCategory, selectedStatus);
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts(selectedCategory, selectedStatus);
  }, [selectedCategory, selectedStatus]);

  // Client-side filtering only for search (category and status are server-side)
  const filteredProducts = products.filter((product) => {
    if (!searchQuery) return true;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productAPI.delete(id);
        setProducts(products.filter((p) => p.id !== id));
        toast.success('Product deleted successfully');
      } catch (error: any) {
        console.error('Error deleting product:', error);
        if (error.response?.status === 401) {
          // Will be handled by interceptor
          return;
        }
        toast.error('Failed to delete product');
      }
    }
  };

  const handleView = (product: Product) => {
    // Open product in new tab on the main website
    window.open(`https://tripundlifestyle.netlify.app/products/${product.id}`, '_blank');
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
  };

  const handleSubmitProduct = async (productData: any) => {
    try {

      if (editingProduct) {
        // Update existing product
        const response = await productAPI.update(editingProduct.id, productData);
        setProducts(products.map(p => p.id === editingProduct.id ? { ...productData, id: editingProduct.id } : p));
        toast.success('Product updated successfully');
      } else {
        // Create new product
        const response = await productAPI.create(productData);
        const newProduct = response.data;
        setProducts([...products, newProduct]);
        toast.success('Product created successfully');
      }
      handleCloseModal();
      fetchProducts(selectedCategory, selectedStatus); // Refresh the list to get the latest data
    } catch (error: any) {
      console.error('Error saving product:', error);
      if (error.response?.status === 401) {
        // Will be handled by interceptor
        return;
      }
      toast.error(`Failed to ${editingProduct ? 'update' : 'create'} product`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInventoryStatus = (quantity: number, status: string) => {
    if (status === 'out_of_stock' || quantity === 0) return { text: 'Out of Stock', color: 'text-red-600' };
    if (quantity < 10) return { text: 'Low Stock', color: 'text-yellow-600' };
    return { text: 'In Stock', color: 'text-green-600' };
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => fetchProducts(selectedCategory, selectedStatus)}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Upload size={20} />
            <span>Import</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download size={20} />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 admin-button"
          >
            <Plus size={20} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Categories</option>
            <option value="divine-collections">Divine Collections</option>
            <option value="wall-decor">Wall Décor</option>
            <option value="festivals">Festivals</option>
            <option value="lighting">Lighting</option>
            <option value="home-accent">Home Accent</option>
            <option value="storage-bags">Storage & Bags</option>
            <option value="gifting">Gifting</option>
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          
          <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter size={20} />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Inventory
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
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
                  Loading products...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const inventoryStatus = getInventoryStatus(product.stock_quantity, product.stock_status);
                const displayPrice = product.sale_price || product.price;
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img
                            className="h-10 w-10 rounded-lg object-cover"
                            src={product.images[0] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop'}
                            alt={product.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop';
                            }}
                          />
                        </div>
                        <div className="ml-4 max-w-xs">
                          <div className="text-sm font-medium text-gray-900 truncate" title={product.name}>
                            {product.name.length > 50 ? product.name.substring(0, 50) + '...' : product.name}
                          </div>
                          <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.categories.map(cat => cat.replace('-', ' ')).join(', ')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.attributes.find(attr => attr.name === 'Material')?.value || 'Handmade'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{displayPrice.toLocaleString()}
                      </div>
                      {product.sale_price && (
                        <div className="text-sm text-gray-500 line-through">
                          ₹{product.price.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package size={16} className={inventoryStatus.color} />
                        <span className={`ml-2 text-sm font-medium ${inventoryStatus.color}`}>
                          {product.stock_quantity} units
                        </span>
                      </div>
                      <div className={`text-xs ${inventoryStatus.color}`}>
                        {inventoryStatus.text}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                            product.status
                          )}`}
                        >
                          {product.status}
                        </span>
                        {product.featured && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => handleView(product)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Showing 1 to {filteredProducts.length} of {products.length} results
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50">
            Previous
          </button>
          <button className="px-3 py-1 bg-primary-600 text-white rounded-md">1</button>
          <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50">2</button>
          <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50">3</button>
          <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>

      {/* Product Form Modal */}
      <ProductForm
        isOpen={showAddModal}
        onClose={handleCloseModal}
        product={editingProduct}
        onSubmit={handleSubmitProduct}
      />
    </div>
  );
}