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
        }
      ];
  const radius = 120; // Radius of the circular carousel
  const centerX = 150; // Center X position
  const centerY = 150; // Center Y position
  
  return (
    <div className="bg-white border-b border-gray-100">
      {/* 3D Revolving Circular Carousel - Both Mobile and Desktop */}
      <div className="relative h-80 md:h-96 flex items-center justify-center overflow-hidden">
        <div 
          className="relative w-80 h-80 md:w-96 md:h-96"
          style={{
            perspective: '1000px',
            transformStyle: 'preserve-3d'
          }}
        >
          {categoryIcons.map((category, index) => {
            const angle = (index * 360 / categoryIcons.length) + rotation;
            const radian = (angle * Math.PI) / 180;
            const x = centerX + radius * Math.cos(radian);
            const y = centerY + radius * Math.sin(radian);
            const scale = 0.8 + 0.2 * Math.cos(radian); // Scale effect for 3D depth
            const opacity = 0.6 + 0.4 * Math.cos(radian); // Opacity effect for depth
            const zIndex = Math.round(50 + 50 * Math.cos(radian)); // Z-index for layering
            
            return (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100 ease-out group cursor-pointer"
                style={{
                  left: x,
                  top: y,
                  transform: `translate(-50%, -50%) scale(${scale})`,
                  opacity,
                  zIndex,
                  transition: 'all 0.1s ease-out'
                }}
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#f8f5f0] to-[#e8e0d0] rounded-full flex items-center justify-center text-[#96865d] mb-2 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 border-2 border-white">
                    <div className="transform group-hover:rotate-12 transition-transform duration-300">
                      {category.icon}
                    </div>
                  </div>
                  <span className="text-xs md:text-sm text-gray-700 text-center font-medium bg-white/80 px-2 py-1 rounded-full shadow-sm">
                    {category.name}
                  </span>
                </div>
              </Link>
            );
          })}
          
          {/* Central decorative element */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-[#96865d] to-[#8B4513] rounded-full flex items-center justify-center shadow-xl border-4 border-white">
            <div className="text-white font-bold text-lg md:text-xl tracking-wider">
              T
            </div>
          </div>
          
          {/* Rotating background rings for visual effect */}
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 border-2 border-dashed border-gray-200 rounded-full opacity-20"
            style={{
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              transition: 'transform 0.1s ease-out'
            }}
          ></div>
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-60 md:h-60 border border-dashed border-gray-300 rounded-full opacity-30"
            style={{
              transform: `translate(-50%, -50%) rotate(${-rotation * 0.7}deg)`,
              transition: 'transform 0.1s ease-out'
            }}
          ></div>
        </div>
        
        {/* Background gradient for depth */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-gray-50/30 to-gray-100/50 pointer-events-none"></div>
      </div>
      
      {/* Mobile instruction */}
      <div className="md:hidden text-center py-2 text-xs text-gray-500">
        Tap any category to explore
      </div>
    </div>
  );
}