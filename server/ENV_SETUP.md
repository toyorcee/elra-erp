# Environment Variables Setup for EDMS Subscription System

## 🔧 **Required Environment Variables**

Add these to your `server/.env` file:

### **Database & Core Settings**

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/edms
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=24h
REFRESH_TOKEN_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

### **Payment Providers**

#### **Paystack (Primary for Nigeria)**

```env
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here
PAYSTACK_WEBHOOK_SECRET=whsec_your_paystack_webhook_secret_here
```

#### **Stripe (International)**

```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here
```

#### **PayPal (International)**

```env
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_SECRET=your_paypal_secret_here
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id_here
```

### **Email Configuration**

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
EMAIL_FROM=EDMS Platform <noreply@edms.com>
```

### **Subscription Settings**

```env
DEFAULT_TRIAL_DAYS=7
SUBSCRIPTION_GRACE_PERIOD_DAYS=3
AUTO_RENEWAL_ENABLED=true
```

## 🚀 **How the Subscription System Works**

### **1. Platform Admin Creates Company + Subscription**

```javascript
// Platform Admin flow:
1. Create Company (name, email, industry)
2. Create Super Admin user for the company
3. Set up subscription (plan, billing cycle, payment method)
4. Initialize payment with Paystack
5. Send payment link to company
6. Verify payment and activate subscription
```

### **2. Subscription Plans Available**

```javascript
// From Subscription.getPlans():
{
  starter: {
    price: { monthly: 99, yearly: 990 },
    features: { maxUsers: 50, maxStorage: 10, maxDepartments: 5 }
  },
  professional: {
    price: { monthly: 299, yearly: 2990 },
    features: { maxUsers: 200, maxStorage: 100, maxDepartments: 20 }
  },
  enterprise: {
    price: { monthly: 799, yearly: 7990 },
    features: { maxUsers: -1, maxStorage: 1000, maxDepartments: -1 }
  }
}
```

### **3. Payment Flow with Paystack**

```javascript
// Payment initialization:
1. Platform Admin selects plan and billing cycle
2. System calculates amount (e.g., $99/month or $990/year)
3. Creates subscription record with "pending" status
4. Calls Paystack API to initialize payment
5. Returns payment URL to Platform Admin
6. Platform Admin sends URL to company

// Payment verification:
1. Company completes payment on Paystack
2. Paystack sends webhook to our system
3. System verifies payment and updates subscription
4. Subscription status changes to "active"
5. Company gets access to their EDMS instance
```

### **4. Subscription Status Management**

```javascript
// Subscription statuses:
- "inactive": Created but not paid
- "trial": Free trial period
- "active": Paid and active
- "suspended": Payment failed, grace period
- "cancelled": Manually cancelled
- "expired": Trial or subscription ended
```

## 📊 **Platform Admin Dashboard Features**

### **Subscription Management**

- View all company subscriptions
- Monitor payment status
- Track usage (users, storage, departments)
- Handle renewals and cancellations
- Generate revenue reports

### **Company Onboarding**

- Create new companies
- Set up super admin accounts
- Configure subscription plans
- Send payment invitations
- Monitor activation status

### **Payment Processing**

- Initialize payments with Paystack
- Verify payment completion
- Handle failed payments
- Process refunds if needed
- Send payment reminders

## 🔐 **Security Considerations**

### **Payment Security**

- All payment data handled by Paystack (PCI compliant)
- Webhook signature verification
- Payment status validation
- Secure API keys management

### **Access Control**

- Platform Admin only can manage subscriptions
- Company Super Admins can view their own subscription
- Usage limits enforced at API level
- Audit trail for all subscription changes

## 📈 **Usage Tracking**

The system automatically tracks:

- Number of active users per company
- Storage usage (GB)
- Number of departments
- Documents uploaded
- API usage (for enterprise plans)

## 🔄 **Renewal Process**

```javascript
// Automatic renewal flow:
1. System checks upcoming renewals daily
2. Sends reminder emails to Platform Admin
3. Processes automatic renewal if enabled
4. Updates subscription dates
5. Sends confirmation emails
```

## 🚨 **Grace Period & Suspension**

```javascript
// When payment fails:
1. Subscription enters grace period (3 days)
2. Company gets warning emails
3. Platform Admin notified
4. If not resolved, subscription suspended
5. Company loses access to EDMS
6. Data preserved for 30 days
```

This system provides a complete subscription management solution for your EDMS platform, with Paystack as the primary payment processor for Nigerian customers.
