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
    const previousSettings = await SystemSettings.getSettings();

    // Log the changes being made
    console.log(
      `🔧 System Settings Update - User: ${req.user.username} (${req.user.email})`
    );
    console.log(
      `📝 Update Type: ${
        Object.keys(updates).length === 1 ? "Partial Update" : "Full Update"
      }`
    );
    console.log(`🔄 Requested Updates:`, JSON.stringify(updates, null, 2));

    // Log specific changes for partial updates
    Object.keys(updates).forEach((section) => {
      if (updates[section] && typeof updates[section] === "object") {
        Object.keys(updates[section]).forEach((field) => {
          const oldValue = previousSettings[section]?.[field];
          const newValue = updates[section][field];

          if (oldValue !== newValue) {
            console.log(`🎯 CHANGE: ${section}.${field}`);
            console.log(`   From: ${oldValue}`);
            console.log(`   To: ${newValue}`);
          }
        });
      }
    });

    // Check for specific important changes
    if (updates.registration?.requireDepartmentSelection !== undefined) {
      const oldValue = previousSettings.registration.requireDepartmentSelection;
      const newValue = updates.registration.requireDepartmentSelection;

      if (oldValue !== newValue) {
        console.log(`🎯 CRITICAL CHANGE: Department Selection Requirement`);
        console.log(`   From: ${oldValue ? "REQUIRED" : "OPTIONAL"}`);
        console.log(`   To: ${newValue ? "REQUIRED" : "OPTIONAL"}`);
        console.log(
          `   Impact: Registration form will ${
            newValue ? "show" : "hide"
          } department field`
        );
      }
    }

    if (updates.registration?.allowPublicRegistration !== undefined) {
      const oldValue = previousSettings.registration.allowPublicRegistration;
      const newValue = updates.registration.allowPublicRegistration;

      if (oldValue !== newValue) {
        console.log(`🎯 CRITICAL CHANGE: Public Registration`);
        console.log(`   From: ${oldValue ? "ALLOWED" : "RESTRICTED"}`);
        console.log(`   To: ${newValue ? "ALLOWED" : "RESTRICTED"}`);
      }
    }

    const settings = await SystemSettings.updateSettings(updates, req.user.id);

    // Log the final result
    console.log(`✅ System Settings Updated Successfully`);
    console.log(`📊 New Settings:`, JSON.stringify(settings, null, 2));
    console.log(`👤 Updated By: ${req.user.username} (${req.user.email})`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`---`);

    res.status(200).json({
      success: true,
      message: "System settings updated successfully",
      data: {
        settings,
        updatedBy: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Update system settings error:", error);
    console.error(`👤 User: ${req.user?.username} (${req.user?.email})`);
    console.error(`📝 Request Body:`, JSON.stringify(req.body, null, 2));

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

// @desc    Update individual subscription plan
// @route   PUT /api/system-settings/subscription-plans/:planName
// @access  Private (Platform Admin only)
export const updateSubscriptionPlan = async (req, res) => {
  try {
    const { planName } = req.params;
    const planUpdates = req.body;

    // Validate plan name
    const validPlanNames = [
      "starter",
      "business",
      "professional",
      "enterprise",
    ];
    if (!validPlanNames.includes(planName)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid plan name. Must be one of: starter, business, professional, enterprise",
      });
    }

    // Get current settings
    const settings = await SystemSettings.getSettings();

    // Update the specific plan
    if (!settings.subscriptionPlans) {
      settings.subscriptionPlans = {};
    }

    settings.subscriptionPlans[planName] = {
      ...settings.subscriptionPlans[planName],
      ...planUpdates,
    };

    // Save the updated settings
    await settings.save();

    console.log(
      `🔧 Subscription Plan Update - User: ${req.user.username} (${req.user.email})`
    );
    console.log(`📦 Plan: ${planName}`);
    console.log(`🔄 Updates:`, JSON.stringify(planUpdates, null, 2));

    res.status(200).json({
      success: true,
      message: `${planName} plan updated successfully`,
      data: {
        plan: settings.subscriptionPlans[planName],
      },
    });
  } catch (error) {
    console.error("Update subscription plan error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
