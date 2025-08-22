import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchProducts, setFilters } from '../store/slices/productSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import ProductGrid from '../components/product/ProductGrid';
import { ChevronDown } from 'lucide-react';

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
];

export default function ProductsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { products, loading, filters } = useSelector((state: RootState) => state.products);
  const { categories } = useSelector((state: RootState) => state.categories);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    dispatch(setFilters({ category: category === 'All' ? '' : category }));
    dispatch(fetchProducts({ category: category === 'All' ? undefined : category }));
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    dispatch(setFilters({ sortBy: value }));
  };

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return (a.sale_price || a.price) - (b.sale_price || b.price);
      case 'price-high':
        return (b.sale_price || b.price) - (a.sale_price || a.price);
      case 'popular':
        return b.featured ? 1 : -1;
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">All Products</h1>
          <p className="text-gray-600">
            Discover our collection of handcrafted artisanal pieces
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-semibold mb-4">Categories</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => handleCategoryChange('All')}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      selectedCategory === 'All'
                        ? 'bg-primary-100 text-primary-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    All
                  </button>
                </li>
                {Array.isArray(categories) && categories.map((category) => (
                  <li key={category.slug}>
                    <button
                      onClick={() => handleCategoryChange(category.slug)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        selectedCategory === category.slug
                          ? 'bg-primary-100 text-primary-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <h3 className="font-semibold mb-4">Price Range</h3>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    className="w-full"
                    onChange={(e) =>
                      dispatch(setFilters({ maxPrice: parseInt(e.target.value) }))
                    }
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>₹0</span>
                    <span>₹{filters.maxPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
              <div className="flex justify-between items-center">
                <p className="text-gray-600">
                  Showing {sortedProducts.length} products
                </p>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={20}
                  />
                </div>
              </div>
            </div>

            <ProductGrid products={sortedProducts} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}