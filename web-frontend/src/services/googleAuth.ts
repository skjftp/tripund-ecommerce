import api from './api';

declare global {
  interface Window {
    google: any;
  }
}

export interface GoogleSignInResponse {
  user: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
  token: string;
}

class GoogleAuthService {
  private clientId = ''; // Will be set from environment or config
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    // Wait for Google Sign-In library to load
    while (!window.google) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // You'll need to get your Google Client ID from Google Console
    // For now, we'll integrate with your backend auth
    this.initialized = true;
  }

  async signInWithGoogle(): Promise<GoogleSignInResponse> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      // Initialize Google Sign-In
      window.google.accounts.id.initialize({
        client_id: this.clientId || 'YOUR_GOOGLE_CLIENT_ID', // Replace with actual client ID
        callback: async (response: any) => {
          try {
            // Send Google token to your backend for verification
            const result = await api.post('/auth/google', {
              credential: response.credential
            });

            const userData: GoogleSignInResponse = {
              user: {
                id: result.data.user.id,
                email: result.data.user.email,
                name: `${result.data.user.first_name} ${result.data.user.last_name}`,
                picture: result.data.user.picture
              },
              token: result.data.token
            };

            resolve(userData);
          } catch (error) {
            reject(error);
          }
        },
        error_callback: (error: any) => {
          reject(new Error('Google Sign-In failed: ' + error.type));
        }
      });

      // Render the sign-in button (one-tap)
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback to explicit sign-in button
          this.showSignInButton();
        }
      });
    });
  }

  private showSignInButton() {
    // This will be called from the React component
    window.google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'continue_with'
      }
    );
  }

  async signOut() {
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
  }
}

export const googleAuthService = new GoogleAuthService();
export default googleAuthService;