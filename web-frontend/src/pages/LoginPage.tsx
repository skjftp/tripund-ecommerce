import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Smartphone, ArrowRight, Shield, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  
  const [step, setStep] = useState<'mobile' | 'delivery' | 'otp' | 'profile'>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOTP] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [isNewUser, setIsNewUser] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');

  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Indian mobile number
    if (mobileNumber.length !== 10 || !/^[6-9]\d{9}$/.test(mobileNumber)) {
      toast.error('Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9)');
      return;
    }

    // Show delivery choice popup
    setStep('delivery');
  };

  const handleSendOTP = async (method: 'whatsapp' | 'sms') => {
    setLoading(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://tripund-backend-665685012221.asia-south1.run.app/api/v1'}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile_number: mobileNumber,
          country_code: '91',
          delivery_method: method
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const deliveryText = method === 'whatsapp' ? 'WhatsApp' : 'SMS';
        toast.success(`OTP sent to your mobile via ${deliveryText}`);
        setStep('otp');
        setOtpExpiry(Date.now() + 5 * 60 * 1000);
      } else {
        toast.error(result.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://tripund-backend-665685012221.asia-south1.run.app/api/v1'}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile_number: mobileNumber,
          otp: otp,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('userId', result.user.id);
        setToken(result.token);
        setIsNewUser(result.is_new_user);
        
        if (result.is_new_user) {
          toast.success('Welcome! Please complete your profile.');
          setStep('profile');
        } else {
          toast.success('Welcome back!');
          navigate(returnTo || '/');
        }
      } else {
        toast.error(result.error || 'Invalid OTP');
        setOTP('');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast.error('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://tripund-backend-665685012221.asia-south1.run.app/api/v1'}/mobile/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name,
          email: email,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Profile completed successfully!');
        navigate(returnTo || '/');
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile completion error:', error);
      toast.error('Failed to complete profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    setOTP('');
    setStep('delivery');
    setOtpExpiry(null);
  };

  const remainingTime = otpExpiry ? Math.max(0, Math.ceil((otpExpiry - Date.now()) / 1000)) : 0;
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-4 px-4">
      <div className="max-w-sm w-full space-y-4">
        <div className="text-center">
          <Smartphone className="mx-auto h-8 w-8 text-primary-600" />
          <h2 className="mt-3 text-2xl font-bold text-gray-900">
            {step === 'mobile' && 'Enter Mobile'}
            {step === 'delivery' && 'Choose Delivery'}
            {step === 'otp' && 'Enter OTP'}
            {step === 'profile' && 'Complete Profile'}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {step === 'mobile' && 'Universal login for all users'}
            {step === 'delivery' && 'How should we send your OTP?'}
            {step === 'otp' && `Code sent to +91 ${mobileNumber}`}
            {step === 'profile' && 'Tell us about yourself'}
          </p>
        </div>

        {/* Step 1: Mobile Number Entry */}
        {step === 'mobile' && (
          <form className="mt-4 space-y-4" onSubmit={handleMobileSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-600 text-sm">
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setMobileNumber(value);
                  }}
                  placeholder="9876543210"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                10 digits, starts with 6-9
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || mobileNumber.length !== 10}
              className="w-full py-2 text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 rounded-lg font-medium"
            >
              Continue
            </button>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                New users will be automatically registered
              </p>
            </div>
          </form>
        )}

        {/* Step 2: Delivery Choice */}
        {step === 'delivery' && (
          <div className="mt-4 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-800 font-medium">📱 Choose OTP Delivery Method</p>
            </div>

            <div className="space-y-3">
              {/* WhatsApp Option (Recommended) */}
              <button
                onClick={() => {
                  handleSendOTP('whatsapp');
                }}
                disabled={loading}
                className="w-full p-4 border-2 border-green-300 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:bg-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">📱</span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-green-800">WhatsApp</p>
                      <p className="text-xs text-green-600">Recommended • Instant delivery</p>
                    </div>
                  </div>
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">✨ Best</span>
                </div>
              </button>

              {/* SMS Option */}
              <button
                onClick={() => {
                  handleSendOTP('sms');
                }}
                disabled={loading}
                className="w-full p-4 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">💬</span>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">SMS</p>
                    <p className="text-xs text-gray-600">Traditional text message</p>
                  </div>
                </div>
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => setStep('mobile')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Change number
              </button>
            </div>

            {loading && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Sending OTP...</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: OTP Verification */}
        {step === 'otp' && (
          <form className="mt-4 space-y-4" onSubmit={handleVerifyOTP}>
            <div className="text-center mb-4">
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">
                OTP sent to +91 {mobileNumber}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOTP(value);
                }}
                placeholder="123456"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-xl tracking-widest"
                maxLength={6}
                autoFocus
                required
              />
              {remainingTime > 0 ? (
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Expires in {minutes}:{seconds.toString().padStart(2, '0')}
                </p>
              ) : (
                <p className="text-xs text-red-500 mt-1 text-center">
                  OTP expired
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-2 text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 rounded-lg font-medium"
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('mobile')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Change number
              </button>
              
              {remainingTime <= 0 && (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  Resend
                </button>
              )}
            </div>
          </form>
        )}

        {/* Step 4: Profile Completion (New Users Only) */}
        {step === 'profile' && (
          <form className="mt-4 space-y-4" onSubmit={handleCompleteProfile}>
            <div className="text-center mb-4">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">
                Welcome to TRIPUND! Let's set up your profile.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email helps us send order confirmations
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full py-2 text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 rounded-lg font-medium"
            >
              {loading ? 'Completing...' : 'Complete Profile'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate(returnTo || '/')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Skip for now →
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-3 text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-2">
            <p className="text-xs text-green-700">
              🇮🇳 Indian mobile numbers only • Secure OTP
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}