import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import axios from 'axios';
import tripundLogo from '../../assets/tripund-logo.png';

const API_URL = 'https://tripund-backend-665685012221.asia-south1.run.app/api/v1';

interface FooterContent {
  companyName?: string;
  companyDescription?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };
  copyrightText?: string;
}

export default function Footer() {
  const [content, setContent] = useState<FooterContent>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await axios.get(`${API_URL}/content/footer`);
      if (response.data) {
        // API returns data directly from Firestore document
        setContent(response.data);
      }
    } catch (error) {
      console.error('Error fetching footer content:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use dynamic content if available, otherwise use defaults
  const companyName = content.companyName || 'TRIPUND';
  const companyDescription = content.companyDescription || 'Premium Indian artisan marketplace specializing in handcrafted wall decor, spiritual art, and cultural artifacts.';
  const email = content.email || 'support@tripundlifestyle.com';
  const phone = content.phone || '+91 98765 43210';
  const address = content.address || {
    street: '123 Artisan Street',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    pincode: '110001',
  };
  const socialLinks = content.socialLinks || {};
  const copyrightText = content.copyrightText || '© 2024 TRIPUND Lifestyle. All rights reserved.';
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="inline-block mb-4">
              <img 
                src={tripundLogo} 
                alt="TRIPUND LIFESTYLE" 
                className="h-12 w-auto max-w-[180px] object-contain brightness-0 invert"
              />
            </Link>
            <p className="text-gray-400">
              {companyDescription}
            </p>
            <div className="flex space-x-4 mt-4">
              {socialLinks.facebook && (
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <Facebook size={20} />
                </a>
              )}
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <Instagram size={20} />
                </a>
              )}
              {socialLinks.twitter && (
                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <Twitter size={20} />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-gray-400 hover:text-white">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-gray-400 hover:text-white">
                  Categories
                </Link>
              </li>
              <li>
                <Link to="/artisans" className="text-gray-400 hover:text-white">
                  Our Artisans
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-gray-400 hover:text-white">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-gray-400 hover:text-white">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-white">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-gray-400 hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-conditions" className="text-gray-400 hover:text-white">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-gray-400">
                <Mail size={16} />
                <span>{email}</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-400">
                <Phone size={16} />
                <span>{phone}</span>
              </li>
              <li className="flex items-start space-x-2 text-gray-400">
                <MapPin size={16} className="mt-1" />
                <span>
                  {address.street},<br />
                  {address.city}, {address.country} {address.pincode}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>{copyrightText}</p>
          <div className="mt-2 space-x-4">
            <Link to="/privacy-policy" className="hover:text-white">
              Privacy Policy
            </Link>
            <Link to="/terms-conditions" className="hover:text-white">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}