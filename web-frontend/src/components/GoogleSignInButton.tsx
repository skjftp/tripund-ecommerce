import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch } from '../store';
import { logout } from '../store/slices/authSlice';
import googleAuthService from '../services/googleAuth';
import toast from 'react-hot-toast';

interface GoogleSignInButtonProps {
  mode: 'signin' | 'signup';
  onSuccess?: () => void;
}

export default function GoogleSignInButton({ mode, onSuccess }: GoogleSignInButtonProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleGoogleSignIn = async () => {
    try {
      // Initialize Google Sign-In
      await new Promise<void>((resolve, reject) => {
        if (typeof window !== 'undefined' && window.google) {
          window.google.accounts.id.initialize({
            client_id: process.env.VITE_GOOGLE_CLIENT_ID || 'demo-client-id', // You need to set this
            callback: async (response: any) => {
              try {
                // Decode the JWT token to get user info
                const payload = JSON.parse(atob(response.credential.split('.')[1]));
                
                // Create user data
                const userData = {
                  id: payload.sub,
                  email: payload.email,
                  name: payload.name,
                  picture: payload.picture,
                  given_name: payload.given_name,
                  family_name: payload.family_name
                };
                
                // Store auth data in Redux (simulate successful login)
                // TODO: Implement proper Google OAuth integration
                console.log('Google Sign-In successful', payload);
                /*
                dispatch(setAuth({
                  isAuthenticated: true,
                  token: 'google-auth-' + payload.sub, // Temporary token
                  user: {
                    id: payload.sub,
                    email: payload.email,
                    profile: {
                      first_name: payload.given_name || '',
                      last_name: payload.family_name || '',
                      picture: payload.picture
                    }
                  }
                }));
                */

                // Store token in localStorage
                localStorage.setItem('token', 'google-auth-' + payload.sub);
                
                toast.success(`Welcome ${payload.name}!`);
                
                if (onSuccess) {
                  onSuccess();
                } else {
                  navigate('/');
                }
                
                resolve();
              } catch (error) {
                reject(error);
              }
            },
            error_callback: reject
          });
          
          // Trigger sign-in prompt
          window.google.accounts.id.prompt();
        } else {
          reject(new Error('Google Sign-In not loaded'));
        }
      });
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      toast.error('Google Sign-In requires setup. Please use email/password for now.');
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleGoogleSignIn}
      type="button"
      className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
    >
      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
    </button>
  );
}