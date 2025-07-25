# EDMS Subscription Workflow Example

## 🏢 **Real-World Scenario: Court System Wants EDMS**

Let's say a **Nigerian Court System** contacts you wanting to use EDMS for their document management.

---

## 📋 **Step 1: Company Contact & Initial Setup**

### **Company Details:**

- **Name:** Lagos High Court
- **Email:** admin@lagoshighcourt.gov.ng
- **Industry:** Legal/Government
- **Contact Person:** Chief Registrar
- **Expected Users:** 150 staff members
- **Budget:** $500/month

### **Platform Admin Actions:**

1. **Login to Platform Admin Dashboard**
2. **Create New Company**
3. **Set up Super Admin Account**
4. **Configure Subscription**

---

## 🔧 **Step 2: Platform Admin Creates Company**

### **API Call: Create Company**

```javascript
POST /api/platform/companies
{
  "companyName": "Lagos High Court",
  "superadmin": {
    "firstName": "Chief",
    "lastName": "Registrar",
    "email": "registrar@lagoshighcourt.gov.ng",
    "phone": "+2348012345678",
    "position": "Chief Registrar"
  }
}
```

### **System Response:**

```javascript
{
  "success": true,
  "data": {
    "company": {
      "_id": "6877829d62a8e4c87de7bc9b",
      "name": "Lagos High Court",
      "email": "admin@lagoshighcourt.gov.ng",
      "industry": "legal",
      "status": "pending"
    },
    "superadmin": {
      "_id": "6877829d62a8e4c87de7bc9c",
      "email": "registrar@lagoshighcourt.gov.ng",
      "firstName": "Chief",
      "lastName": "Registrar",
      "isActive": false,
      "activationToken": "abc123..."
    }
  }
}
```

---

## 💳 **Step 3: Set Up Subscription**

### **Platform Admin Analysis:**

- **150 users** → Need **Professional Plan** (200 users max)
- **Budget $500/month** → **Professional Plan** fits ($299/month)
- **Government entity** → Prefer **yearly billing** for budget planning
- **Nigeria** → Use **Paystack** for payment

### **API Call: Initialize Payment**

```javascript
POST /api/subscriptions/initialize-payment
{
  "companyId": "6877829d62a8e4c87de7bc9b",
  "plan": "professional",
  "billingCycle": "yearly",
  "paymentProvider": "paystack",
  "customAmount": null
}
```

### **System Response:**

```javascript
{
  "success": true,
  "data": {
    "subscription": {
      "_id": "6877829d62a8e4c87de7bc9d",
      "company": "6877829d62a8e4c87de7bc9b",
      "plan": {
        "name": "professional",
        "displayName": "Professional",
        "price": {
          "monthly": 299,
          "yearly": 2990
        },
        "features": {
          "maxUsers": 200,
          "maxStorage": 100,
          "maxDepartments": 20,
          "customWorkflows": true,
          "advancedAnalytics": true,
          "prioritySupport": true
        }
      },
      "billingCycle": "yearly",
      "payment": {
        "provider": "paystack",
        "amount": 2990,
        "currency": "NGN",
        "status": "pending"
      },
      "status": "inactive"
    },
    "payment": {
      "authorization_url": "https://checkout.paystack.com/abc123",
      "reference": "EDMS_1753440660_ABC123",
      "access_code": "abc123"
    },
    "redirectUrl": "https://checkout.paystack.com/abc123"
  }
}
```

---

## 📧 **Step 4: Send Payment Link to Company**

### **Platform Admin Email to Court:**

```
Subject: Lagos High Court - EDMS Subscription Payment

Dear Chief Registrar,

Thank you for choosing EDMS for your document management needs.

Your subscription details:
- Plan: Professional (200 users, 100GB storage)
- Billing: Yearly ($2,990/year)
- Payment Method: Paystack

Please complete your payment using this secure link:
https://checkout.paystack.com/abc123

Once payment is completed, you'll receive:
1. Access credentials for your Super Admin account
2. Setup instructions for your EDMS instance
3. Training materials and support contacts

If you have any questions, please contact us.

Best regards,
EDMS Platform Team
```

---

## 💰 **Step 5: Company Completes Payment**

### **Court System Actions:**

1. **Clicks payment link**
2. **Enters payment details on Paystack**
3. **Completes payment** (₦2,990,000)

### **Paystack Webhook to Our System:**

```javascript
POST /api/subscriptions/webhook/paystack
{
  "event": "charge.success",
  "data": {
    "id": 123456789,
    "status": "success",
    "reference": "EDMS_1753440660_ABC123",
    "amount": 299000000, // in kobo
    "paid_at": "2025-01-25T10:30:00.000Z",
    "metadata": {
      "subscriptionId": "6877829d62a8e4c87de7bc9d",
      "companyId": "6877829d62a8e4c87de7bc9b"
    }
  }
}
```

---

## ✅ **Step 6: System Verifies & Activates**

### **API Call: Verify Payment**

```javascript
POST /api/subscriptions/verify-payment
{
  "subscriptionId": "6877829d62a8e4c87de7bc9d",
  "paymentProvider": "paystack",
  "paymentData": {
    "reference": "EDMS_1753440660_ABC123"
  }
}
```

### **System Updates:**

```javascript
// Subscription becomes active
{
  "status": "active",
  "payment": {
    "status": "completed",
    "transactionId": "123456789",
    "lastBillingDate": "2025-01-25T10:30:00.000Z",
    "nextBillingDate": "2026-01-25T10:30:00.000Z"
  },
  "trialEndDate": "2025-02-01T10:30:00.000Z"
}

// Super Admin account activated
{
  "isActive": true,
  "isEmailVerified": true,
  "lastLogin": null
}
```

---

## 🎉 **Step 7: Company Gets Access**

### **System Sends Welcome Email:**

```
Subject: Welcome to EDMS - Lagos High Court

Dear Chief Registrar,

Your EDMS subscription is now active! 🎉

Login Details:
- URL: https://edms.yourplatform.com
- Email: registrar@lagoshighcourt.gov.ng
- Password: [temporary password]

Next Steps:
1. Login and change your password
2. Set up your departments (Legal, Admin, etc.)
3. Create user accounts for your staff
4. Configure approval workflows
5. Upload your first documents

Support:
- Email: support@edms.com
- Phone: +234-xxx-xxx-xxxx
- Documentation: https://docs.edms.com

Your subscription includes:
✅ 200 user accounts
✅ 100GB storage
✅ Custom workflows
✅ Advanced analytics
✅ Priority support

Welcome aboard!

EDMS Team
```

---

## 🏗️ **Step 8: Super Admin Configures System**

### **Chief Registrar Actions:**

1. **Logs into EDMS**
2. **Changes password**
3. **Creates departments:**

   - Legal Department
   - Administrative Department
   - IT Department
   - External Department

4. **Sets up approval levels:**

   - Level 10: Junior Staff
   - Level 30: Senior Staff
   - Level 50: Department Head
   - Level 70: Deputy Registrar
   - Level 90: Chief Registrar

5. **Creates user accounts** for 150 staff members

6. **Configures workflows** for different document types

---

## 📊 **Step 9: Platform Admin Monitoring**

### **Platform Admin Dashboard Shows:**

```javascript
{
  "activeSubscriptions": 15,
  "monthlyRevenue": 45000,
  "newThisMonth": 3,
  "subscriptions": [
    {
      "company": "Lagos High Court",
      "plan": "Professional",
      "status": "active",
      "usage": {
        "currentUsers": 45,
        "currentStorage": 2.5,
        "currentDepartments": 4
      },
      "payment": {
        "nextBillingDate": "2026-01-25",
        "amount": 2990
      }
    }
  ]
}
```

---

## 🔄 **Step 10: Ongoing Management**

### **Monthly Tasks:**

- **Monitor usage** (users, storage, departments)
- **Send usage reports** to companies
- **Handle renewals** and payments
- **Provide support** and training

### **Yearly Tasks:**

- **Process renewals** automatically
- **Update pricing** if needed
- **Send annual reports**
- **Plan upgrades** and new features

---

## 💡 **Key Benefits of This System:**

1. **Automated Payment Processing** - No manual invoicing
2. **Usage Tracking** - Monitor resource consumption
3. **Flexible Plans** - Scale up/down as needed
4. **Professional Onboarding** - Smooth setup process
5. **Revenue Management** - Predictable income
6. **Customer Support** - Proactive monitoring

This workflow ensures a professional, automated subscription management system that scales with your business!
