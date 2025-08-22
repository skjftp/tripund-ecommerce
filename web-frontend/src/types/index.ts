export interface Product {
  id: string;
  title: string;
  description: string;
  short_description: string;
  price: {
    current: number;
    original: number;
    currency: string;
  };
  discount: number;
  category: string;
  subcategory: string;
  tags: string[];
  images: {
    main: string;
    gallery: string[];
    thumbnails: string[];
  };
  inventory: {
    in_stock: boolean;
    quantity: number;
    sku: string;
  };
  artisan: {
    name: string;
    location: string;
    story: string;
  };
  specifications: Record<string, any>;
  seo: {
    meta_title: string;
    meta_description: string;
    keywords: string;
  };
  status: string;
  featured: boolean;
  is_limited: boolean;
  created_at: string;
  updated_at: string;
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
  user: User;
}