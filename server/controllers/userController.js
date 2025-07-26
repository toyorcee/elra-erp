import User from "../models/User.js";
import Role from "../models/Role.js";
import {
  hasPermission,
  canManageUser,
  generatePermissionAudit,
} from "../utils/permissionUtils.js";
import { validateRegistration } from "../utils/validationUtils.js";
import { checkPlanLimits } from "../middleware/planLimits.js";

// Get all users (with role-based filtering)
export const getAllUsers = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user has permission to view users
    if (!hasPermission(currentUser, "user.view")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view users",
      });
    }

    let query = { isActive: true };

    // Filter by department if user is not admin
    if (currentUser.role.level < 90) {
      query.department = currentUser.department;
    }

    const users = await User.find(query)
      .populate("role", "name level description")
      .populate("supervisor", "name email")
      .select("-password");

    res.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const user = await User.findById(id)
      .populate("role", "name level description permissions")
      .populate("supervisor", "name email")
      .populate("subordinates", "name email role")
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if current user can view this user
    if (!canManageUser(currentUser, user, "view")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this user",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

// Create new user
export const createUser = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user has permission to create users
    if (!hasPermission(currentUser, "user.create")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to create users",
      });
    }

    const {
      name,
      email,
      password,
      phone,
      department,
      position,
      roleId,
      supervisorId,
    } = req.body;

    // Check if email already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Validate role assignment
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    // Check if current user can assign this role
    if (role.level >= currentUser.role.level) {
      return res.status(403).json({
        success: false,
        message: "You cannot assign a role equal to or higher than yours",
      });
    }

    // Generate employee ID
    const employeeId = `EMP${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const newUser = new User({
      name,
      email,
      password,
      phone,
      department,
      position,
      role: roleId,
      supervisor: supervisorId,
      employeeId,
    });

    await newUser.save();

    // Populate role for response
    await newUser.populate("role", "name level description");

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        employeeId: newUser.employeeId,
        department: newUser.department,
        position: newUser.position,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const updateData = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if current user can edit this user
    if (!canManageUser(currentUser, user, "edit")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to edit this user",
      });
    }

    // Remove sensitive fields from update
    delete updateData.password;
    delete updateData.email; // Email should be changed through separate process

    // If role is being updated, validate the change
    if (updateData.role) {
      const newRole = await Role.findById(updateData.role);
      if (!newRole) {
        return res.status(400).json({
          success: false,
          message: "Invalid role",
        });
      }

      if (newRole.level >= currentUser.role.level) {
        return res.status(403).json({
          success: false,
          message: "You cannot assign a role equal to or higher than yours",
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("role", "name level description")
      .populate("supervisor", "name email")
      .select("-password");

    res.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

// Delete user (soft delete)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if current user can delete this user
    if (!canManageUser(currentUser, user, "delete")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this user",
      });
    }

    // Soft delete
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

// Assign role to user
export const assignRole = async (req, res) => {
  try {
    const { userId, roleId } = req.body;
    const currentUser = req.user;

    // Check if user has permission to assign roles
    if (!hasPermission(currentUser, "user.assign_role")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to assign roles",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Check if current user can assign this role
    if (role.level >= currentUser.role.level) {
      return res.status(403).json({
        success: false,
        message: "You cannot assign a role equal to or higher than yours",
      });
    }

    user.role = roleId;
    await user.save();

    await user.populate("role", "name level description");

    res.json({
      success: true,
      message: "Role assigned successfully",
      data: {
        user: user.name,
        role: user.role.name,
      },
    });
  } catch (error) {
    console.error("Assign role error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign role",
    });
  }
};

// Get manageable users (users that current user can manage)
export const getManageableUsers = async (req, res) => {
  try {
    const currentUser = req.user;

    const manageableUsers = await User.find({
      "role.level": { $lt: currentUser.role.level },
      isActive: true,
    })
      .populate("role", "name level description")
      .select("-password");

    res.json({
      success: true,
      data: manageableUsers,
      count: manageableUsers.length,
    });
  } catch (error) {
    console.error("Get manageable users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch manageable users",
    });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const currentUser = req.user;

    const user = await User.findById(currentUser.userId)
      .populate("role", "name level description permissions")
      .populate("supervisor", "name email")
      .populate("subordinates", "name email role")
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
    });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const currentUser = req.user;
    const updateData = req.body;

    // Remove sensitive fields
    delete updateData.role;
    delete updateData.email;
    delete updateData.password;

    const updatedUser = await User.findByIdAndUpdate(
      currentUser.userId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("role", "name level description")
      .select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};
