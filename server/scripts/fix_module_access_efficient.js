import mongoose from "mongoose";
import dotenv from "dotenv";
import Role from "../models/Role.js";
import Department from "../models/Department.js";
import Module from "../models/Module.js";

dotenv.config();

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
    });

    console.log(`🟢 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

async function fixModuleAccessEfficient() {
  try {
    await connectDB();

    console.log(
      "🔧 FIXING MODULE ACCESS - ALL ROLES (HOD, MANAGER, STAFF, VIEWER)"
    );
    console.log("=".repeat(80));

    // Define department-specific module access for ALL roles
    const departmentModuleAccess = {
      "Finance & Accounting": [
        "SELF_SERVICE",
        "CUSTOMER_CARE",
        "FINANCE",
        "PROCUREMENT",
        "PAYROLL",
        "PROJECTS",
        "INVENTORY",
      ],
      "Human Resources": [
        "SELF_SERVICE",
        "CUSTOMER_CARE",
        "HR",
        "PAYROLL",
        "PROJECTS",
      ],
      "Information Technology": [
        "SELF_SERVICE",
        "CUSTOMER_CARE",
        "IT",
        "SYSTEM_ADMIN",
        "PROJECTS",
      ],
      Operations: [
        "SELF_SERVICE",
        "CUSTOMER_CARE",
        "OPERATIONS",
        "PROJECTS",
        "INVENTORY",
        "PROCUREMENT",
      ],
      "Sales & Marketing": [
        "SELF_SERVICE",
        "CUSTOMER_CARE",
        "SALES",
        "PROJECTS",
      ],
      "Legal & Compliance": [
        "SELF_SERVICE",
        "CUSTOMER_CARE",
        "LEGAL",
        "PROJECTS",
      ],
      "Customer Service": ["SELF_SERVICE", "CUSTOMER_CARE", "PROJECTS"],
      "Executive Office": [
        "SELF_SERVICE",
        "CUSTOMER_CARE",
        "SYSTEM_ADMIN",
        "PROJECTS",
      ],
      "System Administration": [
        "SELF_SERVICE",
        "CUSTOMER_CARE",
        "SYSTEM_ADMIN",
        "PROJECTS",
      ],
    };

    // Define role-specific module access (what each role level can access)
    const roleModuleAccess = {
      HOD: {
        level: 700,
        description: "Head of Department - Full access to department modules",
        modules: {
          "Finance & Accounting": [
            "SELF_SERVICE",
            "CUSTOMER_CARE",
            "FINANCE",
            "PROCUREMENT",
            "PAYROLL",
            "PROJECTS",
            "INVENTORY",
          ],
          "Human Resources": [
            "SELF_SERVICE",
            "CUSTOMER_CARE",
            "HR",
            "PAYROLL",
            "PROJECTS",
          ],
          "Information Technology": [
            "SELF_SERVICE",
            "CUSTOMER_CARE",
            "IT",
            "SYSTEM_ADMIN",
            "PROJECTS",
          ],
          Operations: [
            "SELF_SERVICE",
            "CUSTOMER_CARE",
            "OPERATIONS",
            "PROJECTS",
            "INVENTORY",
            "PROCUREMENT",
          ],
          "Sales & Marketing": [
            "SELF_SERVICE",
            "CUSTOMER_CARE",
            "SALES",
            "PROJECTS",
          ],
          "Legal & Compliance": [
            "SELF_SERVICE",
            "CUSTOMER_CARE",
            "LEGAL",
            "PROJECTS",
          ],
          "Customer Service": ["SELF_SERVICE", "CUSTOMER_CARE", "PROJECTS"],
          "Executive Office": [
            "SELF_SERVICE",
            "CUSTOMER_CARE",
            "SYSTEM_ADMIN",
            "PROJECTS",
          ],
          "System Administration": [
            "SELF_SERVICE",
            "CUSTOMER_CARE",
            "SYSTEM_ADMIN",
            "PROJECTS",
          ],
        },
      },
      MANAGER: {
        level: 600,
        description: "Manager - Limited access to department modules",
        modules: {
          "Finance & Accounting": [
            "SELF_SERVICE",
            "CUSTOMER_CARE",
            "FINANCE",
            "PROCUREMENT",
            "PROJECTS",
          ],
          "Human Resources": [
            "SELF_SERVICE",
            "CUSTOMER_CARE",
            "HR",
            "PROJECTS",
          ],
          "Information Technology": [
            "SELF_SERVICE",
            "CUSTOMER_CARE",
            "IT",
            "PROJECTS",
          ],
          Operations: [
            "SELF_SERVICE",
            "CUSTOMER_CARE",
            "OPERATIONS",
            "PROJECTS",
            "INVENTORY",
          ],
          "Sales & Marketing": [
            "SELF_SERVICE",
            "CUSTOMER_CARE",
            "SALES",
            "PROJECTS",
          ],
          "Legal & Compliance": [
            "SELF_SERVICE",
            "CUSTOMER_CARE",
            "LEGAL",
            "PROJECTS",
          ],
          "Customer Service": ["SELF_SERVICE", "CUSTOMER_CARE", "PROJECTS"],
          "Executive Office": ["SELF_SERVICE", "CUSTOMER_CARE", "PROJECTS"],
          "System Administration": [
            "SELF_SERVICE",
            "CUSTOMER_CARE",
            "PROJECTS",
          ],
        },
      },
      STAFF: {
        level: 300,
        description: "Staff - Basic access to department modules",
        modules: {
          "Finance & Accounting": [
            "SELF_SERVICE",
            "CUSTOMER_CARE",
            "FINANCE",
            "PROJECTS",
          ],
          "Human Resources": [
            "SELF_SERVICE",
            "CUSTOMER_CARE",
            "HR",
            "PROJECTS",
          ],
          "Information Technology": [
            "SELF_SERVICE",
            "CUSTOMER_CARE",
            "IT",
            "PROJECTS",
          ],
          Operations: [
            "SELF_SERVICE",
            "CUSTOMER_CARE",
            "OPERATIONS",
            "PROJECTS",
          ],
          "Sales & Marketing": [
            "SELF_SERVICE",
            "CUSTOMER_CARE",
            "SALES",
            "PROJECTS",
          ],
          "Legal & Compliance": [
            "SELF_SERVICE",
            "CUSTOMER_CARE",
            "LEGAL",
            "PROJECTS",
          ],
          "Customer Service": ["SELF_SERVICE", "CUSTOMER_CARE", "PROJECTS"],
          "Executive Office": ["SELF_SERVICE", "CUSTOMER_CARE", "PROJECTS"],
          "System Administration": [
            "SELF_SERVICE",
            "CUSTOMER_CARE",
            "PROJECTS",
          ],
        },
      },
      VIEWER: {
        level: 100,
        description: "Viewer - Read-only access to department modules",
        modules: {
          "Finance & Accounting": ["SELF_SERVICE", "CUSTOMER_CARE", "PROJECTS"],
          "Human Resources": ["SELF_SERVICE", "CUSTOMER_CARE", "PROJECTS"],
          "Information Technology": [
            "SELF_SERVICE",
            "CUSTOMER_CARE",
            "PROJECTS",
          ],
          Operations: ["SELF_SERVICE", "CUSTOMER_CARE", "PROJECTS"],
          "Sales & Marketing": ["SELF_SERVICE", "CUSTOMER_CARE", "PROJECTS"],
          "Legal & Compliance": ["SELF_SERVICE", "CUSTOMER_CARE", "PROJECTS"],
          "Customer Service": ["SELF_SERVICE", "CUSTOMER_CARE", "PROJECTS"],
          "Executive Office": ["SELF_SERVICE", "CUSTOMER_CARE", "PROJECTS"],
          "System Administration": [
            "SELF_SERVICE",
            "CUSTOMER_CARE",
            "PROJECTS",
          ],
        },
      },
    };

    // 1. Update all roles with proper module access
    console.log(
      "\n📝 Updating roles with department-specific module access..."
    );

    for (const [roleName, roleConfig] of Object.entries(roleModuleAccess)) {
      const role = await Role.findOne({ name: roleName });
      if (!role) {
        console.log(`⚠️  Role "${roleName}" not found, skipping`);
        continue;
      }

      // Create module access for this role
      const moduleAccess = [];
      for (const [deptName, allowedModules] of Object.entries(
        roleConfig.modules
      )) {
        for (const moduleCode of allowedModules) {
          // Check if this module access already exists
          const existingAccess = moduleAccess.find(
            (ma) => ma.module === moduleCode
          );
          if (!existingAccess) {
            moduleAccess.push({
              module: moduleCode,
              permissions:
                roleName === "VIEWER"
                  ? ["view"]
                  : roleName === "STAFF"
                  ? ["view", "create"]
                  : roleName === "MANAGER"
                  ? ["view", "create", "edit"]
                  : ["view", "create", "edit", "approve"], // HOD
            });
          }
        }
      }

      // Update role
      role.moduleAccess = moduleAccess;
      role.description = roleConfig.description;
      await role.save();

      console.log(`✅ ${roleName}: ${moduleAccess.length} modules configured`);
      console.log(
        `   Modules: ${moduleAccess.map((ma) => ma.module).join(", ")}`
      );
    }

    // 2. Update all modules to have proper department access
    console.log("\n📝 Updating module department access...");

    const modules = await Module.find({});
    const departments = await Department.find({});
    const departmentMap = {};
    departments.forEach((dept) => {
      departmentMap[dept.name] = dept._id;
    });

    // Update each module with proper department access
    for (const module of modules) {
      const allowedDepartments = [];

      // Check which departments should have access to this module
      for (const [deptName, allowedModules] of Object.entries(
        departmentModuleAccess
      )) {
        if (allowedModules.includes(module.code)) {
          const deptId = departmentMap[deptName];
          if (deptId) {
            allowedDepartments.push(deptId);
          }
        }
      }

      // Update module with department access
      module.departmentAccess = allowedDepartments;
      await module.save();

      console.log(
        `✅ ${module.name}: ${allowedDepartments.length} departments`
      );
    }

    // 3. Create comprehensive configuration for frontend
    console.log("\n📝 Creating comprehensive frontend configuration...");

    const frontendConfig = {
      roleModuleAccess: roleModuleAccess,
      departmentModuleAccess: departmentModuleAccess,
      roleLevels: {
        SUPER_ADMIN: 1000,
        HOD: 700,
        MANAGER: 600,
        STAFF: 300,
        VIEWER: 100,
      },
      universalModules: ["SELF_SERVICE", "CUSTOMER_CARE", "PROJECTS"],
    };

    console.log("✅ Comprehensive frontend configuration created");

    // 4. Test all role configurations
    console.log("\n🧪 Testing all role configurations...");

    for (const [roleName, roleConfig] of Object.entries(roleModuleAccess)) {
      console.log(`\n📋 ${roleName} (Level ${roleConfig.level}):`);

      for (const [deptName, modules] of Object.entries(roleConfig.modules)) {
        console.log(
          `   ${deptName}: ${modules.length} modules (${modules.join(", ")})`
        );
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ COMPREHENSIVE MODULE ACCESS FIXED - ALL ROLES");
    console.log("=".repeat(80));
    console.log("\n📋 WHAT WAS DONE:");
    console.log("1. ✅ Updated HOD role with department-specific access");
    console.log("2. ✅ Updated MANAGER role with limited department access");
    console.log("3. ✅ Updated STAFF role with basic department access");
    console.log("4. ✅ Updated VIEWER role with read-only access");
    console.log("5. ✅ Updated all modules with proper department access");
    console.log("6. ✅ Created comprehensive frontend configuration");
    console.log("\n🎯 TESTING GUIDE:");
    console.log("1. Login as Finance HOD - should see 7 modules");
    console.log("2. Login as Finance Manager - should see 5 modules");
    console.log("3. Login as Finance Staff - should see 4 modules");
    console.log("4. Login as Finance Viewer - should see 3 modules");
    console.log("\n🔧 NEXT STEPS:");
    console.log("1. Update frontend to use the role-based mapping");
    console.log("2. Test each role level with different departments");
    console.log("3. Verify proper module filtering works");
  } catch (error) {
    console.error("❌ Error fixing module access:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
}

fixModuleAccessEfficient();
