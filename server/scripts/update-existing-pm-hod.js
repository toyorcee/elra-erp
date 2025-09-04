import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

async function updateExistingPMHOD() {
  try {
    await connectDB();

    console.log("🔍 Finding Project Management HOD...");

    const pmHOD = await User.findOne({
      email: "pm.hod@elra.com",
      username: "pm.hod",
    });

    if (!pmHOD) {
      console.log("❌ Project Management HOD not found!");
      return;
    }

    console.log("✅ Found PM HOD:", pmHOD.firstName, pmHOD.lastName);
    console.log("📧 Email:", pmHOD.email);
    console.log(
      "🔍 Current moduleAccess:",
      pmHOD.moduleAccess?.length || 0,
      "modules"
    );

    if (pmHOD.moduleAccess && pmHOD.moduleAccess.length > 0) {
      console.log("\n📋 Current moduleAccess structure:");
      pmHOD.moduleAccess.forEach((mod, index) => {
        console.log(
          `   ${index + 1}. Module: ${mod.module}, Code: ${
            mod.code || "MISSING"
          }, Permissions: ${mod.permissions?.join(", ")}`
        );
      });

      console.log(
        "\n🔧 Adding missing code field to each moduleAccess item..."
      );

      // Add code field to each moduleAccess item
      pmHOD.moduleAccess.forEach((mod) => {
        if (!mod.code) {
          mod.code = mod.module; // Add code field
          console.log(`   ✅ Added code: ${mod.module} -> ${mod.code}`);
        }
      });

      // Mark moduleAccess as modified
      pmHOD.markModified("moduleAccess");

      await pmHOD.save();
      console.log("✅ ModuleAccess updated successfully!");

      console.log("\n📋 Updated moduleAccess structure:");
      pmHOD.moduleAccess.forEach((mod, index) => {
        console.log(
          `   ${index + 1}. Module: ${mod.module}, Code: ${
            mod.code
          }, Permissions: ${mod.permissions?.join(", ")}`
        );
      });
    } else {
      console.log("⚠️ No moduleAccess found!");
    }

    console.log("\n✅ Project Management HOD updated successfully!");
  } catch (error) {
    console.error("❌ Error updating PM HOD:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the script
updateExistingPMHOD();
