import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchProducts, setFilters } from '../store/slices/productSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import ProductGrid from '../components/product/ProductGrid';
import { ChevronDown, Filter, X } from 'lucide-react';

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
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState(50000);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory(''); // Reset subcategory when category changes
    setExpandedCategory(expandedCategory === category ? null : category);
    dispatch(setFilters({ category: category === 'All' ? '' : category }));
    dispatch(fetchProducts({ category: category === 'All' ? undefined : category }));
  };

  const handleSubcategoryChange = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
    dispatch(setFilters({ subcategory }));
    dispatch(fetchProducts({ category: selectedCategory, subcategory }));
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
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center justify-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md"
          >
            <Filter size={20} />
            <span>Filters</span>
          </button>

          {/* Sidebar - Collapsible on mobile */}
          <aside className={`${showFilters ? 'block' : 'hidden'} lg:block lg:w-64`}>
            <div className="bg-white p-6 rounded-lg shadow-md relative">
              {/* Close button for mobile */}
              <button
                onClick={() => setShowFilters(false)}
                className="lg:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
              <h3 className="font-semibold mb-4">Categories</h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedSubcategory('');
                      setExpandedCategory(null);
                      dispatch(setFilters({ category: '', subcategory: '' }));
                      dispatch(fetchProducts());
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      selectedCategory === 'All'
                        ? 'bg-primary-100 text-primary-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    All Products
                  </button>
                </li>
                
                {Array.isArray(categories) && categories.map((category) => (
                  <li key={category.slug}>
                    {/* Main Category */}
                    <button
                      onClick={() => handleCategoryChange(category.slug)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                        selectedCategory === category.slug
                          ? 'bg-primary-100 text-primary-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{category.name}</span>
                      {category.children && category.children.length > 0 && (
                        <ChevronDown 
                          size={16} 
                          className={`transform transition-transform text-gray-400 ${
                            expandedCategory === category.slug ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </button>
                    
                    {/* Subcategories */}
                    {category.children && category.children.length > 0 && expandedCategory === category.slug && (
                      <ul className="mt-1 ml-4 space-y-1 border-l-2 border-primary-200 pl-2">
                        {category.children.map((subcat, index) => (
                          <li key={index}>
                            <button
                              onClick={() => handleSubcategoryChange(subcat.name)}
                              className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                                selectedSubcategory === subcat.name
                                  ? 'bg-primary-50 text-primary-600 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                              }`}
                            >
                              {subcat.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
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
                    value={priceRange}
                    className="w-full"
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setPriceRange(value);
                      dispatch(setFilters({ maxPrice: value }));
                    }}
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>₹0</span>
                    <span>₹{priceRange.toLocaleString()}</span>
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