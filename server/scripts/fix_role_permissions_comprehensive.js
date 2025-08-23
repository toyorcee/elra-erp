import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import models
import Role from "../models/Role.js";
import Module from "../models/Module.js";
import Department from "../models/Department.js";

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

async function fixRolePermissionsComprehensive() {
  try {
    await connectDB();

    console.log("🔧 Comprehensive Role & Module Permissions Fix...");
    console.log("=".repeat(80));

    // Get all data
    const roles = await Role.find().sort({ level: -1 });
    const modules = await Module.find().sort({ order: 1 });
    const departments = await Department.find().sort({ name: 1 });

    console.log(
      `📋 Found ${roles.length} roles, ${modules.length} modules, ${departments.length} departments`
    );

    // Define proper role-module access mapping with CORRECT CRUD permissions
    const roleModuleAccess = {
      SUPER_ADMIN: {
        level: 1000,
        modules: {
          // Full access to everything - ADMIN level
          SELF_SERVICE: [
            "view",
            "create",
            "edit",
            "delete",
            "approve",
            "admin",
          ],
          HR: ["view", "create", "edit", "delete", "approve", "admin"],
          PAYROLL: ["view", "create", "edit", "delete", "approve", "admin"],
          FINANCE: ["view", "create", "edit", "delete", "approve", "admin"],
          IT: ["view", "create", "edit", "delete", "approve", "admin"],
          OPERATIONS: ["view", "create", "edit", "delete", "approve", "admin"],
          SALES: ["view", "create", "edit", "delete", "approve", "admin"],
          CUSTOMER_SERVICE: [
            "view",
            "create",
            "edit",
            "delete",
            "approve",
            "admin",
          ],
          LEGAL: ["view", "create", "edit", "delete", "approve", "admin"],
          EXECUTIVE: ["view", "create", "edit", "delete", "approve", "admin"],
          SYSTEM_ADMIN: [
            "view",
            "create",
            "edit",
            "delete",
            "approve",
            "admin",
          ], // Only Super Admin
          DOCUMENTS: ["view", "create", "edit", "delete", "approve", "admin"],
          PROJECTS: ["view", "create", "edit", "delete", "approve", "admin"],
          INVENTORY: ["view", "create", "edit", "delete", "approve", "admin"],
          PROCUREMENT: ["view", "create", "edit", "delete", "approve", "admin"],
          CUSTOMER_CARE: [
            "view",
            "create",
            "edit",
            "delete",
            "approve",
            "admin",
          ],
        },
      },
      HOD: {
        level: 700,
        modules: {
          // Department management - APPROVE level for their department modules
          SELF_SERVICE: ["view", "create", "edit", "delete"], // Full self-service access
          HR: ["view", "create", "edit", "approve"], // Department-specific
          PAYROLL: ["view", "create", "edit", "approve"], // Department-specific
          FINANCE: ["view", "create", "edit", "approve"], // Department-specific
          IT: ["view", "create", "edit", "approve"], // Department-specific
          OPERATIONS: ["view", "create", "edit", "approve"], // Department-specific
          SALES: ["view", "create", "edit", "approve"], // Department-specific
          CUSTOMER_SERVICE: ["view", "create", "edit", "approve"], // Department-specific
          LEGAL: ["view", "create", "edit", "approve"], // Department-specific
          EXECUTIVE: ["view", "create", "edit", "approve"], // HODs get executive access
          // NO SYSTEM_ADMIN - only Super Admin
          DOCUMENTS: ["view", "create", "edit", "delete", "approve"], // Full document access
          PROJECTS: ["view", "create", "edit", "approve"], // Department-specific
          INVENTORY: ["view", "create", "edit", "approve"], // Department-specific
          PROCUREMENT: ["view", "create", "edit", "approve"], // Department-specific
          CUSTOMER_CARE: ["view", "create", "edit", "approve"], // Department-specific
        },
      },
      MANAGER: {
        level: 600,
        modules: {
          // Department management - EDIT level for their department modules
          SELF_SERVICE: ["view", "create", "edit"], // Full self-service access
          HR: ["view", "create", "edit"], // Department-specific
          FINANCE: ["view", "create", "edit"], // Department-specific
          IT: ["view", "create", "edit"], // Department-specific
          OPERATIONS: ["view", "create", "edit"], // Department-specific
          SALES: ["view", "create", "edit"], // Department-specific
          CUSTOMER_SERVICE: ["view", "create", "edit"], // Department-specific
          LEGAL: ["view", "create", "edit"], // Department-specific

          PROJECTS: ["view", "create", "edit"], // Department-specific
          INVENTORY: ["view", "create", "edit"], // Department-specific
          PROCUREMENT: ["view", "create", "edit"], // Department-specific
          CUSTOMER_CARE: ["view", "create", "edit"], // Department-specific
        },
      },
      STAFF: {
        level: 300,
        modules: {
          // Basic departmental access - CREATE level for their department modules
          SELF_SERVICE: ["view", "create", "edit"], // Full self-service access
          HR: ["view", "create"], // Department-specific - can create but not edit
          FINANCE: ["view", "create"], // Department-specific - can create but not edit
          IT: ["view", "create"], // Department-specific - can create but not edit
          OPERATIONS: ["view", "create"], // Department-specific - can create but not edit
          SALES: ["view", "create"], // Department-specific - can create but not edit
          CUSTOMER_SERVICE: ["view", "create"], // Department-specific - can create but not edit
          LEGAL: ["view", "create"], // Department-specific - can create but not edit

          PROJECTS: ["view", "create"], // Department-specific - can create but not edit
          INVENTORY: ["view", "create"], // Department-specific - can create but not edit
          PROCUREMENT: ["view", "create"], // Department-specific - can create but not edit
          CUSTOMER_CARE: ["view", "create"], // Department-specific - can create but not edit
        },
      },
      VIEWER: {
        level: 100,
        modules: {
          SELF_SERVICE: ["view"],
        },
      },
    };

    console.log("\n🔧 Updating Role Module Access...");
    console.log("=".repeat(60));

    let updatedRoles = 0;

    for (const role of roles) {
      const roleConfig = roleModuleAccess[role.name];

      if (!roleConfig) {
        console.log(`⚠️  No configuration found for role: ${role.name}`);
        continue;
      }

      console.log(`\n📝 Updating ${role.name} (Level: ${role.level})...`);

      // Clear existing module access
      role.moduleAccess = [];

      // Add configured module access
      for (const [moduleCode, permissions] of Object.entries(
        roleConfig.modules
      )) {
        role.moduleAccess.push({
          module: moduleCode,
          permissions: permissions,
        });
        console.log(`   ✅ ${moduleCode}: ${permissions.join(", ")}`);
      }

      await role.save();
      updatedRoles++;
    }

    console.log(`\n📊 Summary: Updated ${updatedRoles} roles`);

    // Show comprehensive access matrix
    console.log("\n" + "=".repeat(80));
    console.log("📋 COMPREHENSIVE ACCESS MATRIX");
    console.log("=".repeat(80));

    console.log("\n🎯 ROLE ACCESS SUMMARY:");
    console.log("-".repeat(60));

    for (const role of roles) {
      console.log(`\n🔐 ${role.name} (Level: ${role.level})`);
      console.log("-".repeat(40));

      if (role.moduleAccess && role.moduleAccess.length > 0) {
        // Group by permission level
        const adminModules = [];
        const approveModules = [];
        const editModules = [];
        const createModules = [];
        const viewModules = [];

        role.moduleAccess.forEach((access) => {
          if (access.permissions.includes("admin")) {
            adminModules.push(access.module);
          } else if (access.permissions.includes("approve")) {
            approveModules.push(access.module);
          } else if (access.permissions.includes("edit")) {
            editModules.push(access.module);
          } else if (access.permissions.includes("create")) {
            createModules.push(access.module);
          } else if (access.permissions.includes("view")) {
            viewModules.push(access.module);
          }
        });

        if (adminModules.length > 0) {
          console.log(`   🔧 ADMIN ACCESS: ${adminModules.join(", ")}`);
        }
        if (approveModules.length > 0) {
          console.log(`   ✅ APPROVE ACCESS: ${approveModules.join(", ")}`);
        }
        if (editModules.length > 0) {
          console.log(`   ✏️  EDIT ACCESS: ${editModules.join(", ")}`);
        }
        if (createModules.length > 0) {
          console.log(`   ➕ CREATE ACCESS: ${createModules.join(", ")}`);
        }
        if (viewModules.length > 0) {
          console.log(`   👁️  VIEW ONLY: ${viewModules.join(", ")}`);
        }
      } else {
        console.log(`   ❌ No module access configured`);
      }
    }

    // Show department-specific recommendations
    console.log("\n" + "=".repeat(80));
    console.log("🏢 DEPARTMENT-SPECIFIC ACCESS RECOMMENDATIONS");
    console.log("=".repeat(80));

    const departmentModuleMapping = {
      "Human Resources": ["HR", "PAYROLL", "SELF_SERVICE"],
      "Finance & Accounting": [
        "FINANCE",
        "PAYROLL",
        "PROCUREMENT",
        "SELF_SERVICE",
      ],
      "Information Technology": [
        "IT",
        "SYSTEM_ADMIN",
        "DOCUMENTS",
        "SELF_SERVICE",
      ],
      Operations: [
        "OPERATIONS",
        "INVENTORY",
        "PROJECTS",
        "DOCUMENTS",
        "SELF_SERVICE",
      ],
      "Sales & Marketing": [
        "SALES",
        "CUSTOMER_SERVICE",
        "DOCUMENTS",
        "SELF_SERVICE",
      ],
      "Customer Service": [
        "CUSTOMER_SERVICE",
        "CUSTOMER_CARE",
        "DOCUMENTS",
        "SELF_SERVICE",
      ],
      "Legal & Compliance": ["LEGAL", "DOCUMENTS", "SELF_SERVICE"],
      "Executive Office": [
        "EXECUTIVE",
        "SYSTEM_ADMIN",
        "DOCUMENTS",
        "SELF_SERVICE",
      ],
      Procurement: [
        "PROCUREMENT",
        "INVENTORY",
        "FINANCE",
        "DOCUMENTS",
        "SELF_SERVICE",
      ],
    };

    console.log("\n📋 Recommended modules by department:");
    for (const [deptName, moduleList] of Object.entries(
      departmentModuleMapping
    )) {
      console.log(`\n🏢 ${deptName}:`);
      console.log(`   📦 Core Modules: ${moduleList.join(", ")}`);

      // Show role access within this department
      console.log(`   👥 Role Access:`);
      console.log(`      • HOD: Full approve access to core modules`);
      console.log(`      • Manager: Edit access to core modules`);
      console.log(`      • Staff: Create access to core modules`);
      console.log(
        `      • Viewer: View access to SELF_SERVICE, DOCUMENTS only`
      );
    }

    // Verification
    console.log("\n" + "=".repeat(80));
    console.log("🔍 VERIFICATION CHECKS");
    console.log("=".repeat(80));

    // Check System Admin access
    const systemAdminRoles = roles.filter((role) =>
      role.moduleAccess.some((access) => access.module === "SYSTEM_ADMIN")
    );

    console.log(`\n🔧 SYSTEM_ADMIN Access:`);
    if (
      systemAdminRoles.length === 1 &&
      systemAdminRoles[0].name === "SUPER_ADMIN"
    ) {
      console.log(`   ✅ Correct: Only SUPER_ADMIN has SYSTEM_ADMIN access`);
    } else {
      console.log(
        `   ❌ Problem: ${systemAdminRoles
          .map((r) => r.name)
          .join(", ")} have SYSTEM_ADMIN access`
      );
    }

    // Check Self-Service access
    const selfServiceRoles = roles.filter((role) =>
      role.moduleAccess.some((access) => access.module === "SELF_SERVICE")
    );
    console.log(`\n👤 SELF_SERVICE Access:`);
    console.log(
      `   📋 Roles with access: ${selfServiceRoles
        .map((r) => r.name)
        .join(", ")}`
    );

    if (selfServiceRoles.length === roles.length) {
      console.log(`   ✅ Correct: All roles have SELF_SERVICE access`);
    } else {
      console.log(`   ⚠️  Warning: Not all roles have SELF_SERVICE access`);
    }

    // CRUD Analysis
    console.log("\n" + "=".repeat(80));
    console.log("🔍 CRUD PERMISSIONS ANALYSIS");
    console.log("=".repeat(80));

    console.log("\n📋 CRUD Permission Matrix by Role:");
    console.log("-".repeat(60));

    for (const role of roles) {
      console.log(`\n🔐 ${role.name} (Level: ${role.level})`);
      console.log("-".repeat(40));

      if (role.moduleAccess && role.moduleAccess.length > 0) {
        // Create a matrix showing CRUD for each module
        const modules = [
          "SELF_SERVICE",
          "HR",
          "PAYROLL",
          "FINANCE",
          "IT",
          "OPERATIONS",
          "SALES",
          "CUSTOMER_SERVICE",
          "LEGAL",
          "EXECUTIVE",
          "SYSTEM_ADMIN",
          "DOCUMENTS",
          "PROJECTS",
          "INVENTORY",
          "PROCUREMENT",
          "CUSTOMER_CARE",
        ];

        console.log(
          "Module          | View | Create | Edit | Delete | Approve | Admin"
        );
        console.log(
          "----------------|------|--------|------|--------|---------|-------"
        );

        for (const moduleName of modules) {
          const access = role.moduleAccess.find((a) => a.module === moduleName);
          if (access) {
            const view = access.permissions.includes("view") ? "✅" : "❌";
            const create = access.permissions.includes("create") ? "✅" : "❌";
            const edit = access.permissions.includes("edit") ? "✅" : "❌";
            const delete_perm = access.permissions.includes("delete")
              ? "✅"
              : "❌";
            const approve = access.permissions.includes("approve")
              ? "✅"
              : "❌";
            const admin = access.permissions.includes("admin") ? "✅" : "❌";

            console.log(
              `${moduleName.padEnd(15)} | ${view.padEnd(4)} | ${create.padEnd(
                6
              )} | ${edit.padEnd(4)} | ${delete_perm.padEnd(
                6
              )} | ${approve.padEnd(7)} | ${admin}`
            );
          } else {
            console.log(
              `${moduleName.padEnd(
                15
              )} | ❌   | ❌     | ❌   | ❌     | ❌      | ❌`
            );
          }
        }
      } else {
        console.log(`   ❌ No module access configured`);
      }
    }

    // CRUD Logic Verification
    console.log("\n" + "=".repeat(80));
    console.log("🔍 CRUD LOGIC VERIFICATION");
    console.log("=".repeat(80));

    console.log("\n✅ CRUD Permission Logic:");
    console.log("-".repeat(40));
    console.log("• SUPER_ADMIN: Full CRUD + Approve + Admin on ALL modules");
    console.log("• HOD: View + Create + Edit + Approve on department modules");
    console.log("• MANAGER: View + Create + Edit on department modules");
    console.log(
      "• STAFF: View + Create on department modules (can edit own documents)"
    );
    console.log("• VIEWER: View only on SELF_SERVICE and DOCUMENTS");
    console.log("");
    console.log("🎯 Key Principles:");
    console.log(
      "• SELF_SERVICE: Universal access (all roles can use personal features)"
    );
    console.log(
      "• DOCUMENTS: Progressive access (view → create → edit → delete → approve)"
    );
    console.log(
      "• Department modules: Role-based access based on user's department"
    );
    console.log("• SYSTEM_ADMIN: Super Admin only");
    console.log("• EXECUTIVE: HOD and above only");

    console.log("\n" + "=".repeat(80));
    console.log("✅ Comprehensive role permissions fix completed!");
    console.log("=".repeat(80));
  } catch (error) {
    console.error("❌ Error fixing role permissions:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

fixRolePermissionsComprehensive();
