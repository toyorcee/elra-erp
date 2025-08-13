import mongoose from "mongoose";
import bcrypt from "bcryptjs";
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

const setSuperAdminPassword = async () => {
  try {
    console.log("🔧 Setting Super Admin password...");

    await connectDB();

    // Find the superadmin user
    const superAdmin = await User.findOne({ email: "oluwasegun@elra.com" });

    if (!superAdmin) {
      console.log("❌ Super Admin not found!");
      return;
    }

    console.log("👤 Found Super Admin:", {
      email: superAdmin.email,
      username: superAdmin.username,
    });

    // Hash the password
    const password = "Sbpdojddme4*";
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log("🔐 Password hashed successfully");

    // Update the superadmin with the correct password hash
    const updatedSuperAdmin = await User.findByIdAndUpdate(
      superAdmin._id,
      {
        password: hashedPassword,
        isActive: true,
        isEmailVerified: true,
        status: "ACTIVE",
        lastLogin: new Date(),
      },
      { new: true }
    );

    console.log("✅ Super Admin password updated successfully!");
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

    // Test the password verification
    const isPasswordCorrect = await updatedSuperAdmin.correctPassword(
      password,
      updatedSuperAdmin.password
    );
    console.log(
      "🔍 Password verification test:",
      isPasswordCorrect ? "✅ PASSED" : "❌ FAILED"
    );
  } catch (error) {
    console.error("❌ Error setting Super Admin password:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run the script
setSuperAdminPassword();

















