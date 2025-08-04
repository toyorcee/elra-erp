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

async function checkManagerRole() {
  try {
    await connectDB();

    console.log("🔍 Checking Current MANAGER Role...");
    console.log("=".repeat(60));

    // Find the MANAGER role
    const managerRole = await Role.findOne({ name: "MANAGER" });

    if (!managerRole) {
      console.log("❌ MANAGER role not found in database!");
      return;
    }

    console.log("\n🎯 Current MANAGER Role Details:");
    console.log(`   Name: ${managerRole.name}`);
    console.log(`   Level: ${managerRole.level}`);
    console.log(`   Description: ${managerRole.description}`);
    console.log(`   Total Permissions: ${managerRole.permissions.length}`);
    console.log(
      `   Department Access: ${
        managerRole.departmentAccess?.join(", ") || "Not set"
      }`
    );
    console.log(
      `   Can Manage Roles: ${managerRole.canManageRoles?.length || 0} roles`
    );
    console.log(`   Is Active: ${managerRole.isActive}`);

    console.log("\n📋 Current Permissions:");
    if (managerRole.permissions.length === 0) {
      console.log("   ❌ No permissions assigned!");
    } else {
      managerRole.permissions.forEach((permission, index) => {
        console.log(`   ${index + 1}. ${permission}`);
      });
    }

    // Categorize permissions
    const documentPermissions = managerRole.permissions.filter((p) =>
      p.startsWith("document.")
    );
    const workflowPermissions = managerRole.permissions.filter((p) =>
      p.startsWith("workflow.")
    );
    const userPermissions = managerRole.permissions.filter((p) =>
      p.startsWith("user.")
    );
    const systemPermissions = managerRole.permissions.filter((p) =>
      p.startsWith("system.")
    );

    console.log("\n📊 Permission Categories:");
    console.log(`   📄 Document Permissions: ${documentPermissions.length}`);
    console.log(`   ⚙️  Workflow Permissions: ${workflowPermissions.length}`);
    console.log(`   👥 User Permissions: ${userPermissions.length}`);
    console.log(`   🔧 System Permissions: ${systemPermissions.length}`);

    console.log("\n🎯 Analysis:");
    if (managerRole.permissions.length < 15) {
      console.log(
        "   ⚠️  MANAGER role has limited permissions - needs enhancement"
      );
    } else {
      console.log("   ✅ MANAGER role has good permission coverage");
    }

    if (managerRole.departmentAccess?.includes("All")) {
      console.log(
        "   ⚠️  Has access to ALL departments - may need department-specific restrictions"
      );
    } else {
      console.log("   ✅ Department access is properly restricted");
    }

    // Check for missing permissions compared to SUPERVISOR
    const supervisorRole = await Role.findOne({ name: "SUPERVISOR" });
    if (supervisorRole) {
      const missingPermissions = supervisorRole.permissions.filter(
        (permission) => !managerRole.permissions.includes(permission)
      );

      if (missingPermissions.length > 0) {
        console.log("\n❌ Missing Permissions (compared to SUPERVISOR):");
        missingPermissions.forEach((permission, index) => {
          console.log(`   ${index + 1}. ${permission}`);
        });
      } else {
        console.log("\n✅ MANAGER has all SUPERVISOR permissions");
      }
    }

    console.log("\n✅ MANAGER role check completed!");
  } catch (error) {
    console.error("❌ Error checking MANAGER role:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

checkManagerRole();
