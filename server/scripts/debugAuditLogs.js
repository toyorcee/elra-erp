import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import models
import AuditLog from "../models/AuditLog.js";
import User from "../models/User.js";

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

async function debugAuditLogs() {
  try {
    await connectDB();

    // Get recent audit logs
    const logs = await AuditLog.find({})
      .limit(10)
      .populate("userId", "firstName lastName email department")
      .sort({ timestamp: -1 });

    console.log("\n=== Recent Audit Logs ===");
    logs.forEach((log, index) => {
      console.log(
        `${index + 1}. User: ${log.userId?.firstName} ${log.userId?.lastName}`
      );
      console.log(
        `   Department (from userDetails): ${log.userDetails?.department}`
      );
      console.log(
        `   Department (from populated user): ${
          log.userId?.department?.code || log.userId?.department?.name || "N/A"
        }`
      );
      console.log(`   Action: ${log.action}`);
      console.log(`   Timestamp: ${log.timestamp}`);
      console.log("---");
    });

    // Check what happens when we filter by department
    const userDept = "IT"; // Example department
    console.log(`\n=== Filtering by department: ${userDept} ===`);

    const filteredLogs = await AuditLog.find({
      "userDetails.department": userDept,
    }).limit(5);

    console.log(`Found ${filteredLogs.length} logs for department ${userDept}`);
    filteredLogs.forEach((log, index) => {
      console.log(
        `${index + 1}. User Dept: ${log.userDetails?.department}, Action: ${
          log.action
        }`
      );
    });

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
  }
}

debugAuditLogs();
