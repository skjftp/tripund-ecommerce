import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://tripund-backend-665685012221.asia-south1.run.app/api/v1';

class AnalyticsService {
  private sessionId: string;

  constructor() {
    // Generate or get existing session ID
    this.sessionId = this.getOrCreateSessionId();
    
    // Track initial page visit
    this.trackPageVisit();
    
    // Set up navigation tracking
    this.setupNavigationTracking();
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem('analytics_session_id', sessionId);
      
      // Set session expiry (2 hours)
      const expiryTime = Date.now() + (2 * 60 * 60 * 1000);
      sessionStorage.setItem('analytics_session_expiry', expiryTime.toString());
    } else {
      // Check if session has expired
      const expiryTime = sessionStorage.getItem('analytics_session_expiry');
      if (expiryTime && Date.now() > parseInt(expiryTime)) {
        sessionId = this.generateSessionId();
        sessionStorage.setItem('analytics_session_id', sessionId);
        const newExpiryTime = Date.now() + (2 * 60 * 60 * 1000);
        sessionStorage.setItem('analytics_session_expiry', newExpiryTime.toString());
      }
    }
    return sessionId;
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private getUTMParameters(): Record<string, string> {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      utm_source: urlParams.get('utm_source') || '',
      utm_medium: urlParams.get('utm_medium') || '',
      utm_campaign: urlParams.get('utm_campaign') || '',
      utm_content: urlParams.get('utm_content') || '',
      utm_term: urlParams.get('utm_term') || '',
    };
  }

  async trackPageVisit(customPage?: string) {
    try {
      const utmParams = this.getUTMParameters();
      const userId = localStorage.getItem('userId') || '';
      
      await axios.post(`${API_BASE_URL}/analytics/track/visit`, {
        page: customPage || window.location.pathname,
        session_id: this.sessionId,
        user_id: userId,
        referrer: document.referrer,
        ...utmParams
      });
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }

  async trackUserAction(action: string, data?: {
    page?: string;
    product_id?: string;
    category?: string;
    value?: number;
    metadata?: Record<string, any>;
  }) {
    try {
      const userId = localStorage.getItem('userId') || '';
      
      await axios.post(`${API_BASE_URL}/analytics/track/action`, {
        session_id: this.sessionId,
        user_id: userId,
        action: action,
        page: data?.page || window.location.pathname,
        product_id: data?.product_id,
        category: data?.category,
        value: data?.value,
        metadata: data?.metadata,
      });
    } catch (error) {
      console.error('Action tracking failed:', error);
    }
  }

  private setupNavigationTracking() {
    // Track route changes
    let currentPath = window.location.pathname;
    
    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', () => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        this.trackPageVisit();
      }
    });
    
    // Override pushState and replaceState for SPA navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      setTimeout(() => this.trackPageVisit(), 100);
    };
    
    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      setTimeout(() => this.trackPageVisit(), 100);
    };
  }

  // Track specific e-commerce events
  trackProductView(productId: string, productName: string, category: string, price: number) {
    this.trackUserAction('view_product', {
      product_id: productId,
      category: category,
      value: price,
      metadata: { product_name: productName }
    });
  }

  trackAddToCart(productId: string, quantity: number, price: number) {
    this.trackUserAction('add_to_cart', {
      product_id: productId,
      value: price * quantity,
      metadata: { quantity }
    });
  }

  trackCheckoutStart(cartValue: number) {
    this.trackUserAction('checkout_start', {
      value: cartValue,
      metadata: { step: 'checkout_initiated' }
    });
  }

  trackPurchase(orderId: string, orderValue: number, products: string[]) {
    this.trackUserAction('purchase', {
      value: orderValue,
      metadata: { 
        order_id: orderId, 
        product_count: products.length,
        products: products 
      }
    });
  }

  trackCategoryView(category: string, productCount: number) {
    this.trackUserAction('view_category', {
      category: category,
      metadata: { product_count: productCount }
    });
  }

  trackSearch(searchTerm: string, resultCount: number) {
    this.trackUserAction('search', {
      metadata: { 
        search_term: searchTerm,
        result_count: resultCount 
      }
    });
  }

  // Get session info for debugging
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      userId: localStorage.getItem('userId') || '',
      currentPage: window.location.pathname,
      utmParams: this.getUTMParameters()
    };
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();
export default analytics;