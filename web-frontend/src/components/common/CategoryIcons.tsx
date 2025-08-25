import { Link } from 'react-router-dom';
import { Home, Palette, Sparkles, Lightbulb, Gift, Package } from 'lucide-react';

interface CategoryIcon {
  id: string;
  name: string;
  icon: React.ReactNode;
  slug: string;
}

const categoryIcons: CategoryIcon[] = [
  {
    id: 'divine-collections',
    name: 'Divine',
    icon: <Sparkles size={24} />,
    slug: 'divine-collections'
  },
  {
    id: 'wall-decor',
    name: 'Wall Art',
    icon: <Palette size={24} />,
    slug: 'wall-decor'
  },
  {
    id: 'festivals',
    name: 'Festivals',
    icon: <Home size={24} />,
    slug: 'festivals'
  },
  {
    id: 'lighting',
    name: 'Lighting',
    icon: <Lightbulb size={24} />,
    slug: 'lighting'
  },
  {
    id: 'home-accent',
    name: 'Home',
    icon: <Package size={24} />,
    slug: 'home-accent'
  },
  {
    id: 'gifting',
    name: 'Gifts',
    icon: <Gift size={24} />,
    slug: 'gifting'
  }
];

export default function CategoryIcons() {
  return (
    <div className="bg-white border-b border-gray-100">
      {/* Mobile - Horizontal Scroll */}
      <div className="lg:hidden overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 px-4 py-3 min-w-max">
          {categoryIcons.map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${category.slug}`}
              className="flex flex-col items-center justify-center min-w-[70px] p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 bg-[#f8f5f0] rounded-full flex items-center justify-center text-[#96865d] mb-1">
                {category.icon}
              </div>
              <span className="text-xs text-gray-700 text-center">{category.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop - Static Grid */}
      <div className="hidden lg:block max-w-7xl mx-auto px-4">
        <div className="flex justify-center gap-8 py-4">
          {categoryIcons.map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${category.slug}`}
              className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-all duration-200 group"
            >
              <div className="w-14 h-14 bg-[#f8f5f0] rounded-full flex items-center justify-center text-[#96865d] mb-2 group-hover:bg-[#96865d] group-hover:text-white transition-all duration-200">
                {category.icon}
              </div>
              <span className="text-sm text-gray-700 text-center">{category.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}