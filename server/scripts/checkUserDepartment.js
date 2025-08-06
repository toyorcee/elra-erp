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

async function checkUserDepartment() {
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
    console.log(`Email: ${user.email}`);
    console.log(
      `Department: ${user.department?.name || "N/A"} (Code: ${
        user.department?.code || "N/A"
      })`
    );
    console.log(`Role: ${user.role?.name || "N/A"}`);
    console.log("");

    // Check audit logs for this user
    const userLogs = await AuditLog.find({ userId: user._id })
      .limit(5)
      .sort({ timestamp: -1 });

    console.log("📋 Recent Audit Logs for this user:");
    userLogs.forEach((log, index) => {
      console.log(`${index + 1}. Action: ${log.action}`);
      console.log(
        `   Department (from userDetails): ${log.userDetails?.department}`
      );
      console.log(`   Timestamp: ${log.timestamp}`);
      console.log("---");
    });

    // Test filtering by the user's actual department
    const userDept = user.department?.code || "N/A";
    console.log(`\n🔍 Testing filter for department: ${userDept}`);

    const filteredLogs = await AuditLog.find({
      "userDetails.department": userDept,
    }).limit(5);

    console.log(`Found ${filteredLogs.length} logs for department ${userDept}`);
    filteredLogs.forEach((log, index) => {
      console.log(
        `${index + 1}. User: ${log.userDetails?.name}, Action: ${log.action}`
      );
    });

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
  }
}

checkUserDepartment();
