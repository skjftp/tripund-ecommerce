import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Smartphone, ArrowRight, Shield, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MobileRegisterPage() {
  const [step, setStep] = useState<'mobile' | 'otp' | 'profile'>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [countryCode, setCountryCode] = useState('91');
  const [otp, setOTP] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null);
  const [token, setToken] = useState<string>('');
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
          purpose: 'register'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('OTP sent to your mobile number');
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
      const response = await fetch('/api/v1/auth/mobile/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile_number: mobileNumber,
          otp: otp,
          purpose: 'register'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setToken(result.token);
        localStorage.setItem('token', result.token);
        localStorage.setItem('userId', result.user.id);
        
        if (result.is_new_user) {
          toast.success('Account created! Please complete your profile.');
          setStep('profile');
        } else {
          toast.success('Login successful!');
          navigate('/');
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

  const handleResendOTP = async () => {
    setOTP('');
    setStep('mobile');
    setOtpExpiry(null);
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/v1/mobile/profile', {
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
        navigate('/');
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

  const remainingTime = otpExpiry ? Math.max(0, Math.ceil((otpExpiry - Date.now()) / 1000)) : 0;
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <UserPlus className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {step === 'mobile' && 'Create Account'}
            {step === 'otp' && 'Verify Mobile Number'}
            {step === 'profile' && 'Complete Your Profile'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'mobile' && 'Join TRIPUND with your mobile number'}
            {step === 'otp' && `OTP sent to +${countryCode} ${mobileNumber}`}
            {step === 'profile' && 'Tell us a bit about yourself'}
          </p>
        </div>

        {step === 'mobile' && (
          <form className="mt-8 space-y-6" onSubmit={handleSendOTP}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country Code
                </label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || mobileNumber.length !== 10}
              className="w-full flex justify-center py-3 px-4 text-lg font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400"
            >
              {loading ? 'Sending OTP...' : (
                <>
                  Get OTP
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/mobile-login" className="font-medium text-primary-600 hover:text-primary-500">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOTP}>
            <div className="space-y-4">
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                  Enter 6-digit OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOTP(value);
                  }}
                  placeholder="123456"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-2xl tracking-widest"
                  maxLength={6}
                  autoFocus
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
              className="w-full flex justify-center py-3 px-4 text-lg font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400"
            >
              {loading ? 'Verifying...' : (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Verify OTP
                </>
              )}
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
                  className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </form>
        )}

        {step === 'profile' && (
          <form className="mt-8 space-y-6" onSubmit={handleCompleteProfile}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email is optional but recommended for order updates
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full flex justify-center py-3 px-4 text-lg font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400"
            >
              {loading ? 'Completing...' : (
                <>
                  Complete Registration
                  <CheckCircle className="ml-2 h-5 w-5" />
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Skip for now →
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}