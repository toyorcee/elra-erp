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

async function fixDepartmentManagement() {
  try {
    await connectDB();

    console.log("🔧 Fixing department management permissions...");

    // SUPER_ADMIN: Can approve any department, manage all roles
    const superAdminResult = await Role.findOneAndUpdate(
      { name: "SUPER_ADMIN" },
      {
        canApproveDepartment: true, // Can approve ANY department
        canManageManagers: true,
        canManageHODs: true,
        canManageStaff: true,
      },
      { new: true }
    );
    
    if (superAdminResult) {
      console.log("✅ Fixed SUPER_ADMIN - Can approve any department, manage all roles");
    }

    // HOD: Can approve their own department, manage MANAGER and STAFF in their department
    const hodResult = await Role.findOneAndUpdate(
      { name: "HOD" },
      {
        canApproveDepartment: true, // Can approve THEIR OWN department
        canManageManagers: true, // Can manage MANAGERs in their department
        canManageHODs: false, // Cannot manage other HODs
        canManageStaff: true, // Can manage STAFF in their department
      },
      { new: true }
    );
    
    if (hodResult) {
      console.log("✅ Fixed HOD - Can approve own department, manage MANAGER and STAFF");
    }

    // MANAGER: Can manage STAFF in their department, cannot approve registrations
    const managerResult = await Role.findOneAndUpdate(
      { name: "MANAGER" },
      {
        canApproveDepartment: false, // Cannot approve registrations
        canManageManagers: false, // Cannot manage other MANAGERs
        canManageHODs: false, // Cannot manage HODs
        canManageStaff: true, // Can manage STAFF in their department
      },
      { new: true }
    );
    
    if (managerResult) {
      console.log("✅ Fixed MANAGER - Can manage STAFF in their department");
    }

    // STAFF: Basic access, no management permissions
    const staffResult = await Role.findOneAndUpdate(
      { name: "STAFF" },
      {
        canApproveDepartment: false,
        canManageManagers: false,
        canManageHODs: false,
        canManageStaff: false,
      },
      { new: true }
    );
    
    if (staffResult) {
      console.log("✅ Fixed STAFF - Basic access only");
    }

    console.log("\n📊 Final Role Hierarchy with Department Management:");
    const allRoles = await Role.find({}).sort({ level: -1 });
    allRoles.forEach((role) => {
      console.log(`  ${role.name} (Level: ${role.level})`);
      console.log(`    Description: ${role.description}`);
      console.log(`    Can Approve Department: ${role.canApproveDepartment ? "Yes" : "No"}`);
      console.log(`    Can Manage Managers: ${role.canManageManagers ? "Yes" : "No"}`);
      console.log(`    Can Manage HODs: ${role.canManageHODs ? "Yes" : "No"}`);
      console.log(`    Can Manage Staff: ${role.canManageStaff ? "Yes" : "No"}`);
      console.log("");
    });

    console.log("🎉 Department management permissions fixed!");
    console.log("\n📋 Department Management Logic:");
    console.log("• SUPER_ADMIN: Can approve ANY department, manage ALL roles");
    console.log("• HOD: Can approve THEIR OWN department, manage MANAGER & STAFF in their dept");
    console.log("• MANAGER: Can manage STAFF in their department, cannot approve registrations");
    console.log("• STAFF: Basic access, no management permissions");
  } catch (error) {
    console.error("❌ Error fixing department management:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
}

// Run the fix
fixDepartmentManagement(); 