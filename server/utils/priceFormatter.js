/**
 * Price formatting utility for subscription plans
 */

/**
 * Format price with proper currency symbol and formatting
 * @param {number} amount - The price amount
 * @param {string} currency - Currency code (USD, NGN)
 * @param {string} billingCycle - Billing cycle (monthly, yearly)
 * @returns {string} Formatted price string
 */
export const formatPrice = (
  amount,
  currency = "USD",
  billingCycle = "monthly"
) => {
  if (!amount || isNaN(amount)) return "0";

  const formatters = {
    USD: new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    NGN: new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }),
  };

  const formatter = formatters[currency];
  if (!formatter) {
    // Fallback formatting
    return currency === "NGN"
      ? `₦${amount.toLocaleString()}`
      : `$${amount.toFixed(2)}`;
  }

  return formatter.format(amount);
};

/**
 * Format price for display with billing cycle
 * @param {number} amount - The price amount
 * @param {string} currency - Currency code (USD, NGN)
 * @param {string} billingCycle - Billing cycle (monthly, yearly)
 * @returns {object} Formatted price object
 */
export const formatPriceForDisplay = (
  amount,
  currency = "USD",
  billingCycle = "monthly"
) => {
  const formatted = formatPrice(amount, currency, billingCycle);
  const cycleText = billingCycle === "monthly" ? "month" : "year";

  return {
    amount: amount,
    currency: currency,
    billingCycle: billingCycle,
    formatted: formatted,
    display: `${formatted}/${cycleText}`,
    symbol: currency === "NGN" ? "₦" : "$",
  };
};

/**
 * Get formatted prices for all currencies and billing cycles
 * @param {object} priceData - Price data object
 * @returns {object} Formatted price object
 */
export const formatAllPrices = (priceData) => {
  const formatted = {};

  // Format USD prices
  if (priceData.USD) {
    formatted.USD = {
      monthly: formatPriceForDisplay(priceData.USD.monthly, "USD", "monthly"),
      yearly: formatPriceForDisplay(priceData.USD.yearly, "USD", "yearly"),
    };
  }

  // Format NGN prices
  if (priceData.NGN) {
    formatted.NGN = {
      monthly: formatPriceForDisplay(priceData.NGN.monthly, "NGN", "monthly"),
      yearly: formatPriceForDisplay(priceData.NGN.yearly, "NGN", "yearly"),
    };
  }

  // Legacy support for direct monthly/yearly prices
  if (priceData.monthly) {
    formatted.monthly = formatPriceForDisplay(
      priceData.monthly,
      "USD",
      "monthly"
    );
  }

  if (priceData.yearly) {
    formatted.yearly = formatPriceForDisplay(priceData.yearly, "USD", "yearly");
  }

  return formatted;
};
