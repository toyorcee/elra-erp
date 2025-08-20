import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import PersonalAllowance from "../models/PersonalAllowance.js";
import PersonalBonus from "../models/PersonalBonus.js";
import Deduction from "../models/Deduction.js";
import User from "../models/User.js";
import Department from "../models/Department.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "../.env") });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const debugIndividualItems = async () => {
  try {
    await connectDB();

    console.log("🔍 DEBUGGING INDIVIDUAL SCOPE ITEMS");
    console.log("=".repeat(60));

    // Get IT Department and Employee
    const itDept = await Department.findOne({
      $or: [
        { name: { $regex: /IT|Information Technology/i } },
        { code: { $regex: /IT/i } },
      ],
    });

    if (!itDept) {
      console.log("❌ IT Department not found");
      return;
    }

    const itEmployee = await User.findOne({
      department: itDept._id,
      isActive: true,
    }).populate("department", "name");

    if (!itEmployee) {
      console.log("❌ IT Employee not found");
      return;
    }

    console.log(`\n👤 IT Employee: ${itEmployee.firstName} ${itEmployee.lastName}`);
    console.log(`Employee ID: ${itEmployee.employeeId}`);
    console.log(`Employee ObjectId: ${itEmployee._id}`);
    console.log(`Department: ${itEmployee.department.name}`);

    // Check IT Performance Bonus (Allowance)
    console.log("\n🔍 IT Performance Bonus (Allowance):");
    const itPerformanceBonus = await PersonalAllowance.findOne({
      name: { $regex: /IT Performance Bonus/i },
    }).populate("employees", "firstName lastName employeeId");

    if (itPerformanceBonus) {
      console.log(`Name: ${itPerformanceBonus.name}`);
      console.log(`Scope: ${itPerformanceBonus.scope}`);
      console.log(`Frequency: ${itPerformanceBonus.frequency}`);
      console.log(`Is Used: ${itPerformanceBonus.isUsed}`);
      console.log(`Employees assigned: ${itPerformanceBonus.employees?.length || 0}`);
      
      if (itPerformanceBonus.employees && itPerformanceBonus.employees.length > 0) {
        console.log("Assigned employees:");
        itPerformanceBonus.employees.forEach((emp, index) => {
          console.log(`  ${index + 1}. ${emp.firstName} ${emp.lastName} (${emp.employeeId}) - ${emp._id}`);
        });
      }

      const isEmployeeAssigned = itPerformanceBonus.employees?.some(
        (emp) => emp._id.toString() === itEmployee._id.toString()
      );
      console.log(`Is IT employee assigned? ${isEmployeeAssigned ? "✅ YES" : "❌ NO"}`);
    } else {
      console.log("❌ IT Performance Bonus not found");
    }

    // Check Senior Staff Welfare Fund (Deduction)
    console.log("\n🔍 Senior Staff Welfare Fund (Deduction):");
    const seniorStaffFund = await Deduction.findOne({
      name: { $regex: /Senior Staff Welfare Fund/i },
    }).populate("employees", "firstName lastName employeeId");

    if (seniorStaffFund) {
      console.log(`Name: ${seniorStaffFund.name}`);
      console.log(`Scope: ${seniorStaffFund.scope}`);
      console.log(`Frequency: ${seniorStaffFund.frequency}`);
      console.log(`Is Used: ${seniorStaffFund.isUsed}`);
      console.log(`Employees assigned: ${seniorStaffFund.employees?.length || 0}`);
      
      if (seniorStaffFund.employees && seniorStaffFund.employees.length > 0) {
        console.log("Assigned employees:");
        seniorStaffFund.employees.forEach((emp, index) => {
          console.log(`  ${index + 1}. ${emp.firstName} ${emp.lastName} (${emp.employeeId}) - ${emp._id}`);
        });
      }

      const isEmployeeAssigned = seniorStaffFund.employees?.some(
        (emp) => emp._id.toString() === itEmployee._id.toString()
      );
      console.log(`Is IT employee assigned? ${isEmployeeAssigned ? "✅ YES" : "❌ NO"}`);
    } else {
      console.log("❌ Senior Staff Welfare Fund not found");
    }

    // Check PAYE Tax Deduction
    console.log("\n🔍 PAYE Tax Deduction:");
    const payeDeduction = await Deduction.findOne({
      name: { $regex: /PAYE Tax Deduction/i },
    });

    if (payeDeduction) {
      console.log(`Name: ${payeDeduction.name}`);
      console.log(`Scope: ${payeDeduction.scope}`);
      console.log(`Amount: ${payeDeduction.amount}`);
      console.log(`Calculation Type: ${payeDeduction.calculationType}`);
      console.log(`Type: ${payeDeduction.type}`);
    } else {
      console.log("❌ PAYE Tax Deduction not found");
    }

    console.log("\n🎯 CONCLUSION:");
    console.log("The issue is likely that individual scope items need to be explicitly assigned to employees.");
    console.log("If they're not assigned to the specific IT employee, they won't be applied.");

  } catch (error) {
    console.error("❌ Error in debug:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Database connection closed");
  }
};

debugIndividualItems();

