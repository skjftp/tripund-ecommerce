/**
 * GST calculation utilities with state-based splitting
 */

export interface GSTBreakdown {
  basePrice: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGST: number;
  gstRate: number;
  isInterstate: boolean;
}

// Indian states and union territories
export const INDIAN_STATES = [
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'AR', name: 'Arunachal Pradesh' },
  { code: 'AS', name: 'Assam' },
  { code: 'BR', name: 'Bihar' },
  { code: 'CG', name: 'Chhattisgarh' },
  { code: 'GA', name: 'Goa' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'HR', name: 'Haryana' },
  { code: 'HP', name: 'Himachal Pradesh' },
  { code: 'JK', name: 'Jammu and Kashmir' },
  { code: 'JH', name: 'Jharkhand' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'KL', name: 'Kerala' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'MN', name: 'Manipur' },
  { code: 'ML', name: 'Meghalaya' },
  { code: 'MZ', name: 'Mizoram' },
  { code: 'NL', name: 'Nagaland' },
  { code: 'OD', name: 'Odisha' },
  { code: 'PB', name: 'Punjab' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'SK', name: 'Sikkim' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'TG', name: 'Telangana' },
  { code: 'TR', name: 'Tripura' },
  { code: 'UK', name: 'Uttarakhand' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'WB', name: 'West Bengal' },
  // Union Territories
  { code: 'AN', name: 'Andaman and Nicobar Islands' },
  { code: 'CH', name: 'Chandigarh' },
  { code: 'DH', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: 'DL', name: 'Delhi' },
  { code: 'LA', name: 'Ladakh' },
  { code: 'LD', name: 'Lakshadweep' },
  { code: 'PY', name: 'Puducherry' }
];

// Business state - Karnataka (where Tripund is registered)
const BUSINESS_STATE = 'KA';

/**
 * Calculate GST breakdown based on state
 * @param gstInclusivePrice - The price that already includes GST
 * @param stateCode - The customer's state code
 * @param gstRate - The GST rate percentage (default 18%)
 * @returns GST breakdown with CGST/SGST or IGST
 */
export const calculateStateBasedGST = (
  gstInclusivePrice: number,
  stateCode: string,
  gstRate: number = 18
): GSTBreakdown => {
  // Calculate base price from GST-inclusive price
  const basePrice = Math.round((gstInclusivePrice * 100) / (100 + gstRate));
  const totalGST = gstInclusivePrice - basePrice;
  
  // Check if it's interstate transaction
  const isInterstate = stateCode !== BUSINESS_STATE;
  
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  
  if (isInterstate) {
    // Interstate - apply IGST
    igst = totalGST;
  } else {
    // Intrastate - split equally between CGST and SGST
    cgst = Math.round(totalGST / 2);
    sgst = totalGST - cgst; // To handle odd amounts
  }
  
  return {
    basePrice,
    cgst,
    sgst,
    igst,
    totalGST,
    gstRate,
    isInterstate
  };
};

/**
 * Calculate GST breakdown for cart items based on state
 * @param items - Array of items with price and quantity
 * @param stateCode - The customer's state code
 * @param gstRate - The GST rate percentage (default 18%)
 * @returns Total GST breakdown
 */
export const calculateCartStateBasedGST = (
  items: Array<{ price: number; quantity: number }>,
  stateCode: string,
  gstRate: number = 18
): GSTBreakdown => {
  const totalWithGST = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return calculateStateBasedGST(totalWithGST, stateCode, gstRate);
};

/**
 * Format GST type based on whether it's interstate or intrastate
 * @param isInterstate - Whether the transaction is interstate
 * @returns Formatted GST type string
 */
export const formatGSTType = (isInterstate: boolean): string => {
  return isInterstate ? 'IGST' : 'CGST + SGST';
};

/**
 * Get state name from code
 * @param stateCode - The state code
 * @returns State name or empty string
 */
export const getStateName = (stateCode: string): string => {
  const state = INDIAN_STATES.find(s => s.code === stateCode);
  return state ? state.name : '';
};