import mongoose from "mongoose";

const systemSettingsSchema = new mongoose.Schema(
  {
    // Registration settings
    registration: {
      allowPublicRegistration: {
        type: Boolean,
        default: true,
      },
      requireDepartmentSelection: {
        type: Boolean,
        default: false,
      },
      defaultDepartment: {
        type: String,
        default: "External",
      },
      requireEmailVerification: {
        type: Boolean,
        default: false,
      },
      requireAdminApproval: {
        type: Boolean,
        default: false,
      },
    },

    // Department settings
    departments: {
      allowExternalDepartment: {
        type: Boolean,
        default: true,
      },
      autoCreateExternal: {
        type: Boolean,
        default: true,
      },
      maxDepartments: {
        type: Number,
        default: 50,
      },
    },

    // System information
    systemInfo: {
      companyName: {
        type: String,
        default: "EDMS System",
      },
      systemName: {
        type: String,
        default: "Electronic Document Management System",
      },
      version: {
        type: String,
        default: "1.0.0",
      },
      contactEmail: {
        type: String,
        default: "admin@edms.com",
      },
    },

    // Security settings
    security: {
      passwordMinLength: {
        type: Number,
        default: 6,
      },
      passwordRequireUppercase: {
        type: Boolean,
        default: true,
      },
      passwordRequireLowercase: {
        type: Boolean,
        default: true,
      },
      passwordRequireNumbers: {
        type: Boolean,
        default: true,
      },
      sessionTimeout: {
        type: Number,
        default: 24, // hours
      },
      maxLoginAttempts: {
        type: Number,
        default: 5,
      },
    },

    // File upload settings
    fileUpload: {
      maxFileSize: {
        type: Number,
        default: 10, // MB
      },
      allowedFileTypes: [
        {
          type: String,
          enum: [
            "pdf",
            "doc",
            "docx",
            "xls",
            "xlsx",
            "ppt",
            "pptx",
            "txt",
            "jpg",
            "jpeg",
            "png",
            "gif",
            "zip",
            "rar",
          ],
        },
      ],
      maxFilesPerUpload: {
        type: Number,
        default: 10,
      },
    },

    // Notification settings
    notifications: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      documentApprovalNotifications: {
        type: Boolean,
        default: true,
      },
      userRegistrationNotifications: {
        type: Boolean,
        default: true,
      },
      systemAlertNotifications: {
        type: Boolean,
        default: true,
      },
    },

    // UI/UX settings
    ui: {
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "light",
      },
      primaryColor: {
        type: String,
        default: "#3B82F6",
      },
      logoUrl: {
        type: String,
        default: "",
      },
      faviconUrl: {
        type: String,
        default: "",
      },
    },

    currency: {
      defaultCurrency: {
        type: String,
        enum: ["USD", "NGN"],
        default: "USD",
      },
      usdToNgnRate: {
        type: Number,
        default: 1500,
        min: 1,
        max: 10000,
      },
      autoUpdateConversionRate: {
        type: Boolean,
        default: false,
      },
      lastConversionRateUpdate: {
        type: Date,
        default: Date.now,
      },
    },

    // Subscription Plans Configuration
    subscriptionPlans: {
      starter: {
        displayName: {
          type: String,
          default: "Starter Plan",
        },
        description: {
          type: String,
          default:
            "Perfect for small teams and startups getting started with document management",
        },
        price: {
          USD: {
            monthly: {
              type: Number,
              default: 19.99,
              min: 0,
            },
            yearly: {
              type: Number,
              default: 199.99,
              min: 0,
            },
          },
          NGN: {
            monthly: {
              type: Number,
              default: 29985, // 19.99 * 1500
              min: 0,
            },
            yearly: {
              type: Number,
              default: 299985, // 199.99 * 1500
              min: 0,
            },
          },
        },
        features: {
          maxUsers: {
            type: Number,
            default: 10,
            min: 1,
          },
          maxStorage: {
            type: Number,
            default: 10,
            min: 1,
          },
          maxDepartments: {
            type: Number,
            default: 5,
            min: 1,
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
        isActive: {
          type: Boolean,
          default: true,
        },
      },
      business: {
        displayName: {
          type: String,
          default: "Business Plan",
        },
        description: {
          type: String,
          default: "Ideal for growing businesses and medium organizations",
        },
        price: {
          USD: {
            monthly: {
              type: Number,
              default: 49.99,
              min: 0,
            },
            yearly: {
              type: Number,
              default: 499.99,
              min: 0,
            },
          },
          NGN: {
            monthly: {
              type: Number,
              default: 74985, // 49.99 * 1500
              min: 0,
            },
            yearly: {
              type: Number,
              default: 749985, // 499.99 * 1500
              min: 0,
            },
          },
        },
        features: {
          maxUsers: {
            type: Number,
            default: 50,
            min: 1,
          },
          maxStorage: {
            type: Number,
            default: 50,
            min: 1,
          },
          maxDepartments: {
            type: Number,
            default: 15,
            min: 1,
          },
          customWorkflows: {
            type: Boolean,
            default: true,
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
            default: true,
          },
          sso: {
            type: Boolean,
            default: false,
          },
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
      professional: {
        displayName: {
          type: String,
          default: "Professional Plan",
        },
        description: {
          type: String,
          default: "For established organizations with advanced workflow needs",
        },
        price: {
          USD: {
            monthly: {
              type: Number,
              default: 99.99,
              min: 0,
            },
            yearly: {
              type: Number,
              default: 999.99,
              min: 0,
            },
          },
          NGN: {
            monthly: {
              type: Number,
              default: 149985, // 99.99 * 1500
              min: 0,
            },
            yearly: {
              type: Number,
              default: 1499850, // 999.99 * 1500
              min: 0,
            },
          },
        },
        features: {
          maxUsers: {
            type: Number,
            default: 150,
            min: 1,
          },
          maxStorage: {
            type: Number,
            default: 200,
            min: 1,
          },
          maxDepartments: {
            type: Number,
            default: 30,
            min: 1,
          },
          customWorkflows: {
            type: Boolean,
            default: true,
          },
          advancedAnalytics: {
            type: Boolean,
            default: true,
          },
          prioritySupport: {
            type: Boolean,
            default: true,
          },
          customBranding: {
            type: Boolean,
            default: true,
          },
          apiAccess: {
            type: Boolean,
            default: true,
          },
          sso: {
            type: Boolean,
            default: false,
          },
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
      enterprise: {
        displayName: {
          type: String,
          default: "Enterprise Plan",
        },
        description: {
          type: String,
          default:
            "Complete solution for large enterprises with unlimited scalability and dedicated support",
        },
        price: {
          USD: {
            monthly: {
              type: Number,
              default: 199.99,
              min: 0,
            },
            yearly: {
              type: Number,
              default: 1999.99,
              min: 0,
            },
          },
          NGN: {
            monthly: {
              type: Number,
              default: 299985, // 199.99 * 1500
              min: 0,
            },
            yearly: {
              type: Number,
              default: 2999985, // 1999.99 * 1500
              min: 0,
            },
          },
        },
        features: {
          maxUsers: {
            type: Number,
            default: -1, // unlimited
            min: -1,
          },
          maxStorage: {
            type: Number,
            default: 1000,
            min: 1,
          },
          maxDepartments: {
            type: Number,
            default: -1, // unlimited
            min: -1,
          },
          customWorkflows: {
            type: Boolean,
            default: true,
          },
          advancedAnalytics: {
            type: Boolean,
            default: true,
          },
          prioritySupport: {
            type: Boolean,
            default: true,
          },
          customBranding: {
            type: Boolean,
            default: true,
          },
          apiAccess: {
            type: Boolean,
            default: true,
          },
          sso: {
            type: Boolean,
            default: true,
          },
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one system settings document exists
systemSettingsSchema.statics.getInstance = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this({
      updatedBy: null, // Will be set when first updated
    });
    await settings.save();
  }
  return settings;
};

// Get settings with defaults
systemSettingsSchema.statics.getSettings = async function () {
  const settings = await this.getInstance();
  return settings;
};

// Update settings
systemSettingsSchema.statics.updateSettings = async function (updates, userId) {
  const settings = await this.getInstance();

  // Update each section
  Object.keys(updates).forEach((section) => {
    if (settings[section] && typeof updates[section] === "object") {
      Object.assign(settings[section], updates[section]);
    }
  });

  settings.updatedBy = userId;
  await settings.save();
  return settings;
};

const SystemSettings = mongoose.model("SystemSettings", systemSettingsSchema);

export default SystemSettings;
