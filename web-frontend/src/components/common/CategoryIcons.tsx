import { Link } from 'react-router-dom';
import { 
  Home, 
  Palette, 
  Sparkles, 
  Lightbulb, 
  Gift, 
  Package, 
  Archive, 
  Star,
  TrendingUp,
  Tag,
  Plus,
  ShoppingBag
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useRef, useState } from 'react';
import { RootState, AppDispatch } from '../../store';
import { fetchCategories } from '../../store/slices/categoriesSlice';

interface CategoryIcon {
  id: string;
  name: string;
  icon: React.ReactNode;
  slug: string;
}

// Icon mapping for categories
const getIconForCategory = (slug: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    'bestsellers': <Star size={24} />,            // Bestsellers
    'new-in': <TrendingUp size={24} />,           // NEW In
    'divine-collections': <Sparkles size={24} />, // Divine
    'home-accent': <Home size={24} />,            // Home
    'wall-decor': <Palette size={24} />,          // Wall
    'festivals': <Gift size={24} />,              // Festivals
    'lighting': <Lightbulb size={24} />,          // Lighting
    'storage-bags': <Archive size={24} />,        // Storage
    'gifting': <Package size={24} />,             // Gifting
    'sale': <Tag size={24} />                     // Sale/Special
  };
  return iconMap[slug] || <ShoppingBag size={24} />;
};

export default function CategoryIcons() {
  const dispatch = useDispatch<AppDispatch>();
  const { categories } = useSelector((state: RootState) => state.categories);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [userScrollTimeout, setUserScrollTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories.length]);

  // Map categories from API with fallback to hardcoded data
  const categoryIcons: CategoryIcon[] = categories.length > 0 
    ? categories.map(category => ({
        id: category.id,
        name: category.name.length > 10 ? category.name.split(' ')[0] : category.name,
        icon: getIconForCategory(category.slug),
        slug: category.slug
      }))
    : [
        {
          id: 'bestsellers',
          name: 'Bestsellers',
          icon: <Star size={24} />,
          slug: 'bestsellers'
        },
        {
          id: 'new-in',
          name: 'NEW In',
          icon: <TrendingUp size={24} />,
          slug: 'new-in'
        },
        {
          id: 'divine-collections',
          name: 'Divine',
          icon: <Sparkles size={24} />,
          slug: 'divine-collections'
        },
        {
          id: 'home-accent',
          name: 'Home',
          icon: <Home size={24} />,
          slug: 'home-accent'
        },
        {
          id: 'wall-decor',
          name: 'Wall',
          icon: <Palette size={24} />,
          slug: 'wall-decor'
        },
        {
          id: 'festivals',
          name: 'Festivals',
          icon: <Gift size={24} />,
          slug: 'festivals'
        },
        {
          id: 'lighting',
          name: 'Lighting',
          icon: <Lightbulb size={24} />,
          slug: 'lighting'
        },
        {
          id: 'storage-bags',
          name: 'Storage',
          icon: <Archive size={24} />,
          slug: 'storage-bags'
        },
        {
          id: 'gifting',
          name: 'Gifting',
          icon: <Package size={24} />,
          slug: 'gifting'
        },
        {
          id: 'sale',
          name: 'Sale',
          icon: <Tag size={24} />,
          slug: 'sale'
        }
      ];

  // Auto scroll animation that respects user interaction
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollPosition = 0;
    const scrollSpeed = 0.5; // Slow but visible scroll speed
    let animationId: number;
    
    const animate = () => {
      // Only auto-scroll if user is not actively scrolling
      if (!isUserScrolling) {
        scrollPosition += scrollSpeed;
        
        // Reset scroll when reaching halfway (since we duplicated categories)
        const maxScroll = scrollContainer.scrollWidth / 2;
        if (scrollPosition >= maxScroll) {
          scrollPosition = 0;
        }
        
        scrollContainer.scrollLeft = scrollPosition;
      } else {
        // Update scroll position to match user's scroll
        scrollPosition = scrollContainer.scrollLeft;
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    // Handle user scroll interactions
    const handleScroll = () => {
      setIsUserScrolling(true);
      
      // Clear existing timeout
      if (userScrollTimeout) {
        clearTimeout(userScrollTimeout);
      }
      
      // Resume auto-scroll after user stops scrolling for 3 seconds
      const timeout = setTimeout(() => {
        setIsUserScrolling(false);
        // Sync scroll position for smooth transition
        scrollPosition = scrollContainer.scrollLeft;
      }, 3000);
      
      setUserScrollTimeout(timeout);
    };
    
    // Handle touch/mouse interactions to pause auto-scroll
    const handleInteractionStart = () => {
      setIsUserScrolling(true);
      if (userScrollTimeout) {
        clearTimeout(userScrollTimeout);
      }
    };
    
    const handleInteractionEnd = () => {
      // Resume auto-scroll after 1 second of no interaction
      const timeout = setTimeout(() => {
        setIsUserScrolling(false);
        scrollPosition = scrollContainer.scrollLeft;
      }, 1000);
      
      setUserScrollTimeout(timeout);
    };
    
    // Add event listeners
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    scrollContainer.addEventListener('touchstart', handleInteractionStart, { passive: true });
    scrollContainer.addEventListener('touchend', handleInteractionEnd, { passive: true });
    scrollContainer.addEventListener('mousedown', handleInteractionStart);
    scrollContainer.addEventListener('mouseup', handleInteractionEnd);
    
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (userScrollTimeout) clearTimeout(userScrollTimeout);
      
      scrollContainer.removeEventListener('scroll', handleScroll);
      scrollContainer.removeEventListener('touchstart', handleInteractionStart);
      scrollContainer.removeEventListener('touchend', handleInteractionEnd);
      scrollContainer.removeEventListener('mousedown', handleInteractionStart);
      scrollContainer.removeEventListener('mouseup', handleInteractionEnd);
    };
  }, [isUserScrolling, userScrollTimeout]);

  return (
    <div className="bg-white border-b border-gray-100">
      {/* Auto-scrolling horizontal carousel */}
      <div className="relative py-6 overflow-hidden">
        <div 
          ref={scrollRef}
          className="flex gap-6 md:gap-8 px-4 overflow-x-auto scrollbar-hide"
          style={{
            scrollBehavior: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* Duplicate categories for seamless infinite scroll */}
          {[...categoryIcons, ...categoryIcons].map((category, index) => (
            <Link
              key={`${category.id}-${index}`}
              to={`/category/${category.slug}`}
              className="flex flex-col items-center justify-center min-w-[80px] md:min-w-[100px] p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 group flex-shrink-0"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#f8f5f0] to-[#e8e0d0] rounded-full flex items-center justify-center text-[#96865d] mb-2 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200 border-2 border-white">
                <div className="transform group-hover:rotate-6 transition-transform duration-200">
                  {category.icon}
                </div>
              </div>
              <span className="text-xs md:text-sm text-gray-700 text-center font-medium whitespace-nowrap">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
        
        {/* Gradient fade edges for seamless effect */}
        <div className="absolute left-0 top-0 w-8 h-full bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
        <div className="absolute right-0 top-0 w-8 h-full bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
}