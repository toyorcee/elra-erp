import mongoose from "mongoose";

const marketingFinancialTransactionSchema = new mongoose.Schema(
  {
    // Basic Info
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },

    // Transaction Type & Direction
    type: {
      type: String,
      enum: ["expense", "revenue"],
      required: true,
    },
    direction: {
      type: String,
      enum: ["in", "out"],
      required: true,
    },

    // Financial Details
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "NGN",
    },

    // Marketing-specific Categories
    category: {
      type: String,
      required: true,
      enum: [
        // Revenue categories
        "sponsorships",
        "partnerships",
        "affiliate_commissions",
        "content_licensing",
        "event_revenue",
        "brand_licensing",
        // Expense categories
        "digital_ads",
        "social_media",
        "content_creation",
        "influencer_marketing",
        "email_marketing",
        "seo_tools",
        "analytics_tools",
        "design_software",
        "photography",
        "video_production",
        "events",
        "conferences",
        "trade_shows",
        "print_materials",
        "branding",
        "pr_activities",
        "market_research",
        "other",
      ],
    },

    // Department & Module
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    module: {
      type: String,
      default: "marketing",
      enum: ["marketing"],
    },

    // Approval Workflow
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "processed", "cancelled"],
      default: "pending",
    },
    approvalLevel: {
      type: String,
      enum: ["department", "finance", "executive"],
      required: true,
    },

    // Budget Integration (for expenses)
    budgetCategory: {
      type: String,
      enum: ["operational", "projects"],
      required: function () {
        return this.type === "expense";
      },
    },
    budgetReservationId: {
      type: String,
    },

    // People
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Marketing-specific fields
    campaignId: {
      type: String,
    },
    campaignName: {
      type: String,
    },
    platform: {
      type: String,
      enum: [
        "facebook",
        "instagram",
        "twitter",
        "linkedin",
        "google",
        "youtube",
        "tiktok",
        "email",
        "website",
        "offline",
        "other",
      ],
    },
    targetAudience: {
      type: String,
    },
    roi: {
      type: Number, // Return on Investment percentage
    },
    impressions: {
      type: Number,
    },
    clicks: {
      type: Number,
    },
    conversions: {
      type: Number,
    },

    // Payment Information
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "cash", "check", "card", "crypto", "other"],
    },
    paymentReference: {
      type: String,
    },

    // Supporting Documents
    attachments: [
      {
        filename: String,
        originalName: String,
        path: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Dates
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: Date,
    processedAt: Date,
    dueDate: Date,
    expectedDate: Date, // For revenue
    campaignStartDate: Date,
    campaignEndDate: Date,

    // Metadata
    tags: [String],
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: String,

    // Integration
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },

    // Audit
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
marketingFinancialTransactionSchema.index({ transactionId: 1 });
marketingFinancialTransactionSchema.index({ type: 1, status: 1 });
marketingFinancialTransactionSchema.index({ department: 1, createdAt: -1 });
marketingFinancialTransactionSchema.index({ requestedBy: 1, createdAt: -1 });
marketingFinancialTransactionSchema.index({ campaignId: 1, createdAt: -1 });
marketingFinancialTransactionSchema.index({ platform: 1, createdAt: -1 });

// Pre-save middleware
marketingFinancialTransactionSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Auto-set direction based on type
  if (this.type === "revenue") {
    this.direction = "in";
  } else if (this.type === "expense") {
    this.direction = "out";
  }

  next();
});

// Static methods
marketingFinancialTransactionSchema.statics.generateTransactionId =
  function () {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `MKT_${timestamp}_${random}`;
  };

// Instance methods
marketingFinancialTransactionSchema.methods.calculateROI = function () {
  if (this.type === "expense" && this.impressions && this.conversions) {
    // Simple ROI calculation - can be enhanced based on business logic
    this.roi = ((this.conversions * 100) / this.impressions).toFixed(2);
  }
  return this.roi;
};

const MarketingFinancialTransaction = mongoose.model(
  "MarketingFinancialTransaction",
  marketingFinancialTransactionSchema
);

export default MarketingFinancialTransaction;
