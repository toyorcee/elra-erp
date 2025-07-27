import SystemSettings from "../models/SystemSettings.js";

/**
 * Currency service for handling conversion rates and currency operations
 */
class CurrencyService {
  /**
   * Get the current USD to NGN conversion rate from system settings
   * @returns {Promise<number>} The conversion rate
   */
  static async getUsdToNgnRate() {
    try {
      const settings = await SystemSettings.getSettings();
      return settings.currency?.usdToNgnRate || 1500;
    } catch (error) {
      console.error("Error fetching conversion rate:", error);
      return 1500;
    }
  }

  /**
   * Convert USD amount to NGN using the system conversion rate
   * @param {number} usdAmount - Amount in USD
   * @returns {Promise<number>} Amount in NGN
   */
  static async convertUsdToNgn(usdAmount) {
    const rate = await this.getUsdToNgnRate();
    return usdAmount * rate;
  }

  /**
   * Convert NGN amount to USD using the system conversion rate
   * @param {number} ngnAmount - Amount in NGN
   * @returns {Promise<number>} Amount in USD
   */
  static async convertNgnToUsd(ngnAmount) {
    const rate = await this.getUsdToNgnRate();
    return ngnAmount / rate;
  }

  /**
   * Get the default currency from system settings
   * @returns {Promise<string>} The default currency (USD or NGN)
   */
  static async getDefaultCurrency() {
    try {
      const settings = await SystemSettings.getSettings();
      return settings.currency?.defaultCurrency || "USD";
    } catch (error) {
      console.error("Error fetching default currency:", error);
      return "USD"; // Fallback currency
    }
  }

  /**
   * Update the USD to NGN conversion rate
   * @param {number} newRate - New conversion rate
   * @param {string} userId - User ID who made the change
   * @returns {Promise<Object>} Updated settings
   */
  static async updateConversionRate(newRate, userId) {
    try {
      const settings = await SystemSettings.updateSettings(
        {
          currency: {
            usdToNgnRate: newRate,
            lastConversionRateUpdate: new Date(),
          },
        },
        userId
      );
      return settings;
    } catch (error) {
      console.error("Error updating conversion rate:", error);
      throw error;
    }
  }
}

export default CurrencyService;
