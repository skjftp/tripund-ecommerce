import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroSlide {
  id: number;
  image: string;
  mobileImage?: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  overlayColor?: string;
}

const heroSlides: HeroSlide[] = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=1600&h=600&fit=crop',
    mobileImage: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=800&h=800&fit=crop',
    title: 'Divine Collections',
    subtitle: 'Bring spirituality home with our handcrafted idols',
    buttonText: 'Shop Now',
    buttonLink: '/category/divine-collections',
    overlayColor: 'from-black/50 to-black/20'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1596079890744-c1a0462d0975?w=1600&h=600&fit=crop',
    mobileImage: 'https://images.unsplash.com/photo-1596079890744-c1a0462d0975?w=800&h=800&fit=crop',
    title: 'Festival Décor',
    subtitle: 'Transform your space with traditional torans & decorations',
    buttonText: 'Explore',
    buttonLink: '/category/festivals',
    overlayColor: 'from-black/40 to-transparent'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=600&fit=crop',
    mobileImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop',
    title: 'Wall Art & Décor',
    subtitle: 'Elevate your walls with artistic masterpieces',
    buttonText: 'View Collection',
    buttonLink: '/category/wall-decor',
    overlayColor: 'from-black/50 to-black/20'
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1524634126442-357e0eac3c14?w=1600&h=600&fit=crop',
    mobileImage: 'https://images.unsplash.com/photo-1524634126442-357e0eac3c14?w=800&h=800&fit=crop',
    title: 'Home Accents',
    subtitle: 'Curated collection of premium home accessories',
    buttonText: 'Discover',
    buttonLink: '/category/home-accent',
    overlayColor: 'from-black/40 to-transparent'
  }
];

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-play carousel
  useEffect(() => {
    const timer = setInterval(() => {
      handleNextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [currentSlide]);

  const handleNextSlide = () => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handlePrevSlide = () => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const goToSlide = (index: number) => {
    if (!isTransitioning && index !== currentSlide) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide(index);
        setIsTransitioning(false);
      }, 300);
    }
  };

  return (
    <div className="relative w-full h-[420px] lg:h-[490px] overflow-hidden bg-gray-100">
      {/* Slides */}
      {heroSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-500 ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Background Image */}
          <picture>
            <source
              media="(max-width: 768px)"
              srcSet={slide.mobileImage || slide.image}
            />
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
          </picture>

          {/* Overlay Gradient */}
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.overlayColor || 'from-black/50 to-transparent'}`} />

          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white px-4 max-w-3xl mx-auto">
              <h1 className={`text-3xl md:text-4xl lg:text-5xl font-light mb-3 tracking-wider transform transition-all duration-700 ${
                index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}>
                {slide.title}
              </h1>
              <p className={`text-base md:text-lg mb-6 font-light transform transition-all duration-700 delay-100 ${
                index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}>
                {slide.subtitle}
              </p>
              <Link
                to={slide.buttonLink}
                className={`inline-block bg-white text-gray-900 px-8 py-3 text-sm uppercase tracking-wider font-medium hover:bg-gray-100 transition-all duration-300 transform ${
                  index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: '200ms' }}
              >
                {slide.buttonText}
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={handlePrevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-900 p-3 rounded-full transition-all duration-200 opacity-0 hover:opacity-100 lg:opacity-70"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={handleNextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-900 p-3 rounded-full transition-all duration-200 opacity-0 hover:opacity-100 lg:opacity-70"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 ${
              index === currentSlide
                ? 'w-12 h-1 bg-white'
                : 'w-6 h-1 bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}