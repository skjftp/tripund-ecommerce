import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User, Menu, X, Heart } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import tripundLogo from '../../assets/tripund-logo.png';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const { itemCount } = useSelector((state: RootState) => state.cart);
  const wishlistCount = useSelector((state: RootState) => 
    Array.isArray(state.wishlist.items) ? state.wishlist.items.length : 0
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

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
              className="lg:hidden p-2"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <Link to="/" className="ml-4 lg:ml-0">
              <img 
                src={tripundLogo} 
                alt="TRIPUND LIFESTYLE" 
                className="h-8 w-auto max-w-[160px] object-contain"
              />
            </Link>
          </div>

          <nav className="hidden lg:flex items-center space-x-8">
            <Link to="/products" className="text-gray-700 hover:text-primary-600">
              Products
            </Link>
            <Link to="/categories" className="text-gray-700 hover:text-primary-600">
              Categories
            </Link>
            <Link to="/artisans" className="text-gray-700 hover:text-primary-600">
              Artisans
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-primary-600">
              About
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <form onSubmit={handleSearch} className="hidden md:flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="px-3 py-1 border border-gray-300 rounded-l-md focus:outline-none focus:border-primary-500"
              />
              <button
                type="submit"
                className="bg-primary-600 text-white px-3 py-1 rounded-r-md hover:bg-primary-700"
              >
                <Search size={20} />
              </button>
            </form>

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

        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t">
            <Link
              to="/products"
              className="block py-2 text-gray-700 hover:text-primary-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Products
            </Link>
            <Link
              to="/categories"
              className="block py-2 text-gray-700 hover:text-primary-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Categories
            </Link>
            <Link
              to="/artisans"
              className="block py-2 text-gray-700 hover:text-primary-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Artisans
            </Link>
            <Link
              to="/about"
              className="block py-2 text-gray-700 hover:text-primary-600"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}