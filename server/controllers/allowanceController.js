import PersonalAllowance from "../models/PersonalAllowance.js";
import NotificationService from "../services/notificationService.js";

// Get all allowances (filtered by user role)
export const getAllAllowances = async (req, res) => {
  try {
    const { user } = req;
    const { type, frequency, scope } = req.query;
    let query = { isActive: true };

    if (type && type !== "") {
      query.type = type;
    }
    if (frequency && frequency !== "") {
      query.frequency = frequency;
    }
    if (scope && scope !== "") {
      query.scope = scope;
    }

    if (!scope || scope === "") {
      if (user.role.level >= 700) {
        // HR HOD and Super Admin can see all allowances
        // No additional filtering needed - they can see everything
      } else {
        // Regular users can only see their own allowances
        query.$or = [
          { scope: "individual", employee: user._id },
          { scope: "department", department: user.department },
          { scope: "company" },
        ];
      }
    }

    const allowances = await PersonalAllowance.find(query)
      .populate("employee", "firstName lastName employeeId avatar")
      .populate("employees", "firstName lastName employeeId avatar")
      .populate("department", "name")
      .populate("departments", "name")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: allowances,
      count: allowances.length,
    });
  } catch (error) {
    console.error("Error fetching allowances:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch allowances",
      error: error.message,
    });
  }
};

// Get allowance categories
export const getAllowanceCategories = async (req, res) => {
  try {
    const categories = [
      { value: "transport", label: "Transport Allowance", taxable: false },
      { value: "housing", label: "Housing Allowance", taxable: false },
      { value: "meal", label: "Meal Allowance", taxable: false },
      { value: "medical", label: "Medical Allowance", taxable: false },
      { value: "education", label: "Education Allowance", taxable: false },
      { value: "hardship", label: "Hardship Allowance", taxable: true },
      { value: "special", label: "Special Allowance", taxable: true },
      { value: "performance", label: "Performance Allowance", taxable: true },
      { value: "other", label: "Other Allowance", taxable: true },
    ];

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching allowance categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch allowance categories",
      error: error.message,
    });
  }
};

// Get allowance types
export const getAllowanceTypes = async (req, res) => {
  try {
    // Return the types from the model schema
    const types = [
      { value: "transport", label: "Transport Allowance", taxable: false },
      { value: "housing", label: "Housing Allowance", taxable: false },
      { value: "meal", label: "Meal Allowance", taxable: false },
      { value: "medical", label: "Medical Allowance", taxable: false },
      { value: "education", label: "Education Allowance", taxable: false },
      { value: "hardship", label: "Hardship Allowance", taxable: true },
      { value: "special", label: "Special Allowance", taxable: true },
      { value: "performance", label: "Performance Allowance", taxable: true },
      { value: "other", label: "Other Allowance", taxable: true },
    ];

    res.status(200).json({
      success: true,
      data: types,
    });
  } catch (error) {
    console.error("Error fetching allowance types:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch allowance types",
      error: error.message,
    });
  }
};

// Get taxable status for allowance type
export const getTaxableStatus = async (req, res) => {
  try {
    const { type } = req.query;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Allowance type is required",
      });
    }

    const nonTaxableAllowances = [
      "transport",
      "meal",
      "medical",
      "housing",
      "education",
    ];
    const taxable = !nonTaxableAllowances.includes(type);

    res.status(200).json({
      success: true,
      data: { taxable },
    });
  } catch (error) {
    console.error("Error fetching taxable status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch taxable status",
      error: error.message,
    });
  }
};

// Get employees by departments (for allowance assignment)
export const getEmployeesByDepartments = async (req, res) => {
  try {
    const { departmentIds } = req.query;
    const { user } = req;

    if (!departmentIds) {
      return res.status(400).json({
        success: false,
        message: "Department IDs are required",
      });
    }

    // Parse departmentIds from query string (comma-separated)
    const departmentIdsArray = departmentIds.split(",").map((id) => id.trim());

    // Find employees in the specified departments
    const User = (await import("../models/User.js")).default;
    const employees = await User.find({
      department: { $in: departmentIdsArray },
      isActive: true,
      "role.level": { $ne: 1000 },
    })
      .select("firstName lastName email employeeId avatar department")
      .populate("department", "name")
      .sort({ firstName: 1, lastName: 1 });

    return res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error("Error fetching employees by departments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
      error: error.message,
    });
  }
};

// Create new allowance
export const createAllowance = async (req, res) => {
  try {
    const { user } = req;
    const allowanceData = { ...req.body };

    console.log("🔍 [allowanceController] Creating allowance:", {
      employee: allowanceData.employee,
      name: allowanceData.name,
      type: allowanceData.type,
      scope: allowanceData.scope,
      amount: allowanceData.amount,
      calculationType: allowanceData.calculationType,
      createdBy: user._id,
      userRole: user.role.level,
      userDepartment: user.department,
    });

    // Handle scope-based data cleaning (same as bonus controller)
    if (allowanceData.scope === "company") {
      allowanceData.employee = null;
      allowanceData.employees = null;
      allowanceData.department = null;
      allowanceData.departments = null;
      console.log(
        "✅ [allowanceController] Company-wide allowance - no specific employee/department"
      );
    } else if (allowanceData.scope === "department") {
      // HR HOD and Super Admin can create allowances for any department
      if (allowanceData.departments && allowanceData.departments.length > 0) {
        allowanceData.department = null;
      }
      allowanceData.employee = null;
      allowanceData.employees = null;
      console.log(
        "✅ [allowanceController] Department-wide allowance - departments:",
        allowanceData.departments || allowanceData.department
      );
    } else if (allowanceData.scope === "individual") {
      // HR HOD and Super Admin can create allowances for any department
      if (allowanceData.departments && allowanceData.departments.length > 0) {
        allowanceData.department = null;
      }
      allowanceData.employee = null;
      console.log(
        "✅ [allowanceController] Individual allowance - employees:",
        allowanceData.employees || allowanceData.employee,
        "departments:",
        allowanceData.departments || allowanceData.department
      );
    }

    allowanceData.createdBy = user._id;

    // Always set isActive to true for new allowances
    allowanceData.isActive = true;
    console.log(
      "✅ [allowanceController] Set isActive to true for new allowance"
    );

    // Clean and validate amount for percentage calculations
    if (
      allowanceData.calculationType === "percentage" &&
      allowanceData.amount
    ) {
      const amount = parseFloat(allowanceData.amount);
      if (isNaN(amount) || amount < 0 || amount > 100) {
        return res.status(400).json({
          success: false,
          message: "Percentage amount must be between 0 and 100",
        });
      }
      allowanceData.amount = amount;
    }

    console.log(
      "🔍 [allowanceController] Final allowance data before creation:",
      {
        scope: allowanceData.scope,
        employee: allowanceData.employee,
        employees: allowanceData.employees,
        department: allowanceData.department,
        departments: allowanceData.departments,
      }
    );

    const allowance = await PersonalAllowance.create(allowanceData);

    const populatedAllowance = await PersonalAllowance.findById(allowance._id)
      .populate("employee", "firstName lastName employeeId avatar")
      .populate("employees", "firstName lastName employeeId avatar")
      .populate("department", "name")
      .populate("departments", "name")
      .populate("createdBy", "firstName lastName email");

    // Send notifications to relevant users
    const notificationService = new NotificationService();
    await notificationService.sendAllowanceNotifications(
      allowance,
      populatedAllowance,
      user
    );

    res.status(201).json({
      success: true,
      message: "Allowance created successfully",
      data: populatedAllowance,
    });
  } catch (error) {
    console.error("Error creating allowance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create allowance",
      error: error.message,
    });
  }
};

// Update allowance
export const updateAllowance = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const updateData = { ...req.body };

    // Find the allowance
    const allowance = await PersonalAllowance.findById(id);
    if (!allowance) {
      return res.status(404).json({
        success: false,
        message: "Allowance not found",
      });
    }

    // HR HOD and Super Admin can update allowances from any department
    // No department restrictions for level 700+ users

    // Handle scope-based data cleaning (same as create function)
    if (updateData.scope === "company") {
      updateData.employee = null;
      updateData.employees = null;
      updateData.department = null;
      updateData.departments = null;
      console.log(
        "✅ [allowanceController] Company-wide allowance update - no specific employee/department"
      );
    } else if (updateData.scope === "department") {
      // HR HOD and Super Admin can update allowances for any department
      if (updateData.departments && updateData.departments.length > 0) {
        updateData.department = null;
      }
      updateData.employee = null;
      updateData.employees = null;
      console.log(
        "✅ [allowanceController] Department-wide allowance update - departments:",
        updateData.departments || updateData.department
      );
    } else if (updateData.scope === "individual") {
      // HR HOD and Super Admin can update allowances for any department
      if (updateData.departments && updateData.departments.length > 0) {
        updateData.department = null;
      }
      updateData.employee = null;
      console.log(
        "✅ [allowanceController] Individual allowance update - employees:",
        updateData.employees || updateData.employee,
        "departments:",
        updateData.departments || updateData.department
      );
    }

    updateData.updatedBy = user._id;

    // Clean and validate amount for percentage calculations
    if (updateData.calculationType === "percentage" && updateData.amount) {
      const amount = parseFloat(updateData.amount);
      if (isNaN(amount) || amount < 0 || amount > 100) {
        return res.status(400).json({
          success: false,
          message: "Percentage amount must be between 0 and 100",
        });
      }
      updateData.amount = amount;
    }

    console.log("🔍 [allowanceController] Final update data:", {
      scope: updateData.scope,
      employee: updateData.employee,
      employees: updateData.employees,
      department: updateData.department,
      departments: updateData.departments,
    });

    const updatedAllowance = await PersonalAllowance.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("employee", "firstName lastName employeeId avatar")
      .populate("employees", "firstName lastName employeeId avatar")
      .populate("department", "name")
      .populate("departments", "name")
      .populate("updatedBy", "firstName lastName email");

    res.status(200).json({
      success: true,
      message: "Allowance updated successfully",
      data: updatedAllowance,
    });
  } catch (error) {
    console.error("Error updating allowance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update allowance",
      error: error.message,
    });
  }
};

// Delete allowance (soft delete)
export const deleteAllowance = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    // Find the allowance
    const allowance = await PersonalAllowance.findById(id);
    if (!allowance) {
      return res.status(404).json({
        success: false,
        message: "Allowance not found",
      });
    }

    // HR HOD and Super Admin can delete allowances from any department
    // No department restrictions for level 700+ users

    // Soft delete
    await PersonalAllowance.findByIdAndUpdate(id, {
      isActive: false,
      updatedBy: user._id,
    });

    res.status(200).json({
      success: true,
      message: "Allowance deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting allowance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete allowance",
      error: error.message,
    });
  }
};

// Get allowance by ID
export const getAllowanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    const allowance = await PersonalAllowance.findById(id)
      .populate("employee", "firstName lastName employeeId avatar department")
      .populate("employees", "firstName lastName employeeId avatar department")
      .populate("department", "name")
      .populate("departments", "name")
      .populate("createdBy", "firstName lastName email avatar")
      .populate("updatedBy", "firstName lastName email avatar");

    if (!allowance) {
      return res.status(404).json({
        success: false,
        message: "Allowance not found",
      });
    }

    // HR HOD and Super Admin can view allowances from any department
    // No department restrictions for level 700+ users

    res.status(200).json({
      success: true,
      data: allowance,
    });
  } catch (error) {
    console.error("Error fetching allowance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch allowance",
      error: error.message,
    });
  }
};
