export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  sale_price?: number | null;
  discount_percentage?: number;
  manage_stock: boolean;
  stock_quantity: number;
  stock_status: string;
  featured: boolean;
  status: string;
  images: string[];
  categories: string[];
  subcategories?: string[];
  tags: string[];
  attributes: Array<{
    name: string;
    value: string;
  }>;
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };
  weight: {
    value?: number;
    unit?: string;
  };
  created_at: string;
  updated_at: string;
  parsed_description?: any;
  
  // Legacy fields for backward compatibility
  title?: string;
  category?: string;
  inventory?: {
    in_stock: boolean;
    quantity: number;
    sku: string;
  };
}

export interface User {
  id: string;
  email: string;
  profile: {
    first_name: string;
    last_name: string;
    phone: string;
    avatar: string;
  };
  addresses: Address[];
  preferences: {
    newsletter: boolean;
    email_notifications: boolean;
    sms_notifications: boolean;
    language: string;
    currency: string;
    categories: string[];
  };
  wishlist: string[];
  order_history: string[];
  role: string;
  created_at: string;
  last_login_at: string;
}

export interface Address {
  id: string;
  type: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
}

export interface CartItem {
  product_id: string;
  product: Product;
  quantity: number;
  price: number;
  added_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  items: OrderItem[];
  shipping_address: Address;
  billing_address: Address;
  payment: Payment;
  totals: OrderTotals;
  status: string;
  tracking?: Tracking;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  product_image: string;
  sku: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface Payment {
  method: string;
  status: string;
  transaction_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount: number;
  currency: string;
  paid_at: string;
}

export interface OrderTotals {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  coupon_code: string;
  coupon_amount: number;
}

export interface Tracking {
  provider: string;
  number: string;
  url: string;
  shipped_at: string;
  delivered_at: string;
  status: string;
}

export interface AuthResponse {
  token: string;
  expires_in: number;
  expires_at?: number;
  user: User;
}