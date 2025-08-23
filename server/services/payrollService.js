import SalaryGrade from "../models/SalaryGrade.js";
import PersonalBonus from "../models/PersonalBonus.js";
import PersonalAllowance from "../models/PersonalAllowance.js";
import Deduction from "../models/Deduction.js";
import User from "../models/User.js";
import Department from "../models/Department.js";

import RoleSalaryGradeMapping from "../models/RoleSalaryGradeMapping.js";
import TaxBracket from "../models/TaxBracket.js";
import AuditService from "./auditService.js";

/**
 * Payroll Processing Service
 * Handles all payroll calculations and processing logic
 */
class PayrollService {
  /**

   * Calculate payroll for a specific employee with comprehensive breakdown
   * @param {string} employeeId - Employee ID
   * @param {number} month - Payroll month (1-12)
   * @param {number} year - Payroll year

   * @param {string} frequency - Payroll frequency (monthly, quarterly, yearly, one_time)
   * @param {boolean} markAsUsed - Whether to mark items as used after processing
   * @returns {Object} Complete payroll calculation
   */

  async calculateEmployeePayroll(
    employeeId,
    month,
    year,
    frequency = "monthly",
    markAsUsed = false
  ) {
    try {
      const Payroll = (await import("../models/Payroll.js")).default;
      const existingPayroll = await Payroll.findOne({
        $or: [
          { employee: employeeId, month: month, year: year },
          { "payrolls.employee": employeeId, month: month, year: year },
        ],
      });

      if (existingPayroll) {
        throw new Error(
          `Payroll already exists for employee ${employeeId} for period ${month}/${year}. Cannot process duplicate payroll.`
        );
      }

      // 1. Get employee data with role mappings
      const employee = await User.findById(employeeId)
        .populate("department", "name code")
        .populate("role", "name level")
        .select(
          "firstName lastName employeeId email department role yearsOfService salaryStep avatar"
        );

      if (!employee) {
        throw new Error("Employee not found");
      }

      // 2. Get role mappings and salary grade
      const roleMappings = await RoleSalaryGradeMapping.find({ isActive: true })
        .populate("role", "name level")
        .populate(
          "salaryGrade",
          "grade name minGrossSalary maxGrossSalary steps allowances customAllowances"
        );

      const employeeMapping = roleMappings.find(
        (mapping) =>
          mapping.role._id.toString() === employee.role?._id.toString()
      );

      if (!employeeMapping) {
        throw new Error("No salary grade mapping found for employee role");
      }

      const salaryGrade = employeeMapping.salaryGrade;

      // 3. Calculate effective base salary with step
      const baseSalary = await this.calculateBaseSalary(employee, salaryGrade);

      // 4. Get applicable allowances (with usage tracking)
      const allowances = await this.calculatePersonalAllowances(
        employeeId,

        employee,
        month,

        year,
        baseSalary.effectiveBaseSalary,
        frequency
      );

      // 5. Get applicable bonuses (with usage tracking)
      const bonuses = await this.calculatePersonalBonuses(
        employeeId,

        employee,
        month,

        year,
        baseSalary.effectiveBaseSalary,
        frequency
      );

      // 6. Get applicable deductions (with usage tracking)
      const deductions = await this.calculateDeductions(
        employeeId,

        employee,
        month,

        year,
        baseSalary.effectiveBaseSalary,
        frequency
      );

      // 7. Calculate PAYE tax based on frequency
      const taxCalculation = await this.calculatePAYETax(
        baseSalary.effectiveBaseSalary,
        allowances.taxableAllowances,
        bonuses.taxableBonuses,
        frequency
      );

      // 8. Calculate final amounts
      // The effectiveBaseSalary already includes grade allowances, so we only add additional allowances
      const grossPay =
        baseSalary.effectiveBaseSalary +
        allowances.totalAllowances +
        bonuses.totalBonuses;

      // For taxable income, we need to include the taxable portion of grade allowances
      const taxableGradeAllowances = 0; // Grade allowances are typically non-taxable
      const taxableIncome =
        baseSalary.actualBaseSalary + // Base salary without allowances
        taxableGradeAllowances +
        allowances.taxableAllowances +
        bonuses.taxableBonuses;
      const totalDeductions =
        deductions.totalDeductions + taxCalculation.payeAmount;
      const netPay = grossPay - totalDeductions;

      // 8.5. Update PAYE deduction amount in the deductions list
      deductions.applicableDeductions.forEach((deduction) => {
        if (deduction.category === "paye") {
          deduction.amount = taxCalculation.payeAmount;
        }
      });

      // 9. Mark items as used if requested (automatic for payroll processing)
      if (markAsUsed) {
        await this.markItemsAsUsed(
          allowances.applicableAllowances,
          bonuses.applicableBonuses,
          deductions.applicableDeductions,
          {
            month,
            year,
            scope: "individual",
            frequency,
            processedBy: "erp-payroll-system",
          }
        );
      }

      // 10. Return comprehensive payroll calculation
      const payrollCalculation = {
        employee: {
          id: employee._id,
          name: `${employee.firstName} ${employee.lastName}`,
          employeeId: employee.employeeId,
          department: employee.department?.name || "N/A",
          role: employee.role?.name || "N/A",
          avatar: employee.avatar,
        },
        period: {
          month,
          year,
          monthName: this.getMonthName(month),
        },
        baseSalary: {
          grade: salaryGrade.grade,
          name: salaryGrade.name,
          customBaseSalary: employee.customBaseSalary,
          effectiveBaseSalary: baseSalary.effectiveBaseSalary,
          actualBaseSalary: baseSalary.actualBaseSalary,
          stepIncrement: baseSalary.stepIncrement,
          gradeAllowances: baseSalary.gradeAllowances,
          totalGradeAllowances: baseSalary.totalGradeAllowances,
        },
        allowances: {
          total: allowances.totalAllowances,
          taxable: allowances.taxableAllowances,
          nonTaxable: allowances.nonTaxableAllowances,
          items: allowances.applicableAllowances,
        },
        bonuses: {
          total: bonuses.totalBonuses,
          taxable: bonuses.taxableBonuses,
          nonTaxable: bonuses.nonTaxableBonuses,
          items: bonuses.applicableBonuses,
        },
        deductions: {
          total: deductions.totalDeductions,
          paye: taxCalculation.payeAmount,
          statutory: deductions.statutoryDeductions,
          voluntary: deductions.voluntaryDeductions,
          items: deductions.applicableDeductions,
        },
        summary: {
          grossPay,
          taxableIncome,
          totalDeductions,
          netPay,
        },
        taxBreakdown: taxCalculation.taxBreakdown,
      };

      // 🔍 DEBUG LOGS FOR PAYROLL CALCULATION
      console.log(
        "🔍 [PAYROLL DEBUG] =========================================="
      );
      console.log(
        "🔍 [PAYROLL DEBUG] EMPLOYEE:",
        payrollCalculation.employee.name
      );
      console.log("🔍 [PAYROLL DEBUG] PERIOD:", `${month}/${year}`);
      console.log("🔍 [PAYROLL DEBUG] BASE SALARY:", {
        effective: payrollCalculation.baseSalary.effectiveBaseSalary,
        actual: payrollCalculation.baseSalary.actualBaseSalary,
        gradeAllowances: payrollCalculation.baseSalary.gradeAllowances,
        totalGradeAllowances:
          payrollCalculation.baseSalary.totalGradeAllowances,
      });
      console.log("🔍 [PAYROLL DEBUG] ALLOWANCES:", {
        total: payrollCalculation.allowances.total,
        taxable: payrollCalculation.allowances.taxable,
        nonTaxable: payrollCalculation.allowances.nonTaxable,
        items: payrollCalculation.allowances.items.length,
      });
      console.log("🔍 [PAYROLL DEBUG] BONUSES:", {
        total: payrollCalculation.bonuses.total,
        taxable: payrollCalculation.bonuses.taxable,
        nonTaxable: payrollCalculation.bonuses.nonTaxable,
        items: payrollCalculation.bonuses.items.length,
      });
      console.log("🔍 [PAYROLL DEBUG] DEDUCTIONS:", {
        total: payrollCalculation.deductions.total,
        paye: payrollCalculation.deductions.paye,
        statutory: payrollCalculation.deductions.statutory,
        voluntary: payrollCalculation.deductions.voluntary,
        items: payrollCalculation.deductions.items.length,
      });
      console.log("🔍 [PAYROLL DEBUG] SUMMARY:", {
        grossPay: payrollCalculation.summary.grossPay,
        taxableIncome: payrollCalculation.summary.taxableIncome,
        totalDeductions: payrollCalculation.summary.totalDeductions,
        netPay: payrollCalculation.summary.netPay,
      });
      console.log(
        "🔍 [PAYROLL DEBUG] =========================================="
      );

      return payrollCalculation;
    } catch (error) {
      console.error("Error calculating employee payroll:", error);
      throw error;
    }
  }

  /**
   * Get step from years of service
   */
  getStepFromYearsOfService(yearsOfService, steps) {
    if (
      !steps ||
      steps.length === 0 ||
      yearsOfService === null ||
      yearsOfService === undefined ||
      yearsOfService < 0
    ) {
      return null;
    }

    const sortedSteps = [...steps].sort(
      (a, b) => a.yearsOfService - b.yearsOfService
    );

    // Find the highest step that the employee qualifies for
    for (let i = sortedSteps.length - 1; i >= 0; i--) {
      if (yearsOfService >= sortedSteps[i].yearsOfService) {
        return sortedSteps[i].step;
      }
    }

    return null;
  }

  /**
   * Calculate base salary from salary grade and step
   */

  async calculateBaseSalary(employee, salaryGrade) {
    try {
      // Calculate salary grade allowances
      const gradeAllowances = {
        housing: salaryGrade.allowances?.housing || 0,
        transport: salaryGrade.allowances?.transport || 0,
        meal: salaryGrade.allowances?.meal || 0,
        other: salaryGrade.allowances?.other || 0,
      };

      // Calculate custom allowances from salary grade
      const customAllowancesTotal =
        salaryGrade.customAllowances?.reduce(
          (sum, allowance) => sum + allowance.amount,
          0
        ) || 0;

      // Total grade allowances
      const totalGradeAllowances =
        gradeAllowances.housing +
        gradeAllowances.transport +
        gradeAllowances.meal +
        gradeAllowances.other +
        customAllowancesTotal;

      // Calculate base salary based on step
      let actualBaseSalary = salaryGrade.minGrossSalary;
      let stepIncrement = 0;
      let effectiveBaseSalary = 0;

      if (salaryGrade.steps && salaryGrade.steps.length > 0) {
        const determinedStep = this.getStepFromYearsOfService(
          employee.yearsOfService,
          salaryGrade.steps
        );

        if (determinedStep) {
          const step = salaryGrade.steps.find((s) => s.step === determinedStep);
          if (step) {
            stepIncrement = (salaryGrade.minGrossSalary * step.increment) / 100;
            actualBaseSalary = salaryGrade.minGrossSalary + stepIncrement;
          }
        } else {
          stepIncrement = 0;
          actualBaseSalary = salaryGrade.minGrossSalary;
        }
      }

      // Final effective base salary is just the actual base salary (allowances are added separately)
      effectiveBaseSalary = actualBaseSalary;

      console.log("🔍 [PAYROLL_SERVICE] Base salary calculation:", {
        employeeId: employee.employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        yearsOfService: employee.yearsOfService,
        determinedStep:
          salaryGrade.steps && salaryGrade.steps.length > 0
            ? this.getStepFromYearsOfService(
                employee.yearsOfService,
                salaryGrade.steps
              )
            : "N/A",
        minGrossSalary: salaryGrade.minGrossSalary,
        stepIncrement,
        actualBaseSalary,
        totalGradeAllowances,
        effectiveBaseSalary,
      });

      return {
        effectiveBaseSalary,
        stepIncrement,
        gradeAllowances,
        customAllowancesTotal,
        totalGradeAllowances,
        actualBaseSalary,
      };
    } catch (error) {
      console.error("Error calculating base salary:", error);
      throw error;
    }
  }

  /**

   * Calculate personal allowances for an employee with usage tracking
   */
  async calculatePersonalAllowances(
    employeeId,
    employee,
    month,
    year,
    effectiveBaseSalary,
    frequency = "monthly"
  ) {
    try {
      // Get all active allowances with usage tracking
      const allowances = await PersonalAllowance.find({
        status: "active",
        isActive: true,
      })
        .populate("employees", "firstName lastName employeeId")
        .populate("departments", "name code");

      let totalAllowances = 0;
      let taxableAllowances = 0;
      let nonTaxableAllowances = 0;
      const applicableAllowances = [];

      for (const allowance of allowances) {
        // Check if available for payroll using frequency logic
        const isAvailable = this.isAvailableForPayroll(
          allowance,
          month,
          year,
          frequency
        );
        if (!isAvailable) {
          console.log(
            `🔍 [ALLOWANCE] ${allowance.name}: Skipped - not available for payroll`
          );
          continue;
        }

        // Check if employee is eligible based on scope
        let isEligible = false;

        if (allowance.scope === "company") {
          isEligible = true;
          console.log(
            `🔍 [ALLOWANCE] ${allowance.name}: Company scope - ELIGIBLE`
          );
        } else if (allowance.scope === "department") {
          isEligible = allowance.departments?.some(
            (dept) => dept._id.toString() === employee.department._id.toString()
          );
          console.log(
            `🔍 [ALLOWANCE] ${allowance.name}: Department scope - ELIGIBLE: ${isEligible}`
          );
        } else if (allowance.scope === "individual") {
          isEligible = allowance.employees?.some(
            (emp) => emp._id.toString() === employeeId.toString()
          );
          console.log(
            `🔍 [ALLOWANCE] ${allowance.name}: Individual scope - ELIGIBLE: ${isEligible}`
          );
        }

        if (isEligible) {
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

          applicableAllowances.push({
            id: allowance._id,
            name: allowance.name,
            type: allowance.type,
            category: allowance.category,
            calculationType: allowance.calculationType,
            amount,
            percentage: allowance.amount,
            taxable: allowance.taxable,
            frequency: allowance.frequency,
          });
        }
      }

      return {
        totalAllowances,
        taxableAllowances,
        nonTaxableAllowances,
        applicableAllowances,
      };
    } catch (error) {
      console.error("Error calculating personal allowances:", error);
      throw error;
    }
  }

  /**

   * Calculate personal bonuses for an employee with usage tracking
   */
  async calculatePersonalBonuses(
    employeeId,
    employee,
    month,
    year,
    effectiveBaseSalary,
    frequency = "monthly"
  ) {
    try {
      // Get all active bonuses with usage tracking
      const bonuses = await PersonalBonus.find({
        status: "active",
        isActive: true,
      })
        .populate("employees", "firstName lastName employeeId")
        .populate("departments", "name code");

      let totalBonuses = 0;
      let taxableBonuses = 0;
      let nonTaxableBonuses = 0;
      const applicableBonuses = [];

      for (const bonus of bonuses) {
        // Check if available for payroll using frequency logic
        if (!this.isAvailableForPayroll(bonus, month, year, frequency))
          continue;

        // Check if employee is eligible based on scope
        let isEligible = false;

        if (bonus.scope === "company") {
          // Company-wide: everyone is eligible
          isEligible = true;
        } else if (bonus.scope === "department") {
          // Department scope: check if employee's department is assigned
          isEligible = bonus.departments?.some(
            (dept) => dept._id.toString() === employee.department._id.toString()
          );
        } else if (bonus.scope === "individual") {
          // Individual scope: check if employee is specifically assigned
          isEligible = bonus.employees?.some(
            (emp) => emp._id.toString() === employeeId.toString()
          );
        }

        if (isEligible) {
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

          applicableBonuses.push({
            id: bonus._id,
            name: bonus.name,
            type: bonus.type,
            category: bonus.category,
            calculationType: bonus.calculationType,
            amount,
            percentage: bonus.amount, // Add the actual percentage
            taxable: bonus.taxable,
            frequency: bonus.frequency,
          });
        }
      }

      return {
        totalBonuses,
        taxableBonuses,
        nonTaxableBonuses,
        applicableBonuses,
      };
    } catch (error) {
      console.error("Error calculating personal bonuses:", error);
      throw error;
    }
  }

  /**

   * Calculate deductions for an employee with usage tracking
   */
  async calculateDeductions(
    employeeId,
    employee,
    month,
    year,
    effectiveBaseSalary,
    frequency = "monthly"
  ) {
    try {
      // Get all active deductions with usage tracking
      const deductions = await Deduction.find({
        status: "active",

        isActive: true,
      })
        .populate("employees", "firstName lastName employeeId")
        .populate("departments", "name code");

      let totalDeductions = 0;
      let statutoryDeductions = 0;
      let voluntaryDeductions = 0;
      const applicableDeductions = [];

      for (const deduction of deductions) {
        // Check if available for payroll using frequency logic
        const isAvailable = this.isAvailableForPayroll(
          deduction,
          month,
          year,
          frequency
        );
        if (!isAvailable) {
          console.log(
            `🔍 [DEDUCTION] ${deduction.name}: Skipped - not available for payroll`
          );
          continue;
        }

        let isEligible = false;

        if (deduction.scope === "company") {
          isEligible = true;
          console.log(
            `🔍 [DEDUCTION] ${deduction.name}: Company scope - ELIGIBLE`
          );
        } else if (deduction.scope === "department") {
          isEligible = deduction.departments?.some(
            (dept) => dept._id.toString() === employee.department._id.toString()
          );
          console.log(
            `🔍 [DEDUCTION] ${deduction.name}: Department scope - ELIGIBLE: ${isEligible}`
          );
        } else if (deduction.scope === "individual") {
          // Individual scope: check if employee is specifically assigned
          isEligible = deduction.employees?.some(
            (emp) => emp._id.toString() === employeeId.toString()
          );
          console.log(
            `🔍 [DEDUCTION] ${deduction.name}: Individual scope - ELIGIBLE: ${isEligible}`
          );
        }

        if (isEligible) {
          let amount = 0;

          // FIXED: Handle PAYE correctly - it should be calculated using tax brackets
          if (deduction.category === "paye") {
            // PAYE is calculated separately using tax brackets in calculatePAYETax
            // Don't set amount to 0 here - let the tax calculation handle it
            amount = 0; // This will be overridden by calculatePAYETax
          } else if (deduction.calculationType === "fixed") {
            amount = deduction.amount;
          } else if (deduction.calculationType === "percentage") {
            amount = (effectiveBaseSalary * deduction.amount) / 100;
          } else if (deduction.calculationType === "tax_brackets") {
            // Tax brackets are handled in calculatePAYETax
            amount = 0; // This will be overridden by calculatePAYETax
          }

          totalDeductions += amount;

          if (deduction.type === "statutory") {
            statutoryDeductions += amount;
          } else {
            voluntaryDeductions += amount;
          }

          applicableDeductions.push({
            id: deduction._id,
            name: deduction.name,
            type: deduction.type,
            category: deduction.category,
            calculationType: deduction.calculationType,
            amount,
            percentage: deduction.amount,
            frequency: deduction.frequency,
          });
        }
      }

      return {
        totalDeductions,
        statutoryDeductions,
        voluntaryDeductions,
        applicableDeductions,
      };
    } catch (error) {
      console.error("Error calculating deductions:", error);
      throw error;
    }
  }

  /**

   * Calculate PAYE tax using tax brackets
   */
  async calculatePAYETax(
    effectiveBaseSalary,
    taxableAllowances,
    taxableBonuses,
    frequency = "monthly"
  ) {
    try {
      // Get tax brackets
      const taxBrackets = await TaxBracket.find({ isActive: true }).sort({
        order: 1,
      });

      // Calculate period taxable income
      const periodTaxableIncome =
        effectiveBaseSalary + taxableAllowances + taxableBonuses;

      const { totalTax, taxBreakdown } = this.calculatePAYE(
        periodTaxableIncome,
        taxBrackets,
        frequency
      );

      console.log(
        `🔍 [PAYE] Taxable Income: ₦${periodTaxableIncome.toLocaleString()}`
      );
      console.log(`🔍 [PAYE] Frequency: ${frequency}`);
      console.log(`🔍 [PAYE] Tax Brackets Found: ${taxBrackets.length}`);
      console.log(`🔍 [PAYE] Calculated Tax: ₦${totalTax.toLocaleString()}`);

      return {
        payeAmount: totalTax,
        taxBreakdown,
      };
    } catch (error) {
      console.error("Error calculating PAYE tax:", error);
      throw error;
    }
  }

  /**
   * Calculate PAYE using tax brackets (helper function)
   * FIXED: Handle different payroll frequencies correctly
   */
  calculatePAYE(periodIncome, taxBrackets, frequency = "monthly") {
    // Ensure frequency is a string
    const freq = String(frequency || "monthly");

    let annualIncome;
    let multiplier;

    // Convert period income to annual income based on frequency
    switch (freq.toLowerCase()) {
      case "monthly":
        annualIncome = periodIncome * 12;
        multiplier = 12;
        break;
      case "quarterly":
        annualIncome = periodIncome * 4;
        multiplier = 4;
        break;
      case "yearly":
        annualIncome = periodIncome;
        multiplier = 1;
        break;
      case "one_time":
        // For one-time, assume it's equivalent to monthly income
        annualIncome = periodIncome * 12;
        multiplier = 12;
        break;
      default:
        // Default to monthly
        annualIncome = periodIncome * 12;
        multiplier = 12;
    }

    let totalAnnualTax = 0;
    let remainingIncome = annualIncome;
    let taxBreakdown = [];

    for (const bracket of taxBrackets) {
      if (remainingIncome <= 0) break;

      const bracketMin = bracket.minAmount;
      const bracketMax = bracket.maxAmount || Infinity;

      // Calculate taxable amount in this bracket
      const taxableInBracket = Math.min(
        remainingIncome,
        bracketMax - bracketMin
      );

      if (taxableInBracket > 0) {
        // Calculate tax for this bracket
        const bracketTax = (taxableInBracket * bracket.taxRate) / 100;
        totalAnnualTax += bracketTax + bracket.additionalTax;

        taxBreakdown.push({
          bracket: bracket.name,
          rate: `${bracket.taxRate}%`,
          taxableAmount: taxableInBracket,
          taxAmount: bracketTax + bracket.additionalTax,
        });

        remainingIncome -= taxableInBracket;
      }
    }

    // Convert annual tax back to the requested period
    const periodTax = totalAnnualTax / multiplier;

    return { totalTax: periodTax, taxBreakdown };
  }

  /**
   * Mark items as used after payroll processing with comprehensive audit trail
   */
  async markItemsAsUsed(allowances, bonuses, deductions, payrollData = {}) {
    try {
      const now = new Date();
      const auditInfo = {
        isUsed: true,
        lastUsedDate: now,
        lastUsedMonth: payrollData.month || now.getMonth() + 1,
        lastUsedYear: payrollData.year || now.getFullYear(),
        lastUsedScope: payrollData.scope || "company",
        lastUsedFrequency: payrollData.frequency || "monthly",
        lastUsedTimestamp: now.toISOString(),
        lastUsedBy: payrollData.processedBy || "system",
      };

      // Mark allowances as used and log audit
      for (const allowance of allowances) {
        await PersonalAllowance.findByIdAndUpdate(allowance.id, {
          $set: auditInfo,
          $inc: { usageCount: 1 },
        });

        // Log audit entry
        await AuditService.logPayrollItemMarkedUsed(
          payrollData.userId || "system",
          {
            id: allowance.id,
            name: allowance.name,
            amount: allowance.amount,
            itemType: "allowance",
            resourceType: "PERSONAL_ALLOWANCE",
            resourceModel: "PersonalAllowance",
            employeeId: payrollData.employeeId,
            employeeName: payrollData.employeeName,
            usageCount: (allowance.usageCount || 0) + 1,
            lastUsedDate: now,
            lastUsedScope: auditInfo.lastUsedScope,
            lastUsedFrequency: auditInfo.lastUsedFrequency,
            lastUsedTimestamp: auditInfo.lastUsedTimestamp,
          },
          payrollData
        );

        console.log(
          `📝 [AUDIT] Marked allowance "${allowance.name}" as used - Scope: ${auditInfo.lastUsedScope}, Period: ${auditInfo.lastUsedMonth}/${auditInfo.lastUsedYear}, Time: ${auditInfo.lastUsedTimestamp}`
        );
      }

      // Mark bonuses as used and log audit
      for (const bonus of bonuses) {
        await PersonalBonus.findByIdAndUpdate(bonus.id, {
          $set: auditInfo,
          $inc: { usageCount: 1 },
        });

        // Log audit entry
        await AuditService.logPayrollItemMarkedUsed(
          payrollData.userId || "system",
          {
            id: bonus.id,
            name: bonus.name,
            amount: bonus.amount,
            itemType: "bonus",
            resourceType: "PERSONAL_BONUS",
            resourceModel: "PersonalBonus",
            employeeId: payrollData.employeeId,
            employeeName: payrollData.employeeName,
            usageCount: (bonus.usageCount || 0) + 1,
            lastUsedDate: now,
            lastUsedScope: auditInfo.lastUsedScope,
            lastUsedFrequency: auditInfo.lastUsedFrequency,
            lastUsedTimestamp: auditInfo.lastUsedTimestamp,
          },
          payrollData
        );

        console.log(
          `📝 [AUDIT] Marked bonus "${bonus.name}" as used - Scope: ${auditInfo.lastUsedScope}, Period: ${auditInfo.lastUsedMonth}/${auditInfo.lastUsedYear}, Time: ${auditInfo.lastUsedTimestamp}`
        );
      }

      // Mark deductions as used and log audit
      for (const deduction of deductions) {
        await Deduction.findByIdAndUpdate(deduction.id, {
          $set: auditInfo,
          $inc: { usageCount: 1 },
        });

        // Log audit entry
        await AuditService.logPayrollItemMarkedUsed(
          payrollData.userId || "system",
          {
            id: deduction.id,
            name: deduction.name,
            amount: deduction.amount,
            itemType: "deduction",
            resourceType: "DEDUCTION",
            resourceModel: "Deduction",
            employeeId: payrollData.employeeId,
            employeeName: payrollData.employeeName,
            usageCount: (deduction.usageCount || 0) + 1,
            lastUsedDate: now,
            lastUsedScope: auditInfo.lastUsedScope,
            lastUsedFrequency: auditInfo.lastUsedFrequency,
            lastUsedTimestamp: auditInfo.lastUsedTimestamp,
          },
          payrollData
        );

        console.log(
          `📝 [AUDIT] Marked deduction "${deduction.name}" as used - Scope: ${auditInfo.lastUsedScope}, Period: ${auditInfo.lastUsedMonth}/${auditInfo.lastUsedYear}, Time: ${auditInfo.lastUsedTimestamp}`
        );
      }

      console.log(
        `✅ [AUDIT] Marked ${allowances.length} allowances, ${bonuses.length} bonuses, and ${deductions.length} deductions as used with comprehensive audit trail`
      );
    } catch (error) {
      console.error("Error marking items as used:", error);
      throw error;
    }
  }

  /**
   * Calculate payroll for all employees (for preview)
   */
  async calculatePayroll(
    month,
    year,
    frequency = "monthly",
    scope = "company",
    scopeId = null,
    userId = "system"
  ) {
    try {
      console.log(
        `🚀 [PAYROLL] Starting payroll processing for ${scope} scope - ${month}/${year} (${frequency})`
      );

      // Get employees based on scope
      let employees;

      switch (scope) {
        case "company":
          employees = await User.find({ isActive: true });
          break;

        case "department":
          if (!scopeId) {
            throw new Error(
              "Department ID(s) are required for department scope"
            );
          }
          // Handle both single department (string) and multiple departments (array)
          const departmentIds = Array.isArray(scopeId) ? scopeId : [scopeId];
          employees = await User.find({
            department: { $in: departmentIds },
            isActive: true,
          });
          break;

        case "individual":
          if (!scopeId) {
            throw new Error("Employee ID(s) are required for individual scope");
          }
          if (!Array.isArray(scopeId)) {
            throw new Error(
              "Individual scope requires an array of employee IDs"
            );
          }
          employees = await User.find({
            _id: { $in: scopeId },
            isActive: true,
          });
          break;

        default:
          throw new Error(
            "Invalid scope. Must be company, department, or individual"
          );
      }

      console.log(
        `👥 [PAYROLL] Found ${employees.length} employees for processing`
      );

      const payrollResults = [];
      let totalGrossPay = 0;
      let totalNetPay = 0;
      let totalDeductions = 0;

      for (const employee of employees) {
        try {
          const payroll = await this.calculateEmployeePayroll(
            employee._id,
            month,
            year,
            frequency,
            false // Always preview mode for calculation
          );
          payrollResults.push(payroll);

          totalGrossPay += payroll.summary.grossPay;
          totalNetPay += payroll.summary.netPay;
          totalDeductions += payroll.summary.totalDeductions;
        } catch (error) {
          console.error(
            `Error processing payroll for employee ${employee._id}:`,
            error
          );
        }
      }

      // Enhanced summary based on scope type
      const payrollSummary = {
        period: { month, year, monthName: this.getMonthName(month), frequency },
        scope: {
          type: scope,
          details: await this.getScopeDetails(scope, scopeId, employees),
        },
        totalEmployees: payrollResults.length,
        totalGrossPay,
        totalNetPay,
        totalDeductions,
        totalTaxableIncome: payrollResults.reduce(
          (sum, payroll) => sum + payroll.summary.taxableIncome,
          0
        ),
        totalPAYE: payrollResults.reduce(
          (sum, payroll) => sum + (payroll.deductions?.paye || 0),
          0
        ),
        breakdown: await this.getScopeBreakdown(
          scope,
          scopeId,
          employees,
          payrollResults
        ),
        payrolls: payrollResults,
      };

      console.log(`✅ [PAYROLL] Payroll processing completed successfully`);
      console.log(
        `📊 [PAYROLL] Summary: ${
          payrollResults.length
        } employees, ₦${totalGrossPay.toLocaleString()} gross, ₦${totalNetPay.toLocaleString()} net`
      );

      return payrollSummary;
    } catch (error) {
      console.error("Error calculating payroll:", error);
      throw error;
    }
  }

  /**
   * Save calculated payroll data to database
   */
  async savePayroll(payrollData, userId = "system") {
    try {
      console.log(`💾 [PAYROLL] Saving calculated payroll data to database`);

      // Import Payroll model
      const Payroll = (await import("../models/Payroll.js")).default;

      for (const payroll of payrollData.payrolls) {
        await this.markItemsAsUsed(
          payroll.allowances?.items || [],
          payroll.bonuses?.items || [],
          payroll.deductions?.items || [],
          {
            userId,
            employeeId: payroll.employee.id,
            employeeName: payroll.employee.name,
            month: payrollData.period.month,
            year: payrollData.period.year,
            scope: payrollData.scope.type,
            frequency: payrollData.period.frequency,
            processedBy: userId,
          }
        );
      }

      // Create Payroll records for each employee
      const savedPayrolls = [];
      for (const payroll of payrollData.payrolls) {
        // Get department ID for department scope
        let departmentId = null;
        if (payrollData.scope.type === "department") {
          // For department scope, we need to get the department ID from the scope details
          if (
            payrollData.scope.details &&
            payrollData.scope.details.departments &&
            payrollData.scope.details.departments.length > 0
          ) {
            departmentId = payrollData.scope.details.departments[0].id;
          }
        }

        const payrollRecord = new Payroll({
          month: payrollData.period.month,
          year: payrollData.period.year,
          frequency: payrollData.period.frequency,
          scope: payrollData.scope.type,
          processingDate: new Date(),
          employee: payroll.employee.id,
          department: departmentId,

          baseSalary: payroll.baseSalary.effectiveBaseSalary,
          // Grade allowances
          housingAllowance: payroll.baseSalary.gradeAllowances?.housing || 0,
          transportAllowance:
            payroll.baseSalary.gradeAllowances?.transport || 0,
          mealAllowance: payroll.baseSalary.gradeAllowances?.meal || 0,
          otherAllowance: payroll.baseSalary.gradeAllowances?.other || 0,
          personalAllowances:
            payroll.allowances?.items?.map((item) => ({
              name: item.name,
              amount: item.amount,
              type: item.calculationType,
            })) || [],
          personalBonuses:
            payroll.bonuses?.items?.map((item) => ({
              name: item.name,
              amount: item.amount,
              type: item.calculationType,
            })) || [],
          deductions:
            payroll.deductions?.items?.map((item) => ({
              name: item.name,
              amount: item.amount,
              type: item.type,
            })) || [],
          grossSalary: payroll.summary.grossPay,
          netSalary: payroll.summary.netPay,
          totalDeductions: payroll.summary.totalDeductions,
          paye: payroll.deductions?.paye || 0,
          pension:
            payroll.deductions?.items?.find((d) => d.category === "pension")
              ?.amount || 0,
          nhis:
            payroll.deductions?.items?.find((d) => d.category === "nhis")
              ?.amount || 0,
          totalAllowances: payroll.allowances?.total || 0,
          totalBonuses: payroll.bonuses?.total || 0,
          taxableIncome: payroll.summary.taxableIncome || 0,
          nonTaxableAllowances:
            (payroll.baseSalary.gradeAllowances?.housing || 0) +
            (payroll.baseSalary.gradeAllowances?.transport || 0) +
            (payroll.baseSalary.gradeAllowances?.meal || 0) +
            (payroll.baseSalary.gradeAllowances?.other || 0),
          createdBy: userId,
          processedBy: userId,
        });

        const savedPayroll = await payrollRecord.save();
        savedPayrolls.push(savedPayroll);
      }

      await AuditService.logPayrollProcessed(userId, {
        payrollId:
          savedPayrolls[0]?._id ||
          `payroll_${payrollData.period.month}_${payrollData.period.year}_${
            payrollData.scope.type
          }_${Date.now()}`,
        month: payrollData.period.month,
        year: payrollData.period.year,
        frequency: payrollData.period.frequency,
        scope: payrollData.scope.type,
        scopeId: userId,
        totalEmployees: payrollData.totalEmployees,
        totalGrossPay: payrollData.totalGrossPay,
        totalNetPay: payrollData.totalNetPay,
        totalDeductions: payrollData.totalDeductions,
      });

      console.log(`✅ [PAYROLL] Payroll data saved successfully`);

      // Return the saved payroll data with the actual database IDs
      return {
        ...payrollData,
        savedPayrolls: savedPayrolls,
        payrollId: savedPayrolls[0]?._id,
      };
    } catch (error) {
      console.error("Error saving payroll:", error);
      throw error;
    }
  }

  /**
   * Process payroll for all employees (legacy method - now uses calculate + save)
   */
  async processPayroll(
    month,
    year,
    frequency = "monthly",
    scope = "company",
    scopeId = null,
    userId = "system",
    isPreview = false
  ) {
    if (isPreview) {
      // For preview, just calculate
      return await this.calculatePayroll(
        month,
        year,
        frequency,
        scope,
        scopeId,
        userId
      );
    } else {
      // For processing, calculate then save
      const calculatedData = await this.calculatePayroll(
        month,
        year,
        frequency,
        scope,
        scopeId,
        userId
      );
      return await this.savePayroll(calculatedData, userId);
    }
  }

  /**
   * Check if an item is available for payroll based on frequency and usage tracking
   */
  isAvailableForPayroll(item, month, year, payrollFrequency = "monthly") {
    // Check if the item is already used
    if (item.isUsed) {
      // If it's a one-time item and already used, it's not available
      if (item.frequency === "one_time") {
        return false;
      }

      // For other frequencies, check if it's been used in this period
      if (item.lastUsedDate) {
        const lastUsedMonth = item.lastUsedDate.getMonth() + 1;
        const lastUsedYear = item.lastUsedDate.getFullYear();

        // If used in the same month/year, it's not available
        if (lastUsedMonth === month && lastUsedYear === year) {
          return false;
        }
      }
    }

    // Check frequency-based availability based on payroll frequency
    switch (payrollFrequency) {
      case "monthly":
        // For monthly payroll, all frequencies are available
        return true;

      case "quarterly":
        // For quarterly payroll, only quarterly and yearly items are available
        return item.frequency === "quarterly" || item.frequency === "yearly";

      case "yearly":
        // For yearly payroll, only yearly items are available
        return item.frequency === "yearly";

      case "one_time":
        // For one-time payroll, only one-time items are available
        return item.frequency === "one_time";

      default:
        return true;
    }
  }

  /**
   * Get month name from month number
   */
  getMonthName(month) {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months[month - 1];
  }

  /**
   * Get detailed scope information
   */
  async getScopeDetails(scope, scopeId, employees) {
    switch (scope) {
      case "company":
        return {
          description: "Company-wide payroll processing",
          departments: await this.getDepartmentBreakdown(employees),
          totalDepartments: new Set(
            employees.map((emp) => emp.department?.toString())
          ).size,
        };

      case "department":
        const departmentIds = Array.isArray(scopeId) ? scopeId : [scopeId];
        const departments = await Department.find({
          _id: { $in: departmentIds },
        });
        return {
          description: `Department-specific payroll processing`,
          departments: departments.map((dept) => ({
            id: dept._id,
            name: dept.name,
            code: dept.code,
            employeeCount: employees.filter(
              (emp) => emp.department?.toString() === dept._id.toString()
            ).length,
          })),
          totalDepartments: departments.length,
          isMultiple: Array.isArray(scopeId),
        };

      case "individual":
        return {
          description: "Individual employee payroll processing",
          employees: employees.map((emp) => ({
            id: emp._id,
            name: `${emp.firstName} ${emp.lastName}`,
            employeeId: emp.employeeId,
            department: emp.department?.name || "No Department",
            role: emp.role?.name || "No Role",
          })),
          totalEmployees: employees.length,
          departments: await this.getDepartmentBreakdown(employees),
        };

      default:
        return { description: "Unknown scope" };
    }
  }

  /**
   * Get department breakdown for employees
   */
  async getDepartmentBreakdown(employees) {
    const departmentMap = new Map();

    for (const emp of employees) {
      const deptId = emp.department?.toString();
      const deptName = emp.department?.name || "No Department";

      if (!departmentMap.has(deptId)) {
        departmentMap.set(deptId, {
          id: emp.department?._id,
          name: deptName,
          employeeCount: 0,
          totalGrossPay: 0,
          totalNetPay: 0,
        });
      }

      departmentMap.get(deptId).employeeCount++;
    }

    return Array.from(departmentMap.values());
  }

  /**
   * Aggregate payroll data for company-wide breakdown
   */
  aggregatePayrollData(payrollResults) {
    if (!payrollResults || !Array.isArray(payrollResults)) {
      return {
        totalBasicSalary: 0,
        totalGradeAllowances: 0,
        totalPersonalAllowances: 0,
        totalPersonalAllowancesTaxable: 0,
        totalPersonalAllowancesNonTaxable: 0,
        totalPersonalBonuses: 0,
        totalPersonalBonusesTaxable: 0,
        totalPersonalBonusesNonTaxable: 0,
        totalDeductions: 0,
        totalDeductionsStatutory: 0,
        totalDeductionsVoluntary: 0,
        totalPAYE: 0,
        totalGrossPay: 0,
        totalTaxableIncome: 0,
        totalNetPay: 0,
        totalEmployees: 0,
      };
    }

    return payrollResults.reduce(
      (aggregate, payroll) => {
        return {
          totalBasicSalary:
            aggregate.totalBasicSalary +
            (payroll.baseSalary?.actualBaseSalary || 0),
          totalGradeAllowances:
            aggregate.totalGradeAllowances +
            (payroll.baseSalary?.totalGradeAllowances || 0),
          totalPersonalAllowances:
            aggregate.totalPersonalAllowances +
            (payroll.allowances?.total || 0),
          totalPersonalAllowancesTaxable:
            aggregate.totalPersonalAllowancesTaxable +
            (payroll.allowances?.taxable || 0),
          totalPersonalAllowancesNonTaxable:
            aggregate.totalPersonalAllowancesNonTaxable +
            (payroll.allowances?.nonTaxable || 0),
          totalPersonalBonuses:
            aggregate.totalPersonalBonuses + (payroll.bonuses?.total || 0),
          totalPersonalBonusesTaxable:
            aggregate.totalPersonalBonusesTaxable +
            (payroll.bonuses?.taxable || 0),
          totalPersonalBonusesNonTaxable:
            aggregate.totalPersonalBonusesNonTaxable +
            (payroll.bonuses?.nonTaxable || 0),
          totalDeductions:
            aggregate.totalDeductions + (payroll.deductions?.total || 0),
          totalDeductionsStatutory:
            aggregate.totalDeductionsStatutory +
            (payroll.deductions?.statutory || 0),
          totalDeductionsVoluntary:
            aggregate.totalDeductionsVoluntary +
            (payroll.deductions?.voluntary || 0),
          totalPAYE: aggregate.totalPAYE + (payroll.deductions?.paye || 0),
          totalGrossPay:
            aggregate.totalGrossPay + (payroll.summary?.grossPay || 0),
          totalTaxableIncome:
            aggregate.totalTaxableIncome +
            (payroll.summary?.taxableIncome || 0),
          totalNetPay: aggregate.totalNetPay + (payroll.summary?.netPay || 0),
          totalEmployees: aggregate.totalEmployees + 1,
        };
      },
      {
        totalBasicSalary: 0,
        totalGradeAllowances: 0,
        totalPersonalAllowances: 0,
        totalPersonalAllowancesTaxable: 0,
        totalPersonalAllowancesNonTaxable: 0,
        totalPersonalBonuses: 0,
        totalPersonalBonusesTaxable: 0,
        totalPersonalBonusesNonTaxable: 0,
        totalDeductions: 0,
        totalDeductionsStatutory: 0,
        totalDeductionsVoluntary: 0,
        totalPAYE: 0,
        totalGrossPay: 0,
        totalTaxableIncome: 0,
        totalNetPay: 0,
        totalEmployees: 0,
      }
    );
  }

  /**
   * Get payroll by ID with full population
   */
  async getPayrollById(payrollId) {
    try {
      const Payroll = (await import("../models/Payroll.js")).default;

      const payroll = await Payroll.findById(payrollId)
        .populate(
          "employee",
          "firstName lastName employeeId email department role avatar position jobTitle"
        )
        .populate("employee.department", "name code")
        .populate("employee.role", "name level description")
        .populate({
          path: "payrolls.employee",
          select:
            "firstName lastName employeeId email department role avatar position jobTitle",
          populate: [
            {
              path: "department",
              select: "name code",
            },
            {
              path: "role",
              select: "name level description",
            },
          ],
        })
        .populate("createdBy", "firstName lastName email")
        .populate("processedBy", "firstName lastName email");

      if (!payroll) {
        throw new Error("Payroll not found");
      }

      return payroll;
    } catch (error) {
      console.error("Error getting payroll by ID:", error);
      throw error;
    }
  }

  /**
   * Get detailed breakdown based on scope
   */
  async getScopeBreakdown(scope, scopeId, employees, payrollResults) {
    switch (scope) {
      case "company":
        return {
          type: "company_wide",
          summary: "All employees across all departments",
          departmentBreakdown: await this.getDepartmentBreakdown(employees),
          aggregatedData: this.aggregatePayrollData(payrollResults),
        };

      case "department":
        const departmentIds = Array.isArray(scopeId) ? scopeId : [scopeId];
        const departments = await Department.find({
          _id: { $in: departmentIds },
        });
        return {
          type: "department_specific",
          summary: `Selected department${
            departments.length > 1 ? "s" : ""
          }: ${departments.map((d) => d.name).join(", ")}`,
          departments: departments.map((dept) => ({
            id: dept._id,
            name: dept.name,
            employeeCount: employees.filter(
              (emp) => emp.department?.toString() === dept._id.toString()
            ).length,
          })),
          aggregatedData: this.aggregatePayrollData(payrollResults),
        };

      case "individual":
        const deptBreakdown = await this.getDepartmentBreakdown(employees);
        return {
          type: "individual_employees",
          summary: `${employees.length} selected employee${
            employees.length > 1 ? "s" : ""
          }`,
          employeeBreakdown: employees.map((emp) => ({
            id: emp._id,
            name: `${emp.firstName} ${emp.lastName}`,
            employeeId: emp.employeeId,
            department: emp.department?.name || "No Department",
            role: emp.role?.name || "No Role",
          })),
          departmentBreakdown: deptBreakdown,
          aggregatedData: this.aggregatePayrollData(payrollResults),
        };

      default:
        return { type: "unknown", summary: "Unknown scope" };
    }
  }
}

export default new PayrollService();
