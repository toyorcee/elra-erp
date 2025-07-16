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
