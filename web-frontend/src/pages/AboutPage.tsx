import { Link } from 'react-router-dom';
import { ArrowRight, Award, Users, Globe, Heart } from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      icon: Award,
      title: 'Quality Craftsmanship',
      description: 'Every piece is handcrafted with meticulous attention to detail by skilled artisans.',
    },
    {
      icon: Users,
      title: 'Artisan Empowerment',
      description: 'We provide fair wages and sustainable livelihoods to traditional craftspeople.',
    },
    {
      icon: Globe,
      title: 'Cultural Preservation',
      description: 'Keeping ancient art forms alive for future generations to appreciate and enjoy.',
    },
    {
      icon: Heart,
      title: 'Sustainable Practices',
      description: 'Eco-friendly materials and processes that respect our planet and communities.',
    },
  ];

  const stats = [
    { number: '500+', label: 'Artisan Partners' },
    { number: '10,000+', label: 'Happy Customers' },
    { number: '15+', label: 'Countries Served' },
    { number: '5,000+', label: 'Unique Products' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-primary-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our Story
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              TRIPUND Lifestyle bridges the gap between traditional artisans and modern homes,
              bringing you authentic handcrafted treasures from around the world.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-gray-600 mb-4">
                At TRIPUND Lifestyle, we believe that every home deserves unique, meaningful pieces
                that tell a story. Our mission is to connect discerning customers with talented
                artisans from India, El Salvador, Mexico, and beyond.
              </p>
              <p className="text-gray-600 mb-4">
                We curate a collection of handcrafted wall decor, spiritual art, and cultural
                artifacts that celebrate tradition while embracing contemporary aesthetics. Each
                piece in our collection is carefully selected for its quality, cultural significance,
                and the skill of the artisan who created it.
              </p>
              <p className="text-gray-600">
                When you purchase from TRIPUND, you're not just buying a product – you're supporting
                traditional crafts, preserving cultural heritage, and bringing home a piece of art
                that has been crafted with love and dedication.
              </p>
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

      {/* Values Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              These core values guide everything we do at TRIPUND Lifestyle
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon className="text-primary-600" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center text-white">
                <div className="text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-primary-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Passionate individuals dedicated to bringing you the finest artisanal products
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Priya Sharma',
                role: 'Founder & CEO',
                image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
              },
              {
                name: 'Rajesh Kumar',
                role: 'Head of Artisan Relations',
                image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
              },
              {
                name: 'Anita Patel',
                role: 'Creative Director',
                image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
              },
            ].map((member, index) => (
              <div key={index} className="text-center">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-xl font-semibold">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Join Our Journey</h2>
          <p className="text-gray-600 mb-8">
            Discover unique handcrafted pieces that bring culture and artistry into your home
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/products"
              className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700"
            >
              Shop Collection
              <ArrowRight className="ml-2" size={20} />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center bg-white text-primary-600 border-2 border-primary-600 px-6 py-3 rounded-md hover:bg-primary-50"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}