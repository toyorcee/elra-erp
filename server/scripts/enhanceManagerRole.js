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

async function enhanceManagerRole() {
  try {
    await connectDB();

    console.log(
      "🔧 Enhancing MANAGER Role for Department-Specific Operations..."
    );
    console.log("=".repeat(70));

    // Find the MANAGER role
    const managerRole = await Role.findOne({ name: "MANAGER" });

    if (!managerRole) {
      console.log("❌ MANAGER role not found. Creating it...");

      // Create MANAGER role with enhanced permissions
      const newManagerRole = new Role({
        name: "MANAGER",
        level: 50,
        description:
          "Department manager with full CRUD operations within assigned department, cross-department transfer capabilities, and enhanced management features",
        permissions: [
          // Document permissions (department-specific CRUD + cross-dept transfer)
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

          // User management permissions (enhanced for managers)
          "user.view", // View users
          "user.view_permissions", // View user permissions
          "user.assign_role", // Assign roles to users (manager-specific)

          // System permissions (enhanced for managers)
          "system.reports", // Access department reports
          "system.audit", // View audit logs (manager-specific)
        ],
        departmentAccess: [], // No blanket access - will be set per user
        canManageRoles: [], // Cannot manage other roles
        isActive: true,
      });

      await newManagerRole.save();
      console.log("✅ Created MANAGER role with enhanced permissions");
    } else {
      console.log(
        "📋 Current MANAGER permissions:",
        managerRole.permissions.length
      );

      // Define enhanced department-specific permissions for MANAGER
      const enhancedPermissions = [
        // Document permissions (department-specific CRUD + cross-dept transfer)
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

        // User management permissions (enhanced for managers)
        "user.view", // View users
        "user.view_permissions", // View user permissions
        "user.assign_role", // Assign roles to users (manager-specific)

        // System permissions (enhanced for managers)
        "system.reports", // Access department reports
        "system.audit", // View audit logs (manager-specific)
      ];

      // Update the role with enhanced permissions
      managerRole.permissions = enhancedPermissions;
      managerRole.description =
        "Department manager with full CRUD operations within assigned department, cross-department transfer capabilities, and enhanced management features";
      managerRole.departmentAccess = []; // No blanket access
      managerRole.canManageRoles = []; // Cannot manage other roles

      await managerRole.save();
      console.log("✅ Updated MANAGER role with enhanced permissions");
    }

    // Verify the update
    const updatedRole = await Role.findOne({ name: "MANAGER" });
    console.log("\n🎯 Enhanced MANAGER Role Details:");
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

    console.log("   👥 User Management (Enhanced for Managers):");
    updatedRole.permissions
      .filter((p) => p.startsWith("user."))
      .forEach((permission, index) => {
        console.log(`      ${index + 1}. ${permission}`);
      });

    console.log("   🔧 System Access (Enhanced for Managers):");
    updatedRole.permissions
      .filter((p) => p.startsWith("system."))
      .forEach((permission, index) => {
        console.log(`      ${index + 1}. ${permission}`);
      });

    console.log("\n🎯 Manager-Specific Capabilities:");
    console.log("   ✅ Full CRUD operations within assigned department");
    console.log("   ✅ Create and manage workflows for their department");
    console.log(
      "   ✅ Transfer documents to other departments (document.share)"
    );
    console.log(
      "   ✅ Delegate workflows to other departments (workflow.delegate)"
    );
    console.log(
      "   ✅ Assign roles to users (user.assign_role) - MANAGER-SPECIFIC"
    );
    console.log("   ✅ View audit logs (system.audit) - MANAGER-SPECIFIC");
    console.log("   ✅ View documents from other departments (read-only)");
    console.log("   ❌ No blanket access to all departments");
    console.log("   ❌ Cannot manage other user roles");

    console.log("\n✅ MANAGER role enhancement completed successfully!");
  } catch (error) {
    console.error("❌ Error enhancing MANAGER role:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

enhanceManagerRole();
