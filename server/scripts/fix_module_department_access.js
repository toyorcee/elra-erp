import mongoose from "mongoose";
import dotenv from "dotenv";
import Module from "../models/Module.js";
import Department from "../models/Department.js";

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

async function fixModuleDepartmentAccess() {
  try {
    await connectDB();

    console.log(
      "🔧 Fixing Module Department Access for Centralized Responsibility..."
    );
    console.log("=".repeat(80));

    // Get all departments
    const departments = await Department.find({ isActive: true });
    const operationsDept = departments.find((d) => d.name === "Operations");
    const procurementDept = departments.find((d) => d.name === "Procurement");
    const financeDept = departments.find(
      (d) => d.name === "Finance & Accounting"
    );

    console.log("🏢 Found Departments:");
    console.log(
      `- Operations: ${operationsDept ? operationsDept.name : "NOT FOUND"}`
    );
    console.log(
      `- Procurement: ${procurementDept ? procurementDept.name : "NOT FOUND"}`
    );
    console.log(`- Finance: ${financeDept ? financeDept.name : "NOT FOUND"}`);

    // Define centralized module assignments
    const centralizedModules = {
      INVENTORY: {
        soleDepartment: operationsDept,
        description: "Inventory Management - Operations Department Only",
      },
      PROCUREMENT: {
        soleDepartment: procurementDept,
        description: "Procurement Management - Procurement Department Only",
      },
      FINANCE: {
        soleDepartment: financeDept,
        description: "Financial Management - Finance Department Only",
      },
    };

    // Fix each module
    for (const [moduleCode, config] of Object.entries(centralizedModules)) {
      console.log(`\n🔧 Fixing ${moduleCode}...`);

      const module = await Module.findOne({ code: moduleCode });
      if (!module) {
        console.log(`❌ Module ${moduleCode} not found`);
        continue;
      }

      console.log(
        `📦 Current ${moduleCode} department access: ${module.departmentAccess.length} departments`
      );

      if (!config.soleDepartment) {
        console.log(`❌ Sole department for ${moduleCode} not found`);
        continue;
      }

      // Clear all department access and assign to sole department
      module.departmentAccess = [config.soleDepartment._id];

      await module.save();

      console.log(
        `✅ ${moduleCode} now assigned to: ${config.soleDepartment.name}`
      );
      console.log(`📋 ${config.description}`);
    }

    // Verify the changes
    console.log("\n" + "=".repeat(80));
    console.log("🔍 VERIFICATION - Updated Module Department Access:");
    console.log("=".repeat(80));

    for (const moduleCode of Object.keys(centralizedModules)) {
      const module = await Module.findOne({ code: moduleCode }).populate(
        "departmentAccess"
      );
      if (module) {
        console.log(`\n📦 ${moduleCode}:`);
        console.log(
          `   Departments: ${module.departmentAccess
            .map((d) => d.name)
            .join(", ")}`
        );
        console.log(`   Count: ${module.departmentAccess.length}`);
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ MODULE DEPARTMENT ACCESS FIXED!");
    console.log("=".repeat(80));
    console.log("📋 Summary of Changes:");
    console.log("• INVENTORY: Now managed solely by Operations Department");
    console.log("• PROCUREMENT: Now managed solely by Procurement Department");
    console.log(
      "• FINANCE: Already properly centralized with Finance Department"
    );
    console.log("\n🎯 Benefits:");
    console.log("• No more confusion about who handles what");
    console.log("• Clear single responsibility for each module");
    console.log("• Streamlined workflow and decision-making");

    await mongoose.disconnect();
    console.log("\n🔌 Database connection closed");
  } catch (error) {
    console.error("❌ Error fixing module department access:", error);
    await mongoose.disconnect();
  }
}

fixModuleDepartmentAccess();
