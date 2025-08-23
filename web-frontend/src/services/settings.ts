import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://tripund-backend-665685012221.asia-south1.run.app/api/v1';

export interface PublicSettings {
  shipping: {
    free_shipping_threshold: number;
    standard_shipping_rate: number;
    express_shipping_rate: number;
  };
  payment: {
    tax_rate: number;
    prepaid_discount: number;
    cod_enabled: boolean;
    cod_limit: number;
  };
  general: {
    currency: string;
  };
}

let cachedSettings: PublicSettings | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getPublicSettings = async (): Promise<PublicSettings> => {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (cachedSettings && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedSettings;
  }

  try {
    const response = await axios.get(`${API_URL}/settings/public`);
    const settings = response.data.settings as PublicSettings;
    cachedSettings = settings;
    cacheTimestamp = now;
    return settings;
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    
    // Return default settings as fallback
    return {
      shipping: {
        free_shipping_threshold: 5000,
        standard_shipping_rate: 100,
        express_shipping_rate: 200,
      },
      payment: {
        tax_rate: 18,
        prepaid_discount: 5,
        cod_enabled: true,
        cod_limit: 10000,
      },
      general: {
        currency: 'INR',
      },
    };
  }
};

export const calculateShipping = (subtotal: number, settings: PublicSettings): number => {
  if (subtotal >= settings.shipping.free_shipping_threshold) {
    return 0;
  }
  return settings.shipping.standard_shipping_rate;
};

export const calculateTax = (amount: number, settings: PublicSettings): number => {
  return Math.round((amount * settings.payment.tax_rate) / 100);
};

export const calculatePrepaidDiscount = (amount: number, settings: PublicSettings): number => {
  return Math.round((amount * settings.payment.prepaid_discount) / 100);
};