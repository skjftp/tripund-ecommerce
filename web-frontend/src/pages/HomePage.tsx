import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, Truck, Shield, Award, RefreshCw } from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { fetchProducts } from '../store/slices/productSlice';
import ProductGrid from '../components/product/ProductGrid';

export default function HomePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { featuredProducts, loading } = useSelector((state: RootState) => state.products);

  useEffect(() => {
    dispatch(fetchProducts({ featured: true, limit: 8 }));
  }, [dispatch]);

  return (
    <div>
      <section className="relative h-[600px] bg-gradient-to-r from-primary-600 to-primary-800">
        <div className="absolute inset-0 bg-black opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
          <div className="text-white max-w-2xl">
            <h1 className="text-5xl font-bold mb-4">
              Discover Authentic Indian Artisanship
            </h1>
            <p className="text-xl mb-8">
              Premium handcrafted wall decor, spiritual art, and cultural artifacts from
              talented artisans across India and beyond.
            </p>
            <div className="space-x-4">
              <Link
                to="/products"
                className="inline-flex items-center bg-white text-primary-600 px-6 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors"
              >
                Shop Now
                <ArrowRight className="ml-2" size={20} />
              </Link>
              <Link
                to="/artisans"
                className="inline-flex items-center bg-transparent border-2 border-white text-white px-6 py-3 rounded-md font-semibold hover:bg-white hover:text-primary-600 transition-colors"
              >
                Meet Our Artisans
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="text-primary-600" size={28} />
              </div>
              <h3 className="font-semibold mb-2">Free Shipping</h3>
              <p className="text-gray-600 text-sm">On orders over ₹5,000</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-primary-600" size={28} />
              </div>
              <h3 className="font-semibold mb-2">Secure Payment</h3>
              <p className="text-gray-600 text-sm">100% secure transactions</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="text-primary-600" size={28} />
              </div>
              <h3 className="font-semibold mb-2">Authentic Products</h3>
              <p className="text-gray-600 text-sm">Directly from artisans</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="text-primary-600" size={28} />
              </div>
              <h3 className="font-semibold mb-2">Easy Returns</h3>
              <p className="text-gray-600 text-sm">30-day return policy</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
            <p className="text-gray-600">
              Handpicked artisanal pieces that celebrate tradition and craftsmanship
            </p>
          </div>
          <ProductGrid products={featuredProducts} loading={loading} />
          <div className="text-center mt-12">
            <Link
              to="/products"
              className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-primary-700 transition-colors"
            >
              View All Products
              <ArrowRight className="ml-2" size={20} />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Our Story</h2>
              <p className="text-gray-600 mb-4">
                TRIPUND Lifestyle bridges the gap between traditional artisans and modern
                homes. We work directly with skilled craftspeople from India, El Salvador,
                Mexico, and other regions to bring you authentic, handcrafted pieces that
                tell a story.
              </p>
              <p className="text-gray-600 mb-6">
                Each product in our collection is carefully selected for its quality,
                cultural significance, and the skill of the artisan who created it. When
                you purchase from TRIPUND, you're not just buying a product – you're
                supporting traditional crafts and the livelihoods of talented artisans.
              </p>
              <Link
                to="/about"
                className="inline-flex items-center text-primary-600 font-semibold hover:text-primary-700"
              >
                Learn More About Us
                <ArrowRight className="ml-2" size={20} />
              </Link>
            </div>
            <div className="relative h-96">
              <img
                src="https://images.unsplash.com/photo-1524634126442-357e0eac3c14?w=800"
                alt="Artisan at work"
                className="w-full h-full object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}