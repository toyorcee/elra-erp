# EDMS Currency Implementation Guide

## 🌍 **Multi-Currency Support**

The EDMS subscription system now supports multiple currencies, with primary focus on **USD** and **NGN (Naira)** for Nigerian customers.

---

## 💰 **Supported Currencies**

### **Primary Currencies:**

- **USD (US Dollar)** - Default international currency
- **NGN (Nigerian Naira)** - Primary currency for Nigerian customers

### **Additional Currencies:**

- **EUR (Euro)** - Supported by Stripe and PayPal
- **GBP (British Pound)** - Supported by Stripe and PayPal

---

## 🔧 **Payment Provider Currency Support**

### **Paystack (Primary for Nigeria)**

```javascript
Supported Currencies: ["NGN", "USD"]
Default Currency: "NGN"
```

### **Stripe (International)**

```javascript
Supported Currencies: ["USD", "EUR", "GBP"]
Default Currency: "USD"
```

### **PayPal (International)**

```javascript
Supported Currencies: ["USD", "EUR", "GBP"]
Default Currency: "USD"
```

---

## 📊 **Currency Conversion Rates**

### **Current Exchange Rates (Approximate)**

```javascript
const rates = {
  USD: 1, // Base currency
  NGN: 1500, // 1 USD = 1500 NGN
  EUR: 0.85, // 1 USD = 0.85 EUR
  GBP: 0.75, // 1 USD = 0.75 GBP
};
```

**Note:** These are static rates for development. In production, implement real-time exchange rate APIs.

---

## 🎯 **Implementation Details**

### **1. Frontend Currency Selection**

#### **Subscription Form Currency Selector**

```jsx
// Currency selection in SubscriptionForm.jsx
const [selectedCurrency, setSelectedCurrency] = useState("USD");

// Currency radio buttons
<label className="flex items-center space-x-2 cursor-pointer">
  <input
    type="radio"
    name="currency"
    value="USD"
    checked={selectedCurrency === "USD"}
    onChange={(e) => setSelectedCurrency(e.target.value)}
  />
  <span>USD ($)</span>
</label>
<label className="flex items-center space-x-2 cursor-pointer">
  <input
    type="radio"
    name="currency"
    value="NGN"
    checked={selectedCurrency === "NGN"}
    onChange={(e) => setSelectedCurrency(e.target.value)}
  />
  <span>NGN (₦)</span>
</label>
```

#### **Dynamic Currency Display**

```jsx
// Plan pricing with currency symbols
<div className="text-3xl font-bold text-white mb-2">
  {selectedCurrency === "NGN" ? "₦" : "$"}
  {currentPlan.price?.[billingCycle] || "99"}
  <span className="text-lg font-normal text-white/70">
    /{billingCycle === "monthly" ? "month" : "year"}
  </span>
</div>
```

### **2. Backend Currency Handling**

#### **Payment Service Currency Methods**

```javascript
// paymentService.js
class PaymentService {
  // Get currency for payment provider
  getCurrencyForProvider(provider, preferredCurrency = null) {
    if (preferredCurrency) {
      const supportedCurrencies = {
        paystack: ["NGN", "USD"],
        stripe: ["USD", "EUR", "GBP"],
        paypal: ["USD", "EUR", "GBP"],
      };

      if (supportedCurrencies[provider]?.includes(preferredCurrency)) {
        return preferredCurrency;
      }
    }

    const defaultCurrencies = {
      paystack: "NGN",
      stripe: "USD",
      paypal: "USD",
    };

    return defaultCurrencies[provider] || "USD";
  }

  // Get supported currencies for a provider
  getSupportedCurrencies(provider) {
    const supportedCurrencies = {
      paystack: ["NGN", "USD"],
      stripe: ["USD", "EUR", "GBP"],
      paypal: ["USD", "EUR", "GBP"],
    };

    return supportedCurrencies[provider] || ["USD"];
  }

  // Format currency for display
  formatCurrency(amount, currency = "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }

  // Convert between currencies
  convertCurrency(amount, fromCurrency, toCurrency) {
    const rates = {
      USD: 1,
      NGN: 1500,
      EUR: 0.85,
      GBP: 0.75,
    };

    if (fromCurrency === toCurrency) return amount;

    const usdAmount = amount / (rates[fromCurrency] || 1);
    return usdAmount * (rates[toCurrency] || 1);
  }
}
```

#### **Subscription Controller Currency Validation**

```javascript
// subscriptionController.js
export const initializeSubscriptionPayment = async (req, res) => {
  const { currency, paymentProvider } = req.body;

  // Handle currency selection
  const selectedCurrency =
    currency || paymentService.getCurrencyForProvider(paymentProvider);

  // Validate currency is supported by the payment provider
  const supportedCurrencies =
    paymentService.getSupportedCurrencies(paymentProvider);
  if (!supportedCurrencies.includes(selectedCurrency)) {
    return res.status(400).json({
      success: false,
      message: `Currency ${selectedCurrency} is not supported by ${paymentProvider}. Supported currencies: ${supportedCurrencies.join(
        ", "
      )}`,
    });
  }

  // Create subscription with selected currency
  const subscription = await Subscription.create({
    payment: {
      provider: paymentProvider,
      amount,
      currency: selectedCurrency,
      status: "pending",
    },
  });
};
```

### **3. Email Service Currency Formatting**

#### **Currency Formatting Helper**

```javascript
// subscriptionEmailService.js
const formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

// Usage in email templates
const formattedAmount = formatCurrency(amount, currency);
```

#### **Email Templates with Currency**

```javascript
// Company billing email
export const sendCompanyBillingEmail = async (
  companyEmail,
  companyName,
  planName,
  billingCycle,
  amount,
  currency,
  transactionId,
  billingPeriod
) => {
  const formattedAmount = formatCurrency(amount, currency);

  const htmlContent = `
    <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 25px; border-radius: 15px; margin: 20px 0; text-align: center;">
      <h2>Subscription Invoice</h2>
      <p><strong>Amount:</strong> ${formattedAmount}</p>
      <p><strong>Plan:</strong> ${planName}</p>
      <p><strong>Billing Cycle:</strong> ${billingCycle}</p>
    </div>
  `;
};
```

---

## 📋 **Database Schema Updates**

### **Transaction Model Currency Field**

```javascript
// models/Transaction.js
const transactionSchema = new mongoose.Schema({
  // ... other fields
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: "USD",
    enum: ["USD", "NGN", "EUR", "GBP"],
  },
  // ... other fields
});
```

### **Subscription Model Currency Field**

```javascript
// models/Subscription.js
const subscriptionSchema = new mongoose.Schema({
  // ... other fields
  payment: {
    provider: {
      type: String,
      enum: ["paystack", "stripe", "paypal"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    // ... other fields
  },
  // ... other fields
});
```

---

## 🚀 **API Endpoints with Currency Support**

### **Initialize Subscription Payment**

```javascript
POST /api/subscriptions/initialize-payment
{
  "companyName": "Example Corp",
  "companyEmail": "admin@example.com",
  "adminName": "John Doe",
  "adminEmail": "john@example.com",
  "adminPhone": "+1234567890",
  "plan": "professional",
  "billingCycle": "monthly",
  "paymentProvider": "paystack",
  "currency": "NGN"  // Optional: defaults to provider's default
}
```

### **Response with Currency**

```javascript
{
  "success": true,
  "data": {
    "subscription": {
      "payment": {
        "provider": "paystack",
        "amount": 299,
        "currency": "NGN",
        "status": "pending"
      }
    },
    "payment": {
      "authorization_url": "https://checkout.paystack.com/...",
      "reference": "EDMS_1234567890_ABC123"
    }
  }
}
```

---

## 💡 **Best Practices**

### **1. Currency Selection Logic**

- **Nigerian customers**: Default to NGN with Paystack
- **International customers**: Default to USD with Stripe/PayPal
- **Allow override**: Users can select preferred currency

### **2. Payment Provider Selection**

```javascript
// Recommended provider selection based on currency
const getRecommendedProvider = (currency) => {
  switch (currency) {
    case "NGN":
      return "paystack";
    case "USD":
    case "EUR":
    case "GBP":
      return "stripe";
    default:
      return "paystack";
  }
};
```

### **3. Error Handling**

```javascript
// Validate currency support before payment
if (!supportedCurrencies.includes(selectedCurrency)) {
  return res.status(400).json({
    success: false,
    message: `Currency ${selectedCurrency} not supported by ${paymentProvider}`,
    supportedCurrencies,
  });
}
```

### **4. Currency Display**

- Always show currency symbol with amounts
- Use proper formatting for each currency
- Include currency in all financial communications

---

## 🔄 **Future Enhancements**

### **1. Real-Time Exchange Rates**

```javascript
// Integrate with exchange rate APIs
const getExchangeRate = async (fromCurrency, toCurrency) => {
  const response = await fetch(
    `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
  );
  const data = await response.json();
  return data.rates[toCurrency];
};
```

### **2. Dynamic Currency Conversion**

```javascript
// Convert prices based on user's location
const convertPriceToLocalCurrency = (usdPrice, userCurrency) => {
  const exchangeRate = await getExchangeRate("USD", userCurrency);
  return usdPrice * exchangeRate;
};
```

### **3. Multi-Currency Pricing**

```javascript
// Store prices in multiple currencies
const planPricing = {
  starter: {
    USD: { monthly: 19.99, yearly: 199.99 },
    NGN: { monthly: 29999, yearly: 299999 },
    EUR: { monthly: 16.99, yearly: 169.99 },
  },
};
```

---

## 📞 **Support & Troubleshooting**

### **Common Issues:**

1. **Currency Not Supported**

   - Check payment provider currency support
   - Validate currency before payment initialization
   - Provide fallback to supported currency

2. **Exchange Rate Discrepancies**

   - Use consistent exchange rates
   - Implement rate caching
   - Handle rate update failures gracefully

3. **Payment Provider Currency Mismatch**
   - Validate provider-currency combinations
   - Auto-select appropriate provider for currency
   - Clear error messages for unsupported combinations

### **Testing Checklist:**

- [ ] USD payments with Stripe
- [ ] NGN payments with Paystack
- [ ] Currency selection in subscription form
- [ ] Email formatting with different currencies
- [ ] Transaction records with correct currency
- [ ] Error handling for unsupported currencies

---

## 🎯 **Implementation Status**

### **✅ Completed:**

- Currency selection in subscription form
- Backend currency validation
- Email formatting with currency
- Transaction model currency support
- Payment provider currency mapping

### **🔄 In Progress:**

- Frontend transaction pages
- Currency conversion utilities
- Real-time exchange rates

### **📋 Planned:**

- Multi-currency pricing
- Dynamic currency detection
- Advanced currency conversion features
