import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    // Company this subscription belongs to
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    // Subscription plan details
    plan: {
      name: {
        type: String,
        required: true,
        enum: ["starter", "business", "professional", "enterprise", "custom"],
      },
      displayName: {
        type: String,
        required: true,
      },
      price: {
        monthly: {
          type: Number,
          required: true,
        },
        yearly: {
          type: Number,
          required: true,
        },
      },
      features: {
        maxUsers: {
          type: Number,
          required: true,
        },
        maxStorage: {
          type: Number,
          required: true,
        },
        maxDepartments: {
          type: Number,
          required: true,
        },
        customWorkflows: {
          type: Boolean,
          default: false,
        },
        advancedAnalytics: {
          type: Boolean,
          default: false,
        },
        prioritySupport: {
          type: Boolean,
          default: false,
        },
        customBranding: {
          type: Boolean,
          default: false,
        },
        apiAccess: {
          type: Boolean,
          default: false,
        },
        sso: {
          type: Boolean,
          default: false,
        },
      },
      description: String,
    },

    // Billing cycle
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },

    // Payment details
    payment: {
      provider: {
        type: String,
        enum: ["paystack", "stripe", "paypal"],
        required: true,
      },
      transactionId: String,
      amount: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: "USD",
      },
      status: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded"],
        default: "pending",
      },
      paymentMethod: String,
      lastBillingDate: Date,
      nextBillingDate: Date,
    },

    // Subscription status
    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "cancelled", "expired"],
      default: "inactive",
    },

    // Subscription dates
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: Date,
    trialEndDate: Date,

    // Usage tracking
    usage: {
      currentUsers: {
        type: Number,
        default: 0,
      },
      currentStorage: {
        type: Number, // in GB
        default: 0,
      },
      currentDepartments: {
        type: Number,
        default: 0,
      },
      documentsUploaded: {
        type: Number,
        default: 0,
      },
      lastUsageUpdate: {
        type: Date,
        default: Date.now,
      },
    },

    // Auto-renewal settings
    autoRenew: {
      type: Boolean,
      default: true,
    },
    renewalDate: Date,

    // Custom settings for enterprise
    customSettings: {
      customDomain: String,
      customBranding: {
        logo: String,
        colors: {
          primary: String,
          secondary: String,
        },
      },
      integrations: [String],
      customFeatures: [String],
    },

    // Audit trail
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
subscriptionSchema.index({ company: 1, status: 1 });
subscriptionSchema.index({ "payment.nextBillingDate": 1 });
subscriptionSchema.index({ status: 1, "payment.nextBillingDate": 1 });

// Pre-save middleware to calculate end date
subscriptionSchema.pre("save", function (next) {
  if (this.isModified("startDate") || this.isModified("billingCycle")) {
    const startDate = new Date(this.startDate);

    if (this.billingCycle === "monthly") {
      this.endDate = new Date(startDate.setMonth(startDate.getMonth() + 1));
    } else if (this.billingCycle === "yearly") {
      this.endDate = new Date(
        startDate.setFullYear(startDate.getFullYear() + 1)
      );
    }
  }
  next();
});

// Instance method to check if subscription is active
subscriptionSchema.methods.isActive = function () {
  return this.status === "active" && new Date() <= this.endDate;
};

// Instance method to check if subscription is in trial
subscriptionSchema.methods.isInTrial = function () {
  return this.trialEndDate && new Date() <= this.trialEndDate;
};

// Instance method to get days until expiration
subscriptionSchema.methods.getDaysUntilExpiration = function () {
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Instance method to check if usage is within limits
subscriptionSchema.methods.isWithinLimits = function () {
  return (
    this.usage.currentUsers <= this.plan.features.maxUsers &&
    this.usage.currentStorage <= this.plan.features.maxStorage &&
    this.usage.currentDepartments <= this.plan.features.maxDepartments
  );
};

// Static method to get subscription plans
subscriptionSchema.statics.getPlans = function () {
  return {
    starter: {
      name: "starter",
      displayName: "Starter Plan",
      price: {
        monthly: 19.99,
        yearly: 199.99, // 17% discount
      },
      features: {
        maxUsers: 10,
        maxStorage: 10,
        maxDepartments: 5,
        customWorkflows: false,
        advancedAnalytics: false,
        prioritySupport: false,
        customBranding: false,
        apiAccess: false,
        sso: false,
      },
      description:
        "Perfect for small teams and startups getting started with document management",
    },
    business: {
      name: "business",
      displayName: "Business Plan",
      price: {
        monthly: 49.99,
        yearly: 499.99, // 17% discount
      },
      features: {
        maxUsers: 50,
        maxStorage: 50,
        maxDepartments: 15,
        customWorkflows: true,
        advancedAnalytics: false,
        prioritySupport: false,
        customBranding: false,
        apiAccess: true,
        sso: false,
      },
      description: "Ideal for growing businesses and medium organizations",
    },
    professional: {
      name: "professional",
      displayName: "Professional Plan",
      price: {
        monthly: 99.99,
        yearly: 999.99, // 17% discount
      },
      features: {
        maxUsers: 150,
        maxStorage: 200,
        maxDepartments: 30,
        customWorkflows: true,
        advancedAnalytics: true,
        prioritySupport: true,
        customBranding: true,
        apiAccess: true,
        sso: false,
      },
      description: "For established organizations with advanced workflow needs",
    },
    enterprise: {
      name: "enterprise",
      displayName: "Enterprise Plan",
      price: {
        monthly: 199.99,
        yearly: 1999.99, // 17% discount
      },
      features: {
        maxUsers: -1, // unlimited
        maxStorage: 1000,
        maxDepartments: -1, // unlimited
        customWorkflows: true,
        advancedAnalytics: true,
        prioritySupport: true,
        customBranding: true,
        apiAccess: true,
        sso: true,
      },
      description:
        "Complete solution for large enterprises with unlimited scalability and dedicated support",
    },
  };
};

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
