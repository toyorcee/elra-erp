import axios from "axios";
import crypto from "crypto";

class PaymentService {
  constructor() {
    this.paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    this.stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    this.paypalClientId = process.env.PAYPAL_CLIENT_ID;
    this.paypalSecret = process.env.PAYPAL_SECRET;
    this.paypalMode =
      process.env.NODE_ENV === "production" ? "live" : "sandbox";
  }

  // ==================== PAYSTACK INTEGRATION ====================

  async initializePaystackPayment(data) {
    try {
      const { email, amount, reference, callback_url, metadata } = data;

      const response = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email,
          amount: amount * 100, // Paystack expects amount in kobo (smallest currency unit)
          reference,
          callback_url,
          metadata,
          currency: "NGN",
        },
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        data: response.data.data,
        authorization_url: response.data.data.authorization_url,
      };
    } catch (error) {
      console.error(
        "Paystack initialization error:",
        error.response?.data || error.message
      );
      return {
        success: false,
        error: error.response?.data?.message || "Payment initialization failed",
      };
    }
  }

  async verifyPaystackPayment(reference) {
    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
          },
        }
      );

      const { data } = response.data;

      return {
        success: true,
        data: {
          status: data.status,
          amount: data.amount / 100, // Convert from kobo to naira
          reference: data.reference,
          transactionId: data.id,
          paymentMethod: data.channel,
          paidAt: data.paid_at,
          metadata: data.metadata,
        },
      };
    } catch (error) {
      console.error(
        "Paystack verification error:",
        error.response?.data || error.message
      );
      return {
        success: false,
        error: error.response?.data?.message || "Payment verification failed",
      };
    }
  }

  // ==================== STRIPE INTEGRATION ====================

  async createStripePaymentIntent(data) {
    try {
      const stripe = await import("stripe");
      const stripeInstance = stripe.default(this.stripeSecretKey);

      const { amount, currency = "usd", metadata } = data;

      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe expects amount in cents
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        },
      };
    } catch (error) {
      console.error("Stripe payment intent error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async confirmStripePayment(paymentIntentId) {
    try {
      const stripe = await import("stripe");
      const stripeInstance = stripe.default(this.stripeSecretKey);

      const paymentIntent = await stripeInstance.paymentIntents.retrieve(
        paymentIntentId
      );

      return {
        success: true,
        data: {
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100, // Convert from cents
          currency: paymentIntent.currency,
          transactionId: paymentIntent.id,
          paymentMethod: paymentIntent.payment_method_types[0],
          paidAt: new Date(paymentIntent.created * 1000),
          metadata: paymentIntent.metadata,
        },
      };
    } catch (error) {
      console.error("Stripe payment confirmation error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ==================== PAYPAL INTEGRATION ====================

  async getPaypalAccessToken() {
    try {
      const auth = Buffer.from(
        `${this.paypalClientId}:${this.paypalSecret}`
      ).toString("base64");

      const response = await axios.post(
        `https://api-m.${
          this.paypalMode === "live" ? "paypal" : "sandbox"
        }.com/v1/oauth2/token`,
        "grant_type=client_credentials",
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error(
        "PayPal access token error:",
        error.response?.data || error.message
      );
      throw new Error("Failed to get PayPal access token");
    }
  }

  async createPaypalOrder(data) {
    try {
      const accessToken = await this.getPaypalAccessToken();
      const { amount, currency = "USD", description, custom_id } = data;

      const response = await axios.post(
        `https://api-m.${
          this.paypalMode === "live" ? "paypal" : "sandbox"
        }.com/v2/checkout/orders`,
        {
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: currency,
                value: amount.toString(),
              },
              description,
              custom_id,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        data: {
          orderId: response.data.id,
          approvalUrl: response.data.links.find(
            (link) => link.rel === "approve"
          ).href,
        },
      };
    } catch (error) {
      console.error(
        "PayPal order creation error:",
        error.response?.data || error.message
      );
      return {
        success: false,
        error: error.response?.data?.message || "PayPal order creation failed",
      };
    }
  }

  async capturePaypalPayment(orderId) {
    try {
      const accessToken = await this.getPaypalAccessToken();

      const response = await axios.post(
        `https://api-m.${
          this.paypalMode === "live" ? "paypal" : "sandbox"
        }.com/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const { purchase_units } = response.data;
      const payment = purchase_units[0].payments.captures[0];

      return {
        success: true,
        data: {
          status: response.data.status,
          amount: parseFloat(payment.amount.value),
          currency: payment.amount.currency_code,
          transactionId: payment.id,
          paymentMethod: "paypal",
          paidAt: new Date(payment.create_time),
          metadata: {
            orderId: response.data.id,
            customId: purchase_units[0].custom_id,
          },
        },
      };
    } catch (error) {
      console.error(
        "PayPal payment capture error:",
        error.response?.data || error.message
      );
      return {
        success: false,
        error: error.response?.data?.message || "PayPal payment capture failed",
      };
    }
  }

  // ==================== UTILITY METHODS ====================

  generatePaymentReference(prefix = "EDMS") {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`.toUpperCase();
  }

  validatePaymentData(data) {
    const { amount, email, plan, billingCycle } = data;

    if (!amount || amount <= 0) {
      return { valid: false, error: "Invalid amount" };
    }

    if (!email || !email.includes("@")) {
      return { valid: false, error: "Invalid email" };
    }

    if (
      !plan ||
      !["starter", "professional", "enterprise", "custom"].includes(plan)
    ) {
      return { valid: false, error: "Invalid plan" };
    }

    if (!billingCycle || !["monthly", "yearly"].includes(billingCycle)) {
      return { valid: false, error: "Invalid billing cycle" };
    }

    return { valid: true };
  }

  // ==================== WEBHOOK HANDLERS ====================

  verifyPaystackWebhook(signature, body) {
    const hash = crypto
      .createHmac("sha512", this.paystackSecretKey)
      .update(JSON.stringify(body))
      .digest("hex");

    return hash === signature;
  }

  verifyStripeWebhook(signature, body, endpointSecret) {
    const stripe = require("stripe")(this.stripeSecretKey);
    try {
      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        endpointSecret
      );
      return { valid: true, event };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // ==================== SUBSCRIPTION HELPERS ====================

  calculateSubscriptionAmount(plan, billingCycle, customAmount = null) {
    if (customAmount) {
      return customAmount;
    }

    const plans = {
      starter: { monthly: 99, yearly: 990 },
      professional: { monthly: 299, yearly: 2990 },
      enterprise: { monthly: 799, yearly: 7990 },
    };

    return plans[plan]?.[billingCycle] || 0;
  }

  getCurrencyForProvider(provider) {
    const currencies = {
      paystack: "NGN",
      stripe: "USD",
      paypal: "USD",
    };

    return currencies[provider] || "USD";
  }
}

export default new PaymentService();
