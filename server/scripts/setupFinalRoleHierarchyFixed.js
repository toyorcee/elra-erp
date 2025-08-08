import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Role from "../models/Role.js";
import User from "../models/User.js";

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

async function setupFinalRoleHierarchy() {
  try {
    await connectDB();

    console.log("🎯 Setting up Final Role Hierarchy...");
    console.log("=".repeat(50));

    // Step 1: Check current roles and clean up conflicts
    console.log(
      "\n🧹 Step 1: Checking current roles and cleaning up conflicts..."
    );

    const currentRoles = await Role.find({});
    console.log("Current roles in database:");
    currentRoles.forEach((role) => {
      console.log(`  - ${role.name} (Level: ${role.level})`);
    });

    // Remove roles that conflict with our new hierarchy
    const rolesToRemove = [
      "PLATFORM_ADMIN",
      "COMPANY_ADMIN",
      "DEPARTMENT_HEAD",
    ];

    for (const roleName of rolesToRemove) {
      const role = await Role.findOne({ name: roleName });
      if (role) {
        console.log(`🗑️  Removing ${roleName} role...`);
        await Role.deleteOne({ name: roleName });
        console.log(`✅ Removed ${roleName} role`);
      }
    }

    // Handle the existing MANAGER role with level 700 - rename it to HOD
    const existingManager = await Role.findOne({ name: "MANAGER", level: 700 });
    if (existingManager) {
      console.log("🔄 Converting existing MANAGER (level 700) to HOD...");
      existingManager.name = "HOD";
      existingManager.description =
        "Head of Department - Can approve STAFF and MANAGER registrations";
      existingManager.permissions = [
        "user.approve_department",
        "user.manage_staff",
        "user.manage_manager",
        "document.approve_department",
        "workflow.approve_department",
        "user.view_department_users",
        "user.edit_department_users",
      ];
      existingManager.autoApproval = false;
      existingManager.canApproveDepartment = true;
      existingManager.canManageManagers = true;
      existingManager.canManageHODs = false;
      existingManager.canManageStaff = true;
      await existingManager.save();
      console.log("✅ Converted MANAGER to HOD");
    }

    // Also remove any roles with conflicting levels
    const conflictingLevels = [600, 300];
    for (const level of conflictingLevels) {
      const conflictingRole = await Role.findOne({ level: level });
      if (
        conflictingRole &&
        !["SUPER_ADMIN", "HOD", "MANAGER", "STAFF"].includes(
          conflictingRole.name
        )
      ) {
        console.log(
          `🗑️  Removing conflicting role: ${conflictingRole.name} (Level: ${level})`
        );
        await Role.deleteOne({ _id: conflictingRole._id });
        console.log(`✅ Removed conflicting role: ${conflictingRole.name}`);
      }
    }

    // Step 2: Define the final role hierarchy
    console.log("\n📋 Step 2: Setting up final role hierarchy...");

    const roleDefinitions = [
      {
        name: "SUPER_ADMIN",
        level: 1000,
        description: "Super Administrator - Full system control",
        permissions: ["*"], // All permissions
        autoApproval: false,
        canApproveDepartment: false,
        canManageManagers: true,
        canManageHODs: true,
        canManageStaff: true,
      },
      {
        name: "HOD",
        level: 700,
        description:
          "Head of Department - Can approve STAFF and MANAGER registrations",
        permissions: [
          "user.approve_department",
          "user.manage_staff",
          "user.manage_manager",
          "document.approve_department",
          "workflow.approve_department",
          "user.view_department_users",
          "user.edit_department_users",
        ],
        autoApproval: false,
        canApproveDepartment: true,
        canManageManagers: true,
        canManageHODs: false,
        canManageStaff: true,
      },
      {
        name: "MANAGER",
        level: 600,
        description: "Manager - Can manage STAFF and assign tasks",
        permissions: [
          "user.manage_staff",
          "user.view_staff",
          "user.assign_staff_tasks",
          "document.view_department",
          "workflow.view_department",
        ],
        autoApproval: false,
        canApproveDepartment: false,
        canManageManagers: false,
        canManageHODs: false,
        canManageStaff: true,
      },
      {
        name: "STAFF",
        level: 300,
        description: "Staff member - Basic access",
        permissions: [
          "document.view_own",
          "document.upload_own",
          "workflow.view_own",
        ],
        autoApproval: false,
        canApproveDepartment: false,
        canManageManagers: false,
        canManageHODs: false,
        canManageStaff: false,
      },
    ];

    // Step 3: Create/Update roles (skip HOD since we already converted it)
    console.log("\n🔄 Step 3: Creating/Updating roles...");

    for (const roleDef of roleDefinitions) {
      // Skip HOD since we already converted the existing MANAGER to HOD
      if (roleDef.name === "HOD") {
        console.log(`⏭️  Skipping HOD - already converted from existing MANAGER`);
        continue;
      }

      let role = await Role.findOne({ name: roleDef.name });

      if (role) {
        console.log(`🔄 Updating existing role: ${roleDef.name}`);
        Object.assign(role, roleDef);
      } else {
        console.log(`🆕 Creating new role: ${roleDef.name}`);
        role = new Role(roleDef);
      }

      await role.save();
      console.log(`✅ ${roleDef.name} role configured`);
    }

    // Step 4: Update users with old role names
    console.log("\n👥 Step 4: Updating users with old role names...");

    const roleMappings = {
      DEPARTMENT_HEAD: "HOD",
      COMPANY_ADMIN: "SUPER_ADMIN",
      PLATFORM_ADMIN: "SUPER_ADMIN",
      JUNIOR_STAFF: "STAFF",
    };

    for (const [oldRoleName, newRoleName] of Object.entries(roleMappings)) {
      const oldRole = await Role.findOne({ name: oldRoleName });
      const newRole = await Role.findOne({ name: newRoleName });

      if (oldRole && newRole) {
        const usersToUpdate = await User.find({ role: oldRole._id });

        for (const user of usersToUpdate) {
          console.log(
            `🔄 Updating user ${user.email}: ${oldRoleName} → ${newRoleName}`
          );
          user.role = newRole._id;
          await user.save();
        }

        console.log(
          `✅ Updated ${usersToUpdate.length} users from ${oldRoleName} to ${newRoleName}`
        );

        // Remove old role
        await Role.deleteOne({ name: oldRoleName });
        console.log(`🗑️  Removed old ${oldRoleName} role`);
      }
    }

    // Step 5: Verify final role structure
    console.log("\n📊 Step 5: Final role structure...");

    const allRoles = await Role.find({}).sort({ level: -1 });
    console.log("\nFinal Role Hierarchy:");
    allRoles.forEach((role) => {
      console.log(`  ${role.name} (Level: ${role.level})`);
      console.log(`    Description: ${role.description}`);
      console.log(`    Auto Approval: ${role.autoApproval ? "Yes" : "No"}`);
      console.log(
        `    Can Approve Department: ${
          role.canApproveDepartment ? "Yes" : "No"
        }`
      );
      console.log(
        `    Can Manage Managers: ${role.canManageManagers ? "Yes" : "No"}`
      );
      console.log(`    Can Manage HODs: ${role.canManageHODs ? "Yes" : "No"}`);
      console.log(
        `    Can Manage Staff: ${role.canManageStaff ? "Yes" : "No"}`
      );
      console.log("");
    });

    // Step 6: Summary
    console.log("\n🎉 Final Role Hierarchy Setup Complete!");
    console.log("=".repeat(50));
    console.log("✅ SUPER_ADMIN: Full system control");
    console.log("✅ HOD: Can approve STAFF and MANAGER, manage both");
    console.log("✅ MANAGER: Can manage STAFF and assign tasks");
    console.log("✅ STAFF: Basic access, requires approval");
    console.log("✅ Removed PLATFORM_ADMIN and COMPANY_ADMIN");
    console.log("✅ All users updated to new role structure");
  } catch (error) {
    console.error("❌ Error setting up role hierarchy:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
}

// Run the setup
setupFinalRoleHierarchy();
