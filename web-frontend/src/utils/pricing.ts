/**
 * Pricing utility functions for GST-inclusive calculations
 * All prices in the database are GST-inclusive
 */

export interface PriceBreakdown {
  totalWithGST: number;      // The price including GST (what customer pays)
  basePrice: number;          // Price before GST
  gstAmount: number;          // GST amount
  gstRate: number;           // GST rate percentage
}

/**
 * Calculate base price and GST from GST-inclusive price
 * Formula: Base Price = GST Inclusive Price / (1 + GST Rate/100)
 * @param gstInclusivePrice - The price that already includes GST
 * @param gstRate - The GST rate percentage (default 18%)
 * @returns Price breakdown with base price and GST amount
 */
export const calculateGSTBreakdown = (gstInclusivePrice: number, gstRate: number = 18): PriceBreakdown => {
  const basePrice = Math.round((gstInclusivePrice * 100) / (100 + gstRate));
  const gstAmount = gstInclusivePrice - basePrice;
  
  return {
    totalWithGST: gstInclusivePrice,
    basePrice,
    gstAmount,
    gstRate
  };
};

/**
 * Calculate GST breakdown for multiple items
 * @param items - Array of items with price and quantity
 * @param gstRate - The GST rate percentage (default 18%)
 * @returns Total price breakdown
 */
export const calculateCartGSTBreakdown = (
  items: Array<{ price: number; quantity: number }>,
  gstRate: number = 18
): PriceBreakdown => {
  const totalWithGST = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return calculateGSTBreakdown(totalWithGST, gstRate);
};

/**
 * Get the effective price for a product (sale price if available, otherwise regular price)
 * @param product - Product with price and optional sale_price
 * @returns The effective price to display
 */
export const getEffectivePrice = (product: { price: number; sale_price?: number | null }): number => {
  return product.sale_price || product.price;
};

/**
 * Format price for display
 * @param amount - The amount to format
 * @returns Formatted price string
 */
export const formatPrice = (amount: number): string => {
  return amount.toLocaleString('en-IN');
};