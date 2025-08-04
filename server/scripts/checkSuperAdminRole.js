import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import models
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

async function checkSuperAdminRole() {
  try {
    await connectDB();

    console.log("🔍 Checking Current SUPER_ADMIN Role...");
    console.log("=".repeat(60));

    // Find the SUPER_ADMIN role
    const superAdminRole = await Role.findOne({ name: "SUPER_ADMIN" });

    if (!superAdminRole) {
      console.log("❌ SUPER_ADMIN role not found in database!");
      return;
    }

    console.log("\n🎯 Current SUPER_ADMIN Role Details:");
    console.log(`   Name: ${superAdminRole.name}`);
    console.log(`   Level: ${superAdminRole.level}`);
    console.log(`   Description: ${superAdminRole.description}`);
    console.log(`   Total Permissions: ${superAdminRole.permissions.length}`);
    console.log(
      `   Department Access: ${
        superAdminRole.departmentAccess?.join(", ") || "Not set"
      }`
    );
    console.log(
      `   Can Manage Roles: ${superAdminRole.canManageRoles?.length || 0} roles`
    );
    console.log(`   Is Active: ${superAdminRole.isActive}`);

    console.log("\n📋 Current Permissions:");
    if (superAdminRole.permissions.length === 0) {
      console.log("   ❌ No permissions assigned!");
    } else {
      superAdminRole.permissions.forEach((permission, index) => {
        console.log(`   ${index + 1}. ${permission}`);
      });
    }

    // Categorize permissions
    const documentPermissions = superAdminRole.permissions.filter((p) =>
      p.startsWith("document.")
    );
    const workflowPermissions = superAdminRole.permissions.filter((p) =>
      p.startsWith("workflow.")
    );
    const userPermissions = superAdminRole.permissions.filter((p) =>
      p.startsWith("user.")
    );
    const systemPermissions = superAdminRole.permissions.filter((p) =>
      p.startsWith("system.")
    );

    console.log("\n📊 Permission Categories:");
    console.log(`   📄 Document Permissions: ${documentPermissions.length}`);
    console.log(`   ⚙️  Workflow Permissions: ${workflowPermissions.length}`);
    console.log(`   👥 User Permissions: ${userPermissions.length}`);
    console.log(`   🔧 System Permissions: ${systemPermissions.length}`);

    // Get all enhanced permissions from MANAGER and SUPERVISOR
    const managerRole = await Role.findOne({ name: "MANAGER" });
    const supervisorRole = await Role.findOne({ name: "SUPERVISOR" });

    const allEnhancedPermissions = new Set();

    if (managerRole) {
      managerRole.permissions.forEach((p) => allEnhancedPermissions.add(p));
    }

    if (supervisorRole) {
      supervisorRole.permissions.forEach((p) => allEnhancedPermissions.add(p));
    }

    const enhancedPermissionsArray = Array.from(allEnhancedPermissions);

    console.log("\n🎯 SUPER_ADMIN vs Enhanced Roles Analysis:");
    console.log(
      `   Total Enhanced Permissions Available: ${enhancedPermissionsArray.length}`
    );
    console.log(
      `   SUPER_ADMIN Current Permissions: ${superAdminRole.permissions.length}`
    );

    // Check for missing permissions
    const missingPermissions = enhancedPermissionsArray.filter(
      (permission) => !superAdminRole.permissions.includes(permission)
    );

    if (missingPermissions.length > 0) {
      console.log(`\n❌ Missing Permissions (${missingPermissions.length}):`);
      missingPermissions.forEach((permission, index) => {
        console.log(`   ${index + 1}. ${permission}`);
      });

      console.log("\n⚠️  SUPER_ADMIN should have ALL permissions!");
    } else {
      console.log("\n✅ SUPER_ADMIN has all enhanced permissions!");
    }

    // Check for SUPER_ADMIN specific permissions that others don't have
    const superAdminOnlyPermissions = superAdminRole.permissions.filter(
      (permission) => !enhancedPermissionsArray.includes(permission)
    );

    if (superAdminOnlyPermissions.length > 0) {
      console.log(
        `\n🔐 SUPER_ADMIN-Only Permissions (${superAdminOnlyPermissions.length}):`
      );
      superAdminOnlyPermissions.forEach((permission, index) => {
        console.log(`   ${index + 1}. ${permission}`);
      });
    }

    console.log("\n✅ SUPER_ADMIN role check completed!");
  } catch (error) {
    console.error("❌ Error checking SUPER_ADMIN role:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

checkSuperAdminRole();
