import mongoose from "mongoose";
import { UNIFIED_CATEGORIES } from "../constants/unifiedCategories.js";

const inventorySchema = new mongoose.Schema(
  {
    // Basic Item Information
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: false,
      trim: true,
      maxlength: 1000,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
    },

    // Item Type and Category
    type: {
      type: String,
      required: true,
      enum: [
        "equipment",
        "vehicle",
        "property",
        "furniture",
        "electronics",
        "other",
      ],
    },
    category: {
      type: String,
      required: true,
      enum: UNIFIED_CATEGORIES,
    },

    // Item Status
    status: {
      type: String,
      enum: [
        "available",
        "unavailable",
        "leased",
        "maintenance",
        "retired",
        "lost",
      ],
      default: "available",
      required: true,
    },

    // Completion Status (for Operations HOD workflow)
    completionStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    completedAt: {
      type: Date,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Item Specifications
    specifications: {
      brand: {
        type: String,
        trim: true,
      },
      model: {
        type: String,
        trim: true,
      },
      year: {
        type: Number,
        min: 1900,
        max: new Date().getFullYear() + 45,
      },
      serialNumber: {
        type: String,
        trim: true,
      },
      licenseType: {
        type: String,
        enum: ["Annual", "Monthly", "Perpetual", "One-time", "Trial"],
      },
      numberOfUsers: {
        type: String,
        trim: true,
      },
      dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
          type: String,
          enum: ["cm", "m", "ft", "in"],
          default: "m",
        },
      },
      weight: {
        value: Number,
        unit: {
          type: String,
          enum: ["kg", "lbs", "tons"],
          default: "kg",
        },
      },
    },

    // Location Information
    location: {
      type: String,
      trim: true,
    },

    // Delivery Information
    deliveryCondition: {
      type: String,
      enum: ["excellent", "good", "fair", "poor", "damaged"],
    },
    receivedBy: {
      type: String,
      trim: true,
    },
    receivedDate: {
      type: Date,
    },

    // Financial Information (in Naira)
    purchasePrice: {
      type: Number,
      required: false,
      min: 0,
    },
    currentValue: {
      type: Number,
      required: false,
      min: 0,
    },
    leaseRate: {
      daily: {
        type: Number,
        min: 0,
      },
      weekly: {
        type: Number,
        min: 0,
      },
      monthly: {
        type: Number,
        min: 0,
      },
    },

    // Maintenance Information
    maintenance: {
      lastServiceDate: {
        type: Date,
      },
      nextServiceDate: {
        type: Date,
      },
      serviceInterval: {
        type: Number,
        min: 0,
      },
      maintenanceNotes: {
        type: String,
        trim: true,
      },
      maintenanceHistory: [
        {
          date: {
            type: Date,
            required: false,
          },
          description: {
            type: String,
            required: false,
            trim: true,
          },
          cost: {
            type: Number,
            min: 0,
          },
          performedBy: {
            type: String,
            trim: true,
          },
          notes: {
            type: String,
            trim: true,
          },
        },
      ],
    },

    // Insurance and Documentation
    insurance: {
      policyNumber: {
        type: String,
        trim: true,
      },
      provider: {
        type: String,
        trim: true,
      },
      expiryDate: {
        type: Date,
      },
      coverage: {
        type: String,
        trim: true,
      },
    },

    // Documents and Images - Store references to Document collection
    documents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
      },
    ],

    // Notes and Comments
    notes: [
      {
        text: {
          type: String,
          required: true,
          trim: true,
        },
        type: {
          type: String,
          default: "completion",
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Project Association
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },

    // Procurement Association
    procurementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Procurement",
    },

    // Assignment Information
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Expiry Information (for consumables)
    expiryDate: {
      type: Date,
    },

    // Audit Fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // company: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Company",
    //   required: true,
    // },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

inventorySchema.index({ status: 1 });
inventorySchema.index({ type: 1 });
inventorySchema.index({ category: 1 });
inventorySchema.index({ code: 1 }, { unique: true });
inventorySchema.index({ "specifications.serialNumber": 1 });

// Virtual for item age
inventorySchema.virtual("age").get(function () {
  if (this.specifications.year) {
    return new Date().getFullYear() - this.specifications.year;
  }
  return null;
});

// Virtual for depreciation
inventorySchema.virtual("depreciation").get(function () {
  return this.purchasePrice - this.currentValue;
});

// Virtual for depreciation percentage
inventorySchema.virtual("depreciationPercentage").get(function () {
  if (this.purchasePrice === 0) return 0;
  return ((this.purchasePrice - this.currentValue) / this.purchasePrice) * 100;
});

// Virtual for maintenance due
inventorySchema.virtual("maintenanceDue").get(function () {
  if (!this.maintenance.nextServiceDate) return false;
  return new Date() >= this.maintenance.nextServiceDate;
});

// Virtual for insurance expiry
inventorySchema.virtual("insuranceExpiring").get(function () {
  if (!this.insurance.expiryDate) return false;
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return this.insurance.expiryDate <= thirtyDaysFromNow;
});

// Pre-save middleware to generate item code if not provided
inventorySchema.pre("save", async function (next) {
  if (!this.code) {
    const count = await this.constructor.countDocuments();
    this.code = `INV${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

// Static method to get inventory statistics
inventorySchema.statics.getInventoryStats = async function () {
  const stats = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalValue: { $sum: "$currentValue" },
        totalPurchasePrice: { $sum: "$purchasePrice" },
      },
    },
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      count: stat.count,
      totalValue: stat.totalValue,
      totalPurchasePrice: stat.totalPurchasePrice,
    };
    return acc;
  }, {});
};

// Static method to get available items
inventorySchema.statics.getAvailableItems = function () {
  return this.find({ isActive: true, status: "available" })
    .populate("createdBy", "firstName lastName")
    .sort({ name: 1 });
};

// Static method to get items by type
inventorySchema.statics.getByType = function (type) {
  return this.find({ isActive: true, type })
    .populate("createdBy", "firstName lastName")
    .sort({ name: 1 });
};

// Static method to get items needing maintenance
inventorySchema.statics.getMaintenanceDue = function () {
  return this.find({
    isActive: true,
    "maintenance.nextServiceDate": { $lte: new Date() },
  })
    .populate("createdBy", "firstName lastName")
    .sort({ "maintenance.nextServiceDate": 1 });
};

// Instance method to add maintenance record
inventorySchema.methods.addMaintenanceRecord = async function (
  description,
  cost = 0,
  performedBy = "",
  notes = ""
) {
  this.maintenance.maintenanceHistory.push({
    date: new Date(),
    description,
    cost,
    performedBy,
    notes,
  });

  // Update next service date if service interval is set
  if (this.maintenance.serviceInterval) {
    this.maintenance.nextServiceDate = new Date();
    this.maintenance.nextServiceDate.setDate(
      this.maintenance.nextServiceDate.getDate() +
        this.maintenance.serviceInterval
    );
  }

  this.maintenance.lastServiceDate = new Date();
  await this.save();
};

// Instance method to add note
inventorySchema.methods.addNote = async function (
  content,
  authorId,
  isPrivate = false
) {
  this.notes.push({
    content,
    author: authorId,
    isPrivate,
    createdAt: new Date(),
  });

  await this.save();
};

// Instance method to update status
inventorySchema.methods.updateStatus = async function (newStatus) {
  this.status = newStatus;
  await this.save();
};

// Instance method to get item summary
inventorySchema.methods.getSummary = function () {
  return {
    id: this._id,
    name: this.name,
    code: this.code,
    type: this.type,
    category: this.category,
    status: this.status,
    currentValue: this.currentValue,
    purchasePrice: this.purchasePrice,
    depreciation: this.depreciation,
    depreciationPercentage: this.depreciationPercentage,
    age: this.age,
    maintenanceDue: this.maintenanceDue,
    insuranceExpiring: this.insuranceExpiring,
    location: this.location,
  };
};

const Inventory = mongoose.model("Inventory", inventorySchema);

export default Inventory;
