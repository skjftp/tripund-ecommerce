import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = 'https://tripund-backend-665685012221.asia-south1.run.app/api/v1';

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  subject: z.string().min(5, 'Subject is required'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
  type: z.enum(['general', 'order', 'artisan', 'partnership']),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactContent {
  title?: string;
  subtitle?: string;
  description?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  businessHours?: string[];
  mapEmbedUrl?: string;
}

interface FAQ {
  id?: string;
  question: string;
  answer: string;
  order?: number;
}

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<ContactContent>({});
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [contentLoading, setContentLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      type: 'general',
    },
  });

  useEffect(() => {
    fetchContent();
    fetchFAQs();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await axios.get(`${API_URL}/content/contact`);
      if (response.data?.content?.data) {
        setContent(response.data.content.data);
      }
    } catch (error) {
      console.error('Error fetching contact content:', error);
    } finally {
      setContentLoading(false);
    }
  };

  const fetchFAQs = async () => {
    try {
      const response = await axios.get(`${API_URL}/content/faqs/list`);
      if (response.data) {
        setFaqs(response.data.slice(0, 4)); // Show only first 4 FAQs on contact page
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      // Use default FAQs if API fails
      setFaqs([
        {
          question: 'How long does shipping take?',
          answer: 'Domestic orders typically arrive within 5-7 business days. International shipping takes 10-15 business days.',
        },
        {
          question: 'Do you offer custom orders?',
          answer: 'Yes! We work with our artisans to create custom pieces. Contact us for more details.',
        },
        {
          question: 'What is your return policy?',
          answer: 'We offer a 30-day return policy for unused items in original condition. Custom orders are non-refundable.',
        },
        {
          question: 'How can I become an artisan partner?',
          answer: 'We\'re always looking for talented artisans. Please fill out the contact form selecting "Partnership" as the inquiry type.',
        },
      ]);
    }
  };

  const onSubmit = async (data: ContactFormData) => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual API endpoint when available
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      reset();
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Use dynamic content if available, otherwise use defaults
  const pageTitle = content.title || 'Get in Touch';
  const pageSubtitle = content.subtitle || 'We\'d love to hear from you. Let us know how we can help!';
  const email = content.email || 'support@tripundlifestyle.com';
  const phone = content.phone || '+91 98765 43210';
  const address = content.address || {
    street: '123 Artisan Street',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    pincode: '110001',
  };
  const businessHours = content.businessHours && content.businessHours.length > 0 
    ? content.businessHours 
    : ['Monday - Saturday', '10:00 AM - 7:00 PM IST'];

  const contactInfo = [
    {
      icon: Phone,
      title: 'Phone',
      content: phone,
      subtext: businessHours[0] || 'Mon-Sat, 10 AM - 7 PM IST',
    },
    {
      icon: Mail,
      title: 'Email',
      content: email,
      subtext: 'We reply within 24 hours',
    },
    {
      icon: MapPin,
      title: 'Office',
      content: address.street || '123 Artisan Street',
      subtext: `${address.city || 'New Delhi'}, ${address.country || 'India'} ${address.pincode || '110001'}`,
    },
    {
      icon: Clock,
      title: 'Business Hours',
      content: businessHours[0]?.split(':')[0] || 'Monday - Saturday',
      subtext: businessHours[0]?.includes(':') ? businessHours[0].split(':').slice(1).join(':').trim() : '10:00 AM - 7:00 PM IST',
    },
  ];

  if (contentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-primary-600 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-white">
          <h1 className="text-4xl font-bold mb-4">{pageTitle}</h1>
          <p className="text-xl text-primary-100">
            {pageSubtitle}
          </p>
        </div>
      </section>

      {/* Contact Info Grid */}
      <section className="py-12 -mt-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <info.icon className="text-primary-600" size={24} />
                </div>
                <h3 className="font-semibold mb-1">{info.title}</h3>
                <p className="text-gray-800">{info.content}</p>
                <p className="text-sm text-gray-600 mt-1">{info.subtext}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center mb-6">
                <MessageSquare className="text-primary-600 mr-3" size={28} />
                <h2 className="text-2xl font-bold">Send us a Message</h2>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name *
                    </label>
                    <input
                      {...register('name')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="John Doe"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      {...register('email')}
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="john@example.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      {...register('phone')}
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Inquiry Type *
                    </label>
                    <select
                      {...register('type')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="order">Order Support</option>
                      <option value="artisan">Artisan Information</option>
                      <option value="partnership">Partnership</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <input
                    {...register('subject')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="How can we help you?"
                  />
                  {errors.subject && (
                    <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message *
                  </label>
                  <textarea
                    {...register('message')}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Tell us more about your inquiry..."
                  />
                  {errors.message && (
                    <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send size={18} className="mr-2" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Map & FAQs */}
            <div>
              {/* Map Placeholder */}
              <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                <h3 className="text-xl font-semibold mb-4">Visit Our Office</h3>
                {content.mapEmbedUrl ? (
                  <iframe
                    src={content.mapEmbedUrl}
                    className="w-full aspect-video rounded-lg"
                    allowFullScreen
                    loading="lazy"
                  />
                ) : (
                  <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Map Integration Coming Soon</p>
                  </div>
                )}
                <div className="mt-4">
                  <p className="text-gray-600">
                    <strong>TRIPUND Lifestyle</strong><br />
                    {address.street}<br />
                    {address.city}, {address.state}<br />
                    {address.country} {address.pincode}
                  </p>
                  {content.whatsapp && (
                    <p className="mt-2 text-gray-600">
                      WhatsApp: {content.whatsapp}
                    </p>
                  )}
                </div>
              </div>

              {/* FAQs */}
              <div className="bg-white rounded-lg shadow-md p-8">
                <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div key={faq.id || index} className="border-b pb-4 last:border-b-0">
                      <h4 className="font-medium text-gray-800 mb-2">{faq.question}</h4>
                      <p className="text-gray-600 text-sm">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4">Connect With Us</h3>
          <p className="text-gray-600 mb-6">
            {content.description || 'Follow us on social media for updates, new arrivals, and artisan stories'}
          </p>
          <div className="flex justify-center space-x-6">
            <a href="#" className="text-gray-600 hover:text-primary-600">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="#" className="text-gray-600 hover:text-primary-600">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/>
              </svg>
            </a>
            <a href="#" className="text-gray-600 hover:text-primary-600">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}