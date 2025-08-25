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
  status?: string;
  type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

class InvoiceService {
  async getInvoices(params: InvoiceListParams = {}): Promise<InvoiceListResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/invoices?${queryParams.toString()}`);
    return response.data;
  }
  
  async getInvoice(id: string): Promise<Invoice> {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  }
  
  async downloadInvoice(id: string): Promise<Blob> {
    const response = await api.get(`/invoices/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }
}

export default new InvoiceService();