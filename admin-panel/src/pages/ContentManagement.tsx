import React, { useState, useEffect } from 'react';
import { Save, Eye, Smartphone, Monitor, Plus, Trash2, Edit2, ChevronDown, ChevronRight } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://tripund-backend-665685012221.asia-south1.run.app/api/v1';

interface FAQ {
  id?: string;
  question: string;
  answer: string;
  order: number;
  active: boolean;
}

interface ContentSection {
  id: string;
  title: string;
  icon: React.ReactElement;
  expanded: boolean;
}

export default function ContentManagement() {
  const [activeSection, setActiveSection] = useState('about');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  // Content states
  const [aboutContent, setAboutContent] = useState({
    title: '',
    subtitle: '',
    mainContent: '',
    mission: '',
    vision: '',
    values: [{ title: '', description: '' }],
    stats: [{ number: '', label: '' }],
    whyChooseUs: [''],
    teamMembers: [{ name: '', position: '', bio: '', image: '' }],
    missionImage: '',
    heroImage: ''
  });

  const [footerContent, setFooterContent] = useState({
    companyName: 'TRIPUND',
    companyDescription: 'Premium Indian artisan marketplace specializing in handcrafted wall decor, spiritual art, and cultural artifacts.',
    email: 'support@tripundlifestyle.com',
    phone: '+91 98765 43210',
    address: {
      street: '123 Artisan Street',
      city: 'New Delhi',
      state: 'Delhi',
      country: 'India',
      pincode: '110001'
    },
    socialLinks: {
      facebook: 'https://facebook.com/tripundlifestyle',
      instagram: 'https://instagram.com/tripundlifestyle',
      twitter: 'https://twitter.com/tripundlifestyle',
      linkedin: '',
      youtube: ''
    },
    copyrightText: '© 2024 TRIPUND Lifestyle. All rights reserved.',
    quickLinks: [
      { title: 'All Products', url: '/products' },
      { title: 'Categories', url: '/categories' },
      { title: 'Our Artisans', url: '/artisans' },
      { title: 'About Us', url: '/about' }
    ],
    customerService: [
      { title: 'Contact Us', url: '/contact' },
      { title: 'Shipping Info', url: '/shipping' },
      { title: 'Returns & Exchanges', url: '/returns' },
      { title: 'FAQ', url: '/faq' }
    ]
  });

  const [contactContent, setContactContent] = useState({
    title: 'Get in Touch',
    subtitle: "We'd love to hear from you. Let us know how we can help!",
    description: 'Have questions about our products or want to know more about our artisan partners? Feel free to reach out!',
    email: 'support@tripundlifestyle.com',
    phone: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
    address: {
      street: '123 Artisan Street, Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      country: 'India',
      pincode: '110001'
    },
    businessHours: [
      'Monday - Friday: 10:00 AM - 7:00 PM IST',
      'Saturday: 10:00 AM - 4:00 PM IST',
      'Sunday: Closed'
    ],
    mapEmbedUrl: '',
    socialMediaText: 'Follow us on social media for updates, new arrivals, and artisan stories'
  });

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);

  const sections: ContentSection[] = [
    { id: 'about', title: 'About Page', icon: <Monitor size={20} />, expanded: false },
    { id: 'footer', title: 'Footer Content', icon: <Monitor size={20} />, expanded: false },
    { id: 'contact', title: 'Contact Page', icon: <Monitor size={20} />, expanded: false },
    { id: 'faqs', title: 'FAQs', icon: <Monitor size={20} />, expanded: false }
  ];

  useEffect(() => {
    fetchContent();
    fetchFAQs();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      // Fetch all content types
      const [aboutRes, footerRes, contactRes] = await Promise.all([
        axios.get(`${API_URL}/content/about`).catch(() => null),
        axios.get(`${API_URL}/content/footer`).catch(() => null),
        axios.get(`${API_URL}/content/contact`).catch(() => null)
      ]);

      if (aboutRes?.data?.content?.data) {
        const data = aboutRes.data.content.data;
        // Ensure values have the right structure
        if (data.values && Array.isArray(data.values)) {
          // Check if values are strings (old format) or objects (new format)
          if (typeof data.values[0] === 'string') {
            data.values = data.values.map((v: string) => ({ title: v, description: '' }));
          }
        }
        // Ensure other arrays exist
        data.teamMembers = data.teamMembers || [];
        data.whyChooseUs = data.whyChooseUs || [];
        data.stats = data.stats || [];
        setAboutContent(data);
      } else {
        // Set default content if nothing fetched
        setAboutContent({
          title: 'Our Story',
          subtitle: 'TRIPUND Lifestyle bridges the gap between traditional artisans and modern homes, bringing you authentic handcrafted treasures from around the world.',
          mainContent: `At TRIPUND Lifestyle, we believe that every home deserves unique, meaningful pieces that tell a story. Our mission is to connect discerning customers with talented artisans from India, El Salvador, Mexico, and beyond.\n\nWe curate a collection of handcrafted wall decor, spiritual art, and cultural artifacts that celebrate tradition while embracing contemporary aesthetics. Each piece in our collection is carefully selected for its quality, cultural significance, and the skill of the artisan who created it.\n\nWhen you purchase from TRIPUND, you're not just buying a product – you're supporting traditional crafts, preserving cultural heritage, and bringing home a piece of art that has been crafted with love and dedication.`,
          mission: 'To connect discerning customers with talented artisans from India, El Salvador, Mexico, and beyond.',
          vision: 'To be the leading platform for authentic handcrafted art and decor.',
          values: [
            { title: 'Quality Craftsmanship', description: 'Every piece is handcrafted with meticulous attention to detail by skilled artisans.' },
            { title: 'Artisan Empowerment', description: 'We provide fair wages and sustainable livelihoods to traditional craftspeople.' },
            { title: 'Cultural Preservation', description: 'Keeping ancient art forms alive for future generations to appreciate and enjoy.' },
            { title: 'Sustainable Practices', description: 'Eco-friendly materials and processes that respect our planet and communities.' }
          ],
          stats: [
            { number: '500+', label: 'Artisan Partners' },
            { number: '10,000+', label: 'Happy Customers' },
            { number: '15+', label: 'Countries Served' },
            { number: '5,000+', label: 'Unique Products' }
          ],
          whyChooseUs: [
            'Direct from artisan partnerships',
            'Authentic handcrafted products',
            'Supporting traditional crafts',
            'Quality assured products'
          ],
          teamMembers: [
            { name: 'Priya Sharma', position: 'Founder & CEO', bio: '', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400' },
            { name: 'Rajesh Kumar', position: 'Head of Artisan Relations', bio: '', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400' },
            { name: 'Anita Patel', position: 'Creative Director', bio: '', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400' }
          ],
          missionImage: 'https://images.unsplash.com/photo-1524634126442-357e0eac3c14?w=800',
          heroImage: ''
        });
      }
      if (footerRes?.data?.content?.data) {
        setFooterContent(footerRes.data.content.data);
      } else {
        // Set default footer content
        setFooterContent({
          companyName: 'TRIPUND',
          companyDescription: 'Premium Indian artisan marketplace specializing in handcrafted wall decor, spiritual art, and cultural artifacts.',
          email: 'support@tripundlifestyle.com',
          phone: '+91 98765 43210',
          address: {
            street: '123 Artisan Street',
            city: 'New Delhi',
            state: 'Delhi',
            country: 'India',
            pincode: '110001'
          },
          socialLinks: {
            facebook: 'https://facebook.com/tripundlifestyle',
            instagram: 'https://instagram.com/tripundlifestyle',
            twitter: 'https://twitter.com/tripundlifestyle',
            linkedin: '',
            youtube: ''
          },
          copyrightText: '© 2024 TRIPUND Lifestyle. All rights reserved.',
          quickLinks: [
            { title: 'All Products', url: '/products' },
            { title: 'Categories', url: '/categories' },
            { title: 'Our Artisans', url: '/artisans' },
            { title: 'About Us', url: '/about' }
          ],
          customerService: [
            { title: 'Contact Us', url: '/contact' },
            { title: 'Shipping Info', url: '/shipping' },
            { title: 'Returns & Exchanges', url: '/returns' },
            { title: 'FAQ', url: '/faq' }
          ]
        });
      }
      if (contactRes?.data?.content?.data) {
        setContactContent(contactRes.data.content.data);
      } else {
        // Set default contact content
        setContactContent({
          title: 'Get in Touch',
          subtitle: "We'd love to hear from you. Let us know how we can help!",
          description: 'Have questions about our products or want to know more about our artisan partners? Feel free to reach out!',
          email: 'support@tripundlifestyle.com',
          phone: '+91 98765 43210',
          whatsapp: '+91 98765 43210',
          address: {
            street: '123 Artisan Street, Connaught Place',
            city: 'New Delhi',
            state: 'Delhi',
            country: 'India',
            pincode: '110001'
          },
          businessHours: [
            'Monday - Saturday: 10:00 AM - 7:00 PM IST',
            'Sunday: Closed'
          ],
          mapEmbedUrl: '',
          socialMediaText: 'Follow us on social media for updates, new arrivals, and artisan stories'
        });
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFAQs = async () => {
    try {
      const response = await axios.get(`${API_URL}/content/faqs/list`);
      setFaqs(response.data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      // Set default FAQs
      setFaqs([
        {
          id: '1',
          question: 'How long does shipping take?',
          answer: 'Domestic orders typically arrive within 5-7 business days. International shipping takes 10-15 business days.',
          order: 1,
          active: true
        },
        {
          id: '2',
          question: 'Do you offer custom orders?',
          answer: 'Yes! We work with our artisans to create custom pieces. Contact us for more details.',
          order: 2,
          active: true
        },
        {
          id: '3',
          question: 'What is your return policy?',
          answer: 'We offer a 30-day return policy for unused items in original condition. Custom orders are non-refundable.',
          order: 3,
          active: true
        },
        {
          id: '4',
          question: 'How can I become an artisan partner?',
          answer: "We're always looking for talented artisans. Please fill out the contact form selecting 'Partnership' as the inquiry type.",
          order: 4,
          active: true
        },
        {
          id: '5',
          question: 'What makes TRIPUND products unique?',
          answer: 'All our products are handcrafted by skilled artisans from various parts of India, ensuring each piece is unique and carries the authentic touch of traditional craftsmanship.',
          order: 5,
          active: true
        },
        {
          id: '6',
          question: 'Do you offer international shipping?',
          answer: 'Yes, we ship worldwide. International shipping charges and delivery times vary by location. Please check our shipping policy for more details.',
          order: 6,
          active: true
        },
        {
          id: '7',
          question: 'How do I care for handcrafted products?',
          answer: 'Care instructions vary by product type. Each product comes with specific care guidelines. Generally, avoid direct sunlight and moisture for most handicrafts.',
          order: 7,
          active: true
        },
        {
          id: '8',
          question: 'Can I request custom designs?',
          answer: "Yes, we accept custom orders for many of our product categories. Please contact us with your requirements and we'll connect you with the right artisan.",
          order: 8,
          active: true
        }
      ]);
    }
  };

  const saveContent = async (type: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        toast.error('Please login to continue');
        return;
      }

      let contentData: any = {};
      
      switch(type) {
        case 'about':
          // Clean up empty values before saving
          const cleanedAbout = {
            ...aboutContent,
            values: aboutContent.values.filter(v => v.title),
            stats: aboutContent.stats.filter(s => s.number && s.label),
            teamMembers: aboutContent.teamMembers.filter(m => m.name),
            whyChooseUs: aboutContent.whyChooseUs.filter(w => w)
          };
          contentData = { data: cleanedAbout };
          break;
        case 'footer':
          contentData = { data: footerContent };
          break;
        case 'contact':
          contentData = { data: contactContent };
          break;
      }

      await axios.put(
        `${API_URL}/admin/content/${type}`,
        {
          type,
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Page`,
          content: contentData,
          published: true
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} content updated successfully`);
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Failed to save content');
    }
  };

  const saveFAQ = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        toast.error('Please login to continue');
        return;
      }

      if (editingFaq?.id) {
        // Update existing FAQ
        await axios.put(
          `${API_URL}/admin/faqs/${editingFaq.id}`,
          editingFaq,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        toast.success('FAQ updated successfully');
      } else if (editingFaq) {
        // Create new FAQ
        await axios.post(
          `${API_URL}/admin/faqs`,
          editingFaq,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        toast.success('FAQ created successfully');
      }

      setEditingFaq(null);
      fetchFAQs();
    } catch (error) {
      console.error('Error saving FAQ:', error);
      toast.error('Failed to save FAQ');
    }
  };

  const deleteFAQ = async (id: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        toast.error('Please login to continue');
        return;
      }

      if (confirm('Are you sure you want to delete this FAQ?')) {
        await axios.delete(`${API_URL}/admin/faqs/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('FAQ deleted successfully');
        fetchFAQs();
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast.error('Failed to delete FAQ');
    }
  };

  const renderAboutEditor = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Page Title</label>
        <input
          type="text"
          value={aboutContent.title}
          onChange={(e) => setAboutContent({ ...aboutContent, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
        <input
          type="text"
          value={aboutContent.subtitle}
          onChange={(e) => setAboutContent({ ...aboutContent, subtitle: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Main Content</label>
        <textarea
          value={aboutContent.mainContent}
          onChange={(e) => setAboutContent({ ...aboutContent, mainContent: e.target.value })}
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mission</label>
          <textarea
            value={aboutContent.mission}
            onChange={(e) => setAboutContent({ ...aboutContent, mission: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Vision</label>
          <textarea
            value={aboutContent.vision}
            onChange={(e) => setAboutContent({ ...aboutContent, vision: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Values</label>
        {aboutContent.values.map((value, index) => (
          <div key={index} className="border border-gray-200 rounded-md p-3 mb-2">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Value Title (e.g., Quality Craftsmanship)"
                value={value.title}
                onChange={(e) => {
                  const newValues = [...aboutContent.values];
                  newValues[index].title = e.target.value;
                  setAboutContent({ ...aboutContent, values: newValues });
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={() => {
                  const newValues = aboutContent.values.filter((_, i) => i !== index);
                  setAboutContent({ ...aboutContent, values: newValues });
                }}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
              >
                <Trash2 size={20} />
              </button>
            </div>
            <textarea
              placeholder="Value Description"
              value={value.description}
              onChange={(e) => {
                const newValues = [...aboutContent.values];
                newValues[index].description = e.target.value;
                setAboutContent({ ...aboutContent, values: newValues });
              }}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        ))}
        <button
          onClick={() => setAboutContent({ ...aboutContent, values: [...aboutContent.values, { title: '', description: '' }] })}
          className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
        >
          <Plus size={16} /> Add Value
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Statistics</label>
        {aboutContent.stats.map((stat, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Number (e.g., 500+)"
              value={stat.number}
              onChange={(e) => {
                const newStats = [...aboutContent.stats];
                newStats[index].number = e.target.value;
                setAboutContent({ ...aboutContent, stats: newStats });
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="text"
              placeholder="Label (e.g., Artisan Partners)"
              value={stat.label}
              onChange={(e) => {
                const newStats = [...aboutContent.stats];
                newStats[index].label = e.target.value;
                setAboutContent({ ...aboutContent, stats: newStats });
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={() => {
                const newStats = aboutContent.stats.filter((_, i) => i !== index);
                setAboutContent({ ...aboutContent, stats: newStats });
              }}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
        <button
          onClick={() => setAboutContent({ ...aboutContent, stats: [...aboutContent.stats, { number: '', label: '' }] })}
          className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
        >
          <Plus size={16} /> Add Statistic
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Why Choose Us</label>
        {aboutContent.whyChooseUs.map((reason, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={reason}
              onChange={(e) => {
                const newReasons = [...aboutContent.whyChooseUs];
                newReasons[index] = e.target.value;
                setAboutContent({ ...aboutContent, whyChooseUs: newReasons });
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={() => {
                const newReasons = aboutContent.whyChooseUs.filter((_, i) => i !== index);
                setAboutContent({ ...aboutContent, whyChooseUs: newReasons });
              }}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
        <button
          onClick={() => setAboutContent({ ...aboutContent, whyChooseUs: [...aboutContent.whyChooseUs, ''] })}
          className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
        >
          <Plus size={16} /> Add Reason
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Team Members</label>
        {aboutContent.teamMembers.map((member, index) => (
          <div key={index} className="border border-gray-200 rounded-md p-3 mb-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
              <input
                type="text"
                placeholder="Name"
                value={member.name}
                onChange={(e) => {
                  const newMembers = [...aboutContent.teamMembers];
                  newMembers[index].name = e.target.value;
                  setAboutContent({ ...aboutContent, teamMembers: newMembers });
                }}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                placeholder="Position"
                value={member.position}
                onChange={(e) => {
                  const newMembers = [...aboutContent.teamMembers];
                  newMembers[index].position = e.target.value;
                  setAboutContent({ ...aboutContent, teamMembers: newMembers });
                }}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <input
              type="text"
              placeholder="Image URL"
              value={member.image}
              onChange={(e) => {
                const newMembers = [...aboutContent.teamMembers];
                newMembers[index].image = e.target.value;
                setAboutContent({ ...aboutContent, teamMembers: newMembers });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
            />
            <div className="flex items-center justify-between">
              <textarea
                placeholder="Bio (optional)"
                value={member.bio}
                onChange={(e) => {
                  const newMembers = [...aboutContent.teamMembers];
                  newMembers[index].bio = e.target.value;
                  setAboutContent({ ...aboutContent, teamMembers: newMembers });
                }}
                rows={2}
                className="flex-1 mr-2 px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={() => {
                  const newMembers = aboutContent.teamMembers.filter((_, i) => i !== index);
                  setAboutContent({ ...aboutContent, teamMembers: newMembers });
                }}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={() => setAboutContent({ ...aboutContent, teamMembers: [...aboutContent.teamMembers, { name: '', position: '', bio: '', image: '' }] })}
          className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
        >
          <Plus size={16} /> Add Team Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Hero Image URL</label>
          <input
            type="text"
            value={aboutContent.heroImage}
            onChange={(e) => setAboutContent({ ...aboutContent, heroImage: e.target.value })}
            placeholder="Image URL for hero section"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mission Section Image URL</label>
          <input
            type="text"
            value={aboutContent.missionImage}
            onChange={(e) => setAboutContent({ ...aboutContent, missionImage: e.target.value })}
            placeholder="Image URL for mission section"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <button
        onClick={() => saveContent('about')}
        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
      >
        <Save size={20} /> Save About Content
      </button>
    </div>
  );

  const renderFooterEditor = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
          <input
            type="text"
            value={footerContent.companyName}
            onChange={(e) => setFooterContent({ ...footerContent, companyName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Copyright Text</label>
          <input
            type="text"
            value={footerContent.copyrightText}
            onChange={(e) => setFooterContent({ ...footerContent, copyrightText: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Company Description</label>
        <textarea
          value={footerContent.companyDescription}
          onChange={(e) => setFooterContent({ ...footerContent, companyDescription: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={footerContent.email}
            onChange={(e) => setFooterContent({ ...footerContent, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input
            type="text"
            value={footerContent.phone}
            onChange={(e) => setFooterContent({ ...footerContent, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Street"
            value={footerContent.address.street}
            onChange={(e) => setFooterContent({ 
              ...footerContent, 
              address: { ...footerContent.address, street: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="text"
            placeholder="City"
            value={footerContent.address.city}
            onChange={(e) => setFooterContent({ 
              ...footerContent, 
              address: { ...footerContent.address, city: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="text"
            placeholder="State"
            value={footerContent.address.state}
            onChange={(e) => setFooterContent({ 
              ...footerContent, 
              address: { ...footerContent.address, state: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="text"
            placeholder="Pincode"
            value={footerContent.address.pincode}
            onChange={(e) => setFooterContent({ 
              ...footerContent, 
              address: { ...footerContent.address, pincode: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Social Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="url"
            placeholder="Facebook URL"
            value={footerContent.socialLinks.facebook}
            onChange={(e) => setFooterContent({ 
              ...footerContent, 
              socialLinks: { ...footerContent.socialLinks, facebook: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="url"
            placeholder="Instagram URL"
            value={footerContent.socialLinks.instagram}
            onChange={(e) => setFooterContent({ 
              ...footerContent, 
              socialLinks: { ...footerContent.socialLinks, instagram: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="url"
            placeholder="Twitter URL"
            value={footerContent.socialLinks.twitter}
            onChange={(e) => setFooterContent({ 
              ...footerContent, 
              socialLinks: { ...footerContent.socialLinks, twitter: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="url"
            placeholder="LinkedIn URL"
            value={footerContent.socialLinks.linkedin}
            onChange={(e) => setFooterContent({ 
              ...footerContent, 
              socialLinks: { ...footerContent.socialLinks, linkedin: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="url"
            placeholder="YouTube URL"
            value={footerContent.socialLinks.youtube}
            onChange={(e) => setFooterContent({ 
              ...footerContent, 
              socialLinks: { ...footerContent.socialLinks, youtube: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <button
        onClick={() => saveContent('footer')}
        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
      >
        <Save size={20} /> Save Footer Content
      </button>
    </div>
  );

  const renderContactEditor = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Page Title</label>
        <input
          type="text"
          value={contactContent.title}
          onChange={(e) => setContactContent({ ...contactContent, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
        <input
          type="text"
          value={contactContent.subtitle}
          onChange={(e) => setContactContent({ ...contactContent, subtitle: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={contactContent.description}
          onChange={(e) => setContactContent({ ...contactContent, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={contactContent.email}
            onChange={(e) => setContactContent({ ...contactContent, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input
            type="text"
            value={contactContent.phone}
            onChange={(e) => setContactContent({ ...contactContent, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
          <input
            type="text"
            value={contactContent.whatsapp}
            onChange={(e) => setContactContent({ ...contactContent, whatsapp: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Business Hours</label>
        {contactContent.businessHours.map((hour, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={hour}
              onChange={(e) => {
                const newHours = [...contactContent.businessHours];
                newHours[index] = e.target.value;
                setContactContent({ ...contactContent, businessHours: newHours });
              }}
              placeholder="e.g., Monday - Friday: 9:00 AM - 6:00 PM"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={() => {
                const newHours = contactContent.businessHours.filter((_, i) => i !== index);
                setContactContent({ ...contactContent, businessHours: newHours });
              }}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
        <button
          onClick={() => setContactContent({ 
            ...contactContent, 
            businessHours: [...contactContent.businessHours, ''] 
          })}
          className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
        >
          <Plus size={16} /> Add Business Hours
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Map Embed URL (Google Maps iframe URL)</label>
        <input
          type="text"
          value={contactContent.mapEmbedUrl}
          onChange={(e) => setContactContent({ ...contactContent, mapEmbedUrl: e.target.value })}
          placeholder="https://www.google.com/maps/embed?..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
        <p className="text-xs text-gray-500 mt-1">Get the embed URL from Google Maps by clicking Share → Embed a map</p>
      </div>

      <button
        onClick={() => saveContent('contact')}
        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
      >
        <Save size={20} /> Save Contact Content
      </button>
    </div>
  );

  const renderFAQEditor = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Frequently Asked Questions</h3>
        <button
          onClick={() => setEditingFaq({ question: '', answer: '', order: faqs.length + 1, active: true })}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} /> Add FAQ
        </button>
      </div>

      {editingFaq && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
            <input
              type="text"
              value={editingFaq.question}
              onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Answer</label>
            <textarea
              value={editingFaq.answer}
              onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveFAQ}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Save FAQ
            </button>
            <button
              onClick={() => setEditingFaq(null)}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {faqs.map((faq) => (
          <div key={faq.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{faq.question}</h4>
                <p className="text-gray-600 mt-1">{faq.answer}</p>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => setEditingFaq(faq)}
                  className="text-blue-600 hover:bg-blue-50 p-2 rounded"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => faq.id && deleteFAQ(faq.id)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPreview = () => {
    const previewWidth = previewMode === 'mobile' ? 'max-w-sm' : 'max-w-4xl';
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-medium">Preview - {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h3>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                >
                  <Monitor size={20} />
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                >
                  <Smartphone size={20} />
                </button>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
            <div className={`mx-auto ${previewWidth} border rounded-lg bg-gray-50`}>
              {activeSection === 'about' && (
                <div className="p-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{aboutContent.title}</h1>
                  <p className="text-lg text-gray-600 mb-6">{aboutContent.subtitle}</p>
                  <p className="text-gray-700 mb-8">{aboutContent.mainContent}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Mission</h3>
                      <p className="text-gray-600">{aboutContent.mission}</p>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Vision</h3>
                      <p className="text-gray-600">{aboutContent.vision}</p>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">Our Values</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aboutContent.values.filter(v => v.title).map((value, index) => (
                        <div key={index}>
                          <h4 className="font-semibold text-gray-800 mb-1">{value.title}</h4>
                          <p className="text-sm text-gray-600">{value.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {aboutContent.teamMembers && aboutContent.teamMembers.filter(m => m.name).length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold mb-4">Meet Our Team</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {aboutContent.teamMembers.filter(m => m.name).map((member, index) => (
                          <div key={index} className="text-center">
                            {member.image && (
                              <img src={member.image} alt={member.name} className="w-20 h-20 rounded-full mx-auto mb-2 object-cover" />
                            )}
                            <h5 className="font-semibold">{member.name}</h5>
                            <p className="text-sm text-gray-600">{member.position}</p>
                            {member.bio && <p className="text-xs text-gray-500 mt-1">{member.bio}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4 text-center">
                    {aboutContent.stats.filter(s => s.number).map((stat, index) => (
                      <div key={index}>
                        <div className="text-2xl font-bold text-blue-600">{stat.number}</div>
                        <div className="text-sm text-gray-600">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'footer' && (
                <div className="bg-gray-900 text-white p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="text-xl font-bold mb-3">{footerContent.companyName}</h3>
                      <p className="text-gray-400 text-sm">{footerContent.companyDescription}</p>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Contact Info</h4>
                      <p className="text-gray-400 text-sm">{footerContent.email}</p>
                      <p className="text-gray-400 text-sm">{footerContent.phone}</p>
                      <p className="text-gray-400 text-sm mt-2">
                        {footerContent.address.street}<br />
                        {footerContent.address.city}, {footerContent.address.state}<br />
                        {footerContent.address.pincode}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Follow Us</h4>
                      <div className="flex gap-3">
                        {footerContent.socialLinks.facebook && <span className="text-gray-400">FB</span>}
                        {footerContent.socialLinks.instagram && <span className="text-gray-400">IG</span>}
                        {footerContent.socialLinks.twitter && <span className="text-gray-400">TW</span>}
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-800 mt-6 pt-6 text-center text-gray-400 text-sm">
                    {footerContent.copyrightText}
                  </div>
                </div>
              )}

              {activeSection === 'contact' && (
                <div className="p-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{contactContent.title}</h1>
                  <p className="text-lg text-gray-600 mb-4">{contactContent.subtitle}</p>
                  <p className="text-gray-700 mb-8">{contactContent.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
                      <div className="space-y-3 text-gray-600">
                        <p>Email: {contactContent.email}</p>
                        <p>Phone: {contactContent.phone}</p>
                        <p>WhatsApp: {contactContent.whatsapp}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Business Hours</h3>
                      <div className="space-y-2 text-gray-600">
                        {contactContent.businessHours.filter(h => h).map((hour, index) => (
                          <p key={index}>{hour}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'faqs' && (
                <div className="p-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h1>
                  <div className="space-y-4">
                    {faqs.map((faq, index) => (
                      <div key={index} className="border-b pb-4">
                        <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                        <p className="text-gray-600">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
        <button
          onClick={() => setShowPreview(true)}
          className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 flex items-center gap-2"
        >
          <Eye size={20} /> Preview
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-medium mb-4">Content Sections</h3>
            <div className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading content...</p>
              </div>
            ) : (
              <>
                {activeSection === 'about' && renderAboutEditor()}
                {activeSection === 'footer' && renderFooterEditor()}
                {activeSection === 'contact' && renderContactEditor()}
                {activeSection === 'faqs' && renderFAQEditor()}
              </>
            )}
          </div>
        </div>
      </div>

      {showPreview && renderPreview()}
    </div>
  );
}