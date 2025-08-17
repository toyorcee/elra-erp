import PersonalAllowance from "../models/PersonalAllowance.js";

// Get all allowances (filtered by user role)
export const getAllAllowances = async (req, res) => {
  try {
    let query = { isActive: true };

    if (req.departmentFilter) {
      query = { ...query, ...req.departmentFilter };
    }

    const allowances = await PersonalAllowance.find(query)
      .populate("employee", "firstName lastName employeeId")
      .populate("department", "name")
      .populate("salaryGrade", "name baseSalary")
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
    // Return the categories from the model schema
    const categories = [
      { value: "performance", label: "Performance Allowance", taxable: true },
      { value: "special", label: "Special Allowance", taxable: true },
      { value: "hardship", label: "Hardship Allowance", taxable: true },
      { value: "transport", label: "Transport Allowance", taxable: false },
      { value: "housing", label: "Housing Allowance", taxable: false },
      { value: "meal", label: "Meal Allowance", taxable: false },
      { value: "medical", label: "Medical Allowance", taxable: false },
      { value: "education", label: "Education Allowance", taxable: false },
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

// Create new allowance
export const createAllowance = async (req, res) => {
  try {
    const { user } = req;

    const allowanceData = {
      ...req.body,
      createdBy: user._id,
    };

    // HOD can only create allowances for their department
    if (user.role.level === 700) {
      allowanceData.department = user.department;
    }

    const allowance = new PersonalAllowance(allowanceData);
    await allowance.save();

    const populatedAllowance = await PersonalAllowance.findById(allowance._id)
      .populate("employee", "firstName lastName employeeId")
      .populate("department", "name")
      .populate("salaryGrade", "name baseSalary");

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

    // Find the allowance
    const allowance = await PersonalAllowance.findById(id);
    if (!allowance) {
      return res.status(404).json({
        success: false,
        message: "Allowance not found",
      });
    }

    // Check if HOD is trying to update allowance from different department
    if (user.role.level === 700) {
      if (allowance.department?.toString() !== user.department?.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only update allowances for your department",
        });
      }
    }

    const updatedAllowance = await PersonalAllowance.findByIdAndUpdate(
      id,
      { ...req.body, updatedBy: user._id },
      { new: true, runValidators: true }
    )
      .populate("employee", "firstName lastName employeeId")
      .populate("department", "name")
      .populate("salaryGrade", "name baseSalary");

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

    // Check if HOD is trying to delete allowance from different department
    if (user.role.level === 700) {
      if (allowance.department?.toString() !== user.department?.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only delete allowances for your department",
        });
      }
    }

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
      .populate("employee", "firstName lastName employeeId")
      .populate("department", "name")
      .populate("salaryGrade", "name baseSalary");

    if (!allowance) {
      return res.status(404).json({
        success: false,
        message: "Allowance not found",
      });
    }

    // Check if HOD is trying to view allowance from different department
    if (user.role.level === 700) {
      if (allowance.department?.toString() !== user.department?.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only view allowances for your department",
        });
      }
    }

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
