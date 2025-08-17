import PersonalBonus from "../models/PersonalBonus.js";

// Get all bonuses (filtered by user role)
export const getAllBonuses = async (req, res) => {
  try {
    let query = { isActive: true };

    if (req.departmentFilter) {
      query = { ...query, ...req.departmentFilter };
    }

    const bonuses = await PersonalBonus.find(query)
      .populate("employee", "firstName lastName employeeId")
      .populate("department", "name")
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

// Create new bonus
export const createBonus = async (req, res) => {
  try {
    const { user } = req;

    const bonusData = {
      ...req.body,
      createdBy: user._id,
    };

    // HOD can only create bonuses for their department
    if (user.role.level === 700) {
      bonusData.department = user.department;
    }

    const bonus = new PersonalBonus(bonusData);
    await bonus.save();

    const populatedBonus = await PersonalBonus.findById(bonus._id)
      .populate("employee", "firstName lastName employeeId")
      .populate("department", "name");

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

    // Find the bonus
    const bonus = await PersonalBonus.findById(id);
    if (!bonus) {
      return res.status(404).json({
        success: false,
        message: "Bonus not found",
      });
    }

    // Check if HOD is trying to update bonus from different department
    if (user.role.level === 700) {
      if (bonus.department?.toString() !== user.department?.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only update bonuses for your department",
        });
      }
    }

    const updatedBonus = await PersonalBonus.findByIdAndUpdate(
      id,
      { ...req.body, updatedBy: user._id },
      { new: true, runValidators: true }
    )
      .populate("employee", "firstName lastName employeeId")
      .populate("department", "name");

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

    // Check if HOD is trying to delete bonus from different department
    if (user.role.level === 700) {
      if (bonus.department?.toString() !== user.department?.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only delete bonuses for your department",
        });
      }
    }

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
      .populate("employee", "firstName lastName employeeId")
      .populate("department", "name");

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
