import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchCategories } from '../store/slices/categoriesSlice';

export default function CategoriesPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { categories, loading, error } = useSelector((state: RootState) => state.categories);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleCategoryClick = (slug: string) => {
    navigate(`/products?category=${slug}`);
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            onClick={() => handleCategoryClick(category.slug)}
            className="cursor-pointer group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <div className="aspect-w-16 aspect-h-12">
              {category.image ? (
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(category.name);
                  }}
                />
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  <span className="text-4xl font-bold text-primary-600 opacity-50">
                    {category.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4">
              <h3 className="text-xl font-bold text-white mb-1">{category.name}</h3>
              <p className="text-sm text-gray-200 mb-2">{category.description}</p>
              {category.children && category.children.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {category.children.slice(0, 3).map((subcat, index) => (
                    <span key={index} className="text-xs bg-white/20 text-white px-2 py-1 rounded">
                      {subcat.name}
                    </span>
                  ))}
                  {category.children.length > 3 && (
                    <span className="text-xs bg-white/20 text-white px-2 py-1 rounded">
                      +{category.children.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}