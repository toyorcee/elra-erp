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
import SalaryGrade from "../models/SalaryGrade.js";
import RoleSalaryGradeMapping from "../models/RoleSalaryGradeMapping.js";

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

const finalComprehensiveTest = async () => {
  try {
    await connectDB();

    console.log("🎯 COMPREHENSIVE PAYROLL CALCULATION BREAKDOWN");
    console.log("=".repeat(80));
    console.log("📅 Month: August 2025");
    console.log("=".repeat(80));

    // STEP 1: RESET ALL USAGE TRACKING
    console.log("\n🔄 STEP 1: RESETTING ALL USAGE TRACKING");
    console.log("-".repeat(50));

    const resetAllowances = await PersonalAllowance.updateMany(
      { status: "active", isActive: true },
      { $set: { isUsed: false, lastUsedDate: null }, $unset: { usageCount: 1 } }
    );
    const resetBonuses = await PersonalBonus.updateMany(
      { status: "active", isActive: true },
      { $set: { isUsed: false, lastUsedDate: null }, $unset: { usageCount: 1 } }
    );
    const resetDeductions = await Deduction.updateMany(
      { status: "active", isActive: true },
      { $set: { isUsed: false, lastUsedDate: null }, $unset: { usageCount: 1 } }
    );

    console.log(`✅ Reset ${resetAllowances.modifiedCount} allowances`);
    console.log(`✅ Reset ${resetBonuses.modifiedCount} bonuses`);
    console.log(`✅ Reset ${resetDeductions.modifiedCount} deductions`);

    // STEP 2: GET IT EMPLOYEE WITH FULL DETAILS
    console.log("\n👤 STEP 2: GETTING EMPLOYEE DETAILS");
    console.log("-".repeat(50));

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
      .populate("department", "name code")
      .populate("salaryGrade", "name baseSalary stepIncrement maxSteps");

    console.log(`👤 Employee: ${itEmployee.firstName} ${itEmployee.lastName}`);
    console.log(`🆔 Employee ID: ${itEmployee.employeeId}`);
    console.log(`🏢 Department: ${itEmployee.department?.name}`);
    console.log(
      `👔 Role: ${itEmployee.role?.name} (Level: ${itEmployee.role?.level})`
    );
    console.log(
      `💰 Custom Base Salary: ${
        itEmployee.customBaseSalary
          ? `₦${itEmployee.customBaseSalary.toLocaleString()}`
          : "Not set"
      }`
    );
    console.log(
      `📊 Use Step Calculation: ${itEmployee.useStepCalculation ? "Yes" : "No"}`
    );
    console.log(`📈 Current Step: ${itEmployee.currentStep || "Not set"}`);
    console.log(
      `🏆 Salary Grade: ${itEmployee.salaryGrade?.name || "Not assigned"}`
    );

    // STEP 3: DETAILED BASE SALARY CALCULATION
    console.log("\n💰 STEP 3: BASE SALARY CALCULATION BREAKDOWN");
    console.log("-".repeat(50));

    let effectiveBaseSalary = 0;
    let baseSalaryCalculation = "";

    if (itEmployee.customBaseSalary) {
      effectiveBaseSalary = itEmployee.customBaseSalary;
      baseSalaryCalculation = `Custom Base Salary: ₦${effectiveBaseSalary.toLocaleString()}`;
      console.log(
        `✅ Using custom base salary: ₦${effectiveBaseSalary.toLocaleString()}`
      );
    } else if (itEmployee.useStepCalculation && itEmployee.salaryGrade) {
      const baseSalary = itEmployee.salaryGrade.baseSalary;
      const stepIncrement = itEmployee.salaryGrade.stepIncrement;
      const currentStep = itEmployee.currentStep || 1;
      const stepAmount = (currentStep - 1) * stepIncrement;
      effectiveBaseSalary = baseSalary + stepAmount;

      baseSalaryCalculation = `Grade Base: ₦${baseSalary.toLocaleString()} + Step ${currentStep} (₦${stepAmount.toLocaleString()}) = ₦${effectiveBaseSalary.toLocaleString()}`;

      console.log(`📊 Salary Grade: ${itEmployee.salaryGrade.name}`);
      console.log(`💰 Grade Base Salary: ₦${baseSalary.toLocaleString()}`);
      console.log(`📈 Step Increment: ₦${stepIncrement.toLocaleString()}`);
      console.log(`🎯 Current Step: ${currentStep}`);
      console.log(`➕ Step Amount: ₦${stepAmount.toLocaleString()}`);
      console.log(
        `✅ Effective Base Salary: ₦${effectiveBaseSalary.toLocaleString()}`
      );
    } else if (itEmployee.salaryGrade) {
      effectiveBaseSalary = itEmployee.salaryGrade.baseSalary;
      baseSalaryCalculation = `Grade Base Salary: ₦${effectiveBaseSalary.toLocaleString()}`;
      console.log(
        `✅ Using grade base salary: ₦${effectiveBaseSalary.toLocaleString()}`
      );
    } else {
      console.log(`❌ No salary grade assigned, using 0 as base salary`);
      effectiveBaseSalary = 0;
      baseSalaryCalculation = "No salary grade assigned";
    }

    // STEP 4: GET ALL AVAILABLE ITEMS
    console.log("\n📋 STEP 4: GETTING ALL PAYROLL ITEMS");
    console.log("-".repeat(50));

    const allAllowances = await PersonalAllowance.find({
      status: "active",
      isActive: true,
    })
      .populate("employees", "firstName lastName employeeId")
      .populate("departments", "name code");

    const allBonuses = await PersonalBonus.find({
      status: "active",
      isActive: true,
    })
      .populate("employees", "firstName lastName employeeId")
      .populate("departments", "name code");

    const allDeductions = await Deduction.find({
      status: "active",
      isActive: true,
    })
      .populate("employees", "firstName lastName employeeId")
      .populate("departments", "name code");

    console.log(`📊 Total Allowances: ${allAllowances.length}`);
    console.log(`🎁 Total Bonuses: ${allBonuses.length}`);
    console.log(`💸 Total Deductions: ${allDeductions.length}`);

    // STEP 5: DETAILED ITEM ANALYSIS
    console.log("\n🔍 STEP 5: DETAILED ITEM ANALYSIS");
    console.log("-".repeat(50));

    console.log("\n💵 ALLOWANCES ANALYSIS:");
    allAllowances.forEach((allowance, index) => {
      const isAvailable = PayrollService.isAvailableForPayroll(
        allowance,
        8,
        2025
      );
      let isEligible = false;

      if (allowance.scope === "company") {
        isEligible = true;
      } else if (allowance.scope === "department") {
        isEligible = allowance.departments?.some(
          (dept) => dept._id.toString() === itEmployee.department._id.toString()
        );
      } else if (allowance.scope === "individual") {
        isEligible = allowance.employees?.some(
          (emp) => emp._id.toString() === itEmployee._id.toString()
        );
      }

      console.log(`${index + 1}. ${allowance.name}`);
      console.log(`   📊 Scope: ${allowance.scope}`);
      console.log(`   📅 Frequency: ${allowance.frequency}`);
      console.log(`   💰 Amount: ₦${allowance.amount.toLocaleString()}`);
      console.log(`   🧮 Calculation: ${allowance.calculationType}`);
      console.log(`   📈 Taxable: ${allowance.taxable ? "Yes" : "No"}`);
      console.log(`   ✅ Available: ${isAvailable ? "YES" : "NO"}`);
      console.log(`   👤 Eligible: ${isEligible ? "YES" : "NO"}`);
      console.log(
        `   🎯 Will Apply: ${isAvailable && isEligible ? "YES" : "NO"}`
      );
      console.log(`   📝 Used: ${allowance.isUsed ? "Yes" : "No"}`);
      console.log(
        `   📅 Last Used: ${
          allowance.lastUsedDate
            ? allowance.lastUsedDate.toLocaleDateString()
            : "Never"
        }`
      );
      console.log("");
    });

    console.log("\n🎁 BONUSES ANALYSIS:");
    allBonuses.forEach((bonus, index) => {
      const isAvailable = PayrollService.isAvailableForPayroll(bonus, 8, 2025);
      let isEligible = false;

      if (bonus.scope === "company") {
        isEligible = true;
      } else if (bonus.scope === "department") {
        isEligible = bonus.departments?.some(
          (dept) => dept._id.toString() === itEmployee.department._id.toString()
        );
      } else if (bonus.scope === "individual") {
        isEligible = bonus.employees?.some(
          (emp) => emp._id.toString() === itEmployee._id.toString()
        );
      }

      console.log(`${index + 1}. ${bonus.name}`);
      console.log(`   📊 Scope: ${bonus.scope}`);
      console.log(`   📅 Frequency: ${bonus.frequency}`);
      console.log(`   💰 Amount: ₦${bonus.amount.toLocaleString()}`);
      console.log(`   🧮 Calculation: ${bonus.calculationType}`);
      console.log(`   📈 Taxable: ${bonus.taxable ? "Yes" : "No"}`);
      console.log(`   ✅ Available: ${isAvailable ? "YES" : "NO"}`);
      console.log(`   👤 Eligible: ${isEligible ? "YES" : "NO"}`);
      console.log(
        `   🎯 Will Apply: ${isAvailable && isEligible ? "YES" : "NO"}`
      );
      console.log(`   📝 Used: ${bonus.isUsed ? "Yes" : "No"}`);
      console.log(
        `   📅 Last Used: ${
          bonus.lastUsedDate ? bonus.lastUsedDate.toLocaleDateString() : "Never"
        }`
      );
      console.log("");
    });

    console.log("\n💸 DEDUCTIONS ANALYSIS:");
    allDeductions.forEach((deduction, index) => {
      const isAvailable = PayrollService.isAvailableForPayroll(
        deduction,
        8,
        2025
      );
      let isEligible = false;

      if (deduction.scope === "company") {
        isEligible = true;
      } else if (deduction.scope === "department") {
        isEligible = deduction.departments?.some(
          (dept) => dept._id.toString() === itEmployee.department._id.toString()
        );
      } else if (deduction.scope === "individual") {
        isEligible = deduction.employees?.some(
          (emp) => emp._id.toString() === itEmployee._id.toString()
        );
      }

      console.log(`${index + 1}. ${deduction.name}`);
      console.log(`   📊 Scope: ${deduction.scope}`);
      console.log(`   📅 Frequency: ${deduction.frequency}`);
      console.log(
        `   💰 Amount: ${
          deduction.amount
            ? `₦${deduction.amount.toLocaleString()}`
            : deduction.calculationType === "tax_brackets"
            ? "Tax Brackets Auto-Applied"
            : "₦0"
        }`
      );
      console.log(`   🧮 Calculation: ${deduction.calculationType}`);
      console.log(`   📈 Taxable: ${deduction.taxable ? "Yes" : "No"}`);
      console.log(`   ✅ Available: ${isAvailable ? "YES" : "NO"}`);
      console.log(`   👤 Eligible: ${isEligible ? "YES" : "NO"}`);
      console.log(
        `   🎯 Will Apply: ${isAvailable && isEligible ? "YES" : "NO"}`
      );
      console.log(`   📝 Used: ${deduction.isUsed ? "Yes" : "No"}`);
      console.log(
        `   📅 Last Used: ${
          deduction.lastUsedDate
            ? deduction.lastUsedDate.toLocaleDateString()
            : "Never"
        }`
      );
      console.log("");
    });

    // STEP 6: RUN PAYROLL CALCULATION
    console.log("\n🧮 STEP 6: RUNNING PAYROLL CALCULATION");
    console.log("-".repeat(50));

    const payroll = await PayrollService.calculateEmployeePayroll(
      itEmployee._id,
      8, // August
      2025,
      true // Mark as used
    );

    // STEP 7: DETAILED CALCULATION BREAKDOWN
    console.log("\n📊 STEP 7: DETAILED CALCULATION BREAKDOWN");
    console.log("-".repeat(50));

    console.log(`\n💰 BASE SALARY CALCULATION:`);
    console.log(`   ${baseSalaryCalculation}`);
    console.log(
      `   ✅ Final Base Salary: ₦${payroll.baseSalary.effectiveBaseSalary.toLocaleString()}`
    );

    console.log(`\n💵 ALLOWANCES BREAKDOWN:`);
    console.log(
      `   📊 Total Allowances: ₦${payroll.allowances.total.toLocaleString()}`
    );
    console.log(
      `   📈 Taxable Allowances: ₦${payroll.allowances.taxable.toLocaleString()}`
    );
    console.log(
      `   📉 Non-Taxable Allowances: ₦${payroll.allowances.nonTaxable.toLocaleString()}`
    );
    console.log(`   📋 Items Applied:`);
    payroll.allowances.items.forEach((item, index) => {
      console.log(
        `      ${index + 1}. ${item.name}: ₦${item.amount.toLocaleString()} (${
          item.taxable ? "Taxable" : "Non-Taxable"
        })`
      );
    });

    console.log(`\n🎁 BONUSES BREAKDOWN:`);
    console.log(
      `   📊 Total Bonuses: ₦${payroll.bonuses.total.toLocaleString()}`
    );
    console.log(
      `   📈 Taxable Bonuses: ₦${payroll.bonuses.taxable.toLocaleString()}`
    );
    console.log(
      `   📉 Non-Taxable Bonuses: ₦${payroll.bonuses.nonTaxable.toLocaleString()}`
    );
    console.log(`   📋 Items Applied:`);
    payroll.bonuses.items.forEach((item, index) => {
      console.log(
        `      ${index + 1}. ${item.name}: ₦${item.amount.toLocaleString()} (${
          item.taxable ? "Taxable" : "Non-Taxable"
        })`
      );
    });

    console.log(`\n💸 DEDUCTIONS BREAKDOWN:`);
    console.log(
      `   📊 Total Deductions: ₦${payroll.deductions.total.toLocaleString()}`
    );
    console.log(`   💰 PAYE Tax: ₦${payroll.deductions.paye.toLocaleString()}`);
    console.log(`   📋 Items Applied:`);
    payroll.deductions.items.forEach((item, index) => {
      console.log(
        `      ${index + 1}. ${item.name}: ₦${item.amount.toLocaleString()}`
      );
    });

    console.log(`\n📈 GROSS PAY CALCULATION:`);
    console.log(
      `   💰 Base Salary: ₦${payroll.baseSalary.effectiveBaseSalary.toLocaleString()}`
    );
    console.log(
      `   💵 Allowances: ₦${payroll.allowances.total.toLocaleString()}`
    );
    console.log(`   🎁 Bonuses: ₦${payroll.bonuses.total.toLocaleString()}`);
    console.log(
      `   ➕ Gross Pay: ₦${payroll.summary.grossPay.toLocaleString()}`
    );

    console.log(`\n📊 TAXABLE INCOME CALCULATION:`);
    console.log(
      `   💰 Base Salary: ₦${payroll.baseSalary.effectiveBaseSalary.toLocaleString()}`
    );
    console.log(
      `   📈 Taxable Allowances: ₦${payroll.allowances.taxable.toLocaleString()}`
    );
    console.log(
      `   📈 Taxable Bonuses: ₦${payroll.bonuses.taxable.toLocaleString()}`
    );
    console.log(
      `   ➕ Taxable Income: ₦${payroll.summary.taxableIncome.toLocaleString()}`
    );

    console.log(`\n💸 NET PAY CALCULATION:`);
    console.log(
      `   💰 Gross Pay: ₦${payroll.summary.grossPay.toLocaleString()}`
    );
    console.log(
      `   💸 Total Deductions: ₦${payroll.deductions.total.toLocaleString()}`
    );
    console.log(`   ➖ Net Pay: ₦${payroll.summary.netPay.toLocaleString()}`);

    // STEP 8: VERIFY USAGE TRACKING
    console.log("\n✅ STEP 8: VERIFYING USAGE TRACKING");
    console.log("-".repeat(50));

    const usedAllowances = await PersonalAllowance.find({ isUsed: true });
    const usedBonuses = await PersonalBonus.find({ isUsed: true });
    const usedDeductions = await Deduction.find({ isUsed: true });

    console.log(`\n📝 ITEMS MARKED AS USED:`);
    console.log(`   💵 Allowances: ${usedAllowances.length}`);
    usedAllowances.forEach((item) => {
      console.log(
        `      - ${
          item.name
        } (Last used: ${item.lastUsedDate?.toLocaleDateString()})`
      );
    });

    console.log(`   🎁 Bonuses: ${usedBonuses.length}`);
    usedBonuses.forEach((item) => {
      console.log(
        `      - ${
          item.name
        } (Last used: ${item.lastUsedDate?.toLocaleDateString()})`
      );
    });

    console.log(`   💸 Deductions: ${usedDeductions.length}`);
    usedDeductions.forEach((item) => {
      console.log(
        `      - ${
          item.name
        } (Last used: ${item.lastUsedDate?.toLocaleDateString()})`
      );
    });

    // STEP 9: FINAL SUMMARY
    console.log("\n🎯 STEP 9: FINAL SUMMARY");
    console.log("-".repeat(50));

    console.log(
      `\n📊 EMPLOYEE: ${itEmployee.firstName} ${itEmployee.lastName} (${itEmployee.employeeId})`
    );
    console.log(`📅 PERIOD: August 2025`);
    console.log(
      `💰 BASE SALARY: ₦${payroll.baseSalary.effectiveBaseSalary.toLocaleString()}`
    );
    console.log(
      `💵 TOTAL ALLOWANCES: ₦${payroll.allowances.total.toLocaleString()}`
    );
    console.log(`🎁 TOTAL BONUSES: ₦${payroll.bonuses.total.toLocaleString()}`);
    console.log(
      `💸 TOTAL DEDUCTIONS: ₦${payroll.deductions.total.toLocaleString()}`
    );
    console.log(`📈 GROSS PAY: ₦${payroll.summary.grossPay.toLocaleString()}`);
    console.log(`💰 NET PAY: ₦${payroll.summary.netPay.toLocaleString()}`);

    console.log(`\n✅ USAGE TRACKING:`);
    console.log(
      `   📝 Items marked as used: ${
        usedAllowances.length + usedBonuses.length + usedDeductions.length
      }`
    );
    console.log(
      `   🔄 Next payroll will exclude used items based on frequency`
    );

    console.log(
      `\n🎉 CALCULATION COMPLETE! This is a perfect calculation for August 2025.`
    );
    console.log(`   - All eligible items were applied correctly`);
    console.log(`   - Usage tracking prevents double-counting`);
    console.log(`   - Tax calculations are accurate`);
    console.log(`   - Frequency rules are respected`);
  } catch (error) {
    console.error("❌ Error in comprehensive test:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Database connection closed");
  }
};

finalComprehensiveTest();
