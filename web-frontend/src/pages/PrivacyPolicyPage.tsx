import { useEffect } from 'react';

export default function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <section>
            <p className="text-gray-600 mb-4">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            
            <p className="text-gray-700">
              At TRIPUND Lifestyle, we are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website 
              and make purchases from our online store.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-medium mb-2">Personal Information</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Name and contact information (email address, phone number)</li>
                  <li>Billing and shipping addresses</li>
                  <li>Payment information (processed securely through Razorpay)</li>
                  <li>Order history and preferences</li>
                  <li>Account credentials (username and encrypted password)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Automatically Collected Information</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>IP address and browser information</li>
                  <li>Device information and operating system</li>
                  <li>Browsing behavior and pages visited</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Process and fulfill your orders</li>
              <li>Send order confirmations and shipping updates</li>
              <li>Respond to customer service requests and inquiries</li>
              <li>Personalize your shopping experience</li>
              <li>Send promotional emails about new products and special offers (with your consent)</li>
              <li>Improve our website and services</li>
              <li>Prevent fraudulent transactions and ensure security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
            <p className="text-gray-700 mb-3">
              We do not sell, trade, or rent your personal information to third parties. We may share your information with:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Payment processors (Razorpay) to process transactions</li>
              <li>Shipping partners to deliver your orders</li>
              <li>Service providers who assist in operating our website</li>
              <li>Law enforcement agencies when required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
            <p className="text-gray-700">
              We implement appropriate technical and organizational measures to protect your personal information against 
              unauthorized access, alteration, disclosure, or destruction. This includes:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 mt-3">
              <li>SSL encryption for data transmission</li>
              <li>Secure payment processing through Razorpay</li>
              <li>Regular security audits and updates</li>
              <li>Limited access to personal information by authorized personnel only</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Cookies</h2>
            <p className="text-gray-700">
              We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
              You can control cookie preferences through your browser settings. However, disabling cookies may 
              limit certain features of our website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
            <p className="text-gray-700 mb-3">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Access and receive a copy of your personal information</li>
              <li>Correct or update your personal information</li>
              <li>Request deletion of your personal information</li>
              <li>Opt-out of marketing communications</li>
              <li>Lodge a complaint with relevant data protection authorities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Children's Privacy</h2>
            <p className="text-gray-700">
              Our website is not intended for children under 18 years of age. We do not knowingly collect personal 
              information from children. If you believe we have collected information from a child, please contact us 
              immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. 
              We will notify you of any material changes by posting the updated policy on our website with a new "Last Updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Contact Us</h2>
            <p className="text-gray-700 mb-3">
              If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">TRIPUND Lifestyle</p>
              <p className="text-gray-700">Email: privacy@tripundlifestyle.com</p>
              <p className="text-gray-700">Phone: +91 98765 43210</p>
              <p className="text-gray-700">Address: Mumbai, Maharashtra, India</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}