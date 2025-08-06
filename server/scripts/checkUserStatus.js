import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Invitation from "../models/Invitation.js";
import Role from "../models/Role.js";
import Department from "../models/Department.js";
import Company from "../models/Company.js";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🟢 MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const checkUserStatus = async () => {
  try {
    await connectDB();

    const email = "holuwarnasritohbehd@gmail.com";

    // Check user
    const user = await User.findOne({ email }).select("+password");
    console.log("\n🔍 User Status:");
    console.log({
      found: !!user,
      email: user?.email,
      status: user?.status,
      isActive: user?.isActive,
      isEmailVerified: user?.isEmailVerified,
      hasPassword: !!user?.password,
      passwordLength: user?.password?.length,
      role: user?.role,
      department: user?.department,
      createdAt: user?.createdAt,
    });

    // Check invitation
    const invitation = await Invitation.findOne({
      email,
      status: "active",
    }).populate("role department company");

    console.log("\n🔍 Invitation Status:");
    console.log({
      found: !!invitation,
      email: invitation?.email,
      code: invitation?.code,
      status: invitation?.status,
      expiresAt: invitation?.expiresAt,
      role: invitation?.role?.name,
      department: invitation?.department?.name,
      company: invitation?.company?.name,
    });

    // Test multiple possible passwords
    if (user) {
      const testPasswords = [
        "Sbpdojddme4*",
        "Sbpdojddme4",
        "sbpdojddme4*",
        "sbpdojddme4",
        "Sbpdojddme4* ",
        " Sbpdojddme4*",
        "Password123!",
        "password123",
        "123456",
        "admin",
        "user",
      ];

      console.log("\n🔍 Password Tests:");
      for (const testPassword of testPasswords) {
        const isCorrect = await user.correctPassword(
          testPassword,
          user.password
        );
        console.log(
          `"${testPassword}" -> ${isCorrect ? "✅ CORRECT" : "❌ WRONG"}`
        );
      }

      console.log("\n🔍 Password Hash Info:");
      console.log({
        hashStart: user.password?.substring(0, 20) + "...",
        hashLength: user.password?.length,
        hashAlgorithm: user.password?.startsWith("$2a$") ? "bcrypt" : "unknown",
      });
    }

    console.log("\n✅ Check complete");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB Disconnected");
  }
};

checkUserStatus();
