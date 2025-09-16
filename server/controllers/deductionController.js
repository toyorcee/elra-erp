import Deduction from "../models/Deduction.js";
import TaxBracket from "../models/TaxBracket.js";
import AuditService from "../services/auditService.js";
import NotificationService from "../services/notificationService.js";
import User from "../models/User.js";
import Department from "../models/Department.js";

// Function to create Nigerian tax brackets
const createNigerianTaxBrackets = async (userId) => {
  // Check if brackets already exist
  const existingBrackets = await TaxBracket.find({ isActive: true });
  if (existingBrackets.length > 0) {
    console.log("✅ Tax brackets already exist, skipping creation");
    return existingBrackets;
  }

  // Nigerian PAYE Tax Brackets (2025)
  const nigerianBrackets = [
    {
      name: "First ₦300,000",
      minAmount: 0,
      maxAmount: 300000,
      taxRate: 7,
      additionalTax: 0,
      order: 1,
      isActive: true,
      createdBy: userId,
    },
    {
      name: "Next ₦300,000",
      minAmount: 300000,
      maxAmount: 600000,
      taxRate: 11,
      additionalTax: 21000, // 7% of ₦300,000
      order: 2,
      isActive: true,
      createdBy: userId,
    },
    {
      name: "Next ₦500,000",
      minAmount: 600000,
      maxAmount: 1100000,
      taxRate: 15,
      additionalTax: 54000, // Previous brackets total
      order: 3,
      isActive: true,
      createdBy: userId,
    },
    {
      name: "Next ₦500,000",
      minAmount: 1100000,
      maxAmount: 1600000,
      taxRate: 19,
      additionalTax: 129000, // Previous brackets total
      order: 4,
      isActive: true,
      createdBy: userId,
    },
    {
      name: "Next ₦1,600,000",
      minAmount: 1600000,
      maxAmount: 3200000,
      taxRate: 21,
      additionalTax: 224000, // Previous brackets total
      order: 5,
      isActive: true,
      createdBy: userId,
    },
    {
      name: "Above ₦3,200,000",
      minAmount: 3200000,
      maxAmount: null, // No upper limit
      taxRate: 24,
      additionalTax: 560000, // Previous brackets total
      order: 6,
      isActive: true,
      createdBy: userId,
    },
  ];

  const createdBrackets = await TaxBracket.insertMany(nigerianBrackets);
  console.log("✅ Nigerian PAYE tax brackets created successfully");
  return createdBrackets;
};

// Get all deductions with department filtering
export const getAllDeductions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      category,
      status,
      employee,
    } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Apply department filter if set by middleware
    if (req.departmentFilter) {
      query = { ...query, ...req.departmentFilter };
    }

    // Apply filters
    if (type) query.type = type;
    if (category) query.category = category;
    if (status) query.status = status;
    if (employee) query.employee = employee;

    const deductions = await Deduction.find(query)
      .populate(
        "employee",
        "firstName lastName email employeeId avatar department"
      )
      .populate(
        "employees",
        "firstName lastName email employeeId avatar department"
      )
      .populate("department", "name description level")
      .populate("departments", "name description level")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Deduction.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        deductions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching deductions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch deductions",
      error: error.message,
    });
  }
};

// Get deduction categories
export const getDeductionCategories = async (req, res) => {
  try {
    const { type } = req.query;

    const allCategories = [
      // Statutory Categories
      { value: "paye", label: "PAYE (Pay As You Earn)", type: "statutory" },
      { value: "pension", label: "Pension", type: "statutory" },
      {
        value: "nhis",
        label: "NHIS (National Health Insurance)",
        type: "statutory",
      },

      // Voluntary Categories
      { value: "loan_repayment", label: "Loan Repayment", type: "voluntary" },
      { value: "insurance", label: "Insurance", type: "voluntary" },
      {
        value: "association_dues",
        label: "Association Dues",
        type: "voluntary",
      },
      { value: "savings", label: "Savings", type: "voluntary" },
      { value: "transport", label: "Transport", type: "voluntary" },
      { value: "cooperative", label: "Cooperative", type: "voluntary" },
      { value: "training_fund", label: "Training Fund", type: "voluntary" },
      { value: "welfare", label: "Welfare Fund", type: "voluntary" },
      { value: "penalty", label: "Penalty", type: "voluntary" },
      { value: "general", label: "General", type: "voluntary" },
    ];

    // Filter categories based on type if provided
    const categories = type
      ? allCategories.filter((cat) => cat.type === type)
      : allCategories;

    res.status(200).json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    console.error("Error fetching deduction categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch deduction categories",
      error: error.message,
    });
  }
};

// Get deduction types
export const getDeductionTypes = async (req, res) => {
  try {
    const types = [
      { value: "voluntary", label: "Voluntary" },
      { value: "statutory", label: "Statutory" },
    ];

    res.status(200).json({
      success: true,
      data: { types },
    });
  } catch (error) {
    console.error("Error fetching deduction types:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch deduction types",
      error: error.message,
    });
  }
};

// Get employees by department IDs
export const getEmployeesByDepartments = async (req, res) => {
  try {
    const { departmentIds } = req.query;

    if (!departmentIds) {
      return res.status(400).json({
        success: false,
        message: "Department IDs are required",
      });
    }

    // Parse department IDs (can be comma-separated)
    const deptIds = departmentIds.split(",").map((id) => id.trim());

    // Find employees in the specified departments
    const employees = await User.find({
      department: { $in: deptIds },
      isActive: true,
      "role.level": { $ne: 1000 },
    }).select("firstName lastName employeeId department email avatar");

    res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error("Error fetching employees by departments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch employees by departments",
      error: error.message,
    });
  }
};

// Create new deduction
export const createDeduction = async (req, res) => {
  try {
    const { user } = req;
    const deductionData = req.body;

    console.log("🔍 [deductionController] Creating deduction:", {
      employee: deductionData.employee,
      name: deductionData.name,
      type: deductionData.type,
      category: deductionData.category,
      scope: deductionData.scope,
      amount: deductionData.amount,
      calculationType: deductionData.calculationType,
      createdBy: user._id,
      userRole: user.role.level,
      userDepartment: user.department,
    });

    if (deductionData.scope === "company") {
      deductionData.employee = null;
      deductionData.employees = null;
      deductionData.department = null;
      deductionData.departments = null;
      console.log(
        "✅ [deductionController] Company-wide deduction - no specific employee/department"
      );
    } else if (deductionData.scope === "department") {
      // HR HOD and Super Admin can create deductions for any department
      if (deductionData.departments && deductionData.departments.length > 0) {
        deductionData.department = null;
      }
      deductionData.employee = null;
      deductionData.employees = null;
      console.log(
        "✅ [deductionController] Department-wide deduction - departments:",
        deductionData.departments || deductionData.department
      );
    } else if (deductionData.scope === "individual") {
      // HR HOD and Super Admin can create deductions for any department
      if (deductionData.departments && deductionData.departments.length > 0) {
        deductionData.department = null;
      }
      deductionData.employee = null;
      console.log(
        "✅ [deductionController] Individual deduction - employees:",
        deductionData.employees || deductionData.employee,
        "departments:",
        deductionData.departments || deductionData.department
      );
    }

    deductionData.createdBy = user._id;

    // Always set isActive to true for new deductions
    deductionData.isActive = true;
    console.log(
      "✅ [deductionController] Set isActive to true for new deduction"
    );

    // Handle PAYE deductions with tax brackets
    if (deductionData.category === "paye") {
      console.log(
        "🔧 [deductionController] Processing PAYE deduction with tax brackets"
      );
      await createNigerianTaxBrackets(user._id);

      // Set correct fields for PAYE
      deductionData.calculationType = "tax_brackets";
      deductionData.amount = null;
      deductionData.useTaxBrackets = true;

      console.log(
        "✅ [deductionController] PAYE deduction configured for tax brackets"
      );
    } else if (
      deductionData.calculationType === "percentage" &&
      deductionData.amount
    ) {
      const amount = parseFloat(deductionData.amount);
      if (isNaN(amount) || amount < 0 || amount > 100) {
        return res.status(400).json({
          success: false,
          message: "Percentage amount must be between 0 and 100",
        });
      }
      deductionData.amount = amount;
    }

    const deduction = await Deduction.create(deductionData);

    console.log("✅ [deductionController] Deduction created successfully:", {
      deductionId: deduction._id,
      employee: deduction.employee,
      name: deduction.name,
      type: deduction.type,
      category: deduction.category,
      scope: deduction.scope,
    });

    const populatedDeduction = await Deduction.findById(deduction._id)
      .populate("employee", "firstName lastName email employeeId")
      .populate("employees", "firstName lastName email employeeId")
      .populate("department", "name")
      .populate("departments", "name")
      .populate("createdBy", "firstName lastName");

    // Log activity
    await AuditService.logDeductionAction(
      user._id,
      "DEDUCTION_CREATED",
      deduction._id,
      {
        deductionName: deduction.name,
        type: deduction.type,
        scope: deduction.scope,
        category: deduction.category,
        amount: deduction.amount,
        calculationType: deduction.calculationType,
        useTaxBrackets: deduction.useTaxBrackets,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );

    const notificationService = new NotificationService();
    await notificationService.sendDeductionNotifications(
      deduction,
      populatedDeduction,
      user
    );

    res.status(201).json({
      success: true,
      message: "Deduction created successfully",
      data: populatedDeduction,
    });
  } catch (error) {
    console.error("❌ [deductionController] Error creating deduction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create deduction",
      error: error.message,
    });
  }
};

// Update deduction
export const updateDeduction = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const updateData = req.body;

    console.log("🔍 [deductionController] Updating deduction:", {
      deductionId: id,
      updateData: {
        name: updateData.name,
        type: updateData.type,
        category: updateData.category,
        scope: updateData.scope,
        amount: updateData.amount,
        calculationType: updateData.calculationType,
      },
      updatedBy: user._id,
      userRole: user.role.level,
    });

    const deduction = await Deduction.findById(id);

    if (!deduction) {
      return res.status(404).json({
        success: false,
        message: "Deduction not found",
      });
    }

    // HR HOD and Super Admin can update deductions from any department
    // No department restrictions for level 700+ users

    // Set updated by
    updateData.updatedBy = user._id;

    if (updateData.scope === "company") {
      updateData.employee = null;
      updateData.employees = null;
      updateData.department = null;
      updateData.departments = null;
    } else if (updateData.scope === "department") {
      // HR HOD and Super Admin can update deductions for any department
      if (updateData.departments && updateData.departments.length > 0) {
        updateData.department = null;
      }
      updateData.employee = null;
      updateData.employees = null;
    } else if (updateData.scope === "individual") {
      // HR HOD and Super Admin can update deductions for any department
      if (updateData.departments && updateData.departments.length > 0) {
        updateData.department = null;
      }
    }

    // Handle PAYE deductions with tax brackets
    if (updateData.category === "paye") {
      console.log(
        "🔧 [deductionController] Processing PAYE deduction update with tax brackets"
      );

      // Ensure tax brackets exist
      await createNigerianTaxBrackets(user._id);

      // Set correct fields for PAYE
      updateData.calculationType = "tax_brackets";
      updateData.amount = null;
      updateData.useTaxBrackets = true;

      console.log(
        "✅ [deductionController] PAYE deduction update configured for tax brackets"
      );
    }

    // Clean up empty strings for ObjectId fields
    if (updateData.employee === "") updateData.employee = null;
    if (updateData.department === "") updateData.department = null;
    if (updateData.employees && updateData.employees.length === 0)
      updateData.employees = null;
    if (updateData.departments && updateData.departments.length === 0)
      updateData.departments = null;

    const updatedDeduction = await Deduction.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("employee", "firstName lastName email employeeId")
      .populate("department", "name")
      .populate("createdBy", "firstName lastName");

    res.status(200).json({
      success: true,
      message: "Deduction updated successfully",
      data: updatedDeduction,
    });
  } catch (error) {
    console.error("Error updating deduction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update deduction",
      error: error.message,
    });
  }
};

// Delete deduction (hard delete)
export const deleteDeduction = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    console.log("🔍 [deductionController] Deleting deduction:", {
      deductionId: id,
      deletedBy: user._id,
      userRole: user.role.level,
    });

    const deduction = await Deduction.findById(id);

    if (!deduction) {
      return res.status(404).json({
        success: false,
        message: "Deduction not found",
      });
    }

    // HR HOD and Super Admin can delete deductions from any department
    // No department restrictions for level 700+ users

    // Log activity before deletion
    await AuditService.logDeductionAction(
      user._id,
      "DEDUCTION_DELETED",
      deduction._id,
      {
        deductionName: deduction.name,
        deductionType: deduction.type,
        deductionCategory: deduction.category,
        action: "permanently deleted",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );

    await Deduction.findByIdAndDelete(id);

    console.log("✅ [deductionController] Deduction permanently deleted:", {
      deductionId: id,
      employee: deduction.employee,
      name: deduction.name,
      type: deduction.type,
    });

    res.status(200).json({
      success: true,
      message: "Deduction permanently deleted successfully",
    });
  } catch (error) {
    console.error("❌ [deductionController] Error deleting deduction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete deduction",
      error: error.message,
    });
  }
};

// Get deduction by ID
export const getDeductionById = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    const deduction = await Deduction.findById(id)
      .populate(
        "employee",
        "firstName lastName email employeeId avatar department"
      )
      .populate(
        "employees",
        "firstName lastName email employeeId avatar department"
      )
      .populate("department", "name description level")
      .populate("departments", "name description level")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email");

    if (!deduction) {
      return res.status(404).json({
        success: false,
        message: "Deduction not found",
      });
    }

    // HR HOD and Super Admin can view deductions from any department
    // No department restrictions for level 700+ users

    res.status(200).json({
      success: true,
      data: deduction,
    });
  } catch (error) {
    console.error("Error fetching deduction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch deduction",
      error: error.message,
    });
  }
};

// Get deductions for specific employee
export const getEmployeeDeductions = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { type, status } = req.query;

    let query = { employee: employeeId };

    // Apply department filter if set by middleware
    if (req.departmentFilter) {
      query = { ...query, ...req.departmentFilter };
    }

    if (type) query.type = type;
    if (status) query.status = status;

    const deductions = await Deduction.find(query)
      .populate("employee", "firstName lastName email employeeId")
      .populate("department", "name")
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { deductions },
    });
  } catch (error) {
    console.error("Error fetching employee deductions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch employee deductions",
      error: error.message,
    });
  }
};

// Get active deductions for payroll processing
export const getActiveDeductionsForPayroll = async (req, res) => {
  try {
    const { employeeId, payrollDate } = req.query;

    if (!employeeId || !payrollDate) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and payroll date are required",
      });
    }

    let query = {
      employee: employeeId,
      status: "active",
      isActive: true,
      startDate: { $lte: new Date(payrollDate) },
      $or: [{ endDate: { $gte: new Date(payrollDate) } }, { endDate: null }],
    };

    // Apply department filter if set by middleware
    if (req.departmentFilter) {
      query = { ...query, ...req.departmentFilter };
    }

    const deductions = await Deduction.find(query)
      .populate("employee", "firstName lastName email employeeId")
      .populate("department", "name")
      .sort({ type: 1, category: 1 });

    res.status(200).json({
      success: true,
      data: { deductions },
    });
  } catch (error) {
    console.error("Error fetching active deductions for payroll:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active deductions for payroll",
      error: error.message,
    });
  }
};

// Bulk update deduction usage for payroll
export const updateDeductionUsage = async (req, res) => {
  try {
    const { deductionIds, payrollId, payrollDate } = req.body;
    const { user } = req;

    if (!deductionIds || !Array.isArray(deductionIds)) {
      return res.status(400).json({
        success: false,
        message: "Deduction IDs array is required",
      });
    }

    const updatePromises = deductionIds.map(async (deductionId) => {
      const deduction = await Deduction.findById(deductionId);

      if (!deduction) {
        throw new Error(`Deduction ${deductionId} not found`);
      }

      // HR HOD and Super Admin can update deductions from any department
      // No department restrictions for level 700+ users

      deduction.isUsed = true;
      deduction.lastUsedInPayroll = payrollId;
      deduction.lastUsedDate = new Date(payrollDate);
      deduction.updatedBy = user._id;

      return deduction.save();
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: "Deduction usage updated successfully",
    });
  } catch (error) {
    console.error("Error updating deduction usage:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update deduction usage",
      error: error.message,
    });
  }
};

// Toggle deduction active status
export const toggleDeductionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    console.log("🔍 [deductionController] Toggling deduction status:", {
      deductionId: id,
      userRole: user.role.level,
      userDepartment: user.department,
    });

    const deduction = await Deduction.findById(id);

    if (!deduction) {
      return res.status(404).json({
        success: false,
        message: "Deduction not found",
      });
    }

    // Role-based access control
    if (user.role.level >= 700) {
      // HR HOD and Super Admin can toggle deductions from any department
      // No department restrictions for level 700+ users
    } else {
      // Only Super Admin (1000) and HOD (700) can toggle
      return res.status(403).json({
        success: false,
        message: "You don't have permission to toggle deductions",
      });
    }

    // Toggle the isActive status
    deduction.isActive = !deduction.isActive;
    deduction.updatedBy = user._id;

    await deduction.save();

    console.log("✅ [deductionController] Deduction status toggled:", {
      deductionId: deduction._id,
      name: deduction.name,
      isActive: deduction.isActive,
      toggledBy: user._id,
    });

    // Log activity
    await AuditService.logDeductionAction(
      user._id,
      deduction.isActive ? "DEDUCTION_ACTIVATED" : "DEDUCTION_DEACTIVATED",
      deduction._id,
      {
        deductionName: deduction.name,
        isActive: deduction.isActive,
        action: deduction.isActive ? "activated" : "deactivated",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );

    const updatedDeduction = await Deduction.findById(deduction._id)
      .populate("employee", "firstName lastName email employeeId")
      .populate("department", "name")
      .populate("updatedBy", "firstName lastName");

    res.json({
      success: true,
      message: `Deduction ${
        deduction.isActive ? "activated" : "deactivated"
      } successfully`,
      data: updatedDeduction,
    });
  } catch (error) {
    console.error(
      "❌ [deductionController] Error toggling deduction status:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Failed to toggle deduction status",
      error: error.message,
    });
  }
};
