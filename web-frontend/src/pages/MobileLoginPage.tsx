import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Smartphone, ArrowRight, Shield, CheckCircle } from 'lucide-react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { AppDispatch } from '../store';

export default function MobileLoginPage() {
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [countryCode, setCountryCode] = useState('91');
  const [otp, setOTP] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate mobile number
    if (mobileNumber.length !== 10 || !/^[6-9]\d{9}$/.test(mobileNumber)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/v1/auth/mobile/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile_number: mobileNumber,
          country_code: countryCode,
          purpose: 'login'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('OTP sent to your mobile number');
        setStep('otp');
        // Set 5-minute countdown
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
      const response = await fetch('/api/v1/auth/mobile/verify-otp', {
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
        // Store token and user data
        localStorage.setItem('token', result.token);
        localStorage.setItem('userId', result.user.id);
        
        toast.success('Login successful!');
        navigate('/');
      } else {
        toast.error(result.error || 'Invalid OTP');
        setOTP(''); // Clear OTP field
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast.error('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOTP('');
    setStep('mobile');
    setOtpExpiry(null);
  };

  const remainingTime = otpExpiry ? Math.max(0, Math.ceil((otpExpiry - Date.now()) / 1000)) : 0;
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Smartphone className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {step === 'mobile' ? 'Sign in with Mobile' : 'Verify OTP'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'mobile' 
              ? 'Enter your mobile number to receive OTP'
              : `OTP sent to +${countryCode} ${mobileNumber}`
            }
          </p>
        </div>

        {step === 'mobile' ? (
          <form className="mt-8 space-y-6" onSubmit={handleSendOTP}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country Code
                </label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="91">🇮🇳 India (+91)</option>
                  <option value="1">🇺🇸 USA (+1)</option>
                  <option value="44">🇬🇧 UK (+44)</option>
                  <option value="971">🇦🇪 UAE (+971)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setMobileNumber(value);
                  }}
                  placeholder="9876543210"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter 10-digit mobile number
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || mobileNumber.length !== 10}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending OTP...' : (
                <>
                  Send OTP
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                New to TRIPUND?{' '}
                <Link to="/mobile-register" className="font-medium text-primary-600 hover:text-primary-500">
                  Register with mobile number
                </Link>
              </p>
            </div>

            <div className="text-center">
              <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
                ← Back to email login
              </Link>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOTP}>
            <div className="space-y-4">
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  We've sent a 6-digit verification code to
                </p>
                <p className="font-medium text-gray-900">
                  +{countryCode} {mobileNumber}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center text-2xl tracking-widest"
                  maxLength={6}
                  required
                />
                {remainingTime > 0 ? (
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    OTP expires in {minutes}:{seconds.toString().padStart(2, '0')}
                  </p>
                ) : (
                  <p className="text-xs text-red-500 mt-1 text-center">
                    OTP has expired
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Verify & Login
                </>
              )}
            </button>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('mobile')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Change mobile number
              </button>
              
              {remainingTime <= 0 && (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </form>
        )}

        {/* Security Note */}
        <div className="mt-6 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-center mb-2">
              <Shield className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">Secure Login</span>
            </div>
            <p className="text-xs text-blue-700">
              Your mobile number is encrypted and secure. We'll never share your information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}