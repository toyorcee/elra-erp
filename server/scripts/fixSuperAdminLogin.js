import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
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

const fixSuperAdminLogin = async () => {
  try {
    console.log("🔧 Fixing Super Admin login issues...");

    await connectDB();

    // Find and update the superadmin user
    const superAdmin = await User.findOne({ email: "oluwasegun@elra.com" });

    if (!superAdmin) {
      console.log("❌ Super Admin not found!");
      return;
    }

    console.log("👤 Found Super Admin:", {
      email: superAdmin.email,
      username: superAdmin.username,
      isActive: superAdmin.isActive,
      isEmailVerified: superAdmin.isEmailVerified,
      status: superAdmin.status,
    });

    // Update the superadmin to bypass login checks
    const updatedSuperAdmin = await User.findByIdAndUpdate(
      superAdmin._id,
      {
        isActive: true,
        isEmailVerified: true,
        status: "ACTIVE",
        lastLogin: new Date(),
      },
      { new: true }
    );

    console.log("✅ Super Admin updated successfully!");
    console.log("📋 Updated details:");
    console.log("   Email:", updatedSuperAdmin.email);
    console.log("   Username:", updatedSuperAdmin.username);
    console.log("   isActive:", updatedSuperAdmin.isActive);
    console.log("   isEmailVerified:", updatedSuperAdmin.isEmailVerified);
    console.log("   status:", updatedSuperAdmin.status);
    console.log("");
    console.log("🎉 You can now login with:");
    console.log("   Email: oluwasegun@elra.com");
    console.log("   Password: Sbpdojddme4*");
  } catch (error) {
    console.error("❌ Error fixing Super Admin:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run the script
fixSuperAdminLogin();
