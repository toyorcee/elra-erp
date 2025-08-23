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

async function updateModulesDB() {
  try {
    await connectDB();

    console.log("🔧 Updating Modules in Database...");
    console.log("=".repeat(70));

    // Define the missing modules to add
    const modulesToAdd = [
      {
        name: "Self-Service",
        code: "SELF_SERVICE",
        description: "Personal self-service features for all employees",
        icon: "UserIcon",
        color: "#8B5CF6", // Purple
        permissions: ["view", "create", "edit"],
        order: 0, // First in the list
        isActive: true,
      },
      {
        name: "IT Management",
        code: "IT",
        description: "IT infrastructure and technical support management",
        icon: "Cog6ToothIcon",
        color: "#3B82F6", // Blue
        permissions: ["view", "create", "edit", "approve"],
        order: 9,
        isActive: true,
      },
      {
        name: "Operations Management",
        code: "OPERATIONS",
        description: "Business operations and process management",
        icon: "CogIcon",
        color: "#F59E0B", // Amber
        permissions: ["view", "create", "edit", "approve"],
        order: 10,
        isActive: true,
      },
      {
        name: "Sales & Marketing",
        code: "SALES",
        description: "Sales, marketing and customer acquisition",
        icon: "ChartBarIcon",
        color: "#EC4899", // Pink
        permissions: ["view", "create", "edit", "approve"],
        order: 11,
        isActive: true,
      },

      {
        name: "Legal & Compliance",
        code: "LEGAL",
        description: "Legal affairs and regulatory compliance",
        icon: "ShieldCheckIcon",
        color: "#EF4444", // Red
        permissions: ["view", "create", "edit", "approve"],
        order: 13,
        isActive: true,
      },image.png
      {
        name: "Executive Dashboard",
        code: "EXECUTIVE",
        description: "Executive leadership and strategic management",
        icon: "BuildingOfficeIcon",
        color: "#6366F1", // Indigo
        permissions: ["view", "create", "edit", "approve", "admin"],
        order: 14,
        isActive: true,
      },
      {
        name: "System Administration",
        code: "SYSTEM_ADMIN",
        description: "System administration and management",
        icon: "Cog6ToothIcon",
        color: "#6B7280", // Gray
        permissions: ["view", "create", "edit", "approve", "admin"],
        order: 15,
        isActive: true,
      },
    ];

    console.log("📦 Adding missing modules...");
    console.log("=".repeat(50));

    let addedCount = 0;
    let updatedCount = 0;

    for (const moduleData of modulesToAdd) {
      try {
        // Check if module already exists
        const existingModule = await Module.findOne({ code: moduleData.code });

        if (existingModule) {
          console.log(
            `⚠️  Module ${moduleData.name} (${moduleData.code}) already exists - skipping`
          );
          continue;
        }

        // Create new module
        const newModule = new Module(moduleData);
        await newModule.save();

        console.log(`✅ Added: ${moduleData.name} (${moduleData.code})`);
        addedCount++;
      } catch (error) {
        console.error(
          `❌ Error adding module ${moduleData.name}:`,
          error.message
        );
      }
    }

    console.log(`\n📊 Summary: Added ${addedCount} new modules`);

    // Update role module access for new modules
    console.log("\n🔗 Updating Role Module Access...");
    console.log("=".repeat(50));

    const roles = await Role.find().sort({ level: -1 });

    for (const role of roles) {
      const updates = [];

      // Add Self-Service to all roles (universal access)
      if (
        !role.moduleAccess.some((access) => access.module === "SELF_SERVICE")
      ) {
        updates.push({
          module: "SELF_SERVICE",
          permissions: ["view", "create", "edit"],
        });
      }

      // Add department-specific modules based on role level
      if (role.level >= 300) {
        // STAFF and above
        const departmentModules = [
          { module: "IT", permissions: ["view", "create", "edit"] },
          { module: "OPERATIONS", permissions: ["view", "create", "edit"] },
          { module: "SALES", permissions: ["view", "create", "edit"] },
          { module: "CUSTOMER_CARE", permissions: ["view", "create", "edit"] },
          { module: "LEGAL", permissions: ["view", "create", "edit"] },
        ];

        for (const deptModule of departmentModules) {
          if (
            !role.moduleAccess.some(
              (access) => access.module === deptModule.module
            )
          ) {
            updates.push(deptModule);
          }
        }
      }

      if (role.level >= 700) {
        // HOD and above
        const executiveModules = [
          {
            module: "EXECUTIVE",
            permissions: ["view", "create", "edit", "approve"],
          },
          {
            module: "SYSTEM_ADMIN",
            permissions: ["view", "create", "edit", "approve"],
          },
        ];

        for (const execModule of executiveModules) {
          if (
            !role.moduleAccess.some(
              (access) => access.module === execModule.module
            )
          ) {
            updates.push(execModule);
          }
        }
      }

      if (updates.length > 0) {
        role.moduleAccess.push(...updates);
        await role.save();
        console.log(
          `✅ Updated ${role.name}: Added ${updates.length} module access`
        );
      }
    }

    // Final verification
    console.log("\n🔍 Final Verification...");
    console.log("=".repeat(50));

    const finalModules = await Module.find().sort({ order: 1 });
    console.log(`📦 Total modules in database: ${finalModules.length}`);

    const finalRoles = await Role.find().sort({ level: -1 });
    console.log(`👥 Total roles in database: ${finalRoles.length}`);

    console.log("\n📋 All Modules:");
    finalModules.forEach((module, index) => {
      console.log(
        `${index + 1}. ${module.name} (${module.code}) - Order: ${module.order}`
      );
    });

    console.log("\n🔗 Role Module Access Summary:");
    finalRoles.forEach((role) => {
      console.log(`\n${role.name} (Level ${role.level}):`);
      if (role.moduleAccess && role.moduleAccess.length > 0) {
        role.moduleAccess.forEach((access) => {
          console.log(`  • ${access.module}: ${access.permissions.join(", ")}`);
        });
      } else {
        console.log(`  • No module access configured`);
      }
    });

    console.log(`\n${"=".repeat(70)}`);
    console.log("✅ Module database update completed successfully!");
    console.log(`${"=".repeat(70)}`);
  } catch (error) {
    console.error("❌ Error updating modules:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

updateModulesDB();
