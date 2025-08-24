import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import api from '../services/api';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  active: boolean;
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const response = await api.get('/content/faqs/list');
      const faqData = response.data || [];
      setFaqs(faqData.filter((faq: FAQ) => faq.active));
    } catch (error) {
      console.error('Failed to fetch FAQs:', error);
      // Set default FAQs if API fails
      setFaqs(getDefaultFAQs());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultFAQs = (): FAQ[] => [
    {
      id: '1',
      question: 'What makes TRIPUND products unique?',
      answer: 'All our products are handcrafted by skilled Indian artisans using traditional techniques passed down through generations. Each piece is unique and tells a story of Indian heritage and craftsmanship.',
      category: 'General',
      order: 1,
      active: true,
    },
    {
      id: '2',
      question: 'How long does shipping take?',
      answer: 'We typically ship within 2-3 business days. Delivery times vary based on location: Metro cities (3-5 days), Other cities (5-7 days), Remote areas (7-10 days).',
      category: 'Shipping',
      order: 2,
      active: true,
    },
    {
      id: '3',
      question: 'What is your return policy?',
      answer: 'We accept returns within 7 days of delivery for unused items in original packaging. Custom or personalized items cannot be returned unless defective. Return shipping costs are borne by the customer.',
      category: 'Returns',
      order: 3,
      active: true,
    },
    {
      id: '4',
      question: 'Do you offer Cash on Delivery?',
      answer: 'Yes, we offer Cash on Delivery for orders up to ₹10,000. Additional charges may apply based on the order value and delivery location.',
      category: 'Payment',
      order: 4,
      active: true,
    },
    {
      id: '5',
      question: 'How can I track my order?',
      answer: 'Once your order is shipped, you will receive a tracking number via email and SMS. You can use this number to track your order on our website or the courier partner\'s website.',
      category: 'Orders',
      order: 5,
      active: true,
    },
    {
      id: '6',
      question: 'Are the product colors accurate?',
      answer: 'We strive to display accurate colors, but slight variations may occur due to monitor settings and lighting conditions. Handcrafted items may also have natural variations in color and pattern.',
      category: 'Products',
      order: 6,
      active: true,
    },
    {
      id: '7',
      question: 'Can I cancel my order?',
      answer: 'Orders can be cancelled within 24 hours of placement. Once shipped, orders cannot be cancelled. Custom or personalized orders cannot be cancelled once production begins.',
      category: 'Orders',
      order: 7,
      active: true,
    },
    {
      id: '8',
      question: 'Do you ship internationally?',
      answer: 'Currently, we only ship within India. We are working on expanding our services to international markets soon.',
      category: 'Shipping',
      order: 8,
      active: true,
    },
  ];

  const categories = ['all', ...Array.from(new Set(faqs.map(faq => faq.category)))];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => a.order - b.order);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading FAQs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Frequently Asked Questions</h1>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">No FAQs found matching your search.</p>
            </div>
          ) : (
            filteredFAQs.map(faq => (
              <div key={faq.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <button
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                    {!expandedItems.includes(faq.id) && (
                      <p className="text-sm text-gray-500 mt-1">
                        {faq.category}
                      </p>
                    )}
                  </div>
                  {expandedItems.includes(faq.id) ? (
                    <ChevronUp className="text-gray-400" size={20} />
                  ) : (
                    <ChevronDown className="text-gray-400" size={20} />
                  )}
                </button>
                {expandedItems.includes(faq.id) && (
                  <div className="px-6 pb-4 border-t border-gray-100">
                    <p className="text-gray-700 mt-3 whitespace-pre-wrap">{faq.answer}</p>
                    <span className="inline-block mt-3 px-3 py-1 bg-primary-50 text-primary-700 text-xs rounded-full">
                      {faq.category}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-primary-50 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-3">Still have questions?</h2>
          <p className="text-gray-700 mb-6">
            Can't find the answer you're looking for? Please reach out to our customer support team.
          </p>
          <a
            href="/contact"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}