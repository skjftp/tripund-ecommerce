import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { loadCartFromBackend } from '../store/slices/cartSlice';
import { loadWishlistFromBackend } from '../store/slices/wishlistSlice';
import { fetchProfile } from '../store/slices/authSlice';

export default function AppInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // If user is authenticated, load their cart, wishlist, and profile from backend
    if (isAuthenticated) {
      console.log('🔄 Loading user data from backend...');
      
      // Load profile (includes addresses)
      dispatch(fetchProfile());
      
      // Load cart from backend
      dispatch(loadCartFromBackend());
      
      // Load wishlist from backend
      dispatch(loadWishlistFromBackend());
    }
  }, [dispatch, isAuthenticated]);

  return <>{children}</>;
}