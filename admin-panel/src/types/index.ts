export interface User {
  id: string;
  email: string;
  role: 'admin' | 'customer' | 'artisan';
  profile: {
    first_name: string;
    last_name: string;
    phone: string;
    avatar?: string;
  };
  created_at: string;
  last_login_at?: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  price: {
    amount: number;
    currency: string;
    compare_at?: number;
  };
  images: string[];
  sku: string;
  barcode?: string;
  inventory: {
    quantity: number;
    track_quantity: boolean;
    allow_backorder: boolean;
  };
  artisan: {
    id: string;
    name: string;
    location: string;
  };
  tags: string[];
  status: 'active' | 'draft' | 'archived';
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  items: OrderItem[];
  shipping_address: Address;
  billing_address: Address;
  payment: {
    method: 'razorpay' | 'cod' | 'bank_transfer';
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    transaction_id?: string;
    paid_at?: string;
  };
  totals: {
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
  };
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  tracking?: {
    carrier: string;
    tracking_number: string;
    url?: string;
  };
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  variant?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: string;
  order: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  total_products: number;
  recent_orders: Order[];
  revenue_chart: {
    labels: string[];
    data: number[];
  };
  top_products: {
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }[];
}

export interface AdminUser extends User {
  permissions: string[];
  last_activity: string;
}