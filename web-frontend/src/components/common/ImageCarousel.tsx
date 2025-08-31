import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  productName: string;
  className?: string;
  showThumbnails?: boolean;
}

export default function ImageCarousel({ images, productName, className = '', showThumbnails = false }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center w-full h-full ${className}`}>
        <span className="text-gray-400">No image available</span>
      </div>
    );
  }

  const goToPrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex(index);
  };

  if (images.length === 1) {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <img
          src={images[0]}
          alt={productName}
          className="w-full h-full object-cover object-center"
          style={{ minWidth: '100%', minHeight: '100%' }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop';
          }}
        />
      </div>
    );
  }

  return (
    <div className={`relative group w-full h-full ${className}`}>
      {/* Main Image */}
      <div className="relative overflow-hidden w-full h-full">
        <img
          src={images[currentIndex]}
          alt={`${productName} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover object-center transition-opacity duration-300"
          style={{ minWidth: '100%', minHeight: '100%' }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop';
          }}
        />
        
        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/70"
          aria-label="Previous image"
        >
          <ChevronLeft size={20} />
        </button>
        
        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/70"
          aria-label="Next image"
        >
          <ChevronRight size={20} />
        </button>

        {/* Image Counter */}
        <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnail Navigation - Only show if explicitly enabled */}
      {showThumbnails && images.length > 1 && (
        <div className="mt-3 flex space-x-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={(e) => goToSlide(index, e)}
              className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                index === currentIndex
                  ? 'border-primary-500'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={image}
                alt={`${productName} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop';
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Dots Indicator - Only show with thumbnails or if explicitly wanted */}
      {showThumbnails && images.length > 1 && images.length <= 5 && (
        <div className="mt-4 flex justify-center space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => goToSlide(index, e)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-primary-500' : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}