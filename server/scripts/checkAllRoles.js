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

async function checkAllRoles() {
  try {
    await connectDB();

    console.log("🔍 Checking All Roles for Department-Specific Actions...");
    console.log("=".repeat(70));

    // Find all roles
    const roles = await Role.find().sort({ level: -1 });

    if (roles.length === 0) {
      console.log("❌ No roles found in database!");
      return;
    }

    console.log(`📋 Found ${roles.length} roles in the system:\n`);

    roles.forEach((role, index) => {
      console.log(`${index + 1}. ${role.name} (Level ${role.level})`);
      console.log(`   Description: ${role.description}`);
      console.log(`   Permissions: ${role.permissions.length}`);
      console.log(
        `   Department Access: ${
          role.departmentAccess?.join(", ") || "Not set"
        }`
      );
      console.log(
        `   Can Manage Roles: ${role.canManageRoles?.length || 0} roles`
      );
      console.log(`   Is Active: ${role.isActive}`);

      // Categorize permissions
      const documentPermissions = role.permissions.filter((p) =>
        p.startsWith("document.")
      );
      const workflowPermissions = role.permissions.filter((p) =>
        p.startsWith("workflow.")
      );
      const userPermissions = role.permissions.filter((p) =>
        p.startsWith("user.")
      );
      const systemPermissions = role.permissions.filter((p) =>
        p.startsWith("system.")
      );

      console.log(
        `   📄 Document: ${documentPermissions.length} | ⚙️ Workflow: ${workflowPermissions.length} | 👥 User: ${userPermissions.length} | 🔧 System: ${systemPermissions.length}`
      );

      // Analysis
      if (role.departmentAccess?.includes("All")) {
        console.log(`   ⚠️  WARNING: Has blanket access to ALL departments`);
      } else {
        console.log(`   ✅ Department access is properly restricted`);
      }

      if (
        role.permissions.includes("document.share") ||
        role.permissions.includes("workflow.delegate")
      ) {
        console.log(`   ✅ Has cross-department transfer capabilities`);
      }

      console.log("");
    });

    console.log("🎯 Department-Specific Analysis:");
    console.log("=".repeat(50));

    const rolesWithAllAccess = roles.filter((r) =>
      r.departmentAccess?.includes("All")
    );
    const rolesWithTransferCapabilities = roles.filter(
      (r) =>
        r.permissions.includes("document.share") ||
        r.permissions.includes("workflow.delegate")
    );

    console.log(
      `📊 Roles with blanket department access: ${rolesWithAllAccess.length}`
    );
    if (rolesWithAllAccess.length > 0) {
      rolesWithAllAccess.forEach((role) => {
        console.log(`   - ${role.name} (Level ${role.level})`);
      });
    }

    console.log(
      `📊 Roles with cross-department transfer: ${rolesWithTransferCapabilities.length}`
    );
    if (rolesWithTransferCapabilities.length > 0) {
      rolesWithTransferCapabilities.forEach((role) => {
        console.log(`   - ${role.name} (Level ${role.level})`);
      });
    }

    console.log("\n✅ All roles check completed!");
  } catch (error) {
    console.error("❌ Error checking roles:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

checkAllRoles();
