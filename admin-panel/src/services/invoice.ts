import api from './api';

export interface InvoiceLineItem {
  id: string;
  product_id: string;
  product_name: string;
  description?: string;
  hsn_code: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  taxable_value: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate?: number;
  igst_amount?: number;
  total_amount: number;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  state_code: string;
  postal_code: string;
  country: string;
}

export interface BillingEntity {
  name: string;
  gstin?: string;
  pan?: string;
  email?: string;
  phone?: string;
  address: Address;
  is_b2b: boolean;
}

export interface BankDetails {
  account_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  branch_name?: string;
}

export interface TaxSummary {
  total_taxable_value: number;
  total_cgst: number;
  total_sgst: number;
  total_igst: number;
  total_tax: number;
  total_discount: number;
  grand_total: number;
  rounding_amount?: number;
  final_amount: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  user_id: string;
  type: 'regular' | 'credit_note' | 'debit_note';
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'canceled';
  
  // Company Details (Seller)
  seller_name: string;
  seller_gstin: string;
  seller_pan: string;
  seller_address: Address;
  seller_email: string;
  seller_phone: string;
  
  // Customer Details (Buyer)
  buyer_details: BillingEntity;
  shipping_address: Address;
  
  // Invoice Details
  issue_date: string;
  due_date: string;
  place_of_supply: string;
  place_of_delivery: string;
  
  // Line Items
  line_items: InvoiceLineItem[];
  
  // Tax Summary
  tax_summary: TaxSummary;
  
  // Payment Information
  bank_details: BankDetails;
  payment_terms?: string;
  
  // Additional Fields
  notes?: string;
  terms_conditions?: string;
  
  // System Fields
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // Compliance
  irn_hash?: string;
  ack_number?: string;
  e_invoice_status?: string;
  qr_code?: string;
}

export interface InvoiceListResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  limit: number;
}

export interface InvoiceListParams {
  user_id?: string;
  status?: string;
  type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface GenerateInvoiceRequest {
  order_id: string;
  due_days?: number;
}

export interface InvoiceStats {
  total_invoices: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  total_amount: number;
  pending_amount: number;
}

class InvoiceService {
  // List invoices with filtering (Admin)
  async getInvoices(params: InvoiceListParams = {}): Promise<InvoiceListResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/admin/invoices?${queryParams.toString()}`);
    return response.data;
  }
  
  // Get single invoice (Admin)
  async getInvoice(id: string): Promise<Invoice> {
    const response = await api.get(`/admin/invoices/${id}`);
    return response.data;
  }
  
  // Generate invoice from order (Admin)
  async generateInvoice(data: GenerateInvoiceRequest): Promise<Invoice> {
    const response = await api.post('/admin/invoices/generate', data);
    return response.data;
  }
  
  // Update invoice status (Admin)
  async updateInvoiceStatus(id: string, status: string): Promise<{ message: string }> {
    const response = await api.put(`/admin/invoices/${id}/status`, { status });
    return response.data;
  }
  
  // Delete invoice (Admin)
  async deleteInvoice(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/admin/invoices/${id}`);
    return response.data;
  }
  
  // Get invoice statistics (Admin)
  async getInvoiceStats(): Promise<InvoiceStats> {
    const response = await api.get('/admin/invoices/stats');
    return response.data;
  }
  
  // Download invoice PDF (Admin)
  async downloadInvoice(id: string): Promise<Blob> {
    const response = await api.get(`/admin/invoices/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }
  
  // Bulk generate invoices for existing orders (Admin)
  async bulkGenerateInvoices(): Promise<{
    message: string;
    generated: number;
    total_orders: number;
    existing_invoices: number;
  }> {
    const response = await api.post('/admin/invoices/bulk-generate');
    return response.data;
  }
}

export default new InvoiceService();