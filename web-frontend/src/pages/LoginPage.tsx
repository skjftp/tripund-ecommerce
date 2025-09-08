import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Smartphone, ArrowRight, Shield, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOTP] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Indian mobile number
    if (mobileNumber.length !== 10 || !/^[6-9]\d{9}$/.test(mobileNumber)) {
      toast.error('Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9)');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://tripund-backend-665685012221.asia-south1.run.app/api/v1'}/auth/mobile/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile_number: mobileNumber,
          country_code: '91',
          purpose: 'login'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('OTP sent to your mobile number');
        setStep('otp');
        setOtpExpiry(Date.now() + 5 * 60 * 1000);
      } else {
        if (result.error?.includes('not registered')) {
          toast.error('Mobile number not found. Please register first.');
        } else {
          toast.error(result.error || 'Failed to send OTP');
        }
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://tripund-backend-665685012221.asia-south1.run.app/api/v1'}/auth/mobile/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile_number: mobileNumber,
          otp: otp,
          purpose: 'login'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('userId', result.user.id);
        
        toast.success('Login successful!');
        navigate(returnTo || '/');
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

  const handleResendOTP = () => {
    setOTP('');
    setStep('mobile');
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
            {step === 'mobile' ? 'Sign In' : 'Enter OTP'}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {step === 'mobile' 
              ? 'Enter mobile number'
              : `Sent to +91 ${mobileNumber}`
            }
          </p>
        </div>

        {step === 'mobile' ? (
          <form className="mt-4 space-y-4" onSubmit={handleSendOTP}>
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
              {loading ? 'Sending...' : 'Send OTP'}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                New user?{' '}
                <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                  Sign Up
                </Link>
              </p>
            </div>
          </form>
        ) : (
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