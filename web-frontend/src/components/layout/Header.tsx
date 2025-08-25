import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User, Menu, X, Heart, ChevronDown, MapPin, Phone } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import tripundLogo from '../../assets/tripund-logo.png';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
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

  // Handle click outside for profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <>
      {/* Top Bar - Nestasia Style */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 text-xs">
            <div className="flex items-center space-x-4">
              <a href="tel:+919999999999" className="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
                <Phone size={12} />
                <span>+91 99999 99999</span>
              </a>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Free Shipping on Orders Above ₹999</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-900">
                <MapPin size={12} />
                <span>Track Order</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo - Centered on mobile, left on desktop */}
            <div className="flex items-center flex-1 lg:flex-none">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              
              <Link to="/" className="mx-auto lg:mx-0">
                <img 
                  src={tripundLogo} 
                  alt="TRIPUND LIFESTYLE" 
                  className="h-12 w-auto max-w-[180px] object-contain"
                />
              </Link>
            </div>

            {/* Desktop Navigation - Center */}
            <nav className="hidden lg:flex items-center space-x-6 flex-1 justify-center">
              {categories.slice(0, 6).map((category) => (
                <div key={category.id} className="relative group">
                  <Link
                    to={`/products?category=${category.slug}`}
                    className="text-gray-700 hover:text-[#96865d] font-medium text-xs tracking-wider uppercase transition-colors duration-200 whitespace-nowrap"
                  >
                    {category.name}
                  </Link>
                  
                  {/* Mega Menu Dropdown */}
                  {category.children && category.children.length > 0 && (
                    <div className="absolute left-1/2 transform -translate-x-1/2 mt-0 w-screen max-w-md bg-white shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="relative">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#96865d] to-[#f37a1f]"></div>
                        <div className="p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">{category.name}</h3>
                          <div className="grid grid-cols-2 gap-4">
                            {category.children.map((subcat, index) => (
                              <Link
                                key={index}
                                to={`/products?category=${category.slug}&subcategory=${encodeURIComponent(subcat.name)}`}
                                className="text-sm text-gray-600 hover:text-[#96865d] hover:underline transition-colors"
                              >
                                {subcat.name}
                              </Link>
                            ))}
                          </div>
                          <div className="mt-6 pt-4 border-t border-gray-200">
                            <Link
                              to={`/products?category=${category.slug}`}
                              className="text-sm font-medium text-[#96865d] hover:text-[#f37a1f] transition-colors"
                            >
                              View All {category.name} →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              <Link to="/about" className="text-gray-700 hover:text-[#96865d] font-medium text-xs tracking-wider uppercase transition-colors duration-200 whitespace-nowrap">
                About
              </Link>
            </nav>

            {/* Right Icons */}
            <div className="flex items-center space-x-4 flex-1 lg:flex-none justify-end">
              {/* Search Icon for both Desktop and Mobile */}
              <button 
                onClick={() => navigate('/search')}
                className="text-gray-700 hover:text-[#96865d] transition-colors"
                aria-label="Search"
              >
                <Search size={22} />
              </button>

              {/* Account */}
              {isAuthenticated ? (
                <div className="relative" ref={profileDropdownRef}>
                  <button 
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="text-gray-700 hover:text-[#96865d] transition-colors"
                  >
                    <User size={22} />
                  </button>
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-200">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">Hello, {user?.profile.first_name}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setShowProfileDropdown(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setShowProfileDropdown(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        My Orders
                      </Link>
                      <Link
                        to="/wishlist"
                        onClick={() => setShowProfileDropdown(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        My Wishlist
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowProfileDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-[#96865d] transition-colors"
                >
                  <User size={22} />
                </Link>
              )}

              {/* Wishlist */}
              <Link to="/wishlist" className="relative text-gray-700 hover:text-[#96865d] transition-colors">
                <Heart size={22} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#f37a1f] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link to="/cart" className="relative text-gray-700 hover:text-[#96865d] transition-colors">
                <ShoppingCart size={22} />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#96865d] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Menu - Slide from left */}
        <div className={`fixed inset-0 z-50 lg:hidden ${isMenuOpen ? 'visible' : 'invisible'}`}>
          <div 
            className={`fixed inset-0 bg-black transition-opacity duration-300 ${isMenuOpen ? 'opacity-50' : 'opacity-0'}`}
            onClick={() => setIsMenuOpen(false)}
          />
          <div className={`fixed left-0 top-0 h-full w-80 bg-white transform transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <img 
                  src={tripundLogo} 
                  alt="TRIPUND LIFESTYLE" 
                  className="h-10 w-auto"
                />
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <nav className="overflow-y-auto h-full pb-20">
              {/* Mobile Search */}
              <div className="p-4 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#96865d]"
                  onFocus={() => {
                    navigate('/search');
                    setIsMenuOpen(false);
                  }}
                />
              </div>

              {/* Categories */}
              {categories.map((category) => (
                <div key={category.id} className="border-b border-gray-200">
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900">{category.name}</span>
                    {category.children && category.children.length > 0 && (
                      <ChevronDown 
                        size={20} 
                        className={`transform transition-transform text-gray-400 ${expandedCategory === category.id ? 'rotate-180' : ''}`}
                      />
                    )}
                  </button>
                  
                  {/* Subcategories */}
                  {category.children && category.children.length > 0 && expandedCategory === category.id && (
                    <div className="bg-gray-50 py-2">
                      {category.children.map((subcat, index) => (
                        <Link
                          key={index}
                          to={`/products?category=${category.slug}&subcategory=${encodeURIComponent(subcat.name)}`}
                          className="block px-8 py-2 text-sm text-gray-600 hover:text-[#96865d] transition-colors"
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
                className="block px-4 py-3 font-medium text-gray-900 hover:bg-gray-50 transition-colors border-b border-gray-200"
                onClick={() => setIsMenuOpen(false)}
              >
                About Us
              </Link>

              {/* Account Links */}
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/orders"
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login / Register
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}