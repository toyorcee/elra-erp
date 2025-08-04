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

async function enhanceSupervisorRole() {
  try {
    await connectDB();

    console.log(
      "🔧 Enhancing SUPERVISOR Role for Department-Specific Operations..."
    );
    console.log("=".repeat(70));

    // Find the SUPERVISOR role
    const supervisorRole = await Role.findOne({ name: "SUPERVISOR" });

    if (!supervisorRole) {
      console.log("❌ SUPERVISOR role not found. Creating it...");

      // Create SUPERVISOR role with department-specific permissions
      const newSupervisorRole = new Role({
        name: "SUPERVISOR",
        level: 40,
        description:
          "Department supervisor with full CRUD operations within assigned department and limited cross-department transfer capabilities",
        permissions: [
          // Document permissions (department-specific CRUD)
          "document.upload",
          "document.view",
          "document.edit",
          "document.delete",
          "document.approve",
          "document.reject",
          "document.share", // For transferring to other departments
          "document.export", // For reporting
          "document.archive", // For long-term storage

          // Workflow permissions (department-specific + cross-department routing)
          "workflow.create", // Create workflows for their department
          "workflow.start", // Start workflows
          "workflow.approve", // Approve workflows
          "workflow.reject", // Reject workflows
          "workflow.delegate", // Delegate to other departments
          "workflow.view", // View all workflows

          // User management permissions (limited)
          "user.view", // View users
          "user.view_permissions", // View user permissions

          // System permissions (limited)
          "system.reports", // Access department reports
        ],
        departmentAccess: [], // No blanket access - will be set per user
        canManageRoles: [], // Cannot manage other roles
        isActive: true,
      });

      await newSupervisorRole.save();
      console.log(
        "✅ Created SUPERVISOR role with department-specific permissions"
      );
    } else {
      console.log(
        "📋 Current SUPERVISOR permissions:",
        supervisorRole.permissions.length
      );

      // Define enhanced department-specific permissions for SUPERVISOR
      const enhancedPermissions = [
        // Document permissions (department-specific CRUD)
        "document.upload",
        "document.view",
        "document.edit",
        "document.delete",
        "document.approve",
        "document.reject",
        "document.share", // For transferring to other departments
        "document.export", // For reporting
        "document.archive", // For long-term storage

        // Workflow permissions (department-specific + cross-department routing)
        "workflow.create", // Create workflows for their department
        "workflow.start", // Start workflows
        "workflow.approve", // Approve workflows
        "workflow.reject", // Reject workflows
        "workflow.delegate", // Delegate to other departments
        "workflow.view", // View all workflows

        // User management permissions (limited)
        "user.view", // View users
        "user.view_permissions", // View user permissions

        // System permissions (limited)
        "system.reports", // Access department reports
      ];

      // Update the role with enhanced permissions
      supervisorRole.permissions = enhancedPermissions;
      supervisorRole.description =
        "Department supervisor with full CRUD operations within assigned department and limited cross-department transfer capabilities";
      supervisorRole.departmentAccess = []; // No blanket access
      supervisorRole.canManageRoles = []; // Cannot manage other roles

      await supervisorRole.save();
      console.log(
        "✅ Updated SUPERVISOR role with department-specific permissions"
      );
    }

    // Verify the update
    const updatedRole = await Role.findOne({ name: "SUPERVISOR" });
    console.log("\n🎯 Enhanced SUPERVISOR Role Details:");
    console.log(`   Name: ${updatedRole.name}`);
    console.log(`   Level: ${updatedRole.level}`);
    console.log(`   Description: ${updatedRole.description}`);
    console.log(`   Total Permissions: ${updatedRole.permissions.length}`);
    console.log(
      `   Department Access: ${
        updatedRole.departmentAccess?.length || 0
      } departments (restricted)`
    );
    console.log(
      `   Can Manage Roles: ${updatedRole.canManageRoles?.length || 0} roles`
    );

    console.log("\n📋 Enhanced Permissions (Department-Specific):");
    console.log("   📄 Document Operations (Department-Specific):");
    updatedRole.permissions
      .filter((p) => p.startsWith("document."))
      .forEach((permission, index) => {
        console.log(`      ${index + 1}. ${permission}`);
      });

    console.log(
      "   ⚙️  Workflow Operations (Department-Specific + Cross-Dept Routing):"
    );
    updatedRole.permissions
      .filter((p) => p.startsWith("workflow."))
      .forEach((permission, index) => {
        console.log(`      ${index + 1}. ${permission}`);
      });

    console.log("   👥 User Management (Limited):");
    updatedRole.permissions
      .filter((p) => p.startsWith("user."))
      .forEach((permission, index) => {
        console.log(`      ${index + 1}. ${permission}`);
      });

    console.log("   🔧 System Access (Limited):");
    updatedRole.permissions
      .filter((p) => p.startsWith("system."))
      .forEach((permission, index) => {
        console.log(`      ${index + 1}. ${permission}`);
      });

    console.log("\n🎯 Department-Specific Capabilities:");
    console.log("   ✅ Full CRUD operations within assigned department");
    console.log("   ✅ Create and manage workflows for their department");
    console.log(
      "   ✅ Transfer documents to other departments (document.share)"
    );
    console.log(
      "   ✅ Delegate workflows to other departments (workflow.delegate)"
    );
    console.log("   ✅ View documents from other departments (read-only)");
    console.log("   ❌ No blanket access to all departments");
    console.log("   ❌ Cannot manage other user roles");

    console.log("\n✅ SUPERVISOR role enhancement completed successfully!");
  } catch (error) {
    console.error("❌ Error enhancing SUPERVISOR role:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

enhanceSupervisorRole();
