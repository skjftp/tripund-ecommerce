import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, Truck, Shield, Award, RefreshCw, Heart, ShoppingBag } from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { fetchProducts } from '../store/slices/productSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import ProductGrid from '../components/product/ProductGrid';
import HeroSection from '../components/common/HeroSection';
import CategoryIcons from '../components/common/CategoryIcons';

export default function HomePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { featuredProducts, loading } = useSelector((state: RootState) => state.products);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  useEffect(() => {
    // Fetch all products initially
    dispatch(fetchProducts({ limit: 40 }));
    // Fetch categories for showcase
    dispatch(fetchCategories());
  }, [dispatch]);

  const { categories, loading: categoriesLoading, error: categoriesError } = useSelector((state: RootState) => state.categories);

  // Debug logging
  console.log('Categories state:', { categories, categoriesLoading, categoriesError });
  console.log('Categories length:', categories.length);
  console.log('Categories data:', categories);

  // Map categories to showcase format with fallback for empty categories
  const categoryShowcase = categories.length > 0 
    ? categories.slice(0, 6).map(category => ({
        id: category.id,
        name: category.name,
        image: category.image || `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop`,
        description: category.description || `Discover beautiful ${category.name.toLowerCase()} products`,
        slug: category.slug
      }))
    : [
        {
          id: 'divine-collections',
          name: 'Divine Collections',
          image: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&h=600&fit=crop',
          description: 'Sacred idols & spiritual décor',
          slug: 'divine-collections'
        },
        {
          id: 'wall-decor',
          name: 'Wall Décor',
          image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop',
          description: 'Artistic wall hangings & paintings',
          slug: 'wall-decor'
        },
        {
          id: 'festivals',
          name: 'Festival Collection',
          image: 'https://images.unsplash.com/photo-1596079890744-c1a0462d0975?w=600&h=600&fit=crop',
          description: 'Traditional torans & decorations',
          slug: 'festivals'
        },
        {
          id: 'lighting',
          name: 'Lighting',
          image: 'https://images.unsplash.com/photo-1565636192335-5398080bf22f?w=600&h=600&fit=crop',
          description: 'Diyas, candles & lanterns',
          slug: 'lighting'
        },
        {
          id: 'home-accent',
          name: 'Home Accents',
          image: 'https://images.unsplash.com/photo-1524634126442-357e0eac3c14?w=600&h=600&fit=crop',
          description: 'Cushions, vases & showpieces',
          slug: 'home-accent'
        },
        {
          id: 'gifting',
          name: 'Gifting',
          image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&h=600&fit=crop',
          description: 'Curated gift sets & hampers',
          slug: 'gifting'
        }
      ];

  return (
    <div className="min-h-screen bg-white">
      {/* Category Icons - Above Hero */}
      <CategoryIcons />
      
      {/* Hero Section */}
      <HeroSection />

      {/* Category Showcase - Nestasia Style */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">Shop by Category</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our curated collections of authentic handcrafted Indian art and home décor
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {categoryShowcase.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="group relative overflow-hidden bg-white rounded-lg shadow-sm hover:shadow-xl transition-all duration-300"
                onMouseEnter={() => setHoveredCategory(category.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-xl font-medium mb-1">{category.name}</h3>
                  <p className="text-sm opacity-90">{category.description}</p>
                  <div className={`mt-3 flex items-center text-sm font-medium transition-all duration-300 ${
                    hoveredCategory === category.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}>
                    Shop Now <ArrowRight size={16} className="ml-2" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products - Nestasia Style */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">Featured Products</h2>
            <p className="text-gray-600">Handpicked selections from our artisan partners</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 8).map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group"
              >
                <div className="relative overflow-hidden bg-gray-100 rounded-lg">
                  <div className="aspect-square">
                    <img
                      src={product.images?.[0] || 'https://via.placeholder.com/400'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 transition-colors">
                      <Heart size={18} className="text-gray-600" />
                    </button>
                    <button className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 transition-colors">
                      <ShoppingBag size={18} className="text-gray-600" />
                    </button>
                  </div>
                  
                  {/* Sale Badge */}
                  {product.discount_percentage && product.discount_percentage > 0 && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 text-xs font-medium rounded">
                      {product.discount_percentage}% OFF
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</h3>
                  <div className="mt-2 flex items-center gap-2">
                    {product.discount_percentage ? (
                      <>
                        <span className="text-lg font-medium text-gray-900">
                          ₹{Math.round(product.price * (1 - product.discount_percentage / 100))}
                        </span>
                        <span className="text-sm text-gray-500 line-through">₹{product.price}</span>
                      </>
                    ) : (
                      <span className="text-lg font-medium text-gray-900">₹{product.price}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link
              to="/products"
              className="inline-block bg-[#96865d] text-white px-8 py-3 font-medium hover:bg-[#7d6f4e] transition-colors duration-300"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Story Section - Nestasia Style */}
      <section className="py-20 bg-gradient-to-br from-[#f8f5f0] to-[#f0ebe4]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6">
                The TRIPUND Story
              </h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                We bridge the gap between traditional Indian artisans and modern homes. 
                Each piece in our collection tells a story of heritage, skill, and passion 
                passed down through generations.
              </p>
              <p className="text-gray-700 leading-relaxed mb-8">
                From the intricate Madhubani paintings of Bihar to the divine brass idols 
                of Tamil Nadu, we bring you authentic handcrafted treasures that transform 
                your living spaces into galleries of cultural art.
              </p>
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <div className="text-3xl font-light text-[#96865d] mb-2">500+</div>
                  <div className="text-sm text-gray-600">Artisan Partners</div>
                </div>
                <div>
                  <div className="text-3xl font-light text-[#96865d] mb-2">15</div>
                  <div className="text-sm text-gray-600">Indian States</div>
                </div>
                <div>
                  <div className="text-3xl font-light text-[#96865d] mb-2">100%</div>
                  <div className="text-sm text-gray-600">Handcrafted</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1604709265542-3402eabb8aa6?w=600&h=700&fit=crop"
                alt="Indian Craftsmanship"
                className="rounded-lg shadow-xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-lg shadow-xl max-w-xs">
                <p className="text-sm italic text-gray-600">
                  "Supporting 500+ artisan families across India, preserving traditional crafts for future generations"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section - Nestasia Style */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-light text-white mb-4">Stay in Touch</h2>
          <p className="text-gray-400 mb-8">
            Subscribe to receive updates on new collections and exclusive offers
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-3 rounded-full bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#96865d]"
            />
            <button
              type="submit"
              className="px-8 py-3 bg-[#96865d] text-white rounded-full font-medium hover:bg-[#7d6f4e] transition-colors duration-300"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* Features Bar - Nestasia Style */}
      <section className="bg-white border-t py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <Truck className="mx-auto text-[#96865d] mb-3" size={32} />
              <h3 className="font-medium text-gray-900 mb-1">Free Shipping</h3>
              <p className="text-sm text-gray-600">On orders above ₹999</p>
            </div>
            <div className="text-center">
              <Shield className="mx-auto text-[#96865d] mb-3" size={32} />
              <h3 className="font-medium text-gray-900 mb-1">Secure Payment</h3>
              <p className="text-sm text-gray-600">100% secure transactions</p>
            </div>
            <div className="text-center">
              <Award className="mx-auto text-[#96865d] mb-3" size={32} />
              <h3 className="font-medium text-gray-900 mb-1">Authentic Products</h3>
              <p className="text-sm text-gray-600">Handcrafted with love</p>
            </div>
            <div className="text-center">
              <RefreshCw className="mx-auto text-[#96865d] mb-3" size={32} />
              <h3 className="font-medium text-gray-900 mb-1">Easy Returns</h3>
              <p className="text-sm text-gray-600">30 days return policy</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}