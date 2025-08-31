import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Calendar, MapPin, Phone, Mail, Building, FileText } from 'lucide-react';
import invoiceService, { Invoice } from '../services/invoice';

const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInvoice(id);
    }
  }, [id]);

  const fetchInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      const invoiceData = await invoiceService.getInvoice(invoiceId);
      setInvoice(invoiceData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!invoice) return;
    
    try {
      setDownloading(true);
      const blob = await invoiceService.downloadInvoice(invoice.id);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      canceled: 'bg-red-100 text-red-800'
    };

    const statusLabels = {
      draft: 'Draft',
      sent: 'Sent',
      paid: 'Paid',
      overdue: 'Overdue',
      canceled: 'Canceled'
    };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
        statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
      }`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-6"></div>
            <div className="bg-white rounded-lg p-8">
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The requested invoice could not be found.'}</p>
            <Link
              to="/invoices"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Invoices
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 print:hidden">
          <Link
            to="/invoices"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Invoices
          </Link>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Downloading...' : 'Download PDF'}
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 print:shadow-none print:border-0">
          <div className="p-8">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">INVOICE</h1>
                <p className="text-lg font-semibold text-blue-600">{invoice.invoice_number}</p>
                <div className="mt-2">
                  {getStatusBadge(invoice.status)}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 mb-2">{invoice.seller_name}</div>
                <div className="text-sm text-gray-600 space-y-1">
                  {invoice.seller_gstin && <p>GSTIN: {invoice.seller_gstin}</p>}
                  {invoice.seller_pan && <p>PAN: {invoice.seller_pan}</p>}
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">INVOICE DETAILS</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span><strong>Issue Date:</strong> {formatDate(invoice.issue_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span><strong>Due Date:</strong> {formatDate(invoice.due_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span><strong>Place of Supply:</strong> {invoice.place_of_supply}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">SELLER INFORMATION</h3>
                <div className="text-sm space-y-1">
                  <div className="flex items-start gap-2">
                    <Building className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p>{invoice.seller_address.line1}</p>
                      {invoice.seller_address.line2 && <p>{invoice.seller_address.line2}</p>}
                      <p>{invoice.seller_address.city}, {invoice.seller_address.state} {invoice.seller_address.postal_code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>{invoice.seller_email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{invoice.seller_phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">BILL TO</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 mb-2">{invoice.buyer_details.name}</p>
                {invoice.buyer_details.gstin && (
                  <p className="text-sm text-gray-600 mb-1">GSTIN: {invoice.buyer_details.gstin}</p>
                )}
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{invoice.buyer_details.address.line1}</p>
                  {invoice.buyer_details.address.line2 && <p>{invoice.buyer_details.address.line2}</p>}
                  <p>{invoice.buyer_details.address.city}, {invoice.buyer_details.address.state} {invoice.buyer_details.address.postal_code}</p>
                  {invoice.buyer_details.email && <p>{invoice.buyer_details.email}</p>}
                  {invoice.buyer_details.phone && <p>{invoice.buyer_details.phone}</p>}
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">ITEMS</h3>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Description
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        HSN Code
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Rate
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Taxable Value
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Tax
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoice.line_items.map((item, index) => (
                      <tr key={item.id || index}>
                        <td className="px-4 py-3 text-sm">
                          <div>
                            <p className="font-medium text-gray-900">{item.product_name}</p>
                            {item.description && (
                              <p className="text-gray-600 text-xs mt-1">{item.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                          {item.hsn_code}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {formatCurrency(item.taxable_value)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                          {(item.igst_rate || 0) > 0 ? (
                            <div>IGST ({item.igst_rate}%): {formatCurrency(item.igst_amount || 0)}</div>
                          ) : (
                            <div>
                              <div>CGST ({item.cgst_rate}%): {formatCurrency(item.cgst_amount)}</div>
                              <div>SGST ({item.sgst_rate}%): {formatCurrency(item.sgst_amount)}</div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                          {formatCurrency(item.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tax Summary */}
            <div className="flex justify-end mb-8">
              <div className="w-full max-w-md">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Taxable Value:</span>
                      <span>{formatCurrency(invoice.tax_summary.total_taxable_value)}</span>
                    </div>
                    
                    {invoice.tax_summary.total_cgst > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span>CGST:</span>
                          <span>{formatCurrency(invoice.tax_summary.total_cgst)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>SGST:</span>
                          <span>{formatCurrency(invoice.tax_summary.total_sgst)}</span>
                        </div>
                      </>
                    )}
                    
                    {invoice.tax_summary.total_igst > 0 && (
                      <div className="flex justify-between">
                        <span>IGST:</span>
                        <span>{formatCurrency(invoice.tax_summary.total_igst)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between font-medium">
                      <span>Total Tax:</span>
                      <span>{formatCurrency(invoice.tax_summary.total_tax)}</span>
                    </div>
                    
                    {invoice.tax_summary.total_discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Discount:</span>
                        <span>-{formatCurrency(invoice.tax_summary.total_discount)}</span>
                      </div>
                    )}
                    
                    <hr className="my-2" />
                    
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total Amount:</span>
                      <span>{formatCurrency(invoice.tax_summary.final_amount)}</span>
                    </div>
                    
                    {invoice.tax_summary.rounding_amount && invoice.tax_summary.rounding_amount !== 0 && (
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Rounding:</span>
                        <span>{formatCurrency(invoice.tax_summary.rounding_amount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information Section Removed */}
            
            {/* Simple footer */}
            <div className="border-t pt-8 text-center">
              <p className="text-sm text-gray-600">Thank you for shopping with us.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailPage;