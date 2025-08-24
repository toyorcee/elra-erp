import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
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

async function checkCurrentState() {
  try {
    await connectDB();

    console.log("🔍 COMPREHENSIVE DATABASE STATE ANALYSIS");
    console.log("=".repeat(80));

    // 1. Check all departments
    console.log("\n📋 DEPARTMENTS IN DATABASE:");
    console.log("-".repeat(50));
    const departments = await Department.find().sort({ name: 1 });
    departments.forEach((dept, index) => {
      console.log(`${index + 1}. ${dept.name} (ID: ${dept._id})`);
    });

    // 2. Check all roles
    console.log("\n👥 ROLES IN DATABASE:");
    console.log("-".repeat(50));
    const roles = await Role.find().sort({ level: -1 });
    roles.forEach((role, index) => {
      console.log(
        `${index + 1}. ${role.name} (Level: ${role.level}) - ${
          role.description
        }`
      );
    });

    // 3. Check all modules
    console.log("\n📦 MODULES IN DATABASE:");
    console.log("-".repeat(50));
    const modules = await Module.find().sort({ order: 1 });
    modules.forEach((module, index) => {
      console.log(`${index + 1}. ${module.name} (${module.code})`);
      console.log(`   Description: ${module.description}`);
      console.log(`   Active: ${module.isActive}`);
      console.log(`   Required Role Level: ${module.requiredRoleLevel}`);
      console.log(
        `   Department Access: ${module.departmentAccess.length} departments`
      );
    });

    // 4. Check Finance HOD specifically
    console.log("\n💰 FINANCE HOD ANALYSIS:");
    console.log("-".repeat(50));

    // Find Finance HOD users
    const financeHODs = await User.find({
      "role.name": "HOD",
      "department.name": { $regex: /finance/i },
    })
      .populate("role")
      .populate("department");

    if (financeHODs.length === 0) {
      console.log("❌ No Finance HOD found in database");

      // Let's check what HODs exist
      const allHODs = await User.find({
        "role.name": "HOD",
      })
        .populate("role")
        .populate("department");

      console.log("\n🔍 ALL HODs IN DATABASE:");
      allHODs.forEach((hod, index) => {
        console.log(`${index + 1}. ${hod.firstName} ${hod.lastName}`);
        console.log(`   Role: ${hod.role?.name} (Level: ${hod.role?.level})`);
        console.log(
          `   Department: ${hod.department?.name || "No Department"}`
        );
        console.log(`   Email: ${hod.email}`);
      });
    } else {
      financeHODs.forEach((hod, index) => {
        console.log(
          `\n${index + 1}. Finance HOD: ${hod.firstName} ${hod.lastName}`
        );
        console.log(`   Email: ${hod.email}`);
        console.log(`   Role: ${hod.role?.name} (Level: ${hod.role?.level})`);
        console.log(
          `   Department: ${hod.department?.name} (ID: ${hod.department?._id})`
        );
        console.log(
          `   Module Access: ${hod.moduleAccess?.length || 0} modules`
        );

        if (hod.moduleAccess && hod.moduleAccess.length > 0) {
          console.log("   Available Modules:");
          hod.moduleAccess.forEach((access, idx) => {
            console.log(
              `     ${idx + 1}. ${access.module} - Permissions: ${
                access.permissions?.join(", ") || "None"
              }`
            );
          });
        }
      });
    }

    // 5. Check role-module access mapping
    console.log("\n🔗 ROLE-MODULE ACCESS MAPPING:");
    console.log("-".repeat(50));
    roles.forEach((role) => {
      console.log(`\n${role.name} (Level: ${role.level}):`);
      if (role.moduleAccess && role.moduleAccess.length > 0) {
        role.moduleAccess.forEach((access, idx) => {
          console.log(
            `  ${idx + 1}. ${access.module} - ${
              access.permissions?.join(", ") || "No permissions"
            }`
          );
        });
      } else {
        console.log(`  • No module access configured`);
      }
    });

    // 6. Check department-module relationships
    console.log("\n🏢 DEPARTMENT-MODULE RELATIONSHIPS:");
    console.log("-".repeat(50));
    modules.forEach((module) => {
      console.log(`\n${module.name} (${module.code}):`);
      if (module.departmentAccess && module.departmentAccess.length > 0) {
        console.log(
          `  Department Access: ${module.departmentAccess.length} departments`
        );
        // We could populate this to see actual department names
      } else {
        console.log(`  • No department restrictions (accessible by all)`);
      }
    });

    // 7. Check for any Finance department users
    console.log("\n💼 FINANCE DEPARTMENT USERS:");
    console.log("-".repeat(50));
    const financeUsers = await User.find({
      "department.name": { $regex: /finance/i },
    })
      .populate("role")
      .populate("department");

    if (financeUsers.length === 0) {
      console.log("❌ No users found in Finance department");
    } else {
      financeUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   Role: ${user.role?.name} (Level: ${user.role?.level})`);
        console.log(`   Department: ${user.department?.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(
          `   Module Access: ${user.moduleAccess?.length || 0} modules`
        );
      });
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ ANALYSIS COMPLETE");
    console.log("=".repeat(80));
  } catch (error) {
    console.error("❌ Error during analysis:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
}

checkCurrentState();
