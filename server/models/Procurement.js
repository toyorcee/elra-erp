import mongoose from "mongoose";
import { UNIFIED_CATEGORIES } from "../constants/unifiedCategories.js";

const procurementSchema = new mongoose.Schema(
  {
    // Basic Purchase Order Information
    poNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    // Purchase Order Status
    status: {
      type: String,
      enum: ["draft", "pending", "issued", "paid", "delivered", "cancelled"],
      default: "draft",
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent", "critical"],
      default: "medium",
      required: true,
    },

    // Supplier Information
    supplier: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      contactPerson: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      address: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
      },
    },

    // Delivery Information
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      contactPerson: String,
      phone: String,
    },

    // Purchase Order Items
    items: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        unitPrice: {
          type: Number,
          required: true,
          min: 0,
        },
        totalPrice: {
          type: Number,
          required: true,
          min: 0,
        },
        category: {
          type: String,
          required: true,
          enum: UNIFIED_CATEGORIES,
        },
        specifications: {
          brand: String,
          model: String,
          year: Number,
          serialNumber: String,
        },
        receivedQuantity: {
          type: Number,
          default: 0,
          min: 0,
        },
        receivedDate: {
          type: Date,
        },
      },
    ],

    // Financial Information (in Naira)
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    shipping: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Timeline
    orderDate: {
      type: Date,
    },
    expectedDeliveryDate: {
      type: Date,
    },
    actualDeliveryDate: {
      type: Date,
    },
    issuedDate: {
      type: Date,
    },
    markedAsIssuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    paymentDate: {
      type: Date,
    },
    markedAsPaidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    markedAsDeliveredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Approval Information
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedDate: {
      type: Date,
    },
    approvalNotes: {
      type: String,
      trim: true,
    },

    // Related Projects and Inventory
    relatedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    createdInventoryItems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Inventory",
      },
    ],

    // Vendor Information (link to Vendor model)
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
    },

    // Currency Information
    currency: {
      type: String,
      default: "NGN",
      enum: ["NGN", "USD", "EUR", "GBP"],
    },

    // Request and Approval Information
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Notes and Comments
    notes: [
      {
        content: {
          type: String,
          required: true,
          trim: true,
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
        isPrivate: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Documents
    documents: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        type: {
          type: String,
          enum: ["quote", "invoice", "receipt", "warranty", "manual", "other"],
          required: true,
        },
        filename: {
          type: String,
          required: true,
        },
        path: {
          type: String,
          required: true,
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

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

procurementSchema.index({ status: 1 });
procurementSchema.index({ "supplier.name": 1 });
procurementSchema.index({ poNumber: 1 }, { unique: true });
procurementSchema.index({ orderDate: 1 });
procurementSchema.index({ expectedDeliveryDate: 1 });

// Virtual for outstanding amount
procurementSchema.virtual("outstandingAmount").get(function () {
  return this.totalAmount - this.paidAmount;
});

// Virtual for payment status
procurementSchema.virtual("paymentStatus").get(function () {
  if (this.paidAmount === 0) return "unpaid";
  if (this.paidAmount >= this.totalAmount) return "paid";
  return "partial";
});

// Virtual for delivery status
procurementSchema.virtual("deliveryStatus").get(function () {
  if (this.status === "received") return "delivered";
  if (this.actualDeliveryDate) return "delivered";
  if (this.expectedDeliveryDate && new Date() > this.expectedDeliveryDate)
    return "overdue";
  return "pending";
});

// Virtual for items received percentage
procurementSchema.virtual("receivedPercentage").get(function () {
  if (this.items.length === 0) return 0;

  const totalOrdered = this.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalReceived = this.items.reduce(
    (sum, item) => sum + item.receivedQuantity,
    0
  );

  return Math.round((totalReceived / totalOrdered) * 100);
});

// Pre-save middleware to generate PO number if not provided
procurementSchema.pre("save", async function (next) {
  if (!this.poNumber) {
    const count = await this.constructor.countDocuments();
    this.poNumber = `PO${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

// Pre-save middleware to calculate totals
procurementSchema.pre("save", function (next) {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Calculate total amount
  this.totalAmount = this.subtotal + this.tax + this.shipping;

  next();
});

// Static method to get procurement statistics
procurementSchema.statics.getProcurementStats = async function () {
  const stats = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$totalAmount" },
        paidAmount: { $sum: "$paidAmount" },
      },
    },
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      count: stat.count,
      totalAmount: stat.totalAmount,
      paidAmount: stat.paidAmount,
      outstandingAmount: stat.totalAmount - stat.paidAmount,
    };
    return acc;
  }, {});
};

// Static method to get pending approvals
procurementSchema.statics.getPendingApprovals = function () {
  return this.find({ isActive: true, status: "pending" })
    .populate("createdBy", "firstName lastName")
    .populate("relatedProject", "name code")
    .sort({ createdAt: 1 });
};

// Static method to get overdue deliveries
procurementSchema.statics.getOverdueDeliveries = function () {
  return this.find({
    isActive: true,
    status: { $in: ["ordered", "approved"] },
    expectedDeliveryDate: { $lt: new Date() },
  })
    .populate("createdBy", "firstName lastName")
    .populate("relatedProject", "name code")
    .sort({ expectedDeliveryDate: 1 });
};

// Instance method to approve purchase order
procurementSchema.methods.approve = async function (approvedBy, notes = "") {
  this.status = "approved";
  this.approvedBy = approvedBy;
  this.approvedDate = new Date();
  this.approvalNotes = notes;

  await this.save();
};

// Instance method to receive items
procurementSchema.methods.receiveItems = async function (
  itemIndex,
  receivedQuantity,
  receivedDate = new Date()
) {
  if (itemIndex >= 0 && itemIndex < this.items.length) {
    this.items[itemIndex].receivedQuantity = receivedQuantity;
    this.items[itemIndex].receivedDate = receivedDate;

    // Check if all items are received
    const allReceived = this.items.every(
      (item) => item.receivedQuantity >= item.quantity
    );
    if (allReceived) {
      this.status = "received";
      this.actualDeliveryDate = receivedDate;
    }

    await this.save();
  }
};

// Instance method to mark procurement as delivered and notify Operations HOD
procurementSchema.methods.markAsDelivered = async function (deliveredBy) {
  try {
    console.log(
      `📦 [PROCUREMENT] Marking procurement order ${this.poNumber} as delivered`
    );

    // Update procurement status
    this.status = "delivered";
    this.actualDeliveryDate = new Date();
    await this.save();

    // If this procurement is linked to a project, notify Operations HOD
    if (this.relatedProject) {
      const Project = mongoose.model("Project");
      const project = await Project.findById(this.relatedProject);

      if (project && project.projectScope === "external") {
        console.log(
          `📦 [PROCUREMENT] Notifying Operations HOD for project: ${project.name}`
        );
        await project.notifyOperationsHODForInventory(this, deliveredBy);
      }
    }

    console.log(
      `✅ [PROCUREMENT] Procurement order ${this.poNumber} marked as delivered and Operations HOD notified`
    );
    return true;
  } catch (error) {
    console.error(
      `❌ [PROCUREMENT] Error marking procurement as delivered:`,
      error
    );
    throw error;
  }
};

// Instance method to add note
procurementSchema.methods.addNote = async function (
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

// Instance method to get procurement summary
procurementSchema.methods.getSummary = function () {
  return {
    id: this._id,
    poNumber: this.poNumber,
    title: this.title,
    status: this.status,
    priority: this.priority,
    supplier: this.supplier.name,
    totalAmount: this.totalAmount,
    paidAmount: this.paidAmount,
    outstandingAmount: this.outstandingAmount,
    paymentStatus: this.paymentStatus,
    deliveryStatus: this.deliveryStatus,
    receivedPercentage: this.receivedPercentage,
    orderDate: this.orderDate,
    expectedDeliveryDate: this.expectedDeliveryDate,
    actualDeliveryDate: this.actualDeliveryDate,
  };
};

const Procurement = mongoose.model("Procurement", procurementSchema);

export default Procurement;
