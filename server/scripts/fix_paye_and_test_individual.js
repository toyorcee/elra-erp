 import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import PayrollService from "../services/payrollService.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import Role from "../models/Role.js";
import PersonalAllowance from "../models/PersonalAllowance.js";
import PersonalBonus from "../models/PersonalBonus.js";
import Deduction from "../models/Deduction.js";

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

const fixPayeAndTestIndividual = async () => {
  try {
    await connectDB();

    console.log("🔧 FIXING PAYE AND TESTING INDIVIDUAL SCOPE");
    console.log("=".repeat(60));

    // STEP 1: Fix PAYE Tax Deduction
    console.log("\n🔧 STEP 1: FIXING PAYE TAX DEDUCTION");
    console.log("-".repeat(40));

    const payeDeduction = await Deduction.findOne({
      name: { $regex: /PAYE Tax Deduction/i },
    });

    if (payeDeduction) {
      console.log("Current PAYE Deduction:");
      console.log(`Name: ${payeDeduction.name}`);
      console.log(`Amount: ${payeDeduction.amount}`);
      console.log(`Calculation Type: ${payeDeduction.calculationType}`);
      console.log(`Type: ${payeDeduction.type}`);

      // Fix the PAYE deduction - it should be calculated dynamically, not stored
      const updatedPaye = await Deduction.findByIdAndUpdate(
        payeDeduction._id,
        {
          $set: {
            calculationType: "percentage",
            amount: 0, // This will be calculated dynamically in payroll service
            type: "statutory",
            description: "PAYE Tax calculated based on taxable income and tax brackets"
          }
        },
        { new: true }
      );

      console.log("✅ PAYE Deduction fixed:");
      console.log(`Calculation Type: ${updatedPaye.calculationType}`);
      console.log(`Amount: ${updatedPaye.amount}`);
      console.log(`Type: ${updatedPaye.type}`);
    }

    // STEP 2: Reset usage tracking
    console.log("\n🔄 STEP 2: RESETTING USAGE TRACKING");
    console.log("-".repeat(40));

    await PersonalAllowance.updateMany(
      { status: "active", isActive: true },
      { $set: { isUsed: false, lastUsedDate: null }, $unset: { usageCount: 1 } }
    );
    await PersonalBonus.updateMany(
      { status: "active", isActive: true },
      { $set: { isUsed: false, lastUsedDate: null }, $unset: { usageCount: 1 } }
    );
    await Deduction.updateMany(
      { status: "active", isActive: true },
      { $set: { isUsed: false, lastUsedDate: null }, $unset: { usageCount: 1 } }
    );

    console.log("✅ Usage tracking reset");

    // STEP 3: Get IT Employee
    console.log("\n👤 STEP 3: GETTING IT EMPLOYEE");
    console.log("-".repeat(40));

    const itDepartment = await Department.findOne({
      $or: [
        { name: { $regex: /IT|Information Technology/i } },
        { code: { $regex: /IT/i } },
      ],
    });

    const itEmployee = await User.findOne({
      department: itDepartment._id,
      isActive: true,
    })
      .populate("role", "name level")
      .populate("department", "name code");

    console.log(`Employee: ${itEmployee.firstName} ${itEmployee.lastName} (${itEmployee.employeeId})`);
    console.log(`Role: ${itEmployee.role?.name}`);
    console.log(`Department: ${itEmployee.department?.name}`);

    // STEP 4: Test Individual Scope Logic
    console.log("\n🧮 STEP 4: TESTING INDIVIDUAL SCOPE LOGIC");
    console.log("-".repeat(40));

    // Test allowances
    const allowances = await PersonalAllowance.find({
      status: "active",
      isActive: true,
    }).populate("employees", "firstName lastName employeeId");

         console.log("\n💵 TESTING ALLOWANCES:");
     for (const allowance of allowances) {
       const isAvailable = PayrollService.isAvailableForPayroll(allowance, 8, 2025);
      let isApplicable = false;

      if (allowance.scope === "company") {
        isApplicable = true;
      } else if (allowance.scope === "department") {
        isApplicable = allowance.departments?.some(
          (dept) => dept._id.toString() === itEmployee.department._id.toString()
        );
      } else if (allowance.scope === "individual") {
        isApplicable = allowance.employees?.some(
          (emp) => emp._id.toString() === itEmployee._id.toString()
        );
      }

      console.log(`${allowance.name}:`);
      console.log(`  Scope: ${allowance.scope}`);
      console.log(`  Frequency: ${allowance.frequency}`);
      console.log(`  Available: ${isAvailable ? "✅" : "❌"}`);
      console.log(`  Applicable: ${isApplicable ? "✅" : "❌"}`);
      console.log(`  Final: ${isAvailable && isApplicable ? "✅ WILL BE USED" : "❌ WON'T BE USED"}`);
    }

    // Test deductions
    const deductions = await Deduction.find({
      status: "active",
      isActive: true,
    }).populate("employees", "firstName lastName employeeId");

         console.log("\n💸 TESTING DEDUCTIONS:");
     for (const deduction of deductions) {
       const isAvailable = PayrollService.isAvailableForPayroll(deduction, 8, 2025);
      let isApplicable = false;

      if (deduction.scope === "company") {
        isApplicable = true;
      } else if (deduction.scope === "department") {
        isApplicable = deduction.departments?.some(
          (dept) => dept._id.toString() === itEmployee.department._id.toString()
        );
      } else if (deduction.scope === "individual") {
        isApplicable = deduction.employees?.some(
          (emp) => emp._id.toString() === itEmployee._id.toString()
        );
      }

      console.log(`${deduction.name}:`);
      console.log(`  Scope: ${deduction.scope}`);
      console.log(`  Frequency: ${deduction.frequency}`);
      console.log(`  Available: ${isAvailable ? "✅" : "❌"}`);
      console.log(`  Applicable: ${isApplicable ? "✅" : "❌"}`);
      console.log(`  Final: ${isAvailable && isApplicable ? "✅ WILL BE USED" : "❌ WON'T BE USED"}`);
    }

    // STEP 5: Run Full Payroll Test
    console.log("\n🧮 STEP 5: RUNNING FULL PAYROLL TEST");
    console.log("-".repeat(40));

    try {
      const payroll = await PayrollService.calculateEmployeePayroll(
        itEmployee._id,
        8, // August
        2025,
        true // Mark as used
      );

      console.log("\n📋 PAYROLL CALCULATION RESULT:");
      console.log(`Base Salary: ₦${payroll.baseSalary.effectiveBaseSalary.toLocaleString()}`);
      console.log(`Total Allowances: ₦${payroll.allowances.total.toLocaleString()}`);
      console.log(`Total Bonuses: ₦${payroll.bonuses.total.toLocaleString()}`);
      console.log(`Total Deductions: ₦${payroll.deductions.total.toLocaleString()}`);
      console.log(`PAYE: ₦${payroll.deductions.paye.toLocaleString()}`);
      console.log(`Gross Pay: ₦${payroll.summary.grossPay.toLocaleString()}`);
      console.log(`Net Pay: ₦${payroll.summary.netPay.toLocaleString()}`);

      console.log(`\n📊 ITEMS MARKED AS USED:`);
      console.log(`Allowances: ${payroll.allowances.items.length}`);
      console.log(`Bonuses: ${payroll.bonuses.items.length}`);
      console.log(`Deductions: ${payroll.deductions.items.length}`);

      // Show which specific items were used
      console.log(`\n✅ ALLOWANCES USED:`);
      payroll.allowances.items.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name}: ₦${item.amount.toLocaleString()} (${item.taxable ? "Taxable" : "Non-taxable"})`);
      });

      console.log(`\n✅ BONUSES USED:`);
      payroll.bonuses.items.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name}: ₦${item.amount.toLocaleString()} (${item.taxable ? "Taxable" : "Non-taxable"})`);
      });

      console.log(`\n✅ DEDUCTIONS USED:`);
      payroll.deductions.items.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name}: ₦${item.amount.toLocaleString()} (${item.type})`);
      });

    } catch (error) {
      console.error(`❌ Error calculating payroll:`, error.message);
    }

    console.log(`\n🎉 TEST COMPLETED!`);

  } catch (error) {
    console.error("❌ Error in fix and test:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Database connection closed");
  }
};

fixPayeAndTestIndividual();
