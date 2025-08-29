import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    // Basic Vendor Information
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
    },
    address: {
      street: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },
      city: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },
      state: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },
      postalCode: {
        type: String,
        trim: true,
        maxlength: 20,
      },
      country: {
        type: String,
        default: "Nigeria",
        trim: true,
        maxlength: 100,
      },
    },

    // Business Information
    servicesOffered: [
      {
        type: String,
        enum: [
          "software_development",
          "training",
          "supply",
          "consulting",
          "maintenance",
          "installation",
          "transportation",
          "construction",
          "equipment_rental",
          "other",
        ],
        required: true,
      },
    ],
    tinNumber: {
      type: String,
      trim: true,
      maxlength: 20,
      // Optional but useful for government projects
    },

    // Vendor Status
    status: {
      type: String,
      enum: ["approved", "blacklisted", "pending", "suspended"],
      default: "pending",
      required: true,
    },

    // Additional Information
    website: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    registrationNumber: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    businessType: {
      type: String,
      enum: [
        "sole_proprietorship",
        "partnership",
        "corporation",
        "llc",
        "other",
      ],
      default: "corporation",
    },
    yearsInBusiness: {
      type: Number,
      min: 0,
      max: 100,
    },

    // Financial Information
    annualRevenue: {
      type: Number,
      min: 0,
    },
    creditLimit: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Contact Information
    alternativeContact: {
      name: String,
      phone: String,
      email: String,
    },

    // Notes and Comments
    notes: [
      {
        content: {
          type: String,
          required: true,
          trim: true,
          maxlength: 1000,
        },
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Audit Information
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
vendorSchema.index({ name: 1 });
vendorSchema.index({ email: 1 });
vendorSchema.index({ status: 1 });
vendorSchema.index({ servicesOffered: 1 });
vendorSchema.index({ tinNumber: 1 });

// Virtual for full address
vendorSchema.virtual("fullAddress").get(function () {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.postalCode}, ${addr.country}`;
});

// Virtual for display name
vendorSchema.virtual("displayName").get(function () {
  return `${this.name} (${this.contactPerson})`;
});

// Pre-save middleware to ensure email is lowercase
vendorSchema.pre("save", function (next) {
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// Static method to find approved vendors
vendorSchema.statics.findApproved = function () {
  return this.find({ status: "approved" });
};

// Static method to find vendors by service
vendorSchema.statics.findByService = function (service) {
  return this.find({
    servicesOffered: service,
    status: "approved",
  });
};

// Instance method to check if vendor is active
vendorSchema.methods.isActive = function () {
  return this.status === "approved";
};

// Instance method to get vendor summary
vendorSchema.methods.getSummary = function () {
  return {
    id: this._id,
    name: this.name,
    contactPerson: this.contactPerson,
    email: this.email,
    phone: this.phone,
    status: this.status,
    servicesOffered: this.servicesOffered,
    fullAddress: this.fullAddress,
  };
};

const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;
