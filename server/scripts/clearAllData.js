import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import models
import User from "../models/User.js";
import Company from "../models/Company.js";
import Document from "../models/Document.js";
import Department from "../models/Department.js";
import AuditLog from "../models/AuditLog.js";
import Role from "../models/Role.js";
import SystemSettings from "../models/SystemSettings.js";
import IndustryInstance from "../models/IndustryInstance.js";
import ApprovalLevel from "../models/ApprovalLevel.js";
import WorkflowTemplate from "../models/WorkflowTemplate.js";
import Notification from "../models/Notification.js";
import Message from "../models/Message.js";
import Subscription from "../models/Subscription.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI is not defined in environment variables");
      console.log(
        "💡 Please make sure you have a .env file in the server directory"
      );
      console.log(
        "💡 The .env file should contain: MONGODB_URI=your_mongodb_connection_string"
      );
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    console.log("🔄 Retrying in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

async function clearAllData() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await connectDB();

    const platformAdminId = "68823e6996e49078159dbe91"; // Your platform admin ID

    console.log("🧹 Starting data cleanup...");

    // Clear all data except platform admin
    const deletePromises = [
      // Clear companies (this will cascade to related data)
      Company.deleteMany({}),

      // Clear documents
      Document.deleteMany({}),

      // Clear departments
      Department.deleteMany({}),

      // Clear audit logs
      AuditLog.deleteMany({}),

      // Clear system settings
      SystemSettings.deleteMany({}),

      // Clear industry instances
      IndustryInstance.deleteMany({}),

      // Clear approval levels
      ApprovalLevel.deleteMany({}),

      // Clear workflow templates
      WorkflowTemplate.deleteMany({}),

      // Clear notifications
      Notification.deleteMany({}),

      // Clear messages
      Message.deleteMany({}),

      // Clear subscriptions
      Subscription.deleteMany({}),

      // Clear all users except platform admin
      User.deleteMany({ _id: { $ne: platformAdminId } }),
    ];

    await Promise.all(deletePromises);

    console.log("✅ All data cleared successfully!");
    console.log("📊 Summary:");
    console.log("   - All companies deleted");
    console.log("   - All documents deleted");
    console.log("   - All departments deleted");
    console.log("   - All audit logs deleted");
    console.log("   - All system settings deleted");
    console.log("   - All industry instances deleted");
    console.log("   - All approval levels deleted");
    console.log("   - All workflow templates deleted");
    console.log("   - All notifications deleted");
    console.log("   - All messages deleted");
    console.log("   - All subscriptions deleted");
    console.log("   - All users deleted (except platform admin)");

    // Verify platform admin still exists
    const platformAdmin = await User.findById(platformAdminId);
    if (platformAdmin) {
      console.log("✅ Platform admin preserved:", platformAdmin.email);
    } else {
      console.log("❌ Warning: Platform admin not found!");
    }

    console.log("🎉 Fresh start complete! Ready to test subscription system.");
  } catch (error) {
    console.error("❌ Error clearing data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the script
clearAllData();
