import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronDown, ChevronUp, X, Filter, Grid, List, ChevronRight } from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { fetchProducts } from '../store/slices/productSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import ProductCard from '../components/product/ProductCard';

interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface FilterSection {
  title: string;
  key: string;
  options: FilterOption[];
}

// Category-specific filters configuration
const categoryFilters: Record<string, FilterSection[]> = {
  'divine-collections': [
    {
      title: 'Type',
      key: 'type',
      options: [
        { label: 'Idols', value: 'idols' },
        { label: 'Pooja Items', value: 'pooja-items' },
        { label: 'Spiritual Décor', value: 'spiritual-decor' },
        { label: 'Temple Bells', value: 'temple-bells' }
      ]
    },
    {
      title: 'Material',
      key: 'material',
      options: [
        { label: 'Brass', value: 'brass' },
        { label: 'Bronze', value: 'bronze' },
        { label: 'Wood', value: 'wood' },
        { label: 'Marble', value: 'marble' },
        { label: 'Clay', value: 'clay' }
      ]
    },
    {
      title: 'Size',
      key: 'size',
      options: [
        { label: 'Small (< 6 inches)', value: 'small' },
        { label: 'Medium (6-12 inches)', value: 'medium' },
        { label: 'Large (> 12 inches)', value: 'large' }
      ]
    },
    {
      title: 'Price',
      key: 'price',
      options: [
        { label: 'Under ₹500', value: '0-500' },
        { label: '₹500 - ₹1000', value: '500-1000' },
        { label: '₹1000 - ₹2500', value: '1000-2500' },
        { label: '₹2500 - ₹5000', value: '2500-5000' },
        { label: 'Above ₹5000', value: '5000-' }
      ]
    }
  ],
  'wall-decor': [
    {
      title: 'Type',
      key: 'type',
      options: [
        { label: 'Wall Hangings', value: 'wall-hangings' },
        { label: 'Paintings', value: 'paintings' },
        { label: 'Frames', value: 'frames' },
        { label: 'Mirrors', value: 'mirrors' },
        { label: 'Clocks', value: 'clocks' }
      ]
    },
    {
      title: 'Style',
      key: 'style',
      options: [
        { label: 'Traditional', value: 'traditional' },
        { label: 'Modern', value: 'modern' },
        { label: 'Abstract', value: 'abstract' },
        { label: 'Ethnic', value: 'ethnic' },
        { label: 'Contemporary', value: 'contemporary' }
      ]
    },
    {
      title: 'Material',
      key: 'material',
      options: [
        { label: 'Wood', value: 'wood' },
        { label: 'Metal', value: 'metal' },
        { label: 'Canvas', value: 'canvas' },
        { label: 'Glass', value: 'glass' },
        { label: 'Fabric', value: 'fabric' }
      ]
    },
    {
      title: 'Color',
      key: 'color',
      options: [
        { label: 'Multicolor', value: 'multicolor' },
        { label: 'Gold', value: 'gold' },
        { label: 'Silver', value: 'silver' },
        { label: 'Black', value: 'black' },
        { label: 'White', value: 'white' }
      ]
    },
    {
      title: 'Price',
      key: 'price',
      options: [
        { label: 'Under ₹1000', value: '0-1000' },
        { label: '₹1000 - ₹2500', value: '1000-2500' },
        { label: '₹2500 - ₹5000', value: '2500-5000' },
        { label: 'Above ₹5000', value: '5000-' }
      ]
    }
  ],
  'festivals': [
    {
      title: 'Type',
      key: 'type',
      options: [
        { label: 'Torans', value: 'torans' },
        { label: 'Rangoli', value: 'rangoli' },
        { label: 'Garlands', value: 'garlands' },
        { label: 'Decorations', value: 'decorations' }
      ]
    },
    {
      title: 'Occasion',
      key: 'occasion',
      options: [
        { label: 'Diwali', value: 'diwali' },
        { label: 'Holi', value: 'holi' },
        { label: 'Navratri', value: 'navratri' },
        { label: 'Christmas', value: 'christmas' },
        { label: 'Wedding', value: 'wedding' }
      ]
    },
    {
      title: 'Material',
      key: 'material',
      options: [
        { label: 'Fabric', value: 'fabric' },
        { label: 'Paper', value: 'paper' },
        { label: 'Flowers', value: 'flowers' },
        { label: 'Beads', value: 'beads' }
      ]
    },
    {
      title: 'Price',
      key: 'price',
      options: [
        { label: 'Under ₹500', value: '0-500' },
        { label: '₹500 - ₹1000', value: '500-1000' },
        { label: '₹1000 - ₹2000', value: '1000-2000' },
        { label: 'Above ₹2000', value: '2000-' }
      ]
    }
  ],
  'lighting': [
    {
      title: 'Type',
      key: 'type',
      options: [
        { label: 'Diyas', value: 'diyas' },
        { label: 'Candles', value: 'candles' },
        { label: 'Lanterns', value: 'lanterns' },
        { label: 'LED Lights', value: 'led-lights' },
        { label: 'String Lights', value: 'string-lights' }
      ]
    },
    {
      title: 'Material',
      key: 'material',
      options: [
        { label: 'Clay', value: 'clay' },
        { label: 'Brass', value: 'brass' },
        { label: 'Glass', value: 'glass' },
        { label: 'Metal', value: 'metal' },
        { label: 'Wax', value: 'wax' }
      ]
    },
    {
      title: 'Style',
      key: 'style',
      options: [
        { label: 'Traditional', value: 'traditional' },
        { label: 'Modern', value: 'modern' },
        { label: 'Decorative', value: 'decorative' },
        { label: 'Festive', value: 'festive' }
      ]
    },
    {
      title: 'Price',
      key: 'price',
      options: [
        { label: 'Under ₹300', value: '0-300' },
        { label: '₹300 - ₹700', value: '300-700' },
        { label: '₹700 - ₹1500', value: '700-1500' },
        { label: 'Above ₹1500', value: '1500-' }
      ]
    }
  ],
  'home-accent': [
    {
      title: 'Type',
      key: 'type',
      options: [
        { label: 'Cushion Covers', value: 'cushion-covers' },
        { label: 'Vases', value: 'vases' },
        { label: 'Showpieces', value: 'showpieces' },
        { label: 'Table Décor', value: 'table-decor' },
        { label: 'Planters', value: 'planters' }
      ]
    },
    {
      title: 'Material',
      key: 'material',
      options: [
        { label: 'Cotton', value: 'cotton' },
        { label: 'Silk', value: 'silk' },
        { label: 'Ceramic', value: 'ceramic' },
        { label: 'Wood', value: 'wood' },
        { label: 'Metal', value: 'metal' }
      ]
    },
    {
      title: 'Color',
      key: 'color',
      options: [
        { label: 'Multicolor', value: 'multicolor' },
        { label: 'Blue', value: 'blue' },
        { label: 'Green', value: 'green' },
        { label: 'Red', value: 'red' },
        { label: 'Neutral', value: 'neutral' }
      ]
    },
    {
      title: 'Price',
      key: 'price',
      options: [
        { label: 'Under ₹500', value: '0-500' },
        { label: '₹500 - ₹1000', value: '500-1000' },
        { label: '₹1000 - ₹2000', value: '1000-2000' },
        { label: 'Above ₹2000', value: '2000-' }
      ]
    }
  ],
  'storage-bags': [
    {
      title: 'Type',
      key: 'type',
      options: [
        { label: 'Storage Boxes', value: 'storage-boxes' },
        { label: 'Bags', value: 'bags' },
        { label: 'Baskets', value: 'baskets' },
        { label: 'Organizers', value: 'organizers' }
      ]
    },
    {
      title: 'Material',
      key: 'material',
      options: [
        { label: 'Jute', value: 'jute' },
        { label: 'Cotton', value: 'cotton' },
        { label: 'Bamboo', value: 'bamboo' },
        { label: 'Plastic', value: 'plastic' },
        { label: 'Wood', value: 'wood' }
      ]
    },
    {
      title: 'Size',
      key: 'size',
      options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
        { label: 'Extra Large', value: 'xl' }
      ]
    },
    {
      title: 'Price',
      key: 'price',
      options: [
        { label: 'Under ₹500', value: '0-500' },
        { label: '₹500 - ₹1000', value: '500-1000' },
        { label: '₹1000 - ₹2000', value: '1000-2000' },
        { label: 'Above ₹2000', value: '2000-' }
      ]
    }
  ],
  'gifting': [
    {
      title: 'Type',
      key: 'type',
      options: [
        { label: 'Gift Sets', value: 'gift-sets' },
        { label: 'Hampers', value: 'hampers' },
        { label: 'Personalized', value: 'personalized' },
        { label: 'Corporate Gifts', value: 'corporate' }
      ]
    },
    {
      title: 'Occasion',
      key: 'occasion',
      options: [
        { label: 'Wedding', value: 'wedding' },
        { label: 'Birthday', value: 'birthday' },
        { label: 'Anniversary', value: 'anniversary' },
        { label: 'Housewarming', value: 'housewarming' },
        { label: 'Festival', value: 'festival' }
      ]
    },
    {
      title: 'Price',
      key: 'price',
      options: [
        { label: 'Under ₹1000', value: '0-1000' },
        { label: '₹1000 - ₹2500', value: '1000-2500' },
        { label: '₹2500 - ₹5000', value: '2500-5000' },
        { label: 'Above ₹5000', value: '5000-' }
      ]
    }
  ]
};

const categoryInfo: Record<string, { name: string; description: string; banner?: string }> = {
  'divine-collections': {
    name: 'Divine Collections',
    description: 'Discover our sacred collection of handcrafted idols, spiritual décor, and pooja essentials that bring divine blessings to your home.',
    banner: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=1600&h=400&fit=crop'
  },
  'wall-decor': {
    name: 'Wall Décor',
    description: 'Transform your walls into artistic expressions with our curated collection of paintings, hangings, and decorative pieces.',
    banner: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=400&fit=crop'
  },
  'festivals': {
    name: 'Festival Collection',
    description: 'Celebrate every occasion with our vibrant collection of traditional torans, garlands, and festive decorations.',
    banner: 'https://images.unsplash.com/photo-1596079890744-c1a0462d0975?w=1600&h=400&fit=crop'
  },
  'lighting': {
    name: 'Lighting',
    description: 'Illuminate your spaces with our beautiful collection of diyas, candles, lanterns, and decorative lights.',
    banner: 'https://images.unsplash.com/photo-1565636192335-5398080bf22f?w=1600&h=400&fit=crop'
  },
  'home-accent': {
    name: 'Home Accents',
    description: 'Add personality to your living spaces with our stylish cushions, vases, and decorative accents.',
    banner: 'https://images.unsplash.com/photo-1524634126442-357e0eac3c14?w=1600&h=400&fit=crop'
  },
  'storage-bags': {
    name: 'Storage & Bags',
    description: 'Organize in style with our eco-friendly storage solutions and handcrafted bags.',
    banner: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=400&fit=crop'
  },
  'gifting': {
    name: 'Gifting',
    description: 'Find the perfect gift for every occasion with our thoughtfully curated gift sets and hampers.',
    banner: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=1600&h=400&fit=crop'
  }
};

export default function CategoryPage() {
  const { category, subcategory } = useParams<{ category: string; subcategory?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const { products, loading } = useSelector((state: RootState) => state.products);
  const { categories } = useSelector((state: RootState) => state.categories);
  
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    // Fetch categories if not loaded
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
    
    // Fetch products for category/subcategory
    if (category) {
      const filters: any = { category, limit: 100 };
      
      // If subcategory is specified, add it as a type filter
      if (subcategory) {
        // Convert subcategory slug back to readable format
        const subcategoryName = subcategory.replace(/-/g, ' ');
        filters.type = subcategoryName;
      }
      
      dispatch(fetchProducts(filters));
    }
  }, [category, subcategory, dispatch, categories.length]);

  useEffect(() => {
    // Initialize filters from URL params
    const filters: Record<string, string[]> = {};
    searchParams.forEach((value, key) => {
      if (key !== 'sort' && key !== 'view') {
        filters[key] = value.split(',');
      }
    });
    setSelectedFilters(filters);
    
    // Initialize sort and view from URL
    setSortBy(searchParams.get('sort') || 'featured');
    setViewMode((searchParams.get('view') as 'grid' | 'list') || 'grid');
  }, [searchParams]);

  const toggleFilter = (filterKey: string, value: string) => {
    const currentFilters = selectedFilters[filterKey] || [];
    const newFilters = currentFilters.includes(value)
      ? currentFilters.filter(v => v !== value)
      : [...currentFilters, value];
    
    const updatedFilters = { ...selectedFilters };
    if (newFilters.length > 0) {
      updatedFilters[filterKey] = newFilters;
    } else {
      delete updatedFilters[filterKey];
    }
    
    setSelectedFilters(updatedFilters);
    updateURLParams(updatedFilters);
  };

  const updateURLParams = (filters: Record<string, string[]>) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, values]) => {
      if (values.length > 0) {
        params.set(key, values.join(','));
      }
    });
    if (sortBy !== 'featured') params.set('sort', sortBy);
    if (viewMode !== 'grid') params.set('view', viewMode);
    setSearchParams(params);
  };

  const clearAllFilters = () => {
    setSelectedFilters({});
    setSearchParams(new URLSearchParams());
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get category-specific filters
  const filters = category ? categoryFilters[category] || [] : [];
  let info = category ? categoryInfo[category] : null;
  
  // Get actual category data from API for image
  const actualCategory = categories.find(cat => cat.slug === category);
  
  // Use actual category image if available, fallback to hardcoded banner
  if (info && actualCategory && actualCategory.image) {
    info = {
      ...info,
      banner: actualCategory.image
    };
  }
  
  // Get subcategory info if applicable
  let subcategoryInfo = null;
  if (subcategory && categories.length > 0) {
    const currentCategory = categories.find(cat => cat.slug === category);
    if (currentCategory && currentCategory.children) {
      const subcategoryName = subcategory.replace(/-/g, ' ');
      subcategoryInfo = currentCategory.children.find(
        sub => sub.name.toLowerCase() === subcategoryName.toLowerCase()
      );
    }
    
    // Modify info for subcategory
    if (subcategoryInfo && info) {
      info = {
        ...info,
        name: `${info.name} - ${subcategoryInfo.name}`,
        description: `Browse our collection of ${subcategoryInfo.name.toLowerCase()} in ${info.name.toLowerCase()}`
      };
    }
  }

  // Apply filters to products
  const filteredProducts = products.filter(product => {
    // Filter by subcategory if present
    if (subcategory) {
      const subcategoryName = subcategory.replace(/-/g, ' ');
      const productType = product.attributes?.find(attr => 
        attr.name.toLowerCase() === 'type'
      );
      if (!productType || productType.value.toLowerCase() !== subcategoryName.toLowerCase()) {
        // Check if subcategory matches any category tag
        const hasSubcategory = product.tags?.some(tag => 
          tag.toLowerCase() === subcategoryName.toLowerCase()
        );
        if (!hasSubcategory) return false;
      }
    }
    
    // Apply selected filters
    for (const [filterKey, filterValues] of Object.entries(selectedFilters)) {
      // Price filter
      if (filterKey === 'price') {
        const priceRange = filterValues[0].split('-');
        const min = parseInt(priceRange[0]);
        const max = priceRange[1] ? parseInt(priceRange[1]) : Infinity;
        if (product.price < min || product.price > max) return false;
      }
      // Other attribute filters
      else {
        const productAttribute = product.attributes?.find(attr => 
          attr.name.toLowerCase() === filterKey
        );
        if (!productAttribute || !filterValues.includes(productAttribute.value.toLowerCase())) {
          return false;
        }
      }
    }
    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return 0;
    }
  });

  if (!info) {
    return <div>Category not found</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-[#96865d]">Home</Link>
            <ChevronRight size={16} />
            {subcategory ? (
              <>
                <Link to={`/category/${category}`} className="hover:text-[#96865d]">
                  {categoryInfo[category || '']?.name || category}
                </Link>
                <ChevronRight size={16} />
                <span className="text-gray-900">{subcategoryInfo?.name || subcategory.replace(/-/g, ' ')}</span>
              </>
            ) : (
              <span className="text-gray-900">{info?.name || category}</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Category Banner */}
      <div className="relative h-64 lg:h-80 overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="absolute inset-0">
          <img
            src={info.banner}
            alt={info.name}
            className="w-full h-full object-contain lg:object-cover object-center mix-blend-multiply opacity-80"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/40 to-black/30 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-3xl lg:text-4xl font-light mb-2">{info.name}</h1>
            <p className="text-lg max-w-2xl mx-auto">{info.description}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-50 border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-white"
              >
                <Filter size={18} />
                <span>Filters</span>
              </button>
              <p className="text-sm text-gray-600">
                {sortedProducts.length} Products
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  const params = new URLSearchParams(searchParams);
                  params.set('sort', e.target.value);
                  setSearchParams(params);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#96865d]"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              
              <div className="hidden lg:flex items-center gap-2 border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-[#96865d] text-white' : 'bg-white'}`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-[#96865d] text-white' : 'bg-white'}`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Filters</h2>
                {Object.keys(selectedFilters).length > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-[#96865d] hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              {filters.map((section) => (
                <div key={section.key} className="border-b pb-4 mb-4">
                  <button
                    onClick={() => toggleSection(section.key)}
                    className="flex items-center justify-between w-full text-left py-2"
                  >
                    <span className="font-medium">{section.title}</span>
                    {expandedSections[section.key] ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>
                  
                  {(expandedSections[section.key] !== false) && (
                    <div className="mt-2 space-y-2">
                      {section.options.map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 cursor-pointer hover:text-[#96865d]"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFilters[section.key]?.includes(option.value) || false}
                            onChange={() => toggleFilter(section.key, option.value)}
                            className="rounded border-gray-300 text-[#96865d] focus:ring-[#96865d]"
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#96865d]"></div>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No products found matching your filters.</p>
                <button
                  onClick={clearAllFilters}
                  className="mt-4 px-6 py-2 bg-[#96865d] text-white rounded-lg hover:bg-[#7d6f4e]"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6"
                : "space-y-4"
              }>
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} viewMode={viewMode} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-white overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-lg font-medium">Filters</h2>
              <button onClick={() => setShowMobileFilters(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4">
              {Object.keys(selectedFilters).length > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="w-full mb-4 px-4 py-2 bg-gray-100 rounded-lg text-sm"
                >
                  Clear All Filters
                </button>
              )}
              
              {filters.map((section) => (
                <div key={section.key} className="border-b pb-4 mb-4">
                  <button
                    onClick={() => toggleSection(section.key)}
                    className="flex items-center justify-between w-full text-left py-2"
                  >
                    <span className="font-medium">{section.title}</span>
                    {expandedSections[section.key] ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>
                  
                  {(expandedSections[section.key] !== false) && (
                    <div className="mt-2 space-y-2">
                      {section.options.map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFilters[section.key]?.includes(option.value) || false}
                            onChange={() => toggleFilter(section.key, option.value)}
                            className="rounded border-gray-300 text-[#96865d] focus:ring-[#96865d]"
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="sticky bottom-0 bg-white border-t p-4">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full py-3 bg-[#96865d] text-white rounded-lg hover:bg-[#7d6f4e]"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}