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

async function debugRolePermissions() {
  try {
    await connectDB();

    console.log("🔍 Debugging role permissions...");

    // Check current state
    const allRoles = await Role.find({}).sort({ level: -1 });
    console.log("\n📊 Current roles in database:");
    allRoles.forEach((role) => {
      console.log(`  ${role.name} (Level: ${role.level})`);
      console.log(`    canManageManagers: ${role.canManageManagers}`);
      console.log(`    canManageHODs: ${role.canManageHODs}`);
      console.log(`    canManageStaff: ${role.canManageStaff}`);
      console.log(`    canApproveDepartment: ${role.canApproveDepartment}`);
      console.log("");
    });

    // Try direct MongoDB update
    console.log("🔧 Trying direct MongoDB update...");
    
    const db = mongoose.connection.db;
    
    // Update SUPER_ADMIN
    const superAdminResult = await db.collection('roles').updateOne(
      { name: "SUPER_ADMIN" },
      { 
        $set: {
          canManageManagers: true,
          canManageHODs: true,
          canManageStaff: true
        }
      }
    );
    console.log(`SUPER_ADMIN update result: ${superAdminResult.modifiedCount} documents modified`);

    // Update HOD
    const hodResult = await db.collection('roles').updateOne(
      { name: "HOD" },
      { 
        $set: {
          canManageManagers: true,
          canManageStaff: true
        }
      }
    );
    console.log(`HOD update result: ${hodResult.modifiedCount} documents modified`);

    // Update MANAGER
    const managerResult = await db.collection('roles').updateOne(
      { name: "MANAGER" },
      { 
        $set: {
          canManageStaff: true
        }
      }
    );
    console.log(`MANAGER update result: ${managerResult.modifiedCount} documents modified`);

    // Check final state
    console.log("\n📊 Final roles after direct update:");
    const finalRoles = await Role.find({}).sort({ level: -1 });
    finalRoles.forEach((role) => {
      console.log(`  ${role.name} (Level: ${role.level})`);
      console.log(`    canManageManagers: ${role.canManageManagers}`);
      console.log(`    canManageHODs: ${role.canManageHODs}`);
      console.log(`    canManageStaff: ${role.canManageStaff}`);
      console.log(`    canApproveDepartment: ${role.canApproveDepartment}`);
      console.log("");
    });

    console.log("🎉 Debug complete!");
  } catch (error) {
    console.error("❌ Error debugging permissions:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
}

// Run the debug
debugRolePermissions(); 