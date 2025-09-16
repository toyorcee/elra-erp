import PersonalBonus from "../models/PersonalBonus.js";
import NotificationService from "../services/notificationService.js";

// Get all bonuses (filtered by user role)
export const getAllBonuses = async (req, res) => {
  try {
    const { user } = req;
    const { type, frequency, scope } = req.query;
    let query = { isActive: true };

    // Apply additional filters from query parameters first
    if (type && type !== "") {
      query.type = type;
    }
    if (frequency && frequency !== "") {
      query.frequency = frequency;
    }
    if (scope && scope !== "") {
      query.scope = scope;
    }

    // Apply department filter based on user role (but only if scope filter is not applied)
    if (!scope || scope === "") {
      if (user.role.level >= 700) {
        // HR HOD and Super Admin can see all bonuses
        // No additional filtering needed - they can see everything
      } else {
        // Regular users can only see their own bonuses
        query.$or = [
          { scope: "individual", employee: user._id },
          { scope: "department", department: user.department },
          { scope: "company" },
        ];
      }
    }

    const bonuses = await PersonalBonus.find(query)
      .populate("employee", "firstName lastName employeeId avatar")
      .populate("employees", "firstName lastName employeeId avatar")
      .populate("department", "name")
      .populate("departments", "name")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: bonuses,
      count: bonuses.length,
    });
  } catch (error) {
    console.error("Error fetching bonuses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bonuses",
      error: error.message,
    });
  }
};

// Get bonus categories
export const getBonusCategories = async (req, res) => {
  try {
    // Return the categories from the model schema
    const categories = [
      { value: "performance", label: "Performance Bonus", taxable: true },
      { value: "year_end", label: "Year End Bonus", taxable: true },
      { value: "special", label: "Special Bonus", taxable: true },
      { value: "achievement", label: "Achievement Bonus", taxable: true },
      { value: "retention", label: "Retention Bonus", taxable: false },
      { value: "project", label: "Project Bonus", taxable: true },
      { value: "other", label: "Other Bonus", taxable: true },
    ];

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching bonus categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bonus categories",
      error: error.message,
    });
  }
};

// Get bonus types
export const getBonusTypes = async (req, res) => {
  try {
    // Return the types from the model schema
    const types = [
      { value: "personal", label: "Personal Bonus", taxable: true },
      { value: "performance", label: "Performance Bonus", taxable: true },
      {
        value: "thirteenth_month",
        label: "Thirteenth Month Bonus",
        taxable: true,
      },
      { value: "special", label: "Special Bonus", taxable: true },
      { value: "achievement", label: "Achievement Bonus", taxable: true },
      { value: "retention", label: "Retention Bonus", taxable: false },
      { value: "project", label: "Project Bonus", taxable: true },
      { value: "year_end", label: "Year End Bonus", taxable: true },
    ];

    res.status(200).json({
      success: true,
      data: types,
    });
  } catch (error) {
    console.error("Error fetching bonus types:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bonus types",
      error: error.message,
    });
  }
};

// Get taxable status for bonus type
export const getTaxableStatus = async (req, res) => {
  try {
    const { type } = req.query;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Bonus type is required",
      });
    }

    const nonTaxableBonuses = ["retention"];
    const taxable = !nonTaxableBonuses.includes(type);

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

// Get employees by departments (for bonus assignment)
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

// Create new bonus
export const createBonus = async (req, res) => {
  try {
    const { user } = req;
    const bonusData = { ...req.body };

    console.log("🔍 [bonusController] Creating bonus:", {
      employee: bonusData.employee,
      name: bonusData.name,
      type: bonusData.type,
      scope: bonusData.scope,
      amount: bonusData.amount,
      calculationType: bonusData.calculationType,
      createdBy: user._id,
      userRole: user.role.level,
      userDepartment: user.department,
    });

    // Handle scope-based data cleaning (same as deduction controller)
    if (bonusData.scope === "company") {
      bonusData.employee = null;
      bonusData.employees = null;
      bonusData.department = null;
      bonusData.departments = null;
      console.log(
        "✅ [bonusController] Company-wide bonus - no specific employee/department"
      );
    } else if (bonusData.scope === "department") {
      // HR HOD and Super Admin can create bonuses for any department
      if (bonusData.departments && bonusData.departments.length > 0) {
        bonusData.department = null;
      }
      bonusData.employee = null;
      bonusData.employees = null;
      console.log(
        "✅ [bonusController] Department-wide bonus - departments:",
        bonusData.departments || bonusData.department
      );
    } else if (bonusData.scope === "individual") {
      // HR HOD and Super Admin can create bonuses for any department
      if (bonusData.departments && bonusData.departments.length > 0) {
        bonusData.department = null;
      }
      bonusData.employee = null;
      console.log(
        "✅ [bonusController] Individual bonus - employees:",
        bonusData.employees || bonusData.employee,
        "departments:",
        bonusData.departments || bonusData.department
      );
    }

    bonusData.createdBy = user._id;

    // Always set isActive to true for new bonuses
    bonusData.isActive = true;
    console.log("✅ [bonusController] Set isActive to true for new bonus");

    // Clean and validate amount for percentage calculations
    if (bonusData.calculationType === "percentage" && bonusData.amount) {
      const amount = parseFloat(bonusData.amount);
      if (isNaN(amount) || amount < 0 || amount > 100) {
        return res.status(400).json({
          success: false,
          message: "Percentage amount must be between 0 and 100",
        });
      }
      bonusData.amount = amount;
    }

    console.log("🔍 [bonusController] Final bonus data before creation:", {
      scope: bonusData.scope,
      employee: bonusData.employee,
      employees: bonusData.employees,
      department: bonusData.department,
      departments: bonusData.departments,
    });

    const bonus = await PersonalBonus.create(bonusData);

    const populatedBonus = await PersonalBonus.findById(bonus._id)
      .populate("employee", "firstName lastName employeeId avatar")
      .populate("employees", "firstName lastName employeeId avatar")
      .populate("department", "name")
      .populate("departments", "name")
      .populate("createdBy", "firstName lastName email");

    // Send notifications to relevant users
    const notificationService = new NotificationService();
    await notificationService.sendBonusNotifications(
      bonus,
      populatedBonus,
      user
    );

    res.status(201).json({
      success: true,
      message: "Bonus created successfully",
      data: populatedBonus,
    });
  } catch (error) {
    console.error("Error creating bonus:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create bonus",
      error: error.message,
    });
  }
};

// Update bonus
export const updateBonus = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const updateData = { ...req.body };

    // Find the bonus
    const bonus = await PersonalBonus.findById(id);
    if (!bonus) {
      return res.status(404).json({
        success: false,
        message: "Bonus not found",
      });
    }

    // HR HOD and Super Admin can update bonuses from any department
    // No department restrictions for level 700+ users

    // Handle scope-based data cleaning (same as create function)
    if (updateData.scope === "company") {
      updateData.employee = null;
      updateData.employees = null;
      updateData.department = null;
      updateData.departments = null;
      console.log(
        "✅ [bonusController] Company-wide bonus update - no specific employee/department"
      );
    } else if (updateData.scope === "department") {
      // HR HOD and Super Admin can update bonuses for any department
      if (updateData.departments && updateData.departments.length > 0) {
        updateData.department = null;
      }
      updateData.employee = null;
      updateData.employees = null;
      console.log(
        "✅ [bonusController] Department-wide bonus update - departments:",
        updateData.departments || updateData.department
      );
    } else if (updateData.scope === "individual") {
      // HR HOD and Super Admin can update bonuses for any department
      if (updateData.departments && updateData.departments.length > 0) {
        updateData.department = null;
      }
      updateData.employee = null;
      console.log(
        "✅ [bonusController] Individual bonus update - employees:",
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

    console.log("🔍 [bonusController] Final update data:", {
      scope: updateData.scope,
      employee: updateData.employee,
      employees: updateData.employees,
      department: updateData.department,
      departments: updateData.departments,
    });

    const updatedBonus = await PersonalBonus.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("employee", "firstName lastName employeeId avatar")
      .populate("employees", "firstName lastName employeeId avatar")
      .populate("department", "name")
      .populate("departments", "name")
      .populate("updatedBy", "firstName lastName email");

    res.status(200).json({
      success: true,
      message: "Bonus updated successfully",
      data: updatedBonus,
    });
  } catch (error) {
    console.error("Error updating bonus:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update bonus",
      error: error.message,
    });
  }
};

// Delete bonus (soft delete)
export const deleteBonus = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    // Find the bonus
    const bonus = await PersonalBonus.findById(id);
    if (!bonus) {
      return res.status(404).json({
        success: false,
        message: "Bonus not found",
      });
    }

    // HR HOD and Super Admin can delete bonuses from any department
    // No department restrictions for level 700+ users

    // Soft delete
    await PersonalBonus.findByIdAndUpdate(id, {
      isActive: false,
      updatedBy: user._id,
    });

    res.status(200).json({
      success: true,
      message: "Bonus deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting bonus:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete bonus",
      error: error.message,
    });
  }
};

// Get bonus by ID
export const getBonusById = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    const bonus = await PersonalBonus.findById(id)
      .populate("employee", "firstName lastName employeeId avatar department")
      .populate("employees", "firstName lastName employeeId avatar department")
      .populate("department", "name")
      .populate("departments", "name")
      .populate("createdBy", "firstName lastName email avatar")
      .populate("updatedBy", "firstName lastName email avatar");

    if (!bonus) {
      return res.status(404).json({
        success: false,
        message: "Bonus not found",
      });
    }

    // Check if HOD is trying to view bonus from different department
    if (user.role.level === 700) {
      if (bonus.department?.toString() !== user.department?.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only view bonuses for your department",
        });
      }
    }

    res.status(200).json({
      success: true,
      data: bonus,
    });
  } catch (error) {
    console.error("Error fetching bonus:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bonus",
      error: error.message,
    });
  }
};
