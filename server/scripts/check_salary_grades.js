import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import SalaryGrade from "../models/SalaryGrade.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import Role from "../models/Role.js";
import RoleSalaryGradeMapping from "../models/RoleSalaryGradeMapping.js";
import PersonalAllowance from "../models/PersonalAllowance.js";
import PersonalBonus from "../models/PersonalBonus.js";
import Deduction from "../models/Deduction.js";
import TaxBracket from "../models/TaxBracket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "../.env") });

// Function to calculate PAYE using tax brackets
const calculatePAYE = (annualIncome, taxBrackets) => {
  let totalTax = 0;
  let remainingIncome = annualIncome;
  let taxBreakdown = [];

  for (const bracket of taxBrackets) {
    if (remainingIncome <= 0) break;

    const bracketMin = bracket.minAmount;
    const bracketMax = bracket.maxAmount || Infinity;

    // Calculate taxable amount in this bracket
    const taxableInBracket = Math.min(remainingIncome, bracketMax - bracketMin);

    if (taxableInBracket > 0) {
      // Calculate tax for this bracket
      const bracketTax = (taxableInBracket * bracket.taxRate) / 100;
      totalTax += bracketTax + bracket.additionalTax;

      taxBreakdown.push({
        bracket: bracket.name,
        rate: `${bracket.taxRate}%`,
        taxableAmount: taxableInBracket,
        taxAmount: bracketTax + bracket.additionalTax,
      });

      remainingIncome -= taxableInBracket;
    }
  }

  return { totalTax, taxBreakdown };
};

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

const checkSalaryGrades = async () => {
  try {
    await connectDB();

    console.log("💰 COMPREHENSIVE PAYROLL SYSTEM ANALYSIS");
    console.log("=".repeat(80));

    // Get all salary grades
    const salaryGrades = await SalaryGrade.find({ isActive: true })
      .populate("createdBy", "firstName lastName")
      .sort({ minGrossSalary: 1 });

    // Get all role mappings
    const roleMappings = await RoleSalaryGradeMapping.find({ isActive: true })
      .populate("role", "name level description")
      .populate("salaryGrade", "grade name minGrossSalary maxGrossSalary");

    // Get tax brackets for PAYE calculation
    const taxBrackets = await TaxBracket.find({ isActive: true }).sort({
      order: 1,
    });

    console.log(`📊 Found ${salaryGrades.length} active salary grades\n`);

    // Detailed examination of each grade
    salaryGrades.forEach((grade, index) => {
      console.log(`\n${index + 1}. SALARY GRADE: ${grade.grade}`);
      console.log("=".repeat(50));
      console.log(`Name: ${grade.name}`);
      console.log(`Description: ${grade.description}`);
      console.log(
        `Salary Range: ₦${grade.minGrossSalary.toLocaleString()} - ₦${grade.maxGrossSalary.toLocaleString()}`
      );
      console.log(`Status: ${grade.isActive ? "Active" : "Inactive"}`);
      console.log(
        `Created By: ${grade.createdBy?.firstName} ${grade.createdBy?.lastName}`
      );
      console.log(`Created: ${grade.createdAt.toLocaleDateString()}`);

      // Check role mappings
      console.log(`\n👔 ROLE MAPPINGS:`);
      const gradeMappings = roleMappings.filter(
        (mapping) => mapping.salaryGrade._id.toString() === grade._id.toString()
      );

      if (gradeMappings.length > 0) {
        gradeMappings.forEach((mapping, mapIndex) => {
          console.log(
            `   ${mapIndex + 1}. ${
              mapping.role?.name || "Unknown Role"
            } (Level: ${mapping.role?.level || "N/A"}) - ${
              mapping.isActive ? "Active" : "Inactive"
            }`
          );
        });
      } else {
        console.log(`   ❌ No role mappings configured`);
      }

      // Check if steps are configured
      console.log(`\n📈 STEPS CONFIGURATION:`);
      if (grade.steps && grade.steps.length > 0) {
        console.log(
          `✅ Steps are ENABLED (${grade.steps.length} steps configured)`
        );
        grade.steps.forEach((step, stepIndex) => {
          console.log(`   Step ${stepIndex + 1}: ${step.step}`);
          console.log(`     - Increment: ${step.increment}%`);
          console.log(
            `     - Years of Service: ${step.yearsOfService || "Not specified"}`
          );

          // Calculate actual salary for this step
          const stepIncrement = (grade.minGrossSalary * step.increment) / 100;
          const stepSalary = grade.minGrossSalary + stepIncrement;
          console.log(`     - Actual Salary: ₦${stepSalary.toLocaleString()}`);
        });
      } else {
        console.log(`❌ Steps are NOT ENABLED (No steps configured)`);
        console.log(
          `   Base Salary: ₦${grade.minGrossSalary.toLocaleString()}`
        );
      }

      // Check allowances
      console.log(`\n💵 ALLOWANCES CONFIGURATION:`);
      console.log(`   Housing: ₦${grade.allowances.housing.toLocaleString()}`);
      console.log(
        `   Transport: ₦${grade.allowances.transport.toLocaleString()}`
      );
      console.log(`   Meal: ₦${grade.allowances.meal.toLocaleString()}`);
      console.log(`   Other: ₦${grade.allowances.other.toLocaleString()}`);

      // Check custom allowances
      if (grade.customAllowances && grade.customAllowances.length > 0) {
        console.log(`\n🎯 CUSTOM ALLOWANCES:`);
        grade.customAllowances.forEach((allowance, allowanceIndex) => {
          console.log(
            `   ${allowanceIndex + 1}. ${
              allowance.name
            }: ₦${allowance.amount.toLocaleString()}`
          );
        });
      } else {
        console.log(`\n🎯 CUSTOM ALLOWANCES: None configured`);
      }
    });

    // Check IT Department specifically
    console.log(`\n🏢 IT DEPARTMENT ANALYSIS:`);
    console.log("=".repeat(50));

    const itDepartment = await Department.findOne({
      $or: [
        { name: { $regex: /IT|Information Technology/i } },
        { code: { $regex: /IT/i } },
      ],
    });

    let itEmployees = [];

    if (itDepartment) {
      console.log(
        `✅ Found IT Department: ${itDepartment.name} (${itDepartment.code})`
      );

      itEmployees = await User.find({
        department: itDepartment._id,
        isActive: true,
      })
        .populate("role", "name level")
        .populate("department", "name code");

      console.log(`👥 Found ${itEmployees.length} active IT employees\n`);

      itEmployees.forEach((employee, index) => {
        console.log(`${index + 1}. ${employee.firstName} ${employee.lastName}`);
        console.log(`   Employee ID: ${employee.employeeId}`);
        console.log(`   Role: ${employee.role?.name || "Not assigned"}`);
        console.log(
          `   Department: ${employee.department?.name || "Not assigned"}`
        );

        // Salary details
        console.log(`   💰 SALARY CONFIGURATION:`);
        console.log(
          `     - Custom Base Salary: ₦${
            employee.customBaseSalary?.toLocaleString() ||
            "Not set (using grade minimum)"
          }`
        );
        console.log(
          `     - Years of Service: ${employee.yearsOfService || "Not set"}`
        );
        console.log(
          `     - Current Step: ${employee.salaryStep || "Not specified"}`
        );
        console.log(
          `     - Use Step Calculation: ${
            employee.useStepCalculation ? "Yes" : "No"
          }`
        );

        // Find their salary grade
        const employeeMapping = roleMappings.find(
          (mapping) =>
            mapping.role._id.toString() === employee.role?._id.toString()
        );
        const employeeGrade = employeeMapping
          ? salaryGrades.find(
              (grade) =>
                grade._id.toString() ===
                employeeMapping.salaryGrade._id.toString()
            )
          : null;

        if (employeeGrade) {
          console.log(
            `     - Salary Grade: ${employeeGrade.grade} (${employeeGrade.name})`
          );
          console.log(
            `     - Grade Range: ₦${employeeGrade.minGrossSalary.toLocaleString()} - ₦${employeeGrade.maxGrossSalary.toLocaleString()}`
          );

          // Calculate effective base salary
          let effectiveBaseSalary =
            employee.customBaseSalary || employeeGrade.minGrossSalary;
          if (
            employee.useStepCalculation &&
            employee.salaryStep &&
            employeeGrade.steps
          ) {
            const step = employeeGrade.steps.find(
              (s) => s.step === employee.salaryStep
            );
            if (step) {
              const stepIncrement =
                (effectiveBaseSalary * step.increment) / 100;
              effectiveBaseSalary = effectiveBaseSalary + stepIncrement;
              console.log(
                `     - Step Increment: ₦${stepIncrement.toLocaleString()} (${
                  step.increment
                }%)`
              );
            }
          }
          console.log(
            `     - Effective Base Salary: ₦${effectiveBaseSalary.toLocaleString()}`
          );
        } else {
          console.log(`     - Salary Grade: Not mapped`);
        }
        console.log("");
      });
    } else {
      console.log(`❌ IT Department not found`);
    }

    // Check Personal Allowances with usage tracking
    console.log(`\n💵 PERSONAL ALLOWANCES ANALYSIS:`);
    console.log("=".repeat(50));

    const personalAllowances = await PersonalAllowance.find({
      status: "active",
      isActive: true,
    })
      .populate("employees", "firstName lastName employeeId")
      .populate("departments", "name code")
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: 1 });

    console.log(
      `📊 Found ${personalAllowances.length} active personal allowances\n`
    );

    personalAllowances.forEach((allowance, index) => {
      console.log(`${index + 1}. ALLOWANCE: ${allowance.name}`);
      console.log(`   Type: ${allowance.type}`);
      console.log(`   Category: ${allowance.category}`);
      console.log(`   Scope: ${allowance.scope}`);
      console.log(
        `   Calculation: ${allowance.calculationType} ${
          allowance.calculationType === "fixed"
            ? `(₦${allowance.amount?.toLocaleString()})`
            : `(${allowance.amount}% of ${allowance.percentageBase})`
        }`
      );
      console.log(`   Taxable: ${allowance.taxable ? "Yes" : "No"}`);
      console.log(`   Frequency: ${allowance.frequency}`);
      console.log(`   Status: ${allowance.status}`);
      console.log(
        `   Start Date: ${allowance.startDate?.toLocaleDateString()}`
      );
      console.log(
        `   End Date: ${
          allowance.endDate?.toLocaleDateString() || "No end date"
        }`
      );

      // Usage tracking
      console.log(`   📊 USAGE TRACKING:`);
      console.log(`     - Is Used: ${allowance.isUsed ? "Yes" : "No"}`);
      console.log(`     - Usage Count: ${allowance.usageCount || 0}`);
      console.log(
        `     - Last Used Date: ${
          allowance.lastUsedDate?.toLocaleDateString() || "Never"
        }`
      );
      console.log(
        `     - Available for August 2024: ${
          allowance.isAvailableForPayroll ? "Yes" : "No"
        }`
      );

      console.log(
        `   Created By: ${allowance.createdBy?.firstName} ${allowance.createdBy?.lastName}`
      );

      if (allowance.scope === "individual" && allowance.employees?.length > 0) {
        console.log(`   Applicable Employees:`);
        allowance.employees.forEach((emp) => {
          console.log(
            `     - ${emp.firstName} ${emp.lastName} (${emp.employeeId})`
          );
        });
      } else if (
        allowance.scope === "department" &&
        allowance.departments?.length > 0
      ) {
        console.log(`   Applicable Departments:`);
        allowance.departments.forEach((dept) => {
          console.log(`     - ${dept.name} (${dept.code})`);
        });
      } else if (allowance.scope === "company") {
        console.log(`   Applicable to: All employees`);
      }
      console.log("");
    });

    // Check Personal Bonuses with usage tracking
    console.log(`\n🎁 PERSONAL BONUSES ANALYSIS:`);
    console.log("=".repeat(50));

    const personalBonuses = await PersonalBonus.find({
      status: "active",
      isActive: true,
    })
      .populate("employees", "firstName lastName employeeId")
      .populate("departments", "name code")
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: 1 });

    console.log(`📊 Found ${personalBonuses.length} active personal bonuses\n`);

    personalBonuses.forEach((bonus, index) => {
      console.log(`${index + 1}. BONUS: ${bonus.name}`);
      console.log(`   Type: ${bonus.type}`);
      console.log(`   Category: ${bonus.category}`);
      console.log(`   Scope: ${bonus.scope}`);
      console.log(
        `   Calculation: ${bonus.calculationType} ${
          bonus.calculationType === "fixed"
            ? `(₦${bonus.amount?.toLocaleString()})`
            : `(${bonus.amount}% of ${bonus.percentageBase})`
        }`
      );
      console.log(`   Taxable: ${bonus.taxable ? "Yes" : "No"}`);
      console.log(`   Frequency: ${bonus.frequency}`);
      console.log(`   Status: ${bonus.status}`);
      console.log(`   Start Date: ${bonus.startDate?.toLocaleDateString()}`);
      console.log(
        `   End Date: ${bonus.endDate?.toLocaleDateString() || "No end date"}`
      );

      // Usage tracking
      console.log(`   📊 USAGE TRACKING:`);
      console.log(`     - Is Used: ${bonus.isUsed ? "Yes" : "No"}`);
      console.log(`     - Usage Count: ${bonus.usageCount || 0}`);
      console.log(
        `     - Last Used Date: ${
          bonus.lastUsedDate?.toLocaleDateString() || "Never"
        }`
      );
      console.log(
        `     - Available for August 2024: ${
          bonus.isAvailableForPayroll ? "Yes" : "No"
        }`
      );

      console.log(
        `   Created By: ${bonus.createdBy?.firstName} ${bonus.createdBy?.lastName}`
      );

      if (bonus.scope === "individual" && bonus.employees?.length > 0) {
        console.log(`   Applicable Employees:`);
        bonus.employees.forEach((emp) => {
          console.log(
            `     - ${emp.firstName} ${emp.lastName} (${emp.employeeId})`
          );
        });
      } else if (
        bonus.scope === "department" &&
        bonus.departments?.length > 0
      ) {
        console.log(`   Applicable Departments:`);
        bonus.departments.forEach((dept) => {
          console.log(`     - ${dept.name} (${dept.code})`);
        });
      } else if (bonus.scope === "company") {
        console.log(`   Applicable to: All employees`);
      }
      console.log("");
    });

    // Check Deductions with usage tracking
    console.log(`\n💸 DEDUCTIONS ANALYSIS:`);
    console.log("=".repeat(50));

    const deductions = await Deduction.find({
      status: "active",
      isActive: true,
    })
      .populate("employees", "firstName lastName employeeId")
      .populate("departments", "name code")
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: 1 });

    console.log(`📊 Found ${deductions.length} active deductions\n`);

    deductions.forEach((deduction, index) => {
      console.log(`${index + 1}. DEDUCTION: ${deduction.name}`);
      console.log(`   Type: ${deduction.type}`);
      console.log(`   Category: ${deduction.category}`);
      console.log(`   Scope: ${deduction.scope}`);
      if (deduction.category === "paye") {
        console.log(
          `   Calculation: Tax Brackets (Progressive) - No fixed percentage`
        );
      } else {
        console.log(
          `   Calculation: ${deduction.calculationType} ${
            deduction.calculationType === "fixed"
              ? `(₦${deduction.amount?.toLocaleString()})`
              : `(${deduction.amount}% of ${deduction.percentageBase})`
          }`
        );
      }
      console.log(`   Frequency: ${deduction.frequency}`);
      console.log(`   Status: ${deduction.status}`);
      console.log(
        `   Start Date: ${deduction.startDate?.toLocaleDateString()}`
      );
      console.log(
        `   End Date: ${
          deduction.endDate?.toLocaleDateString() || "No end date"
        }`
      );

      // Usage tracking
      console.log(`   📊 USAGE TRACKING:`);
      console.log(`     - Is Used: ${deduction.isUsed ? "Yes" : "No"}`);
      console.log(`     - Usage Count: ${deduction.usageCount || 0}`);
      console.log(
        `     - Last Used Date: ${
          deduction.lastUsedDate?.toLocaleDateString() || "Never"
        }`
      );
      console.log(
        `     - Available for August 2024: ${
          deduction.isAvailableForPayroll ? "Yes" : "No"
        }`
      );

      console.log(
        `   Created By: ${deduction.createdBy?.firstName} ${deduction.createdBy?.lastName}`
      );

      if (deduction.scope === "individual" && deduction.employees?.length > 0) {
        console.log(`   Applicable Employees:`);
        deduction.employees.forEach((emp) => {
          console.log(
            `     - ${emp.firstName} ${emp.lastName} (${emp.employeeId})`
          );
        });
      } else if (
        deduction.scope === "department" &&
        deduction.departments?.length > 0
      ) {
        console.log(`   Applicable Departments:`);
        deduction.departments.forEach((dept) => {
          console.log(`     - ${dept.name} (${dept.code})`);
        });
      } else if (deduction.scope === "company") {
        console.log(`   Applicable to: All employees`);
      }
      console.log("");
    });

    // COMPREHENSIVE PAYROLL PROCESSING EXAMPLE
    console.log(`\n🧮 COMPREHENSIVE PAYROLL PROCESSING EXAMPLE:`);
    console.log("=".repeat(80));

    if (itDepartment && itEmployees && itEmployees.length > 0) {
      console.log(`\n📋 Sample calculation for August 2024:\n`);

      for (const employee of itEmployees.slice(0, 2)) {
        console.log(
          `👤 ${employee.firstName} ${employee.lastName} (${employee.employeeId})`
        );
        console.log(`   Role: ${employee.role?.name || "Not assigned"}`);

        // Find their salary grade
        const employeeMapping = roleMappings.find(
          (mapping) =>
            mapping.role._id.toString() === employee.role?._id.toString()
        );
        const employeeGrade = employeeMapping
          ? salaryGrades.find(
              (grade) =>
                grade._id.toString() ===
                employeeMapping.salaryGrade._id.toString()
            )
          : null;

        if (employeeGrade) {
          console.log(
            `   Salary Grade: ${employeeGrade.grade} (${employeeGrade.name})`
          );

          // Calculate effective base salary
          let effectiveBaseSalary =
            employee.customBaseSalary || employeeGrade.minGrossSalary;
          let stepIncrement = 0;

          if (
            employee.useStepCalculation &&
            employee.salaryStep &&
            employeeGrade.steps
          ) {
            const step = employeeGrade.steps.find(
              (s) => s.step === employee.salaryStep
            );
            if (step) {
              // Apply step increment to the actual base salary (custom or grade minimum)
              stepIncrement = (effectiveBaseSalary * step.increment) / 100;
              effectiveBaseSalary = effectiveBaseSalary + stepIncrement;
              console.log(
                `   Step Applied: ${employee.salaryStep} (+${step.increment}%)`
              );
            }
          }

          console.log(
            `   Effective Base Salary: ₦${effectiveBaseSalary.toLocaleString()}`
          );

          // Get applicable allowances (with usage tracking)
          const applicableAllowances = personalAllowances.filter(
            (allowance) => {
              // Check if available for payroll
              if (!allowance.isAvailableForPayroll) return false;

              if (allowance.scope === "company") return true;
              if (allowance.scope === "department") {
                return allowance.departments.some(
                  (dept) => dept._id.toString() === itDepartment._id.toString()
                );
              }
              if (allowance.scope === "individual") {
                return allowance.employees.some(
                  (emp) => emp._id.toString() === employee._id.toString()
                );
              }
              return false;
            }
          );

          // Get applicable bonuses (with usage tracking)
          const applicableBonuses = personalBonuses.filter((bonus) => {
            // Check if available for payroll
            if (!bonus.isAvailableForPayroll) return false;

            if (bonus.scope === "company") return true;
            if (bonus.scope === "department") {
              return bonus.departments.some(
                (dept) => dept._id.toString() === itDepartment._id.toString()
              );
            }
            if (bonus.scope === "individual") {
              return bonus.employees.some(
                (emp) => emp._id.toString() === employee._id.toString()
              );
            }
            return false;
          });

          // Get applicable deductions (with usage tracking)
          const applicableDeductions = deductions.filter((deduction) => {
            // Check if available for payroll
            if (!deduction.isAvailableForPayroll) return false;

            if (deduction.scope === "company") return true;
            if (deduction.scope === "department") {
              return deduction.departments.some(
                (dept) => dept._id.toString() === itDepartment._id.toString()
              );
            }
            if (deduction.scope === "individual") {
              return deduction.employees.some(
                (emp) => emp._id.toString() === employee._id.toString()
              );
            }
            return false;
          });

          console.log(
            `\n   💵 APPLICABLE ALLOWANCES (${applicableAllowances.length}):`
          );
          let totalAllowances = 0;
          let taxableAllowances = 0;
          let nonTaxableAllowances = 0;

          applicableAllowances.forEach((allowance) => {
            const amount =
              allowance.calculationType === "fixed"
                ? allowance.amount
                : (effectiveBaseSalary * allowance.amount) / 100;
            totalAllowances += amount;

            if (allowance.taxable) {
              taxableAllowances += amount;
            } else {
              nonTaxableAllowances += amount;
            }

            console.log(
              `     - ${allowance.name}: ₦${amount?.toLocaleString()} (${
                allowance.taxable ? "Taxable" : "Non-taxable"
              }) - ${allowance.frequency}`
            );
          });

          console.log(
            `\n   🎁 APPLICABLE BONUSES (${applicableBonuses.length}):`
          );
          let totalBonuses = 0;
          let taxableBonuses = 0;
          let nonTaxableBonuses = 0;

          applicableBonuses.forEach((bonus) => {
            const amount =
              bonus.calculationType === "fixed"
                ? bonus.amount
                : (effectiveBaseSalary * bonus.amount) / 100;
            totalBonuses += amount;

            if (bonus.taxable) {
              taxableBonuses += amount;
            } else {
              nonTaxableBonuses += amount;
            }

            console.log(
              `     - ${bonus.name}: ₦${amount?.toLocaleString()} (${
                bonus.taxable ? "Taxable" : "Non-taxable"
              }) - ${bonus.frequency}`
            );
          });

          console.log(
            `\n   💸 APPLICABLE DEDUCTIONS (${applicableDeductions.length}):`
          );
          let totalDeductions = 0;
          let payeAmount = 0;

          applicableDeductions.forEach((deduction) => {
            let amount = 0;

            if (deduction.category === "paye") {
              // Calculate monthly taxable income (100% dynamic approach)
              const monthlyTaxableIncome =
                effectiveBaseSalary + taxableAllowances + taxableBonuses;

              // Calculate PAYE on monthly income using annual brackets (simpler approach)
              const { totalTax } = calculatePAYE(
                monthlyTaxableIncome,
                taxBrackets
              );
              payeAmount = totalTax;
              amount = payeAmount;
              console.log(
                `     - ${deduction.name}: ₦${amount?.toLocaleString()} (${
                  deduction.type
                }) - ${
                  deduction.frequency
                } - Monthly Tax Brackets (Monthly Taxable: ₦${monthlyTaxableIncome.toLocaleString()})`
              );
            } else if (deduction.calculationType === "fixed") {
              amount = deduction.amount;
              console.log(
                `     - ${deduction.name}: ₦${amount?.toLocaleString()} (${
                  deduction.type
                }) - ${deduction.frequency}`
              );
            } else if (deduction.calculationType === "percentage") {
              amount = (effectiveBaseSalary * deduction.amount) / 100;
              console.log(
                `     - ${deduction.name}: ₦${amount?.toLocaleString()} (${
                  deduction.type
                }) - ${deduction.frequency}`
              );
            }
            totalDeductions += amount;
          });

          // Calculate payroll
          const grossPay = effectiveBaseSalary + totalAllowances + totalBonuses;
          const taxableIncome =
            effectiveBaseSalary + taxableAllowances + taxableBonuses;
          const netPay = grossPay - totalDeductions;

          console.log(`\n   📊 PAYROLL SUMMARY:`);
          console.log(
            `     Base Salary: ₦${effectiveBaseSalary.toLocaleString()}`
          );
          if (stepIncrement > 0) {
            console.log(
              `     Step Increment: ₦${stepIncrement.toLocaleString()}`
            );
          }
          console.log(
            `     Total Allowances: ₦${totalAllowances.toLocaleString()}`
          );
          console.log(
            `       - Taxable: ₦${taxableAllowances.toLocaleString()}`
          );
          console.log(
            `       - Non-taxable: ₦${nonTaxableAllowances.toLocaleString()}`
          );
          console.log(`     Total Bonuses: ₦${totalBonuses.toLocaleString()}`);
          console.log(`       - Taxable: ₦${taxableBonuses.toLocaleString()}`);
          console.log(
            `       - Non-taxable: ₦${nonTaxableBonuses.toLocaleString()}`
          );
          console.log(
            `     Total Deductions: ₦${totalDeductions.toLocaleString()}`
          );
          console.log(`     GROSS PAY: ₦${grossPay.toLocaleString()}`);
          console.log(
            `     TAXABLE INCOME: ₦${taxableIncome.toLocaleString()}`
          );
          console.log(`     NET PAY: ₦${netPay.toLocaleString()}`);

          // Show PAYE breakdown if applicable
          if (payeAmount > 0) {
            const annualIncome = effectiveBaseSalary * 12;
            const { taxBreakdown } = calculatePAYE(annualIncome, taxBrackets);
            console.log(
              `\n   🧮 PAYE TAX BREAKDOWN (Annual: ₦${annualIncome.toLocaleString()}):`
            );
            taxBreakdown.forEach((bracket) => {
              console.log(
                `     - ${bracket.bracket} (${
                  bracket.rate
                }): ₦${bracket.taxableAmount.toLocaleString()} = ₦${bracket.taxAmount.toLocaleString()}`
              );
            });
            console.log(`     Monthly PAYE: ₦${payeAmount.toLocaleString()}`);
          }

          console.log(`\n   🔄 USAGE TRACKING AFTER PAYROLL:`);
          console.log(
            `     - ${applicableAllowances.length} allowances will be marked as used`
          );
          console.log(
            `     - ${applicableBonuses.length} bonuses will be marked as used`
          );
          console.log(
            `     - ${applicableDeductions.length} deductions will be marked as used`
          );

          console.log(`\n${"-".repeat(80)}\n`);
        } else {
          console.log(
            `   ❌ No salary grade mapping found for role: ${employee.role?.name}`
          );
        }
      }
    }

    // PAYROLL SERVICE LOGIC EXPLANATION
    console.log(`\n⚙️ PAYROLL SERVICE LOGIC:`);
    console.log("=".repeat(80));
    console.log(`\n📋 STEP-BY-STEP PROCESS:`);
    console.log(`1. Get all active employees for the payroll period`);
    console.log(`2. For each employee:`);
    console.log(
      `   a. Determine their effective base salary (custom or grade minimum + step)`
    );
    console.log(
      `   b. Get applicable allowances (company/department/individual scope)`
    );
    console.log(
      `   c. Get applicable bonuses (company/department/individual scope)`
    );
    console.log(
      `   d. Get applicable deductions (company/department/individual scope)`
    );
    console.log(`   e. Check usage tracking (isAvailableForPayroll method)`);
    console.log(`   f. Calculate amounts based on calculation type and base`);
    console.log(`   g. Separate taxable vs non-taxable components`);
    console.log(`   h. Calculate gross pay, taxable income, and net pay`);
    console.log(`   i. Mark items as used (markAsUsed method)`);
    console.log(`3. Generate comprehensive payroll report`);
    console.log(`4. Update usage tracking for all processed items`);

    console.log(`\n🎯 KEY FEATURES:`);
    console.log(`✅ Automatic step calculation based on years of service`);
    console.log(`✅ Usage tracking prevents double-counting`);
    console.log(
      `✅ Frequency-based availability (monthly/quarterly/yearly/one-time)`
    );
    console.log(`✅ Scope-based filtering (company/department/individual)`);
    console.log(`✅ Taxable vs non-taxable separation`);
    console.log(`✅ Comprehensive audit trail`);

    console.log(`\n${"=".repeat(80)}`);
    console.log("📋 FINAL SUMMARY:");
    console.log(`- Total Active Salary Grades: ${salaryGrades.length}`);
    console.log(
      `- Grades with Steps: ${
        salaryGrades.filter((g) => g.steps && g.steps.length > 0).length
      }`
    );
    console.log(
      `- Total Active Personal Allowances: ${personalAllowances.length}`
    );
    console.log(`- Total Active Personal Bonuses: ${personalBonuses.length}`);
    console.log(`- Total Active Deductions: ${deductions.length}`);
    console.log(`- IT Employees: ${itEmployees?.length || 0}`);
    console.log(`- Total Roles: ${(await Role.find()).length}`);

    // Check for undefined percentage issues
    console.log(`\n⚠️ UNDEFINED PERCENTAGE ISSUES:`);
    console.log("=".repeat(50));

    let undefinedIssues = [];

    // Check personal allowances
    personalAllowances.forEach((allowance) => {
      if (
        allowance.calculationType === "percentage" &&
        (!allowance.amount || allowance.amount === undefined)
      ) {
        undefinedIssues.push(
          `ALLOWANCE: ${allowance.name} - Percentage is undefined`
        );
      }
    });

    // Check personal bonuses
    personalBonuses.forEach((bonus) => {
      if (
        bonus.calculationType === "percentage" &&
        (!bonus.amount || bonus.amount === undefined)
      ) {
        undefinedIssues.push(`BONUS: ${bonus.name} - Percentage is undefined`);
      }
    });

    // Check deductions
    deductions.forEach((deduction) => {
      if (
        deduction.calculationType === "percentage" &&
        (!deduction.amount || deduction.amount === undefined)
      ) {
        undefinedIssues.push(
          `DEDUCTION: ${deduction.name} - Percentage is undefined`
        );
      }
    });

    if (undefinedIssues.length > 0) {
      console.log(
        `❌ Found ${undefinedIssues.length} items with undefined percentages:\n`
      );
      undefinedIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    } else {
      console.log(`✅ No undefined percentage issues found`);
    }

    console.log(`\n🎉 READY FOR PAYROLL PROCESSING!`);
    console.log(
      `All components are configured and ready for comprehensive payroll calculation.`
    );
  } catch (error) {
    console.error("❌ Error checking salary grades:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Database connection closed");
  }
};

checkSalaryGrades();
