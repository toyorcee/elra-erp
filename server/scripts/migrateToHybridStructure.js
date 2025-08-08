import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

// Import models
import Department from "../models/Department.js";
import Role from "../models/Role.js";
import User from "../models/User.js";
import Module from "../models/Module.js";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// New organizational departments
const newDepartments = [
  {
    name: "Executive Office",
    code: "EXEC",
    description: "Executive leadership and strategic management",
    level: 100,
    isActive: true,
  },
  {
    name: "Human Resources",
    code: "HR",
    description: "Human resources and employee management",
    level: 90,
    isActive: true,
  },
  {
    name: "Information Technology",
    code: "IT",
    description: "IT infrastructure and technical support",
    level: 85,
    isActive: true,
  },
  {
    name: "Finance & Accounting",
    code: "FIN",
    description: "Financial management and accounting",
    level: 80,
    isActive: true,
  },
  {
    name: "Operations",
    code: "OPS",
    description: "Business operations and process management",
    level: 75,
    isActive: true,
  },
  {
    name: "Sales & Marketing",
    code: "SALES",
    description: "Sales, marketing and customer acquisition",
    level: 70,
    isActive: true,
  },
  {
    name: "Customer Service",
    code: "CS",
    description: "Customer support and service delivery",
    level: 65,
    isActive: true,
  },
  {
    name: "Legal & Compliance",
    code: "LEGAL",
    description: "Legal affairs and regulatory compliance",
    level: 60,
    isActive: true,
  },
];

// New functional modules
const newModules = [
  {
    name: "Payroll Management",
    code: "PAYROLL",
    description: "Employee payroll processing and management",
    icon: "CurrencyDollarIcon",
    color: "#10B981", // Green
    order: 1,
    permissions: ["view", "create", "edit", "approve"],
    requiresApproval: true,
  },
  {
    name: "Procurement",
    code: "PROCUREMENT",
    description: "Purchase requisitions and vendor management",
    icon: "ShoppingCartIcon",
    color: "#F59E0B", // Amber
    order: 2,
    permissions: ["view", "create", "edit", "approve"],
    requiresApproval: true,
  },
  {
    name: "Communication",
    code: "COMMUNICATION",
    description: "Internal communication and messaging",
    icon: "ChatBubbleLeftRightIcon",
    color: "#3B82F6", // Blue
    order: 3,
    permissions: ["view", "create", "edit"],
    requiresApproval: false,
  },
  {
    name: "Document Management",
    code: "DOCUMENTS",
    description: "Document storage, sharing and workflow",
    icon: "DocumentIcon",
    color: "#8B5CF6", // Purple
    order: 4,
    permissions: ["view", "create", "edit", "delete", "approve"],
    requiresApproval: true,
  },
  {
    name: "Project Management",
    code: "PROJECTS",
    description: "Project planning and task management",
    icon: "ClipboardDocumentListIcon",
    color: "#EC4899", // Pink
    order: 5,
    permissions: ["view", "create", "edit", "approve"],
    requiresApproval: false,
  },
  {
    name: "Inventory Management",
    code: "INVENTORY",
    description: "Stock management and asset tracking",
    icon: "CubeIcon",
    color: "#06B6D4", // Cyan
    order: 6,
    permissions: ["view", "create", "edit", "approve"],
    requiresApproval: true,
  },
  {
    name: "HR Management",
    code: "HR",
    description: "Employee records and HR processes",
    icon: "UsersIcon",
    color: "#8B5CF6", // Purple
    order: 7,
    permissions: ["view", "create", "edit", "approve"],
    requiresApproval: true,
  },
  {
    name: "Financial Management",
    code: "FINANCE",
    description: "Financial reporting and analysis",
    icon: "ChartBarIcon",
    color: "#10B981", // Green
    order: 8,
    permissions: ["view", "create", "edit", "approve"],
    requiresApproval: true,
  },
];

// Department to Module mapping
const departmentModuleMapping = {
  "Executive Office": ["DOCUMENTS", "PROJECTS", "FINANCE"],
  "Human Resources": ["HR", "PAYROLL", "COMMUNICATION"],
  "Information Technology": ["DOCUMENTS", "PROJECTS", "COMMUNICATION"],
  "Finance & Accounting": ["FINANCE", "PAYROLL", "PROCUREMENT"],
  Operations: ["PROCUREMENT", "INVENTORY", "PROJECTS"],
  "Sales & Marketing": ["COMMUNICATION", "PROJECTS", "DOCUMENTS"],
  "Customer Service": ["COMMUNICATION", "DOCUMENTS"],
  "Legal & Compliance": ["DOCUMENTS", "COMMUNICATION"],
};

async function migrateToHybridStructure() {
  try {
    console.log("🚀 Starting Hybrid Structure Migration");
    console.log("=".repeat(50));

    // Step 1: Create new modules
    console.log("\n📦 Step 1: Creating new modules...");
    const createdModules = [];
    for (const moduleData of newModules) {
      const existingModule = await Module.findOne({ code: moduleData.code });
      if (existingModule) {
        console.log(
          `  ⚠️  Module ${moduleData.name} already exists, updating...`
        );
        Object.assign(existingModule, moduleData);
        await existingModule.save();
        createdModules.push(existingModule);
      } else {
        console.log(`  ✅ Creating module: ${moduleData.name}`);
        const newModule = new Module(moduleData);
        await newModule.save();
        createdModules.push(newModule);
      }
    }

    // Step 2: Create new departments
    console.log("\n🏢 Step 2: Creating new departments...");
    const createdDepartments = [];
    for (const deptData of newDepartments) {
      const existingDept = await Department.findOne({ code: deptData.code });
      if (existingDept) {
        console.log(
          `  ⚠️  Department ${deptData.name} already exists, updating...`
        );
        Object.assign(existingDept, deptData);
        await existingDept.save();
        createdDepartments.push(existingDept);
      } else {
        console.log(`  ✅ Creating department: ${deptData.name}`);
        const newDept = new Department(deptData);
        await newDept.save();
        createdDepartments.push(newDept);
      }
    }

    // Step 3: Update modules with department access
    console.log("\n🔗 Step 3: Linking modules to departments...");
    for (const [deptName, moduleCodes] of Object.entries(
      departmentModuleMapping
    )) {
      const department = createdDepartments.find((d) => d.name === deptName);
      if (department) {
        for (const moduleCode of moduleCodes) {
          const module = createdModules.find((m) => m.code === moduleCode);
          if (module && !module.departmentAccess.includes(department._id)) {
            module.departmentAccess.push(department._id);
            await module.save();
            console.log(`  ✅ Linked ${module.name} to ${department.name}`);
          }
        }
      }
    }

    // Step 4: Update roles with new module access
    console.log("\n👥 Step 4: Updating roles with module access...");
    const roles = await Role.find({ isActive: true });

    for (const role of roles) {
      // Clear old module access
      role.moduleAccess = [];

      // Add new module access based on role level
      if (role.level >= 100) {
        // Company Admin - access to all modules
        role.moduleAccess = createdModules.map((module) => ({
          module: module.code,
          permissions: module.permissions,
        }));
      } else if (role.level >= 90) {
        // Department Head - access to department-specific modules
        role.moduleAccess = createdModules.slice(0, 6).map((module) => ({
          module: module.code,
          permissions: module.permissions.filter((p) => p !== "admin"),
        }));
      } else if (role.level >= 80) {
        // Manager - limited access
        role.moduleAccess = createdModules.slice(0, 4).map((module) => ({
          module: module.code,
          permissions: ["view", "create", "edit"],
        }));
      } else if (role.level >= 70) {
        // Staff - basic access
        role.moduleAccess = createdModules.slice(0, 3).map((module) => ({
          module: module.code,
          permissions: ["view", "create"],
        }));
      } else {
        // Junior Staff - minimal access
        role.moduleAccess = createdModules.slice(0, 2).map((module) => ({
          module: module.code,
          permissions: ["view"],
        }));
      }

      await role.save();
      console.log(
        `  ✅ Updated role ${role.name} with ${role.moduleAccess.length} modules`
      );
    }

    // Step 5: Update existing users
    console.log("\n👤 Step 5: Updating existing users...");
    const users = await User.find({ isActive: true });
    let updatedUsers = 0;

    for (const user of users) {
      // Assign to Executive Office if no department
      if (!user.department) {
        const execDept = createdDepartments.find(
          (d) => d.name === "Executive Office"
        );
        if (execDept) {
          user.department = execDept._id;
          updatedUsers++;
        }
      }
    }

    console.log(`  ✅ Updated ${updatedUsers} users`);

    console.log("\n✅ Migration completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`  • Created/Updated ${createdModules.length} modules`);
    console.log(`  • Created/Updated ${createdDepartments.length} departments`);
    console.log(`  • Updated ${roles.length} roles`);
    console.log(`  • Updated ${updatedUsers} users`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration
connectDB()
  .then(() => migrateToHybridStructure())
  .then(() => {
    console.log("\n🎉 Migration completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  });
