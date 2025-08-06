import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import models
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import Department from "../models/Department.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

async function updateAuditLogs() {
  try {
    await connectDB();

    // Find the user
    const user = await User.findOne({
      firstName: "Oluwatoyosi",
      lastName: "Olaniyan",
    }).populate("department");

    if (!user) {
      console.log("❌ User not found!");
      return;
    }

    console.log("👤 User Details:");
    console.log(`Name: ${user.firstName} ${user.lastName}`);
    console.log(
      `Department: ${user.department?.name} (Code: ${user.department?.code})`
    );

    // Find audit logs for this user that have "N/A" department
    const logsToUpdate = await AuditLog.find({
      userId: user._id,
      "userDetails.department": "N/A",
    });

    console.log(`\n📋 Found ${logsToUpdate.length} audit logs to update`);

    if (logsToUpdate.length > 0) {
      // Update the audit logs
      const result = await AuditLog.updateMany(
        {
          userId: user._id,
          "userDetails.department": "N/A",
        },
        {
          $set: {
            "userDetails.department": user.department?.code || "N/A",
          },
        }
      );

      console.log(`✅ Updated ${result.modifiedCount} audit logs`);
      console.log(
        `Updated department from "N/A" to "${user.department?.code}"`
      );

      // Verify the update
      const updatedLogs = await AuditLog.find({
        userId: user._id,
        "userDetails.department": user.department?.code,
      }).limit(5);

      console.log(
        `\n🔍 Verification - Found ${updatedLogs.length} logs with department "${user.department?.code}":`
      );
      updatedLogs.forEach((log, index) => {
        console.log(
          `${index + 1}. Action: ${log.action}, Department: ${
            log.userDetails?.department
          }`
        );
      });
    } else {
      console.log("✅ No audit logs need updating");
    }

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
  }
}

updateAuditLogs();
