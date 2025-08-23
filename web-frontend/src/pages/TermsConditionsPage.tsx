import { useEffect } from 'react';

export default function TermsConditionsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Terms & Conditions</h1>
        
        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <section>
            <p className="text-gray-600 mb-4">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            
            <p className="text-gray-700">
              Welcome to TRIPUND Lifestyle. These Terms and Conditions ("Terms") govern your use of our website and services. 
              By accessing or using our website, you agree to be bound by these Terms. If you do not agree with any part of 
              these Terms, please do not use our website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">1. General Terms</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>You must be at least 18 years old to use our services</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You agree to provide accurate and complete information when creating an account or making a purchase</li>
              <li>We reserve the right to refuse service to anyone for any reason at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Products and Services</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-medium mb-2">Product Information</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>We strive to display accurate product descriptions, images, and prices</li>
                  <li>Product colors may vary slightly due to monitor settings</li>
                  <li>We reserve the right to limit quantities and correct any errors in pricing or descriptions</li>
                  <li>All products are subject to availability</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Handcrafted Items</h3>
                <p className="text-gray-700">
                  As our products are handcrafted, slight variations in design, color, and dimensions may occur. 
                  These variations are part of the unique charm of handmade items and are not considered defects.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Pricing and Payment</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>All prices are listed in Indian Rupees (INR) and include applicable taxes</li>
              <li>We accept various payment methods through our secure payment processor Razorpay</li>
              <li>Payment must be received in full before order processing</li>
              <li>We reserve the right to change prices without prior notice</li>
              <li>Promotional offers and discounts cannot be combined unless explicitly stated</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Shipping and Delivery</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>We ship to addresses within India</li>
              <li>Shipping charges are calculated based on order value and delivery location</li>
              <li>Estimated delivery times are provided but not guaranteed</li>
              <li>Risk of loss and title for items pass to you upon delivery</li>
              <li>We are not responsible for delays caused by shipping carriers or customs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Returns and Refunds</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Returns are accepted within 7 days of delivery for unused items in original packaging</li>
              <li>Custom or personalized items cannot be returned unless defective</li>
              <li>Return shipping costs are the responsibility of the customer unless the item is defective</li>
              <li>Refunds will be processed within 7-10 business days after receipt of returned items</li>
              <li>We reserve the right to refuse returns that do not meet our return policy requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Cancellations</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Orders can be cancelled within 24 hours of placement</li>
              <li>Once an order has been shipped, it cannot be cancelled</li>
              <li>Custom or personalized orders cannot be cancelled once production has begun</li>
              <li>Cancellation requests must be made through our customer service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Intellectual Property</h2>
            <p className="text-gray-700">
              All content on this website, including but not limited to text, graphics, logos, images, and software, 
              is the property of TRIPUND Lifestyle and is protected by intellectual property laws. You may not reproduce, 
              distribute, or create derivative works without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. User Conduct</h2>
            <p className="text-gray-700 mb-3">You agree not to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Use the website for any illegal or unauthorized purpose</li>
              <li>Violate any laws in your jurisdiction</li>
              <li>Transmit any malicious code or viruses</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Harass, abuse, or harm other users or our staff</li>
              <li>Use false or misleading information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
            <p className="text-gray-700">
              To the fullest extent permitted by law, TRIPUND Lifestyle shall not be liable for any indirect, incidental, 
              special, consequential, or punitive damages arising from your use of our website or products. Our total 
              liability shall not exceed the amount paid by you for the specific product or service in question.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Indemnification</h2>
            <p className="text-gray-700">
              You agree to indemnify and hold harmless TRIPUND Lifestyle, its officers, directors, employees, and agents 
              from any claims, damages, losses, or expenses arising from your use of our website or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Governing Law</h2>
            <p className="text-gray-700">
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising 
              from these Terms or your use of our website shall be subject to the exclusive jurisdiction of the courts 
              in Mumbai, Maharashtra, India.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Changes to Terms</h2>
            <p className="text-gray-700">
              We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting 
              to the website. Your continued use of our website after any changes indicates your acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">13. Contact Information</h2>
            <p className="text-gray-700 mb-3">
              For questions about these Terms and Conditions, please contact us at:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">TRIPUND Lifestyle</p>
              <p className="text-gray-700">Email: support@tripundlifestyle.com</p>
              <p className="text-gray-700">Phone: +91 98765 43210</p>
              <p className="text-gray-700">Address: Mumbai, Maharashtra, India</p>
            </div>
          </section>

          <section className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              By using our website, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}