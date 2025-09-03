import mongoose from "mongoose";
import dotenv from "dotenv";
import Department from "../models/Department.js";
import User from "../models/User.js";
import Module from "../models/Module.js";

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

async function checkDepartments() {
  try {
    await connectDB();

    console.log("🔍 DEPARTMENT ANALYSIS - CURRENT STATE");
    console.log("=".repeat(80));

    // 1. Check all departments in Department collection
    console.log("\n📋 DEPARTMENTS IN DATABASE (Department Collection):");
    console.log("-".repeat(60));
    const departments = await Department.find().sort({ name: 1 });

    if (departments.length === 0) {
      console.log("❌ No departments found in Department collection");
    } else {
      departments.forEach((dept, index) => {
        console.log(`${index + 1}. ${dept.name} (ID: ${dept._id})`);
        console.log(`   Code: ${dept.code || "N/A"}`);
        console.log(`   Level: ${dept.level || "N/A"}`);
        console.log(`   Active: ${dept.isActive}`);
        console.log(`   Description: ${dept.description || "N/A"}`);
        if (dept.settings) {
          console.log(`   Settings:`);
          console.log(
            `     - Allow Project Creation: ${dept.settings.allowProjectCreation}`
          );
          console.log(
            `     - Require Approval: ${dept.settings.requireApproval}`
          );
          console.log(
            `     - Auto Assign Roles: ${dept.settings.autoAssignRoles}`
          );
        }
        console.log("");
      });
    }

    // 2. Check what departments users are actually assigned to
    console.log("\n👥 DEPARTMENTS FROM USER ASSIGNMENTS:");
    console.log("-".repeat(60));
    const userDepartments = await User.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    if (userDepartments.length === 0) {
      console.log("❌ No users found with department assignments");
    } else {
      userDepartments.forEach((dept, index) => {
        if (dept._id) {
          console.log(
            `${index + 1}. ${dept._id.name || dept._id} (${dept.count} users)`
          );
        } else {
          console.log(`${index + 1}. No Department (${dept.count} users)`);
        }
      });
    }

    // 3. Check all available modules
    console.log("\n📦 AVAILABLE MODULES IN DATABASE:");
    console.log("-".repeat(60));
    const modules = await Module.find().sort({ order: 1 });

    if (modules.length === 0) {
      console.log("❌ No modules found in Module collection");
    } else {
      modules.forEach((module, index) => {
        console.log(`${index + 1}. ${module.name} (${module.code})`);
        console.log(`   Description: ${module.description || "N/A"}`);
        console.log(`   Active: ${module.isActive}`);
        console.log(
          `   Required Role Level: ${module.requiredRoleLevel || "N/A"}`
        );
        console.log(
          `   Department Access: ${
            module.departmentAccess?.length || 0
          } departments`
        );
        console.log("");
      });
    }

    // 4. Check the departmentModuleConfig from User model (hardcoded config)
    console.log("\n⚙️ HARDCODED DEPARTMENT MODULE CONFIG (from User model):");
    console.log("-".repeat(60));

    // This is the hardcoded config that's currently in the User model
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
          MANAGER: ["view", "create", "edit", "approve"],
          STAFF: ["view", "create", "edit"],
          VIEWER: ["view"],
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
          MANAGER: ["view", "create", "edit", "approve"],
          STAFF: ["view", "create", "edit"],
          VIEWER: ["view"],
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
          MANAGER: ["view", "create", "edit", "approve"],
          STAFF: ["view", "create", "edit"],
          VIEWER: ["view"],
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
          MANAGER: ["view", "create", "edit", "approve"],
          STAFF: ["view", "create", "edit"],
          VIEWER: ["view"],
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
          MANAGER: ["view", "create", "edit", "approve"],
          STAFF: ["view", "create", "edit"],
          VIEWER: ["view"],
        },
      },
      "Project Management": {
        modules: ["SELF_SERVICE", "CUSTOMER_CARE", "PROJECTS", "COMMUNICATION"],
        permissions: {
          HOD: ["view", "create", "edit", "delete", "approve"],
          MANAGER: ["view", "create", "edit", "approve"],
          STAFF: ["view", "create"],
          VIEWER: ["view", "create"],
        },
      },
    };

    Object.entries(departmentModuleConfig).forEach(
      ([deptName, config], index) => {
        console.log(`${index + 1}. ${deptName}`);
        console.log(`   Modules: ${config.modules.join(", ")}`);
        console.log(`   Permissions:`);
        Object.entries(config.permissions).forEach(([role, perms]) => {
          console.log(`     ${role}: ${perms.join(", ")}`);
        });
        console.log("");
      }
    );

    // 5. Summary and recommendations
    console.log("\n💡 ANALYSIS & RECOMMENDATIONS:");
    console.log("-".repeat(60));

    if (departments.length === 0) {
      console.log("⚠️  No departments exist in Department collection");
      console.log("✅ Recommendation: Create departments through the UI");
    } else {
      console.log(`✅ Found ${departments.length} departments in database`);
    }

    console.log(`✅ Found ${modules.length} modules available`);
    console.log(
      `✅ Hardcoded config covers ${
        Object.keys(departmentModuleConfig).length
      } departments`
    );

    console.log("\n🎯 NEXT STEPS:");
    console.log("1. Check if Project Management department exists");
    console.log("2. Verify module access is working correctly");
    console.log("3. Test department creation through UI");

    await mongoose.connection.close();
    console.log("\n🟢 Database connection closed");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkDepartments();
