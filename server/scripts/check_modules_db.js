import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import models
import Module from "../models/Module.js";
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

async function checkModulesDB() {
  try {
    await connectDB();

    console.log("🔍 Checking Current Modules in Database...");
    console.log("=".repeat(70));

    // Get all modules
    const modules = await Module.find().sort({ order: 1 });
    console.log(`📦 Found ${modules.length} modules\n`);

    console.log("📋 CURRENT MODULES:");
    console.log("=".repeat(50));
    modules.forEach((module, index) => {
      console.log(`${index + 1}. ${module.name} (${module.code})`);
      console.log(`   Description: ${module.description}`);
      console.log(`   Icon: ${module.icon}`);
      console.log(`   Color: ${module.color}`);
      console.log(`   Active: ${module.isActive}`);
      console.log(`   Order: ${module.order}`);
      console.log(`   Permissions: ${module.permissions.join(", ")}`);
      console.log(
        `   Department Access: ${module.departmentAccess.length} departments`
      );
      console.log("");
    });

    // Get all roles and their module access
    const roles = await Role.find().sort({ level: -1 });
    console.log("🔗 ROLE MODULE ACCESS:");
    console.log("=".repeat(50));
    roles.forEach((role) => {
      console.log(`\n${role.name} (Level: ${role.level}):`);
      if (role.moduleAccess && role.moduleAccess.length > 0) {
        role.moduleAccess.forEach((access) => {
          console.log(`  • ${access.module}: ${access.permissions.join(", ")}`);
        });
      } else {
        console.log(`  • No module access configured`);
      }
    });

    // Check what needs to be updated
    console.log("\n🎯 MODULE UPDATE ANALYSIS:");
    console.log("=".repeat(50));

    const currentModuleCodes = modules.map((m) => m.code);
    const currentModuleNames = modules.map((m) => m.name);

    console.log("Current Module Codes:", currentModuleCodes);
    console.log("Current Module Names:", currentModuleNames);

    // Define what we need
    const requiredModules = [
      {
        name: "Self-Service",
        code: "SELF_SERVICE",
        description: "Personal self-service features",
      },
      {
        name: "HR Management",
        code: "HR",
        description: "Human resources management",
      },
      {
        name: "Finance Management",
        code: "FINANCE",
        description: "Financial management and accounting",
      },
      {
        name: "IT Management",
        code: "IT",
        description: "IT infrastructure and technical support",
      },
      {
        name: "Operations Management",
        code: "OPERATIONS",
        description: "Business operations and process management",
      },
      {
        name: "Sales & Marketing",
        code: "SALES",
        description: "Sales, marketing and customer acquisition",
      },
      {
        name: "Customer Service",
        code: "CUSTOMER_SERVICE",
        description: "Customer support and service delivery",
      },
      {
        name: "Legal & Compliance",
        code: "LEGAL",
        description: "Legal affairs and regulatory compliance",
      },
      {
        name: "Executive Dashboard",
        code: "EXECUTIVE",
        description: "Executive leadership and strategic management",
      },
      {
        name: "System Administration",
        code: "SYSTEM_ADMIN",
        description: "System administration and management",
      },
      {
        name: "Payroll Management",
        code: "PAYROLL",
        description: "Payroll processing and salary management",
      },
    ];

    console.log("\n📋 REQUIRED MODULES:");
    console.log("=".repeat(50));
    requiredModules.forEach((module, index) => {
      const exists = currentModuleCodes.includes(module.code);
      console.log(
        `${index + 1}. ${module.name} (${module.code}) - ${
          exists ? "✅ EXISTS" : "❌ MISSING"
        }`
      );
    });

    // Identify missing modules
    const missingModules = requiredModules.filter(
      (module) => !currentModuleCodes.includes(module.code)
    );
    const modulesToRemove = currentModuleCodes.filter(
      (code) =>
        !requiredModules.some((module) => module.code === code) &&
        code !== "COMMUNICATION" // Keep communication for now
    );

    console.log("\n❌ MISSING MODULES:");
    console.log("=".repeat(50));
    if (missingModules.length === 0) {
      console.log("✅ All required modules exist!");
    } else {
      missingModules.forEach((module) => {
        console.log(`• ${module.name} (${module.code})`);
      });
    }

    console.log("\n🗑️ MODULES TO REMOVE:");
    console.log("=".repeat(50));
    if (modulesToRemove.length === 0) {
      console.log("✅ No modules to remove!");
    } else {
      modulesToRemove.forEach((code) => {
        console.log(`• ${code}`);
      });
    }

    console.log(`\n${"=".repeat(70)}`);
  } catch (error) {
    console.error("❌ Error checking modules:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

checkModulesDB();
