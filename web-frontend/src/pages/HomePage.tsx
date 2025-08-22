import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, Truck, Shield, Award, RefreshCw, Search, Filter, ChevronRight } from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { fetchProducts } from '../store/slices/productSlice';
import ProductGrid from '../components/product/ProductGrid';

export default function HomePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { featuredProducts, loading } = useSelector((state: RootState) => state.products);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    dispatch(fetchProducts({ limit: 20 }));
  }, [dispatch]);

  const categories = [
    { id: 'all', name: 'All Products', icon: '🎨' },
    { id: 'divine-collections', name: 'Divine Collections', icon: '🕉️' },
    { id: 'wall-decor', name: 'Wall Décor', icon: '🖼️' },
    { id: 'festivals', name: 'Festivals', icon: '🎊' },
    { id: 'lighting', name: 'Lighting', icon: '💡' },
    { id: 'home-accent', name: 'Home Accent', icon: '🏠' },
    { id: 'storage-bags', name: 'Storage & Bags', icon: '👜' },
    { id: 'gifting', name: 'Gifting', icon: '🎁' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal Hero with Search */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Artistic Home Décor
              </h1>
              <p className="text-gray-600 mt-1">Handcrafted luxury for modern homes</p>
            </div>
            
            {/* Search Bar */}
            <div className="w-full md:w-96 relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills */}
      <section className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{category.icon}</span>
                <span className="font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Products Section */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Products Grid - Full Width */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedCategory === 'all' ? 'All Products' : categories.find(c => c.id === selectedCategory)?.name}
              </h2>
              <button className="flex items-center gap-2 text-gray-600 hover:text-primary-600">
                <Filter size={20} />
                <span>Filters</span>
              </button>
            </div>
            
            <ProductGrid 
              products={featuredProducts.filter(product => 
                selectedCategory === 'all' || product.categories?.includes(selectedCategory)
              )} 
              loading={loading} 
            />
            
            {/* Load More Button */}
            <div className="text-center mt-8">
              <Link
                to="/products"
                className="inline-flex items-center bg-gray-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                View All Products
                <ChevronRight className="ml-2" size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Minimalist Features Bar */}
      <section className="bg-white border-t border-b py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <Truck className="text-gray-400" size={24} />
              <div>
                <p className="font-medium text-sm">Free Shipping</p>
                <p className="text-xs text-gray-500">Orders over ₹5,000</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="text-gray-400" size={24} />
              <div>
                <p className="font-medium text-sm">Secure Payment</p>
                <p className="text-xs text-gray-500">100% Protected</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Award className="text-gray-400" size={24} />
              <div>
                <p className="font-medium text-sm">Authentic</p>
                <p className="text-xs text-gray-500">Handcrafted Quality</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RefreshCw className="text-gray-400" size={24} />
              <div>
                <p className="font-medium text-sm">Easy Returns</p>
                <p className="text-xs text-gray-500">30 Days Policy</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}