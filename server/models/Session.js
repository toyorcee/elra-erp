import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: true,
    },
    responderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    responderName: {
      type: String,
      required: true,
    },
    responderDepartment: {
      type: String,
      required: true,
    },
    sessionTranscript: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    duration: {
      type: Number, 
      default: 0,
    },
    resolution: {
      type: String,
      enum: ["resolved", "escalated", "pending"],
      default: "pending",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.virtual("sessionDuration").get(function () {
  if (this.startTime && this.endTime) {
    const diffTime = Math.abs(this.endTime - this.startTime);
    return Math.ceil(diffTime / (1000 * 60));
  }
  return 0;
});

sessionSchema.pre("save", function (next) {
  if (this.startTime && this.endTime) {
    this.duration = this.sessionDuration;
  }
  next();
});

sessionSchema.index({ complaintId: 1 });
sessionSchema.index({ responderId: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ createdAt: -1 });

sessionSchema.methods.markAsCompleted = function (resolution, notes) {
  this.status = "completed";
  this.resolution = resolution;
  this.notes = notes || "";
  this.endTime = new Date();
  return this.save();
};

sessionSchema.methods.markAsCancelled = function (notes) {
  this.status = "cancelled";
  this.notes = notes || "";
  this.endTime = new Date();
  return this.save();
};

sessionSchema.statics.getSessionsByComplaint = function (complaintId) {
  return this.find({ complaintId }).sort({ createdAt: -1 });
};

sessionSchema.statics.getSessionsByResponder = function (responderId) {
  return this.find({ responderId }).sort({ createdAt: -1 });
};

sessionSchema.statics.getActiveSessions = function () {
  return this.find({ status: "active" });
};

sessionSchema.statics.getCompletedSessions = function () {
  return this.find({ status: "completed" });
};

export default mongoose.model("Session", sessionSchema);
