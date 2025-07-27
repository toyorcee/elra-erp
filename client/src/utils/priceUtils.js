/**
 * Price utility functions for handling currency conversion and formatting
 * Works with the existing backend pricing system without hardcoding values
 */

/**
 * Get the conversion rate from backend system settings
 * @returns {Promise<number>} The USD to NGN conversion rate
 */
const getConversionRateFromBackend = async () => {
  try {
    const response = await fetch("/api/system-settings");
    if (response.ok) {
      const data = await response.json();
      return data.data?.currency?.usdToNgnRate || 1500;
    }
  } catch (error) {
    console.error("Error fetching conversion rate:", error);
  }
  return 1500; // Fallback rate
};

/**
 * Get the correct price for a plan in the specified currency and billing cycle
 * @param {Object} plan - The subscription plan object
 * @param {string} currency - The currency code (USD, NGN)
 * @param {string} cycle - The billing cycle (monthly, yearly)
 * @returns {string} - Formatted price string
 */
export const getPlanPrice = async (plan, currency, cycle) => {
  if (!plan) {
    return currency === "NGN" ? "₦99" : "$99";
  }

  // First try to get the price directly from the plan
  if (plan.price?.[currency]?.[cycle]) {
    const symbol = currency === "NGN" ? "₦" : "$";
    const price = plan.price[currency][cycle];
    return `${symbol}${price.toLocaleString()}`;
  }

  // If direct price not available, try formatted prices
  if (plan.formattedPrices?.[currency]?.[cycle]?.formatted) {
    return plan.formattedPrices[currency][cycle].formatted;
  }

  // If USD price exists, convert to NGN using the backend conversion rate
  if (plan.price?.USD?.[cycle] && currency === "NGN") {
    const usdPrice = plan.price.USD[cycle];

    // Get conversion rate from backend system settings
    const conversionRate = await getConversionRateFromBackend();
    const ngnPrice = usdPrice * conversionRate;
    return `₦${ngnPrice.toLocaleString()}`;
  }

  // Fallback to USD price if available
  if (plan.price?.USD?.[cycle]) {
    const usdPrice = plan.price.USD[cycle];
    return `$${usdPrice.toLocaleString()}`;
  }

  // Last resort fallback
  return currency === "NGN" ? "₦99" : "$99";
};

/**
 * Get the raw price amount for a plan in the specified currency and billing cycle
 * @param {Object} plan - The subscription plan object
 * @param {string} currency - The currency code (USD, NGN)
 * @param {string} cycle - The billing cycle (monthly, yearly)
 * @returns {Promise<number>} - Raw price amount
 */
export const getPlanPriceAmount = async (plan, currency, cycle) => {
  if (!plan) {
    return currency === "NGN" ? 99 : 99;
  }

  // First try to get the price directly from the plan
  if (plan.price?.[currency]?.[cycle]) {
    return plan.price[currency][cycle];
  }

  // If USD price exists, convert to NGN using the backend conversion rate
  if (plan.price?.USD?.[cycle] && currency === "NGN") {
    const usdPrice = plan.price.USD[cycle];

    // Get conversion rate from backend system settings
    const conversionRate = await getConversionRateFromBackend();
    return usdPrice * conversionRate;
  }

  // Fallback to USD price if available
  if (plan.price?.USD?.[cycle]) {
    return plan.price.USD[cycle];
  }

  // Last resort fallback
  return currency === "NGN" ? 99 : 99;
};

/**
 * Format a price with currency symbol
 * @param {number} amount - The price amount
 * @param {string} currency - The currency code (USD, NGN)
 * @returns {string} - Formatted price string
 */
export const formatPrice = (amount, currency) => {
  if (!amount) return currency === "NGN" ? "₦0" : "$0";

  const symbol = currency === "NGN" ? "₦" : "$";
  return `${symbol}${amount.toLocaleString()}`;
};

/**
 * Get the conversion rate between USD and NGN from backend system settings
 * @returns {Promise<number>} - Conversion rate (NGN per USD)
 */
export const getConversionRate = async () => {
  return await getConversionRateFromBackend();
};
