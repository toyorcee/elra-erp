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

async function checkSupervisorRole() {
  try {
    await connectDB();

    console.log("🔍 Checking Current SUPERVISOR Role...");
    console.log("=".repeat(60));

    // Find the SUPERVISOR role
    const supervisorRole = await Role.findOne({ name: "SUPERVISOR" });

    if (!supervisorRole) {
      console.log("❌ SUPERVISOR role not found in database!");
      return;
    }

    console.log("\n🎯 Current SUPERVISOR Role Details:");
    console.log(`   Name: ${supervisorRole.name}`);
    console.log(`   Level: ${supervisorRole.level}`);
    console.log(`   Description: ${supervisorRole.description}`);
    console.log(`   Total Permissions: ${supervisorRole.permissions.length}`);
    console.log(
      `   Department Access: ${
        supervisorRole.departmentAccess?.join(", ") || "Not set"
      }`
    );
    console.log(
      `   Can Manage Roles: ${supervisorRole.canManageRoles?.length || 0} roles`
    );
    console.log(`   Is Active: ${supervisorRole.isActive}`);

    console.log("\n📋 Current Permissions:");
    if (supervisorRole.permissions.length === 0) {
      console.log("   ❌ No permissions assigned!");
    } else {
      supervisorRole.permissions.forEach((permission, index) => {
        console.log(`   ${index + 1}. ${permission}`);
      });
    }

    // Categorize permissions
    const documentPermissions = supervisorRole.permissions.filter((p) =>
      p.startsWith("document.")
    );
    const workflowPermissions = supervisorRole.permissions.filter((p) =>
      p.startsWith("workflow.")
    );
    const userPermissions = supervisorRole.permissions.filter((p) =>
      p.startsWith("user.")
    );
    const systemPermissions = supervisorRole.permissions.filter((p) =>
      p.startsWith("system.")
    );

    console.log("\n📊 Permission Categories:");
    console.log(`   📄 Document Permissions: ${documentPermissions.length}`);
    console.log(`   ⚙️  Workflow Permissions: ${workflowPermissions.length}`);
    console.log(`   👥 User Permissions: ${userPermissions.length}`);
    console.log(`   🔧 System Permissions: ${systemPermissions.length}`);

    console.log("\n🎯 Analysis:");
    if (supervisorRole.permissions.length < 10) {
      console.log(
        "   ⚠️  SUPERVISOR role has limited permissions - needs enhancement"
      );
    } else {
      console.log("   ✅ SUPERVISOR role has good permission coverage");
    }

    if (supervisorRole.departmentAccess?.includes("All")) {
      console.log(
        "   ⚠️  Has access to ALL departments - may need department-specific restrictions"
      );
    } else {
      console.log("   ✅ Department access is properly restricted");
    }

    console.log("\n✅ SUPERVISOR role check completed!");
  } catch (error) {
    console.error("❌ Error checking SUPERVISOR role:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

checkSupervisorRole();
