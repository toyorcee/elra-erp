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

const testUsageTracking = async () => {
  try {
    await connectDB();

    console.log("🧮 TESTING USAGE TRACKING - AUGUST 2024");
    console.log("=".repeat(60));

    // Get IT Department employees for testing
    const itDepartment = await Department.findOne({
      $or: [
        { name: { $regex: /IT|Information Technology/i } },
        { code: { $regex: /IT/i } },
      ],
    });

    if (!itDepartment) {
      console.log("❌ IT Department not found");
      return;
    }

    console.log(`🏢 Testing with IT Department: ${itDepartment.name}`);

    // Get IT employees
    const itEmployees = await User.find({
      department: itDepartment._id,
      isActive: true,
    })
      .populate("role", "name level")
      .populate("department", "name code");

    console.log(`👥 Found ${itEmployees.length} IT employees for testing\n`);

    // Check current usage status before processing
    console.log("📊 CURRENT USAGE STATUS BEFORE PAYROLL:");
    console.log("-".repeat(50));

    const allowances = await PersonalAllowance.find({
      status: "active",
      isActive: true,
    });
    const bonuses = await PersonalBonus.find({
      status: "active",
      isActive: true,
    });
    const deductions = await Deduction.find({
      status: "active",
      isActive: true,
    });

    console.log(
      `Allowances - Used: ${allowances.filter((a) => a.isUsed).length}/${
        allowances.length
      }`
    );
    console.log(
      `Bonuses - Used: ${bonuses.filter((b) => b.isUsed).length}/${
        bonuses.length
      }`
    );
    console.log(
      `Deductions - Used: ${deductions.filter((d) => d.isUsed).length}/${
        deductions.length
      }`
    );

    // Show detailed usage tracking
    console.log(`\n📋 DETAILED USAGE TRACKING BEFORE:`);
    console.log("-".repeat(50));

    console.log(`\n💵 ALLOWANCES:`);
    allowances.forEach((allowance, index) => {
      console.log(
        `${index + 1}. ${allowance.name}: ${
          allowance.isUsed ? "✅ Used" : "❌ Not Used"
        } (Count: ${allowance.usageCount || 0}) - ${allowance.frequency}`
      );
    });

    console.log(`\n🎁 BONUSES:`);
    bonuses.forEach((bonus, index) => {
      console.log(
        `${index + 1}. ${bonus.name}: ${
          bonus.isUsed ? "✅ Used" : "❌ Not Used"
        } (Count: ${bonus.usageCount || 0}) - ${bonus.frequency}`
      );
    });

    console.log(`\n💸 DEDUCTIONS:`);
    deductions.forEach((deduction, index) => {
      console.log(
        `${index + 1}. ${deduction.name}: ${
          deduction.isUsed ? "✅ Used" : "❌ Not Used"
        } (Count: ${deduction.usageCount || 0}) - ${deduction.frequency}`
      );
    });

    // Test individual employee payroll calculation with markAsUsed = true
    if (itEmployees.length > 0) {
      const testEmployee = itEmployees[0];
      console.log(
        `\n🧪 TESTING INDIVIDUAL EMPLOYEE PAYROLL WITH USAGE MARKING:`
      );
      console.log(
        `Employee: ${testEmployee.firstName} ${testEmployee.lastName} (${testEmployee.employeeId})`
      );
      console.log(`Role: ${testEmployee.role?.name || "Not assigned"}`);

      try {
        const payroll = await PayrollService.calculateEmployeePayroll(
          testEmployee._id,
          8, // August
          2024,
          true // Mark as used
        );

        console.log("\n📋 PAYROLL CALCULATION RESULT:");
        console.log(
          `Base Salary: ₦${payroll.baseSalary.effectiveBaseSalary.toLocaleString()}`
        );
        console.log(
          `Total Allowances: ₦${payroll.allowances.total.toLocaleString()}`
        );
        console.log(
          `Total Bonuses: ₦${payroll.bonuses.total.toLocaleString()}`
        );
        console.log(
          `Total Deductions: ₦${payroll.deductions.total.toLocaleString()}`
        );
        console.log(`PAYE: ₦${payroll.deductions.paye.toLocaleString()}`);
        console.log(`Gross Pay: ₦${payroll.summary.grossPay.toLocaleString()}`);
        console.log(`Net Pay: ₦${payroll.summary.netPay.toLocaleString()}`);

        console.log(`\n📊 APPLICABLE ITEMS MARKED AS USED:`);
        console.log(`Allowances: ${payroll.allowances.items.length}`);
        console.log(`Bonuses: ${payroll.bonuses.items.length}`);
        console.log(`Deductions: ${payroll.deductions.items.length}`);
      } catch (error) {
        console.error(
          `❌ Error calculating payroll for ${testEmployee.firstName}:`,
          error.message
        );
      }
    }

    // Check usage status after processing
    console.log(`\n📊 USAGE STATUS AFTER PAYROLL:`);
    console.log("-".repeat(50));

    const allowancesAfter = await PersonalAllowance.find({
      status: "active",
      isActive: true,
    });
    const bonusesAfter = await PersonalBonus.find({
      status: "active",
      isActive: true,
    });
    const deductionsAfter = await Deduction.find({
      status: "active",
      isActive: true,
    });

    console.log(
      `Allowances - Used: ${allowancesAfter.filter((a) => a.isUsed).length}/${
        allowancesAfter.length
      }`
    );
    console.log(
      `Bonuses - Used: ${bonusesAfter.filter((b) => b.isUsed).length}/${
        bonusesAfter.length
      }`
    );
    console.log(
      `Deductions - Used: ${deductionsAfter.filter((d) => d.isUsed).length}/${
        deductionsAfter.length
      }`
    );

    // Show detailed usage tracking after
    console.log(`\n📋 DETAILED USAGE TRACKING AFTER:`);
    console.log("-".repeat(50));

    console.log(`\n💵 ALLOWANCES:`);
    allowancesAfter.forEach((allowance, index) => {
      console.log(
        `${index + 1}. ${allowance.name}: ${
          allowance.isUsed ? "✅ Used" : "❌ Not Used"
        } (Count: ${allowance.usageCount || 0}) - ${allowance.frequency}`
      );
    });

    console.log(`\n🎁 BONUSES:`);
    bonusesAfter.forEach((bonus, index) => {
      console.log(
        `${index + 1}. ${bonus.name}: ${
          bonus.isUsed ? "✅ Used" : "❌ Not Used"
        } (Count: ${bonus.usageCount || 0}) - ${bonus.frequency}`
      );
    });

    console.log(`\n💸 DEDUCTIONS:`);
    deductionsAfter.forEach((deduction, index) => {
      console.log(
        `${index + 1}. ${deduction.name}: ${
          deduction.isUsed ? "✅ Used" : "❌ Not Used"
        } (Count: ${deduction.usageCount || 0}) - ${deduction.frequency}`
      );
    });

    console.log(`\n🎉 USAGE TRACKING TEST COMPLETED!`);
    console.log("Items should now be marked as used for August 2024.");
  } catch (error) {
    console.error("❌ Error testing usage tracking:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Database connection closed");
  }
};

testUsageTracking();
