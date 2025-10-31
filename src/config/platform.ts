/**
 * Platform Configuration
 * 
 * This file contains configurable platform settings that may change over time.
 * Update these values to adjust platform behavior without modifying core logic.
 */

export const PLATFORM_CONFIG = {
  /**
   * Platform fee rate (as a decimal)
   * 
   * This is the percentage of each transaction that the platform takes as a fee.
   * The fee is deducted from the amount the traveler/service provider receives.
   * 
   * Example: 0.175 = 17.5%
   * - If sender pays 100,000 XAF
   * - Platform fee: 100,000 × 0.175 = 17,500 XAF
   * - Traveler receives: 100,000 - 17,500 = 82,500 XAF
   */
  FEE_RATE: 0.175, // 17.5%

  /**
   * Minimum fee amount (in base currency units)
   * Set to 0 for no minimum
   */
  MIN_FEE: 0,

  /**
   * Maximum fee amount (in base currency units)
   * Set to Infinity for no maximum
   */
  MAX_FEE: Infinity,
} as const;

/**
 * Calculate the platform fee for a given amount
 * 
 * @param amount - The total payment amount
 * @returns Object containing fee and net amount (amount after fee)
 */
export function calculatePlatformFee(amount: number) {
  const feeAmount = Math.floor(amount * PLATFORM_CONFIG.FEE_RATE);
  
  // Apply min/max constraints
  const constrainedFee = Math.max(
    PLATFORM_CONFIG.MIN_FEE,
    Math.min(feeAmount, PLATFORM_CONFIG.MAX_FEE)
  );
  
  const netAmount = amount - constrainedFee;
  
  return {
    grossAmount: amount,        // Original amount (what payer pays)
    feeAmount: constrainedFee,  // Platform fee
    netAmount: netAmount,       // Amount recipient receives
    feeRate: PLATFORM_CONFIG.FEE_RATE,
    feePercentage: (PLATFORM_CONFIG.FEE_RATE * 100).toFixed(1) + '%'
  };
}

/**
 * Format platform fee for display
 * 
 * @param amount - The total payment amount
 * @param currency - The currency code (e.g., 'XAF')
 * @returns Formatted string for display
 */
export function formatPlatformFee(amount: number, currency: string = 'XAF') {
  const { feeAmount, netAmount, feePercentage } = calculatePlatformFee(amount);
  
  return {
    feeText: `${feeAmount.toLocaleString()} ${currency} (${feePercentage} platform fee)`,
    netText: `${netAmount.toLocaleString()} ${currency}`,
    feeAmount,
    netAmount
  };
}
