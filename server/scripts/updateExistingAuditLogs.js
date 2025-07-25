import mongoose from "mongoose";
import dotenv from "dotenv";
import AuditLog from "../models/AuditLog.js";
import User from "../models/User.js";
import Company from "../models/Company.js";
import path from "path";
import { fileURLToPath } from "url";

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
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 60000,
      maxPoolSize: 10,
      minPoolSize: 1,
      retryWrites: true,
      w: "majority",
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    console.log("🔄 Retrying in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

const updateExistingAuditLogs = async () => {
  try {
    console.log("🚀 Updating existing audit logs...\n");

    await connectDB();
    // Find audit logs without company field
    const auditLogsWithoutCompany = await AuditLog.find({
      company: { $exists: false },
    });

    console.log(
      `Found ${auditLogsWithoutCompany.length} audit logs without company field`
    );

    if (auditLogsWithoutCompany.length === 0) {
      console.log("✅ All audit logs already have company field");
      return;
    }

    // Get the default company for existing Super Admin
    const defaultCompany = await Company.findOne({ name: "EDMS Platform" });

    if (!defaultCompany) {
      console.log(
        "❌ Default company not found. Please run updateExistingSuperAdmin.js first"
      );
      return;
    }

    console.log("Using default company:", defaultCompany.name);

    // Update audit logs with company field
    let updatedCount = 0;

    for (const auditLog of auditLogsWithoutCompany) {
      try {
        // Get the user who performed the action
        const user = await User.findById(auditLog.userId);

        if (user && user.company) {
          // Use the user's company if they have one
          auditLog.company = user.company;
        } else {
          // Use default company for existing data
          auditLog.company = defaultCompany._id;
        }

        await auditLog.save();
        updatedCount++;

        if (updatedCount % 100 === 0) {
          console.log(`Updated ${updatedCount} audit logs...`);
        }
      } catch (error) {
        console.error(
          `Error updating audit log ${auditLog._id}:`,
          error.message
        );
      }
    }

    console.log(
      `✅ Successfully updated ${updatedCount} audit logs with company field`
    );

    // Verify the update
    const remainingLogsWithoutCompany = await AuditLog.find({
      company: { $exists: false },
    });

    console.log(
      `Verification - Remaining logs without company: ${remainingLogsWithoutCompany.length}`
    );

    console.log("\n" + "=".repeat(60));
    console.log("🎉 AUDIT LOGS UPDATE COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ Error updating existing audit logs:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Database disconnected");
  }
};

// Run the setup
updateExistingAuditLogs();
