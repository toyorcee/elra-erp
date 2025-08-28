import mongoose from "mongoose";
import dotenv from "dotenv";
import Role from "../models/Role.js";
import Department from "../models/Department.js";
import User from "../models/User.js";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const fixAllUserModules = async () => {
  try {
    console.log(
      "🔧 Fixing all users' module access with proper permissions..."
    );

    // Get all roles
    const hodRole = await Role.findOne({ name: "HOD" });
    const managerRole = await Role.findOne({ name: "MANAGER" });
    const staffRole = await Role.findOne({ name: "STAFF" });
    const viewerRole = await Role.findOne({ name: "VIEWER" });

    if (!hodRole || !managerRole || !staffRole || !viewerRole) {
      console.log("❌ One or more roles not found");
      return;
    }

    // Define department-specific module access with role-based permissions
    const departmentModuleConfig = {
      "Human Resources": {
        modules: [
          "SELF_SERVICE",
          "CUSTOMER_CARE",
          "PROJECTS",
          "HR",
          "PAYROLL",
          "COMMUNICATION",
        ],
        permissions: {
          HOD: ["view", "create", "edit", "delete", "approve"],
          MANAGER: ["view", "edit", "approve"], // Managers approve what Staff creates
          STAFF: ["view"], // Staff can only view HR records, not create/edit
          VIEWER: ["view"], // Viewers can only view HR records
        },
      },
      "Legal & Compliance": {
        modules: [
          "SELF_SERVICE",
          "CUSTOMER_CARE",
          "PROJECTS",
          "LEGAL",
          "COMMUNICATION",
        ],
        permissions: {
          HOD: ["view", "create", "edit", "delete", "approve"],
          MANAGER: ["view", "edit", "approve"], // Managers approve what Staff creates
          STAFF: ["view"], // Staff can only view Legal records
          VIEWER: ["view"], // Viewers can only view Legal records
        },
      },
      "Finance & Accounting": {
        modules: [
          "SELF_SERVICE",
          "CUSTOMER_CARE",
          "PROJECTS",
          "FINANCE",
          "PAYROLL",
          "COMMUNICATION",
        ],
        permissions: {
          HOD: ["view", "create", "edit", "delete", "approve"],
          MANAGER: ["view", "edit", "approve"], // Managers approve what Staff creates
          STAFF: ["view"], // Staff can only view Finance records
          VIEWER: ["view"], // Viewers can only view Finance records
        },
      },
      Operations: {
        modules: [
          "SELF_SERVICE",
          "CUSTOMER_CARE",
          "PROJECTS",
          "INVENTORY",
          "COMMUNICATION",
        ],
        permissions: {
          HOD: ["view", "create", "edit", "delete", "approve"],
          MANAGER: ["view", "edit", "approve"], // Managers approve what Staff creates
          STAFF: ["view"], // Staff can only view Inventory records
          VIEWER: ["view"], // Viewers can only view Inventory records
        },
      },
      Procurement: {
        modules: [
          "SELF_SERVICE",
          "CUSTOMER_CARE",
          "PROJECTS",
          "PROCUREMENT",
          "COMMUNICATION",
        ],
        permissions: {
          HOD: ["view", "create", "edit", "delete", "approve"],
          MANAGER: ["view", "edit", "approve"], // Managers approve what Staff creates
          STAFF: ["view"], // Staff can only view Procurement records
          VIEWER: ["view"], // Viewers can only view Procurement records
        },
      },
      "Sales & Marketing": {
        modules: [
          "SELF_SERVICE",
          "CUSTOMER_CARE",
          "PROJECTS",
          "SALES",
          "COMMUNICATION",
        ],
        permissions: {
          HOD: ["view", "create", "edit", "delete", "approve"],
          MANAGER: ["view", "edit", "approve"], // Managers approve what Staff creates
          STAFF: ["view"], // Staff can only view Sales records
          VIEWER: ["view"], // Viewers can only view Sales records
        },
      },
      "Executive Office": {
        modules: [
          "SELF_SERVICE",
          "CUSTOMER_CARE",
          "PROJECTS",
          "SYSTEM_ADMIN",
          "COMMUNICATION",
        ],
        permissions: {
          HOD: ["view", "create", "edit", "delete", "approve"],
          MANAGER: ["view", "edit", "approve"], // Managers approve what Staff creates
          STAFF: ["view"], // Staff can only view System Admin records
          VIEWER: ["view"], // Viewers can only view System Admin records
        },
      },
      "Information Technology": {
        modules: [
          "SELF_SERVICE",
          "CUSTOMER_CARE",
          "PROJECTS",
          "SYSTEM_ADMIN",
          "COMMUNICATION",
        ],
        permissions: {
          HOD: ["view", "create", "edit", "delete", "approve"],
          MANAGER: ["view", "edit", "approve"], // Managers approve what Staff creates
          STAFF: ["view"], // Staff can only view System Admin records
          VIEWER: ["view"], // Viewers can only view System Admin records
        },
      },
      "Customer Service": {
        modules: ["SELF_SERVICE", "CUSTOMER_CARE", "PROJECTS", "COMMUNICATION"],
        permissions: {
          HOD: ["view", "create", "edit", "delete", "approve"],
          MANAGER: ["view", "edit", "approve"], // Managers approve what Staff creates
          STAFF: ["view"], // Staff can only view department records
          VIEWER: ["view"], // Viewers can only view department records
        },
      },
      "System Administration": {
        modules: [
          "SELF_SERVICE",
          "CUSTOMER_CARE",
          "PROJECTS",
          "SYSTEM_ADMIN",
          "COMMUNICATION",
        ],
        permissions: {
          HOD: ["view", "create", "edit", "delete", "approve"],
          MANAGER: ["view", "edit", "approve"], // Managers approve what Staff creates
          STAFF: ["view"], // Staff can only view System Admin records
          VIEWER: ["view"], // Viewers can only view System Admin records
        },
      },
    };

    // Get all users with their roles and departments
    const hodUsers = await User.find({ role: hodRole._id }).populate(
      "department"
    );
    const managerUsers = await User.find({ role: managerRole._id }).populate(
      "department"
    );
    const staffUsers = await User.find({ role: staffRole._id }).populate(
      "department"
    );
    const viewerUsers = await User.find({ role: viewerRole._id }).populate(
      "department"
    );

    console.log(
      `\n👥 Found ${hodUsers.length} HOD users, ${managerUsers.length} Manager users, ${staffUsers.length} Staff users, ${viewerUsers.length} Viewer users`
    );

    // Log current state of users
    console.log("\n🔍 CURRENT STATE OF USERS:");
    for (const user of hodUsers) {
      console.log(`   ${user.username} (${user.department?.name}):`);
      console.log(
        `     User moduleAccess: ${user.moduleAccess?.length || 0} modules`
      );
      if (user.moduleAccess && user.moduleAccess.length > 0) {
        console.log(
          `     User modules: ${user.moduleAccess
            .map((m) => m.module)
            .join(", ")}`
        );
        console.log(
          `     User IDs: ${user.moduleAccess
            .map((m) => m._id || "null")
            .join(", ")}`
        );
      }
    }

    // Function to update user module access with PROJECTS module exception
    const updateUserModules = async (user, roleType) => {
      const departmentName = user.department?.name;

      if (!departmentName) {
        console.log(
          `⚠️  ${roleType} ${user.username} has no department assigned`
        );
        return;
      }

      const config = departmentModuleConfig[departmentName];

      if (!config) {
        console.log(
          `⚠️  No module config found for department: ${departmentName}`
        );
        return;
      }

      const permissions = config.permissions[roleType];
      if (!permissions) {
        console.log(
          `⚠️  No permissions found for role: ${roleType} in department: ${departmentName}`
        );
        return;
      }

      // Create module access array for this user's department and role
      const userModuleAccess = config.modules.map((module) => {
        // Special handling for PROJECTS module - all users except VIEWER can create personal projects
        if (module === "PROJECTS") {
          if (roleType === "VIEWER") {
            return {
              module: module,
              permissions: ["view"], // VIEWER can only view projects, not create
              _id: new mongoose.Types.ObjectId(), // Use _id instead of id
            };
          }
          return {
            module: module,
            permissions: ["view", "create"], // All other users can view and create projects
            _id: new mongoose.Types.ObjectId(), // Use _id instead of id
          };
        }

        // Special handling for SELF_SERVICE, CUSTOMER_CARE, COMMUNICATION - Staff can create
        if (
          ["SELF_SERVICE", "CUSTOMER_CARE", "COMMUNICATION"].includes(module)
        ) {
          if (roleType === "VIEWER" && module === "SELF_SERVICE") {
            return {
              module: module,
              permissions: ["view"], // VIEWER can only view SELF_SERVICE (payroll), not create leave requests
              _id: new mongoose.Types.ObjectId(), // Use _id instead of id
            };
          }
          return {
            module: module,
            permissions: ["view", "create"], // All other users can create in these modules
            _id: new mongoose.Types.ObjectId(), // Use _id instead of id
          };
        }

        return {
          module: module,
          permissions: permissions,
          _id: new mongoose.Types.ObjectId(), // Use _id instead of id
        };
      });

      // Update user's module access
      user.moduleAccess = userModuleAccess;
      await user.save();

      console.log(
        `✅ Updated ${user.firstName} ${user.lastName} (${user.username}) - ${roleType} - Department: ${departmentName}`
      );
      console.log(`   📋 Modules: ${config.modules.join(", ")}`);
      console.log(`   🔐 Permissions: ${permissions.join(", ")}`);
      console.log(
        `   📝 Note: PROJECTS, SELF_SERVICE, CUSTOMER_CARE, COMMUNICATION have special permissions (view, create) for all users`
      );
    };

    // Function to update role moduleAccess to match user-level exactly
    const updateRoleModuleAccess = async (role, roleType) => {
      console.log(
        `\n🔧 Updating ${roleType} role moduleAccess to match user-level...`
      );

      // Get all users with this role to determine what modules they should have
      const usersWithRole = await User.find({ role: role._id }).populate(
        "department"
      );

      // Collect all unique modules that users with this role should have
      const allModules = new Set();

      for (const user of usersWithRole) {
        const departmentName = user.department?.name;
        if (departmentName && departmentModuleConfig[departmentName]) {
          const config = departmentModuleConfig[departmentName];
          config.modules.forEach((module) => allModules.add(module));
        }
      }

      // Convert to array and sort for consistency
      const roleModules = Array.from(allModules).sort();

      const roleModuleAccess = roleModules.map((module) => {
        // Determine permissions based on role type
        let permissions;
        switch (roleType) {
          case "HOD":
            permissions = ["view", "create", "edit", "delete", "approve"];
            break;
          case "MANAGER":
            permissions = ["view", "edit", "approve"];
            break;
          case "STAFF":
            permissions = ["view"];
            break;
          case "VIEWER":
            permissions = ["view"];
            break;
          default:
            permissions = ["view"];
        }

        return {
          module: module,
          permissions: permissions,
          _id: new mongoose.Types.ObjectId(), // Use _id for role-level moduleAccess
        };
      });

      // Update role's moduleAccess
      role.moduleAccess = roleModuleAccess;
      await role.save();

      console.log(
        `✅ Updated ${roleType} role with ${roleModuleAccess.length} modules based on actual user departments`
      );
      console.log(`   📋 Modules: ${roleModules.join(", ")}`);
      if (roleModuleAccess.length > 0) {
        console.log(
          `   🔐 Permissions: ${roleModuleAccess[0].permissions.join(", ")}`
        );
      } else {
        console.log(`   🔐 No modules assigned (no users with this role)`);
      }
      console.log(
        `   🔧 Role now matches exactly what users with this role need`
      );
    };

    // Update HOD users
    console.log("\n🔧 Updating HOD users...");
    for (const user of hodUsers) {
      await updateUserModules(user, "HOD");
    }

    // Update Manager users
    console.log("\n🔧 Updating Manager users...");
    for (const user of managerUsers) {
      await updateUserModules(user, "MANAGER");
    }

    // Update Staff users
    console.log("\n🔧 Updating Staff users...");
    for (const user of staffUsers) {
      await updateUserModules(user, "STAFF");
    }

    // Update Viewer users
    console.log("\n🔧 Updating Viewer users...");
    for (const user of viewerUsers) {
      await updateUserModules(user, "VIEWER");
    }

    // Update role moduleAccess for all roles
    console.log("\n🔧 Updating role moduleAccess...");
    await updateRoleModuleAccess(hodRole, "HOD");
    await updateRoleModuleAccess(managerRole, "MANAGER");
    await updateRoleModuleAccess(staffRole, "STAFF");
    await updateRoleModuleAccess(viewerRole, "VIEWER");

    // Log final state of users
    console.log("\n🔍 FINAL STATE OF USERS:");
    const finalHodUsers = await User.find({ role: hodRole._id }).populate(
      "department"
    );
    for (const user of finalHodUsers) {
      console.log(`   ${user.username} (${user.department?.name}):`);
      console.log(
        `     User moduleAccess: ${user.moduleAccess?.length || 0} modules`
      );
      if (user.moduleAccess && user.moduleAccess.length > 0) {
        console.log(
          `     User modules: ${user.moduleAccess
            .map((m) => m.module)
            .join(", ")}`
        );
        console.log(
          `     User IDs: ${user.moduleAccess
            .map((m) => m._id || "null")
            .join(", ")}`
        );
      }
    }

    console.log(
      "\n✅ All users and roles updated with department-specific module access and proper permissions"
    );
    console.log("\n📊 Permission Summary:");
    console.log("   HOD: view, create, edit, delete, approve");
    console.log(
      "   MANAGER: view, edit, approve (approves what Staff creates)"
    );
    console.log(
      "   STAFF: view (for department modules), view+create (for self-service modules)"
    );
    console.log(
      "   VIEWER: view (for department modules), view+create (for CUSTOMER_CARE, COMMUNICATION), view only (for SELF_SERVICE, PROJECTS)"
    );
    console.log("\n🎯 Special Module Permissions:");
    console.log(
      "   PROJECTS: All users except VIEWER - view, create (personal projects)"
    );
    console.log(
      "   SELF_SERVICE: All users except VIEWER - view, create (leave requests, equipment, tickets)"
    );
    console.log("   CUSTOMER_CARE: All users - view, create (support tickets)");
    console.log("   COMMUNICATION: All users - view, create (messages, files)");
  } catch (error) {
    console.error("❌ Error fixing user modules:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
};

// Run the script
connectDB().then(() => {
  fixAllUserModules().then(() => {
    console.log("✅ Script completed");
    process.exit(0);
  });
});
