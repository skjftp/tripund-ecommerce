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
import { useEffect, useState } from 'react';
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
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories.length]);

  // Infinite rotation animation
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => prev + 0.5); // Slow, smooth rotation
    }, 50); // Update every 50ms for smooth animation
    
    return () => clearInterval(interval);
  }, []);

  // Map categories from API with fallback to hardcoded data
  const categoryIcons: CategoryIcon[] = categories.length > 0 
    ? categories.map(category => ({
        id: category.id,
        name: category.name.length > 8 ? category.name.split(' ')[0] : category.name,
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
  return (
    <div className="bg-white border-b border-gray-100">
      {/* 3D Horizontal Revolving Carousel - Both Mobile and Desktop */}
      <div className="relative h-32 md:h-40 flex items-center justify-center overflow-hidden">
        <div 
          className="relative w-full h-full flex items-center justify-center"
          style={{
            perspective: '1200px',
            perspectiveOrigin: 'center center'
          }}
        >
          <div
            className="relative"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateY(${rotation}deg)`,
              transition: 'transform 0.05s linear'
            }}
          >
            {categoryIcons.map((category, index) => {
              const angle = (index * 360) / categoryIcons.length;
              const radius = 200; // Distance from center
              const rotateY = angle;
              const translateZ = radius;
              
              return (
                <Link
                  key={category.id}
                  to={`/category/${category.slug}`}
                  className="absolute group cursor-pointer"
                  style={{
                    transform: `rotateY(${rotateY}deg) translateZ(${translateZ}px)`,
                    transformOrigin: 'center',
                    left: '50%',
                    top: '50%',
                    marginLeft: '-40px',
                    marginTop: '-40px'
                  }}
                >
                  <div 
                    className="flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24"
                    style={{
                      transform: `rotateY(${-rotateY}deg)`, // Counter-rotate to keep icons facing forward
                      backfaceVisibility: 'hidden'
                    }}
                  >
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#f8f5f0] to-[#e8e0d0] rounded-full flex items-center justify-center text-[#96865d] mb-1 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 border-2 border-white/80">
                      <div className="transform group-hover:rotate-12 transition-transform duration-300">
                        {category.icon}
                      </div>
                    </div>
                    <span className="text-xs md:text-sm text-gray-700 text-center font-medium bg-white/90 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                      {category.name}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          
          {/* Optional: Center gradient for depth effect */}
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-gray-50/20 pointer-events-none"></div>
        </div>
      </div>
      
      {/* Instruction text */}
      <div className="text-center py-2 text-xs text-gray-500">
        Explore our handcrafted categories
      </div>
    </div>
  );
}