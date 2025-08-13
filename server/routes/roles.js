import express from "express";
import { protect } from "../middleware/auth.js";
import { hasPermission } from "../utils/permissionUtils.js";
import Role from "../models/Role.js";

const router = express.Router();

// Get all roles (Manager+ can access)
router.get("/", protect, async (req, res) => {
  if (req.user.role.level < 600) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Manager level required.",
    });
  }
  try {
    const roles = await Role.find().sort({ level: -1 });
    res.json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/", protect, async (req, res) => {
  // Check if user has sufficient role level (Manager = 600, HOD = 700, Super Admin = 1000)
  if (req.user.role.level < 600) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Manager level required.",
    });
  }
  try {
    const {
      name,
      level,
      description,
      permissions,
      departmentAccess,
      canManageRoles,
    } = req.body;

    // Check if role name already exists
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res
        .status(400)
        .json({ success: false, message: "Role name already exists" });
    }

    // Check if level already exists
    const existingLevel = await Role.findOne({ level });
    if (existingLevel) {
      return res
        .status(400)
        .json({ success: false, message: "Role level already exists" });
    }

    const role = new Role({
      name,
      level,
      description,
      permissions: permissions || [],
      departmentAccess: departmentAccess || [],
      canManageRoles: canManageRoles || [],
    });

    await role.save();
    res.status(201).json({ success: true, data: role });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update role (Manager+ can update)
router.put("/:id", protect, async (req, res) => {
  // Check if user has sufficient role level (Manager = 600, HOD = 700, Super Admin = 1000)
  if (req.user.role.level < 600) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Manager level required.",
    });
  }
  try {
    const {
      name,
      level,
      description,
      permissions,
      departmentAccess,
      canManageRoles,
    } = req.body;
    const roleId = req.params.id;

    const role = await Role.findById(roleId);
    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }

    // Prevent updating SUPER_ADMIN role
    if (role.name === "SUPER_ADMIN") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot modify SUPER_ADMIN role" });
    }

    // Check if new name conflicts with existing role
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ name, _id: { $ne: roleId } });
      if (existingRole) {
        return res
          .status(400)
          .json({ success: false, message: "Role name already exists" });
      }
    }

    // Check if new level conflicts with existing role
    if (level && level !== role.level) {
      const existingLevel = await Role.findOne({
        level,
        _id: { $ne: roleId },
      });
      if (existingLevel) {
        return res
          .status(400)
          .json({ success: false, message: "Role level already exists" });
      }
    }

    role.name = name || role.name;
    role.level = level || role.level;
    role.description = description || role.description;
    role.permissions = permissions || role.permissions;
    role.departmentAccess = departmentAccess || role.departmentAccess;
    role.canManageRoles = canManageRoles || role.canManageRoles;

    await role.save();
    res.json({ success: true, data: role });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete role (Manager+ can delete)
router.delete("/:id", protect, async (req, res) => {
  // Check if user has sufficient role level (Manager = 600, HOD = 700, Super Admin = 1000)
  if (req.user.role.level < 600) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Manager level required.",
    });
  }
  try {
    const roleId = req.params.id;
    const role = await Role.findById(roleId);

    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }

    // Prevent deleting SUPER_ADMIN role
    if (role.name === "SUPER_ADMIN") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot delete SUPER_ADMIN role" });
    }

    // Check if any users are using this role
    const User = (await import("../models/User.js")).default;
    const usersWithRole = await User.find({ role: roleId });
    if (usersWithRole.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role. ${usersWithRole.length} user(s) are currently assigned to this role.`,
      });
    }

    await Role.findByIdAndDelete(roleId);
    res.json({ success: true, message: "Role deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get role by ID
router.get("/:id", protect, async (req, res) => {
  // Check if user has sufficient role level (Manager = 600, HOD = 700, Super Admin = 1000)
  if (req.user.role.level < 600) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Manager level required.",
    });
  }
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }
    res.json({ success: true, data: role });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
