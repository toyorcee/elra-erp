import mongoose from "mongoose";
import dotenv from "dotenv";
import Module from "../models/Module.js";
import Department from "../models/Department.js";

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

const departmentManagementModule = {
  name: "Department Management",
  code: "DEPARTMENT_MANAGEMENT",
  description:
    "Centralized module for HODs to manage department-specific functions including project approvals, leave approvals, team management, and department analytics.",
  icon: "BuildingOfficeIcon",
  color: "#8B5CF6", // Purple color (default, matches frontend expectations)
  isActive: true,
  permissions: [
    "view",
    "create",
    "edit",
    "delete",
    "approve",
    "export",
    "admin",
  ],
  departmentAccess: [], // Will be populated for all departments
  requiresApproval: false,
  order: 15, // After existing modules
  requiredRoleLevel: 700, // HOD level only
};

async function createDepartmentManagementModule() {
  try {
    console.log(
      "🚀 [SCRIPT] Starting Department Management Module creation..."
    );

    // Connect to MongoDB
    await connectDB();

    // Check if module already exists
    const existingModule = await Module.findOne({
      code: "DEPARTMENT_MANAGEMENT",
    });
    if (existingModule) {
      console.log(
        "⚠️ [SCRIPT] Department Management module already exists, updating..."
      );

      // Update existing module
      Object.assign(existingModule, departmentManagementModule);
      await existingModule.save();
      console.log(
        "✅ [SCRIPT] Department Management module updated successfully"
      );
    } else {
      // Create new module
      const newModule = new Module(departmentManagementModule);
      await newModule.save();
      console.log(
        "✅ [SCRIPT] Department Management module created successfully"
      );
    }

    // Get all active departments and add them to module access
    const allDepartments = await Department.find({ isActive: true });

    if (allDepartments.length > 0) {
      const module = await Module.findOne({ code: "DEPARTMENT_MANAGEMENT" });
      module.departmentAccess = allDepartments.map((dept) => dept._id);
      await module.save();

      console.log(
        `✅ [SCRIPT] Added ${allDepartments.length} departments to module access`
      );
      console.log(
        "Departments:",
        allDepartments.map((d) => d.name)
      );
    }

    console.log("🎯 [SCRIPT] Department Management Module setup completed!");
    console.log("📋 [SCRIPT] Module Details:");
    console.log(`   Name: ${departmentManagementModule.name}`);
    console.log(`   Code: ${departmentManagementModule.code}`);
    console.log(
      `   Required Role Level: ${departmentManagementModule.requiredRoleLevel} (HOD+)`
    );
    console.log(
      `   Permissions: ${departmentManagementModule.permissions.join(", ")}`
    );
    console.log(`   Icon: ${departmentManagementModule.icon}`);
    console.log(`   Color: ${departmentManagementModule.color}`);
  } catch (error) {
    console.error(
      "❌ [SCRIPT] Error creating Department Management module:",
      error
    );
  } finally {
    // Close connection
    await mongoose.disconnect();
    console.log("🔌 [SCRIPT] MongoDB connection closed");
  }
}

// Run the script
createDepartmentManagementModule();
