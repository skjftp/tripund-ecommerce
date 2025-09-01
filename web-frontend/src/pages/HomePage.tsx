import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, Truck, Shield, Award, RefreshCw, Heart, ShoppingBag } from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { fetchProducts } from '../store/slices/productSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import { addToCartWithSync } from '../store/slices/cartSlice';
import { addToWishlistWithSync, removeFromWishlistWithSync } from '../store/slices/wishlistSlice';
import toast from 'react-hot-toast';
import ProductGrid from '../components/product/ProductGrid';
import HeroSection from '../components/common/HeroSection';
import CategoryIcons from '../components/common/CategoryIcons';

export default function HomePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { featuredProducts, loading } = useSelector((state: RootState) => state.products);
  
  // Filter featured products to only show in-stock items
  const inStockFeaturedProducts = useMemo(() => {
    return featuredProducts.filter(product => {
      // Check if product has stock
      if (product.has_variants && product.variants && product.variants.length > 0) {
        // For variant products, check if any variant has stock
        return product.variants.some((variant: any) => variant.stock_quantity > 0 && variant.available);
      } else {
        // For simple products, check main stock
        return (product.stock_quantity || 0) > 0;
      }
    });
  }, [featuredProducts]);
  
  // Helper function to check if product is out of stock
  const isProductOutOfStock = (product: any) => {
    if (product.has_variants && product.variants && product.variants.length > 0) {
      // For variant products, out of stock if ALL variants are out of stock
      return !product.variants.some((variant: any) => variant.stock_quantity > 0 && variant.available);
    } else {
      // For simple products, check main stock
      return (product.stock_quantity || 0) <= 0;
    }
  };
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [selectedVariantProduct, setSelectedVariantProduct] = useState<any>(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  useEffect(() => {
    // Fetch all products initially
    dispatch(fetchProducts({ limit: 40 }));
    // Fetch categories for showcase
    dispatch(fetchCategories());
  }, [dispatch]);

  const { categories } = useSelector((state: RootState) => state.categories);

  const handleAddToCart = (product: any) => {
    if (product.has_variants && product.variants && product.variants.length > 0) {
      setSelectedVariantProduct(product);
      setShowVariantModal(true);
    } else {
      dispatch(addToCartWithSync(product, 1));
      toast.success('Added to cart!');
    }
  };

  const handleWishlistToggle = (product: any) => {
    const isInWishlist = wishlistItems.some((item: any) => item.id === product.id);
    if (isInWishlist) {
      dispatch(removeFromWishlistWithSync(product.id));
      toast.success('Removed from wishlist');
    } else {
      dispatch(addToWishlistWithSync(product));
      toast.success('Added to wishlist!');
    }
  };

  // Memoize categoryShowcase to ensure proper re-rendering when categories change
  const categoryShowcase = useMemo(() => {
    if (categories.length > 0) {
      return categories.map((category) => ({
        id: category.id,
        name: category.name,
        image: category.image || `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop`,
        description: category.description || `Discover beautiful ${category.name.toLowerCase()} products`,
        slug: category.slug
      }));
    }
    return [
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
  }, [categories]); // Dependency array ensures recalculation when categories change

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
                key={`${category.id}-${category.image}`}
                to={`/category/${category.slug}`}
                className="group relative overflow-hidden bg-white rounded-lg shadow-sm hover:shadow-xl transition-all duration-300"
                onMouseEnter={() => setHoveredCategory(category.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <div className="aspect-square overflow-hidden relative">
                  <img
                    key={category.image}
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {/* Enhanced gradient overlay for better text visibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
                  {/* Additional scrim for text area */}
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                  <h3 className="text-xl font-medium mb-1 text-white drop-shadow-lg">{category.name}</h3>
                  <p className="text-sm text-white/95 drop-shadow">{category.description}</p>
                  <div className={`mt-3 inline-flex items-center text-sm font-medium text-white transition-all duration-300 ${
                    hoveredCategory === category.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
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
            {inStockFeaturedProducts.slice(0, 8).map((product) => (
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
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleWishlistToggle(product);
                      }}
                      className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                    >
                      <Heart 
                        size={18} 
                        className={wishlistItems.some(item => item.id === product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'} 
                      />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                    >
                      <ShoppingBag size={18} className="text-gray-600" />
                    </button>
                  </div>
                  
                  {/* Sale Badge */}
                  {((product.sale_price && product.sale_price < product.price) || 
                    (product.discount_percentage && product.discount_percentage > 0)) && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 text-xs font-medium rounded">
                      {product.discount_percentage ? 
                        `${product.discount_percentage}% OFF` : 
                        `SALE`}
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</h3>
                  <div className="mt-2 flex items-center gap-2">
                    {product.sale_price && product.sale_price < product.price ? (
                      <>
                        <span className="text-lg font-medium text-gray-900">
                          ₹{product.sale_price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                        {product.discount_percentage && product.discount_percentage > 0 && (
                          <span className="text-xs text-green-600 font-medium">
                            {product.discount_percentage}% OFF
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-lg font-medium text-gray-900">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
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

      {/* Variant Selection Modal */}
      {showVariantModal && selectedVariantProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">{selectedVariantProduct.name}</h3>
              <button
                onClick={() => {
                  setShowVariantModal(false);
                  setSelectedVariantProduct(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <VariantSelector
              product={selectedVariantProduct}
              onSelect={(variant) => {
                const cartProduct = {
                  ...selectedVariantProduct,
                  price: variant.price,
                  sale_price: variant.sale_price,
                  sku: variant.sku,
                  variant_info: {
                    color: variant.color,
                    size: variant.size,
                    variant_id: variant.id
                  }
                };
                dispatch(addToCartWithSync(cartProduct, 1));
                toast.success('Added to cart!');
                setShowVariantModal(false);
                setSelectedVariantProduct(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Simplified Variant Selector Component
function VariantSelector({ product, onSelect }: { product: any; onSelect: (variant: any) => void }) {
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  // Find cheapest variant as default
  React.useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      const availableVariants = product.variants.filter((v: any) => v.available);
      if (availableVariants.length > 0) {
        const cheapest = availableVariants.reduce((min: any, variant: any) => {
          const variantPrice = variant.sale_price || variant.price;
          const minPrice = min.sale_price || min.price;
          return variantPrice < minPrice ? variant : min;
        });
        
        setSelectedColor(cheapest.color || '');
        setSelectedSize(cheapest.size || '');
        setSelectedVariant(cheapest);
      }
    }
  }, [product]);

  React.useEffect(() => {
    if (selectedColor || selectedSize) {
      const variant = product.variants?.find((v: any) => 
        v.available &&
        (!selectedColor || v.color === selectedColor) &&
        (!selectedSize || v.size === selectedSize)
      );
      setSelectedVariant(variant);
    }
  }, [selectedColor, selectedSize, product]);

  const availableColors: string[] = [...new Set(product.variants?.filter((v: any) => v.available).map((v: any) => v.color).filter(Boolean))] as string[];
  const availableSizes: string[] = [...new Set(product.variants?.filter((v: any) => v.available).map((v: any) => v.size).filter(Boolean))] as string[];

  return (
    <div className="space-y-4">
      {availableColors.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">Color</label>
          <div className="flex gap-2 flex-wrap">
            {availableColors.map((color: string) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`px-3 py-1 border rounded ${
                  selectedColor === color ? 'border-primary-600 bg-primary-50' : 'border-gray-300'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {availableSizes.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">Size</label>
          <div className="flex gap-2 flex-wrap">
            {availableSizes.map((size: string) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-3 py-1 border rounded ${
                  selectedSize === size ? 'border-primary-600 bg-primary-50' : 'border-gray-300'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedVariant && (
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold">
              ₹{(selectedVariant.sale_price || selectedVariant.price).toLocaleString('en-IN')}
            </span>
            {selectedVariant.sale_price && selectedVariant.price > selectedVariant.sale_price && (
              <span className="text-sm text-gray-500 line-through">
                ₹{selectedVariant.price.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <button
            onClick={() => onSelect(selectedVariant)}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 transition-colors"
          >
            Add to Cart
          </button>
        </div>
      )}
    </div>
  );
}