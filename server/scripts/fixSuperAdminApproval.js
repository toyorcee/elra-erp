import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Role from "../models/Role.js";

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

async function fixSuperAdminApproval() {
  try {
    await connectDB();

    console.log("🔧 Fixing SUPER_ADMIN approval permissions...");

    // Fix SUPER_ADMIN canApproveDepartment
    const superAdminResult = await Role.findOneAndUpdate(
      { name: "SUPER_ADMIN" },
      {
        canApproveDepartment: true,
      },
      { new: true }
    );

    if (superAdminResult) {
      console.log("✅ Fixed SUPER_ADMIN canApproveDepartment to true");
    }

    console.log("\n📊 Final SUPER_ADMIN permissions:");
    console.log(`  canManageManagers: ${superAdminResult.canManageManagers}`);
    console.log(`  canManageHODs: ${superAdminResult.canManageHODs}`);
    console.log(`  canManageStaff: ${superAdminResult.canManageStaff}`);
    console.log(
      `  canApproveDepartment: ${superAdminResult.canApproveDepartment}`
    );

    console.log("\n🎉 SUPER_ADMIN approval permissions fixed!");
  } catch (error) {
    console.error("❌ Error fixing SUPER_ADMIN permissions:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
}

// Run the fix
fixSuperAdminApproval();
