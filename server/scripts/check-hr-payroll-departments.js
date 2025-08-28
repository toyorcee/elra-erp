import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "../.env") });

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Import models
const Module = mongoose.model(
  "Module",
  new mongoose.Schema({}, { strict: false })
);
const Department = mongoose.model(
  "Department",
  new mongoose.Schema({}, { strict: false })
);

const checkHRPayrollDepartments = async () => {
  try {
    console.log("🔍 Checking HR and PAYROLL module department access...");

    // Find HR and PAYROLL modules
    const hrModule = await Module.findOne({ code: "HR" });
    const payrollModule = await Module.findOne({ code: "PAYROLL" });

    console.log("\n📋 HR Module:");
    if (hrModule) {
      console.log(`   Name: ${hrModule.name}`);
      console.log(`   Code: ${hrModule.code}`);
      console.log(`   Active: ${hrModule.isActive}`);
      console.log(
        `   Department Access Count: ${hrModule.departmentAccess.length}`
      );

      if (hrModule.departmentAccess.length > 0) {
        console.log("   Departments with access:");
        for (const deptId of hrModule.departmentAccess) {
          const dept = await Department.findById(deptId);
          console.log(`     • ${dept?.name || "Unknown"} (${deptId})`);
        }
      } else {
        console.log(
          "   • No department restrictions (all departments have access)"
        );
      }
    } else {
      console.log("   ❌ HR module not found");
    }

    console.log("\n📋 PAYROLL Module:");
    if (payrollModule) {
      console.log(`   Name: ${payrollModule.name}`);
      console.log(`   Code: ${payrollModule.code}`);
      console.log(`   Active: ${payrollModule.isActive}`);
      console.log(
        `   Department Access Count: ${payrollModule.departmentAccess.length}`
      );

      if (payrollModule.departmentAccess.length > 0) {
        console.log("   Departments with access:");
        for (const deptId of payrollModule.departmentAccess) {
          const dept = await Department.findById(deptId);
          console.log(`     • ${dept?.name || "Unknown"} (${deptId})`);
        }
      } else {
        console.log(
          "   • No department restrictions (all departments have access)"
        );
      }
    } else {
      console.log("   ❌ PAYROLL module not found");
    }

    // Check HR department
    const hrDepartment = await Department.findOne({ code: "HR" });
    console.log("\n📋 HR Department:");
    if (hrDepartment) {
      console.log(`   Name: ${hrDepartment.name}`);
      console.log(`   Code: ${hrDepartment.code}`);
      console.log(`   ID: ${hrDepartment._id}`);
    } else {
      console.log("   ❌ HR department not found");
    }
  } catch (error) {
    console.error("❌ Error checking HR/PAYROLL departments:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run the script
checkHRPayrollDepartments();

