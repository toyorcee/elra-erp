import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    location: { type: String, default: "" },
    category: {
      type: String,
      enum: [
        "meeting",
        "training",
        "onboarding",
        "entertainment",
        "company_event",
        "department_event",
        "conference",
        "workshop",
        "social",
        "other",
      ],
      default: "meeting",
    },
    audienceScope: {
      type: String,
      enum: ["all", "department"],
      default: "all",
    },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isAllDay: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    // Event state tracking
    eventState: {
      type: String,
      enum: ["created", "updated", "rescheduled"],
      default: "created",
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    originalStart: { type: Date },
    originalEnd: { type: Date },
    updateHistory: [
      {
        updatedAt: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        changes: { type: String },
        previousStart: { type: Date },
        previousEnd: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

EventSchema.index({ start: 1, end: 1 });
EventSchema.index({ department: 1, audienceScope: 1 });

const Event = mongoose.model("Event", EventSchema);
export default Event;
