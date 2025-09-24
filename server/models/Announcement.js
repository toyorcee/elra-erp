import mongoose from "mongoose";

const AnnouncementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
      },
    ],
    audienceScope: {
      type: String,
      enum: ["all", "department"],
      default: "all",
    },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ createdAt: -1 });
AnnouncementSchema.index({ department: 1, audienceScope: 1 });

const Announcement = mongoose.model("Announcement", AnnouncementSchema);
export default Announcement;
