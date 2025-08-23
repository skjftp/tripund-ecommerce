import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Search } from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { fetchProducts } from '../store/slices/productSlice';
import ProductCard from '../components/product/ProductCard';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [localQuery, setLocalQuery] = useState(query);
  
  const { products, loading } = useSelector((state: RootState) => state.products);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      setQuery(localQuery.trim());
      navigate(`/search?q=${encodeURIComponent(localQuery.trim())}`);
    }
  };

  const filteredProducts = products.filter(product => 
    product.name?.toLowerCase().includes(query.toLowerCase()) ||
    product.description?.toLowerCase().includes(query.toLowerCase()) ||
    product.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-12">
        <h1 className="text-3xl font-bold text-center mb-6">Search Products</h1>
        <form onSubmit={handleSearch} className="flex">
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Search for products, categories, or keywords..."
            className="flex-1 px-4 py-3 text-lg border border-gray-300 rounded-l-lg focus:outline-none focus:border-primary-500"
            autoFocus
          />
          <button
            type="submit"
            className="bg-primary-600 text-white px-6 py-3 rounded-r-lg hover:bg-primary-700 transition-colors"
          >
            <Search size={24} />
          </button>
        </form>
      </div>

      {/* Search Results */}
      {query && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              {loading ? 'Searching...' : `${filteredProducts.length} results for "${query}"`}
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-4">
                No products found for "{query}"
              </p>
              <p className="text-gray-500">
                Try searching with different keywords or browse our categories
              </p>
              <button
                onClick={() => navigate('/categories')}
                className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Browse Categories
              </button>
            </div>
          )}
        </div>
      )}

      {/* Popular Searches */}
      {!query && (
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-6">Popular Searches</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {['Wall Decor', 'Divine', 'Brass', 'Wooden', 'Handmade', 'Festival', 'Gifts'].map((term) => (
              <button
                key={term}
                onClick={() => {
                  setLocalQuery(term);
                  setQuery(term);
                  navigate(`/search?q=${encodeURIComponent(term)}`);
                }}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}