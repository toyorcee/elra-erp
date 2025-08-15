import User from "../models/User.js";
import Role from "../models/Role.js";
import Department from "../models/Department.js";
import {
  hasPermission,
  canManageUser,
  generatePermissionAudit,
} from "../utils/permissionUtils.js";
import { validateRegistration } from "../utils/validationUtils.js";
import { checkPlanLimits } from "../middleware/planLimits.js";
import AuditService from "../services/auditService.js";
import {
  validateRoleAssignment,
  validateDepartmentAssignment,
  validateRoleDepartmentCompatibility,
  getAssignmentGuidance,
} from "../utils/levelValidation.js";

// Get all users (with role-based filtering)
export const getAllUsers = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user has permission to view users (Manager+ can view users)
    if (currentUser.role.level < 600) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Manager level required to view users.",
      });
    }

    let query = {};

    // For super admins, show all users including pending, invited, and active users
    if (currentUser.role.level >= 1000) {
      query.$or = [
        { isActive: true },
        { status: "PENDING_REGISTRATION" },
        { status: "INVITED" },
        { status: "ACTIVE" },
      ];
    } else {
      // For regular users, only show active users in their department
      query.isActive = true;
      query.department = currentUser.department;
    }

    // Exclude platform admin users - they should not appear in company user lists
    query.email = { $not: /platformadmin/i };

    const users = await User.find(query)
      .populate("role", "name level description")
      .populate("department", "name description")
      .populate("supervisor", "name email")
      .select("-password");

    const filteredUsers = users.filter((user) => {
      // If user has no role (pending registration), include them
      if (!user.role) return true;

      // If user has a role, only include if it's not PLATFORM_ADMIN
      return user.role.name !== "PLATFORM_ADMIN";
    });

    res.json({
      success: true,
      data: filteredUsers,
      count: filteredUsers.length,
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
      .populate("department", "name description")
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

    // Prevent users from changing their own role (but allow other updates)
    if (currentUser._id.toString() === user._id.toString() && updateData.role) {
      return res.status(403).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    // Remove sensitive fields from update
    delete updateData.password;
    delete updateData.email;

    // Store old values for audit logging
    const oldRole = user.role;
    const oldDepartment = user.department;

    // Validate role assignment if role is being updated
    if (updateData.role) {
      const roleValidation = await validateRoleAssignment(
        currentUser,
        updateData.role,
        user._id
      );
      if (!roleValidation.isValid) {
        return res.status(403).json({
          success: false,
          message: roleValidation.message,
        });
      }
    }

    // Validate department assignment if department is being updated
    if (updateData.department) {
      const deptValidation = await validateDepartmentAssignment(
        currentUser,
        updateData.department,
        user._id
      );
      if (!deptValidation.isValid) {
        return res.status(403).json({
          success: false,
          message: deptValidation.message,
        });
      }
    }

    // Validate role-department compatibility if both are being updated
    if (updateData.role && updateData.department) {
      const compatibilityValidation = await validateRoleDepartmentCompatibility(
        updateData.role,
        updateData.department
      );
      if (!compatibilityValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: compatibilityValidation.message,
        });
      }
    }

    // Keep user in PENDING_REGISTRATION status when role and department are assigned
    // User will only become ACTIVE after completing the invitation process
    if (
      user.status === "PENDING_REGISTRATION" &&
      updateData.role &&
      updateData.department
    ) {
      // Don't auto-activate - keep status as PENDING_REGISTRATION
      // User will become active only after completing invitation process
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("role", "name level description")
      .populate("supervisor", "name email")
      .select("-password");

    if (
      user.status === "PENDING_REGISTRATION" &&
      updateData.role &&
      updateData.department
    ) {
      const newRoleData = await Role.findById(updateData.role);
      const newDeptData = await Department.findById(updateData.department);

      console.log(
        `🔍 [USER ASSIGNMENT] User: ${user.email} | Role: ${newRoleData?.name} (Level ${newRoleData?.level}) | Department: ${newDeptData?.name} (Level ${newDeptData?.level}) | Status: ${user.status}`
      );
    }

    try {
      if (
        updateData.role &&
        oldRole?.toString() !== updateData.role?.toString()
      ) {
        const oldRoleData = oldRole ? await Role.findById(oldRole) : null;
        const newRoleData = await Role.findById(updateData.role);

        await AuditService.logUserAction(
          currentUser._id,
          "USER_ROLE_CHANGED",
          user._id,
          {
            company: currentUser.company,
            oldRole: oldRoleData?.name || "No Role",
            newRole: newRoleData?.name,
            description: `Role changed from "${
              oldRoleData?.name || "No Role"
            }" to "${newRoleData?.name}" for user ${user.firstName} ${
              user.lastName
            }`,
            ipAddress: req.ip,
            userAgent: req.get("User-Agent"),
          }
        );
      }

      // Log department change if department was updated
      if (
        updateData.department &&
        oldDepartment?.toString() !== updateData.department?.toString()
      ) {
        const oldDeptData = oldDepartment
          ? await Department.findById(oldDepartment)
          : null;
        const newDeptData = await Department.findById(updateData.department);

        await AuditService.logUserAction(
          currentUser._id,
          "USER_DEPARTMENT_CHANGED",
          user._id,
          {
            company: currentUser.company,
            oldDepartment: oldDeptData?.name || "No Department",
            newDepartment: newDeptData?.name,
            description: `Department changed from "${
              oldDeptData?.name || "No Department"
            }" to "${newDeptData?.name}" for user ${user.firstName} ${
              user.lastName
            }`,
            ipAddress: req.ip,
            userAgent: req.get("User-Agent"),
          }
        );
      }
    } catch (auditError) {
      console.error("Audit logging error:", auditError);
      // Don't fail the main operation if audit logging fails
    }

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
      email: { $not: /platformadmin/i },
    })
      .populate("role", "name level description")
      .select("-password");

    const filteredUsers = manageableUsers.filter(
      (user) => user.role && user.role.name !== "PLATFORM_ADMIN"
    );

    res.json({
      success: true,
      data: filteredUsers,
      count: filteredUsers.length,
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

// Get pending registration users (for debugging)
export const getPendingRegistrationUsers = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user has permission to view users
    if (!hasPermission(currentUser, "user.view")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view users",
      });
    }

    // Get all users with PENDING_REGISTRATION status
    const pendingUsers = await User.find({
      status: "PENDING_REGISTRATION",
      email: { $not: /platformadmin/i },
    })
      .populate("role", "name level description")
      .populate("department", "name")
      .populate("company", "name")
      .select("-password");

    // Also check all users to see the total count
    const allUsers = await User.find({
      email: { $not: /platformadmin/i },
    }).select("status isActive email");

    res.json({
      success: true,
      data: pendingUsers,
      count: pendingUsers.length,
      debug: {
        totalUsers: allUsers.length,
        statusBreakdown: {
          active: allUsers.filter((u) => u.isActive === true).length,
          inactive: allUsers.filter((u) => u.isActive === false).length,
          pending: allUsers.filter((u) => u.status === "PENDING_REGISTRATION")
            .length,
          active_status: allUsers.filter((u) => u.status === "ACTIVE").length,
        },
      },
    });
  } catch (error) {
    console.error("Get pending registration users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending users",
    });
  }
};

// Get assignment guidance for current user
export const getAssignmentGuidanceForUser = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if user has permission to assign roles/departments
    if (!hasPermission(currentUser, "user.assign_role")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to assign roles and departments",
      });
    }

    const guidance = await getAssignmentGuidance(currentUser);

    res.json({
      success: true,
      data: guidance,
    });
  } catch (error) {
    console.error("Get assignment guidance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get assignment guidance",
    });
  }
};

// Get onboarded members (successfully registered users)
export const getOnboardedMembers = async (req, res) => {
  try {
    const currentUser = req.user;
    const { page = 1, limit = 10, filter = "all", search = "" } = req.query;

    if (currentUser.role.level < 600) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Manager level required to view onboarded members.",
      });
    }

    console.log(
      "🔍 [ONBOARDED_MEMBERS] Fetching onboarded members with params:",
      {
        page,
        limit,
        filter,
        search,
        currentUser: {
          id: currentUser._id,
          email: currentUser.email,
          roleLevel: currentUser.role.level,
          roleName: currentUser.role.name,
        },
      }
    );

    // Build query for onboarded members (users who have completed registration)
    let query = {
      // Only show users who have completed registration (not pending or invited)
      status: { $in: ["ACTIVE", "REGISTERED"] },
      // Exclude platform admin users
      email: { $not: /platformadmin/i },
    };

    // Apply role-based filtering
    if (currentUser.role.level >= 1000) {
      // Super Admin can see all onboarded members
      // No additional department filter needed
    } else if (currentUser.role.level >= 700) {
      // HOD can see members in their department
      query.department = currentUser.department;
    } else {
      // Manager can see members in their department
      query.department = currentUser.department;
    }

    // Apply status filter
    if (filter === "active") {
      query.isActive = true;
    } else if (filter === "inactive") {
      query.isActive = false;
    }

    // Apply search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);
    const pages = Math.ceil(total / parseInt(limit));

    const members = await User.find(query)
      .populate("role", "name level description")
      .populate("department", "name description")
      .select("-password +avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log("✅ [ONBOARDED_MEMBERS] Found members:", {
      count: members.length,
      total,
      pages,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      data: {
        members,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages,
        },
      },
      count: members.length,
      total,
    });
  } catch (error) {
    console.error(
      "❌ [ONBOARDED_MEMBERS] Error fetching onboarded members:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Failed to fetch onboarded members",
    });
  }
};
