import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import models
import Role from "../models/Role.js";
import Module from "../models/Module.js";

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

async function checkERPModules() {
  try {
    await connectDB();

    console.log("🔍 Checking ERP Modules and Roles in Database...");
    console.log("=".repeat(70));

    // Get all roles
    const roles = await Role.find().sort({ level: -1 });
    console.log(`📋 Found ${roles.length} roles\n`);

    // Get all modules
    const modules = await Module.find().sort({ order: 1 });
    console.log(`📦 Found ${modules.length} modules\n`);

    console.log("🏢 CURRENT ROLES:");
    console.log("=".repeat(50));
    roles.forEach((role) => {
      console.log(
        `• ${role.name} (Level: ${role.level}) - ${role.description}`
      );
    });

    console.log("\n📦 CURRENT MODULES:");
    console.log("=".repeat(50));
    modules.forEach((module) => {
      console.log(`• ${module.name} (${module.code}) - ${module.description}`);
    });

    console.log("\n🔗 ROLE MODULE ACCESS:");
    console.log("=".repeat(50));
    roles.forEach((role) => {
      console.log(`\n${role.name}:`);
      if (role.moduleAccess && role.moduleAccess.length > 0) {
        role.moduleAccess.forEach((access) => {
          console.log(`  • ${access.module}: ${access.permissions.join(", ")}`);
        });
      } else {
        console.log(`  • No module access configured`);
      }
    });

    // Check alignment with Master Plan
    console.log("\n📋 MASTER PLAN ALIGNMENT:");
    console.log("=".repeat(50));

    const masterPlanRoles = {
      SUPER_ADMIN: 1000,
      HOD: 700,
      MANAGER: 600,
      STAFF: 300,
      VIEWER: 100,
    };

    const masterPlanModules = [
      "HR",
      "PAYROLL",
      "PROCUREMENT",
      "ACCOUNTS",
      "COMMUNICATION",
      "CUSTOMER_CARE",
    ];

    console.log("\n🎯 Role Alignment:");
    Object.entries(masterPlanRoles).forEach(([roleName, level]) => {
      const existingRole = roles.find((r) => r.name === roleName);
      if (existingRole) {
        console.log(
          `✅ ${roleName}: ${existingRole.level} (Expected: ${level})`
        );
      } else {
        console.log(`❌ ${roleName}: Missing (Expected: ${level})`);
      }
    });

    console.log("\n🎯 Module Alignment:");
    masterPlanModules.forEach((moduleName) => {
      const existingModule = modules.find((m) => m.code === moduleName);
      if (existingModule) {
        console.log(`✅ ${moduleName}: ${existingModule.name}`);
      } else {
        console.log(`❌ ${moduleName}: Missing`);
      }
    });

    console.log(`\n${"=".repeat(70)}`);
  } catch (error) {
    console.error("❌ Error checking ERP modules:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

checkERPModules();
