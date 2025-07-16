import { validationResult } from "express-validator";
import SystemSettings from "../models/SystemSettings.js";
import Department from "../models/Department.js";
import User from "../models/User.js";

// @desc    Get system settings
// @route   GET /api/system-settings
// @access  Private (Admin+)
export const getSystemSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();

    res.status(200).json({
      success: true,
      data: {
        settings,
      },
    });
  } catch (error) {
    console.error("Get system settings error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Update system settings
// @route   PUT /api/system-settings
// @access  Private (Super Admin only)
export const updateSystemSettings = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const updates = req.body;
    const settings = await SystemSettings.updateSettings(updates, req.user.id);

    res.status(200).json({
      success: true,
      message: "System settings updated successfully",
      data: {
        settings,
      },
    });
  } catch (error) {
    console.error("Update system settings error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get registration settings (public)
// @route   GET /api/system-settings/registration
// @access  Public
export const getRegistrationSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();

    // Only return registration-related settings
    const registrationSettings = {
      allowPublicRegistration: settings.registration.allowPublicRegistration,
      requireDepartmentSelection:
        settings.registration.requireDepartmentSelection,
      defaultDepartment: settings.registration.defaultDepartment,
    };

    res.status(200).json({
      success: true,
      data: {
        registration: registrationSettings,
      },
    });
  } catch (error) {
    console.error("Get registration settings error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get available departments for registration
// @route   GET /api/system-settings/departments
// @access  Public
export const getAvailableDepartments = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();

    // Get all active departments
    const departments = await Department.find({ isActive: true })
      .select("name code description")
      .sort({ name: 1 });

    // Filter out External department if not allowed
    const availableDepartments = settings.departments.allowExternalDepartment
      ? departments
      : departments.filter((dept) => dept.code !== "EXT");

    res.status(200).json({
      success: true,
      data: {
        departments: availableDepartments,
        requireSelection: settings.registration.requireDepartmentSelection,
        defaultDepartment: settings.registration.defaultDepartment,
      },
    });
  } catch (error) {
    console.error("Get available departments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Reset system to default settings
// @route   POST /api/system-settings/reset
// @access  Private (Super Admin only)
export const resetSystemSettings = async (req, res) => {
  try {
    // Delete existing settings
    await SystemSettings.deleteMany({});

    // Create new default settings
    const settings = await SystemSettings.getInstance();
    settings.updatedBy = req.user.id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: "System settings reset to defaults successfully",
      data: {
        settings,
      },
    });
  } catch (error) {
    console.error("Reset system settings error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
