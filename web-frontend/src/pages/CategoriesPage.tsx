import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchCategories } from '../store/slices/categoriesSlice';
import { ChevronDown, ChevronUp, Package } from 'lucide-react';

export default function CategoriesPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { categories, loading, error } = useSelector((state: RootState) => state.categories);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleCategoryClick = (slug: string) => {
    navigate(`/products?category=${slug}`);
  };

  const handleSubcategoryClick = (categorySlug: string, subcategoryName: string) => {
    navigate(`/products?category=${categorySlug}&subcategory=${encodeURIComponent(subcategoryName)}`);
  };

  const toggleExpanded = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error loading categories</p>
          <button 
            onClick={() => dispatch(fetchCategories())}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Shop by Category</h1>
        <p className="text-lg text-gray-600">
          Explore our curated collection of Indian handicrafts
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(categories) && categories.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          
          return (
            <div key={category.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div
                onClick={() => handleCategoryClick(category.slug)}
                className="cursor-pointer group relative overflow-hidden"
              >
                <div className="aspect-w-16 aspect-h-12">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallbackDiv = target.nextElementSibling as HTMLElement;
                        if (fallbackDiv) {
                          fallbackDiv.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center"
                    style={{ display: category.image ? 'none' : 'flex' }}
                  >
                    <span className="text-4xl font-bold text-primary-600 opacity-50">
                      {category.name.charAt(0)}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                  
                  {category.children && category.children.length > 0 && (
                    <button
                      onClick={(e) => toggleExpanded(category.id, e)}
                      className="flex items-center justify-between w-full text-left py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        View {category.children.length} Subcategories
                      </span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  )}
                </div>
              </div>
              
              {/* Expandable Subcategories */}
              {category.children && category.children.length > 0 && (
                <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96' : 'max-h-0'}`}>
                  <div className="border-t px-4 py-3 bg-gray-50">
                    <div className="grid grid-cols-1 gap-2">
                      {category.children.map((subcat, index) => (
                        <button
                          key={index}
                          onClick={() => handleSubcategoryClick(category.slug, subcat.name)}
                          className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-primary-50 transition-colors group"
                        >
                          <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600">
                            {subcat.name}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {subcat.product_count || 0} items
                            </span>
                            <Package size={14} className="text-gray-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}