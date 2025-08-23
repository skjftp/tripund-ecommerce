import { useEffect } from 'react';

interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export default function MetaTags({ 
  title = 'TRIPUND Lifestyle - Premium Indian Handicrafts & Home Decor',
  description = 'Discover exquisite handcrafted products from skilled Indian artisans. Shop unique home decor, divine collections, wall art, festive decorations, and more.',
  image = 'https://storage.googleapis.com/tripund-product-images/og-image.jpg',
  url = 'https://tripundlifestyle.com/',
  type = 'website'
}: MetaTagsProps) {
  
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update or create meta tags
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };
    
    // Update primary meta tags
    updateMetaTag('title', title);
    updateMetaTag('description', description);
    
    // Update Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:type', type, true);
    
    // Update Twitter tags
    updateMetaTag('twitter:title', title, true);
    updateMetaTag('twitter:description', description, true);
    updateMetaTag('twitter:image', image, true);
    updateMetaTag('twitter:url', url, true);
    
  }, [title, description, image, url, type]);
  
  return null;
}