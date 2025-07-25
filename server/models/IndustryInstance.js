import mongoose from "mongoose";

const industryInstanceSchema = new mongoose.Schema({
  // Platform Admin who created this instance
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Industry type
  industryType: {
    type: String,
    required: true,
    enum: [
      "court_system",
      "banking_system",
      "healthcare_system",
      "manufacturing_system",
      "legal_firm",
      "government_agency",
      "educational_institution",
      "insurance_company",
      "real_estate_agency",
      "consulting_firm",
    ],
  },

  // Instance details
  name: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    required: true,
  },

  // Instance-specific configuration
  config: {
    // Court System specific
    courtType: {
      type: String,
      enum: ["district", "circuit", "supreme", "municipal", "federal"],
      default: null,
    },
    jurisdiction: String,

    // Banking System specific
    bankType: {
      type: String,
      enum: ["commercial", "investment", "retail", "credit_union"],
      default: null,
    },
    branchCount: Number,

    // Healthcare System specific
    facilityType: {
      type: String,
      enum: ["hospital", "clinic", "pharmacy", "laboratory", "imaging_center"],
      default: null,
    },
    bedCount: Number,

    // Manufacturing System specific
    industrySector: {
      type: String,
      enum: [
        "automotive",
        "electronics",
        "textiles",
        "food_beverage",
        "chemicals",
      ],
      default: null,
    },
    plantCount: Number,

    // General settings
    maxUsers: {
      type: Number,
      default: 100,
    },
    features: [
      {
        type: String,
        enum: [
          "document_management",
          "approval_workflows",
          "audit_trails",
          "compliance_reporting",
          "user_management",
          "role_based_access",
          "notifications",
          "analytics",
          "mobile_access",
          "api_integration",
        ],
      },
    ],
  },

  // Status
  status: {
    type: String,
    enum: ["active", "inactive", "suspended", "pending_setup"],
    default: "pending_setup",
  },

  // Super Admin (Clerk) details
  superAdmin: {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: String,
    isActive: {
      type: Boolean,
      default: false,
    },
    lastLogin: Date,
    setupCompleted: {
      type: Boolean,
      default: false,
    },
    credentialsBackup: {
      tempPassword: {
        type: String,
        default: null,
      },
      passwordChanged: {
        type: Boolean,
        default: false,
      },
      passwordChangedAt: Date,
    },
  },

  // Subscription details
  subscription: {
    plan: {
      type: String,
      enum: ["starter", "professional", "enterprise", "custom"],
      default: "starter",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },

  // Usage metrics
  metrics: {
    totalUsers: {
      type: Number,
      default: 0,
    },
    totalDocuments: {
      type: Number,
      default: 0,
    },
    activeWorkflows: {
      type: Number,
      default: 0,
    },
    storageUsed: {
      type: Number,
      default: 0,
    },
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for efficient queries
industryInstanceSchema.index({ industryType: 1, status: 1 });
industryInstanceSchema.index({ "superAdmin.email": 1 });
industryInstanceSchema.index({ createdBy: 1 });

// Pre-save middleware to update timestamp
industryInstanceSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const IndustryInstance = mongoose.model(
  "IndustryInstance",
  industryInstanceSchema
);

export default IndustryInstance;
