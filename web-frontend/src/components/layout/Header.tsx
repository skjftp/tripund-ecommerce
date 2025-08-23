import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User, Menu, X, Heart, ChevronDown } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import tripundLogo from '../../assets/tripund-logo.png';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const { itemCount } = useSelector((state: RootState) => state.cart);
  const { categories } = useSelector((state: RootState) => state.categories);
  const wishlistCount = useSelector((state: RootState) => 
    Array.isArray(state.wishlist.items) ? state.wishlist.items.length : 0
  );

  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories.length]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <div className="relative w-6 h-5 flex flex-col justify-between">
                <span className={`block h-0.5 w-full bg-gray-700 transform transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`block h-0.5 w-full bg-gray-700 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`block h-0.5 w-full bg-gray-700 transform transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </div>
            </button>
            
            <Link to="/" className="ml-4 lg:ml-0 lg:mr-8">
              <img 
                src={tripundLogo} 
                alt="TRIPUND LIFESTYLE" 
                className="h-8 w-auto max-w-[140px] object-contain"
              />
            </Link>
          </div>

          <nav className="hidden lg:flex items-center space-x-3 xl:space-x-4">
            {categories.map((category) => (
              <div key={category.id} className="relative group">
                <Link
                  to={`/products?category=${category.slug}`}
                  className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 py-2 text-sm whitespace-nowrap"
                >
                  <span>{category.name}</span>
                  {category.children && category.children.length > 0 && (
                    <ChevronDown size={12} className="group-hover:rotate-180 transition-transform" />
                  )}
                </Link>
                
                {/* Subcategory Dropdown */}
                {category.children && category.children.length > 0 && (
                  <div className="absolute left-0 mt-0 w-56 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2">
                      {category.children.map((subcat, index) => (
                        <Link
                          key={index}
                          to={`/products?category=${category.slug}&subcategory=${encodeURIComponent(subcat.name)}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600"
                        >
                          {subcat.name}
                          {subcat.product_count !== undefined && (
                            <span className="text-xs text-gray-500 ml-2">({subcat.product_count})</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <Link to="/about" className="text-gray-700 hover:text-primary-600 text-sm">
              About
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/search')}
              className="text-gray-700 hover:text-primary-600"
              aria-label="Search"
            >
              <Search size={24} />
            </button>

            <Link to="/wishlist" className="relative">
              <Heart className="text-gray-700 hover:text-primary-600" size={24} />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link to="/cart" className="relative">
              <ShoppingCart className="text-gray-700 hover:text-primary-600" size={24} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-1 text-gray-700 hover:text-primary-600">
                  <User size={24} />
                  <span className="hidden lg:inline">{user?.profile.first_name}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/orders"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Orders
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-gray-700 hover:text-primary-600 flex items-center"
              >
                <User size={24} />
                <span className="hidden lg:inline ml-1">Login</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu with animation */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-[600px] overflow-y-auto' : 'max-h-0'}`}>
          <nav className="py-4 border-t bg-gray-50">
            {/* Categories with subcategories */}
            {categories.map((category) => (
              <div key={category.id}>
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-white hover:text-primary-600 transition-colors"
                >
                  <span>{category.name}</span>
                  {category.children && category.children.length > 0 && (
                    <ChevronDown 
                      size={16} 
                      className={`transform transition-transform ${expandedCategory === category.id ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>
                
                {/* Subcategories */}
                {category.children && category.children.length > 0 && expandedCategory === category.id && (
                  <div className="bg-gray-100">
                    {category.children.map((subcat, index) => (
                      <Link
                        key={index}
                        to={`/products?category=${category.slug}&subcategory=${encodeURIComponent(subcat.name)}`}
                        className="block pl-8 pr-4 py-2 text-sm text-gray-600 hover:bg-white hover:text-primary-600"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {subcat.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            <Link
              to="/about"
              className="block px-4 py-3 text-gray-700 hover:bg-white hover:text-primary-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            
            <Link
              to="/search"
              className="block px-4 py-3 text-gray-700 hover:bg-white hover:text-primary-600 transition-colors border-t"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <Search size={20} className="mr-2" />
                <span>Search Products</span>
              </div>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}