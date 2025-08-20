import mongoose from "mongoose";
import dotenv from "dotenv";
import payrollService from "../services/payrollService.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import Role from "../models/Role.js";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const testPayrollProcessing = async () => {
  try {
    console.log(
      "🚀 [TEST] Starting Department Payroll Test (Preview + Processing)"
    );
    console.log("============================================================");

    // Find System Administration department
    const superAdminDept = await Department.findOne({
      name: "System Administration",
    });

    if (!superAdminDept) {
      console.log("❌ [TEST] System Administration department not found");
      return;
    }

    console.log(
      `🏢 [TEST] Found department: ${superAdminDept.name} (ID: ${superAdminDept._id})`
    );

    // Debug: Check what employees are in this department
    const usersInDept = await User.find({
      department: superAdminDept._id,
    }).populate("department");
    console.log(`🔍 [TEST] Users in ${superAdminDept.name}:`);
    usersInDept.forEach((user) => {
      console.log(
        `   - ${user.firstName} ${user.lastName} (${user.employeeId})`
      );
    });

    // Test parameters
    const testParams = {
      month: 8,
      year: 2025,
      frequency: "monthly",
      scope: "department",
      scopeId: superAdminDept._id,
    };

    console.log("📋 [TEST] Test Parameters:", testParams);

    // ========================================
    // TEST 1: PREVIEW PAYROLL
    // ========================================
    console.log("\n🎯 [TEST] ========================================");
    console.log("🎯 [TEST] TESTING PREVIEW PAYROLL");
    console.log("🎯 [TEST] ========================================");

    const previewResult = await payrollService.calculatePayroll(
      testParams.month,
      testParams.year,
      testParams.frequency,
      testParams.scope,
      testParams.scopeId
    );

    console.log("✅ [TEST] Preview payroll calculation completed!");
    console.log("============================================================");
    console.log("📊 [TEST] PREVIEW PAYROLL SUMMARY:");
    console.log(`👥 Total Employees: ${previewResult.totalEmployees}`);
    console.log(
      `💰 Total Gross Pay: ₦${previewResult.totalGrossPay.toLocaleString()}`
    );
    console.log(
      `💸 Total Net Pay: ₦${previewResult.totalNetPay.toLocaleString()}`
    );
    console.log(
      `📉 Total Deductions: ₦${previewResult.totalDeductions.toLocaleString()}`
    );
    console.log(
      `🏛️ Total PAYE Tax: ₦${previewResult.totalPAYE.toLocaleString()}`
    );
    console.log(
      `📊 Total Taxable Income: ₦${previewResult.totalTaxableIncome.toLocaleString()}`
    );

    // Show aggregated breakdown
    if (previewResult.breakdown?.aggregatedData) {
      const agg = previewResult.breakdown.aggregatedData;
      console.log(
        "============================================================"
      );
      console.log("🔍 [TEST] AGGREGATED BREAKDOWN (PREVIEW):");
      console.log(
        `💼 Total Basic Salary: ₦${agg.totalBasicSalary.toLocaleString()}`
      );
      console.log(
        `🎁 Total Grade Allowances: ₦${agg.totalGradeAllowances.toLocaleString()}`
      );
      console.log(
        `🎁 Total Personal Allowances: ₦${agg.totalPersonalAllowances.toLocaleString()}`
      );
      console.log(
        `   ├─ Taxable: ₦${agg.totalPersonalAllowancesTaxable.toLocaleString()}`
      );
      console.log(
        `   └─ Non-taxable: ₦${agg.totalPersonalAllowancesNonTaxable.toLocaleString()}`
      );
      console.log(
        `🏆 Total Personal Bonuses: ₦${agg.totalPersonalBonuses.toLocaleString()}`
      );
      console.log(
        `   ├─ Taxable: ₦${agg.totalPersonalBonusesTaxable.toLocaleString()}`
      );
      console.log(
        `   └─ Non-taxable: ₦${agg.totalPersonalBonusesNonTaxable.toLocaleString()}`
      );
      console.log(
        `📉 Total Deductions: ₦${agg.totalDeductions.toLocaleString()}`
      );
      console.log(
        `   ├─ Statutory: ₦${agg.totalDeductionsStatutory.toLocaleString()}`
      );
      console.log(
        `   └─ Voluntary: ₦${agg.totalDeductionsVoluntary.toLocaleString()}`
      );
    }

    // ========================================
    // TEST 2: ACTUAL PAYROLL PROCESSING
    // ========================================
    console.log("\n🎯 [TEST] ========================================");
    console.log("🎯 [TEST] TESTING ACTUAL PAYROLL PROCESSING");
    console.log("🎯 [TEST] ========================================");

    // Get a real user ID for the processing test
    const testUser = await User.findOne({ employeeId: "SA001" });
    const userId = testUser ? testUser._id : "6895cbac5f360714aa659d3b"; // Fallback to known user ID

    const processingResult = await payrollService.processPayroll(
      testParams.month,
      testParams.year,
      testParams.frequency,
      testParams.scope,
      testParams.scopeId,
      userId,
      false // isPreview = false for actual processing
    );

    console.log("✅ [TEST] Actual payroll processing completed!");
    console.log("============================================================");
    console.log("📊 [TEST] PROCESSING RESULT:");
    console.log(`👥 Total Employees: ${processingResult.totalEmployees}`);
    console.log(
      `💰 Total Gross Pay: ₦${processingResult.totalGrossPay.toLocaleString()}`
    );
    console.log(
      `💸 Total Net Pay: ₦${processingResult.totalNetPay.toLocaleString()}`
    );
    console.log(
      `📉 Total Deductions: ₦${processingResult.totalDeductions.toLocaleString()}`
    );
    console.log(
      `🏛️ Total PAYE Tax: ₦${processingResult.totalPAYE.toLocaleString()}`
    );
    console.log(
      `📊 Total Taxable Income: ₦${processingResult.totalTaxableIncome.toLocaleString()}`
    );
    console.log(`💾 Payroll ID: ${processingResult.payrollId}`);
    console.log(
      `💾 Saved Payrolls: ${
        processingResult.savedPayrolls?.length || 0
      } records`
    );

    // Show aggregated breakdown for processing
    if (processingResult.breakdown?.aggregatedData) {
      const agg = processingResult.breakdown.aggregatedData;
      console.log(
        "============================================================"
      );
      console.log("🔍 [TEST] AGGREGATED BREAKDOWN (PROCESSED):");
      console.log(
        `💼 Total Basic Salary: ₦${agg.totalBasicSalary.toLocaleString()}`
      );
      console.log(
        `🎁 Total Grade Allowances: ₦${agg.totalGradeAllowances.toLocaleString()}`
      );
      console.log(
        `🎁 Total Personal Allowances: ₦${agg.totalPersonalAllowances.toLocaleString()}`
      );
      console.log(
        `   ├─ Taxable: ₦${agg.totalPersonalAllowancesTaxable.toLocaleString()}`
      );
      console.log(
        `   └─ Non-taxable: ₦${agg.totalPersonalAllowancesNonTaxable.toLocaleString()}`
      );
      console.log(
        `🏆 Total Personal Bonuses: ₦${agg.totalPersonalBonuses.toLocaleString()}`
      );
      console.log(
        `   ├─ Taxable: ₦${agg.totalPersonalBonusesTaxable.toLocaleString()}`
      );
      console.log(
        `   └─ Non-taxable: ₦${agg.totalPersonalBonusesNonTaxable.toLocaleString()}`
      );
      console.log(
        `📉 Total Deductions: ₦${agg.totalDeductions.toLocaleString()}`
      );
      console.log(
        `   ├─ Statutory: ₦${agg.totalDeductionsStatutory.toLocaleString()}`
      );
      console.log(
        `   └─ Voluntary: ₦${agg.totalDeductionsVoluntary.toLocaleString()}`
      );
    }

    // ========================================
    // COMPARISON
    // ========================================
    console.log("\n🎯 [TEST] ========================================");
    console.log("🎯 [TEST] COMPARISON: PREVIEW vs PROCESSED");
    console.log("🎯 [TEST] ========================================");
    console.log(
      `💰 Gross Pay: Preview ${previewResult.totalGrossPay.toLocaleString()} vs Processed ${processingResult.totalGrossPay.toLocaleString()}`
    );
    console.log(
      `💸 Net Pay: Preview ${previewResult.totalNetPay.toLocaleString()} vs Processed ${processingResult.totalNetPay.toLocaleString()}`
    );
    console.log(
      `📉 Deductions: Preview ${previewResult.totalDeductions.toLocaleString()} vs Processed ${processingResult.totalDeductions.toLocaleString()}`
    );
    console.log(
      `🏛️ PAYE: Preview ${previewResult.totalPAYE.toLocaleString()} vs Processed ${processingResult.totalPAYE.toLocaleString()}`
    );

    const grossMatch =
      previewResult.totalGrossPay === processingResult.totalGrossPay;
    const netMatch = previewResult.totalNetPay === processingResult.totalNetPay;
    const deductionsMatch =
      previewResult.totalDeductions === processingResult.totalDeductions;
    const payeMatch = previewResult.totalPAYE === processingResult.totalPAYE;

    console.log("\n✅ [TEST] VALIDATION RESULTS:");
    console.log(`💰 Gross Pay Match: ${grossMatch ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`💸 Net Pay Match: ${netMatch ? "✅ PASS" : "❌ FAIL"}`);
    console.log(
      `📉 Deductions Match: ${deductionsMatch ? "✅ PASS" : "❌ FAIL"}`
    );
    console.log(`🏛️ PAYE Match: ${payeMatch ? "✅ PASS" : "❌ FAIL"}`);

    if (grossMatch && netMatch && deductionsMatch && payeMatch) {
      console.log(
        "\n🎉 [TEST] ALL TESTS PASSED! Preview and processed results match perfectly!"
      );
    } else {
      console.log(
        "\n⚠️ [TEST] Some calculations don't match between preview and processing!"
      );
    }

    console.log("============================================================");
    console.log("✅ [TEST] Department payroll test completed successfully!");
  } catch (error) {
    console.error("❌ [TEST] Error during payroll test:", error);
  }
};

const main = async () => {
  await connectDB();
  await testPayrollProcessing();
  await mongoose.disconnect();
  console.log("🔌 Disconnected from MongoDB");
};

main().catch(console.error);
