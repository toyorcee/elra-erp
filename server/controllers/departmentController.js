import { validationResult } from "express-validator";
import Department from "../models/Department.js";
import User from "../models/User.js";
import Document from "../models/Document.js";

// @desc    Create a new department
// @route   POST /api/departments
// @access  Private (Super Admin only)
export const createDepartment = async (req, res) => {
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

    const {
      name,
      code,
      description,
      level,
      parentDepartment,
      manager,
      color,
      settings,
    } = req.body;

    // Check if department with same name or code already exists
    const existingDepartment = await Department.findOne({
      $or: [{ name }, { code: code.toUpperCase() }],
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: "Department with this name or code already exists",
      });
    }

    // Check if parent department exists (if provided)
    if (parentDepartment) {
      const parentDept = await Department.findById(parentDepartment);
      if (!parentDept) {
        return res.status(400).json({
          success: false,
          message: "Parent department not found",
        });
      }
    }

    // Check if manager exists (if provided)
    if (manager) {
      const managerUser = await User.findById(manager);
      if (!managerUser) {
        return res.status(400).json({
          success: false,
          message: "Manager user not found",
        });
      }
    }

    // Create new department
    const department = new Department({
      name,
      code: code.toUpperCase(),
      description,
      level: level || 50,
      parentDepartment: parentDepartment || null,
      manager: manager || null,
      color: color || "#3B82F6",
      settings: settings || {
        allowDocumentUpload: true,
        requireApproval: true,
        maxFileSize: 10,
        allowedFileTypes: [
          "pdf",
          "doc",
          "docx",
          "xls",
          "xlsx",
          "ppt",
          "pptx",
          "txt",
          "jpg",
          "png",
        ],
      },
      createdBy: req.user.id,
    });

    await department.save();

    // Populate references
    await department.populate([
      { path: "parentDepartment", select: "name code" },
      { path: "manager", select: "firstName lastName email" },
      { path: "createdBy", select: "firstName lastName" },
    ]);

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: {
        department,
      },
    });
  } catch (error) {
    console.error("Create department error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private (Admin+)
export const getAllDepartments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status = "active",
      includeInactive = false,
    } = req.query;

    const query = {};

    // Filter by status
    if (status === "active") {
      query.isActive = true;
    } else if (status === "inactive") {
      query.isActive = false;
    } else if (includeInactive === "true") {
      // Include both active and inactive
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search.toUpperCase(), $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: "parentDepartment", select: "name code" },
        { path: "manager", select: "firstName lastName email" },
        { path: "createdBy", select: "firstName lastName" },
      ],
      sort: { name: 1 },
    };

    const departments = await Department.paginate(query, options);

    res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error("Get departments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Bulk delete all departments (except External)
// @route   DELETE /api/departments/bulk-delete
// @access  Private (Super Admin only)
export const bulkDeleteDepartments = async (req, res) => {
  try {
    // Check if user is super admin
    if (req.user.role.level < 100) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super admin privileges required.",
      });
    }

    // Get all departments except External
    const departmentsToDelete = await Department.find({
      code: { $ne: "EXT" },
    });

    if (departmentsToDelete.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No departments found to delete",
      });
    }

    // Check if any departments have users or documents
    const departmentIds = departmentsToDelete.map((dept) => dept._id);

    const userCount = await User.countDocuments({
      department: { $in: departmentIds },
    });

    const documentCount = await Document.countDocuments({
      department: { $in: departmentIds },
    });

    if (userCount > 0 || documentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete departments. Found ${userCount} users and ${documentCount} documents associated with these departments. Please reassign users and documents first.`,
      });
    }

    // Delete departments
    const deleteResult = await Department.deleteMany({
      code: { $ne: "EXT" },
    });

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${deleteResult.deletedCount} departments`,
      data: {
        deletedCount: deleteResult.deletedCount,
        deletedDepartments: departmentsToDelete.map((dept) => ({
          id: dept._id,
          name: dept.name,
          code: dept.code,
        })),
      },
    });
  } catch (error) {
    console.error("Bulk delete departments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Bulk create departments
// @route   POST /api/departments/bulk-create
// @access  Private (Super Admin only)
export const bulkCreateDepartments = async (req, res) => {
  try {
    // Check if user is super admin
    if (req.user.role.level < 100) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super admin privileges required.",
      });
    }

    const { departments } = req.body;

    if (!Array.isArray(departments) || departments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Departments array is required and must not be empty",
      });
    }

    const createdDepartments = [];
    const errors = [];

    for (const deptData of departments) {
      try {
        // Check if department already exists
        const existingDept = await Department.findOne({
          $or: [
            { name: deptData.name },
            { code: deptData.code?.toUpperCase() },
          ],
        });

        if (existingDept) {
          errors.push({
            department: deptData.name,
            error: "Department with this name or code already exists",
          });
          continue;
        }

        // Create department
        const department = new Department({
          name: deptData.name,
          code: deptData.code?.toUpperCase(),
          description: deptData.description || "",
          level: deptData.level || 50,
          color: deptData.color || "#3B82F6",
          createdBy: req.user.id,
        });

        await department.save();
        createdDepartments.push(department);
      } catch (error) {
        errors.push({
          department: deptData.name,
          error: error.message,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdDepartments.length} departments`,
      data: {
        createdCount: createdDepartments.length,
        createdDepartments: createdDepartments.map((dept) => ({
          id: dept._id,
          name: dept.name,
          code: dept.code,
        })),
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error("Bulk create departments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get department by ID
// @route   GET /api/departments/:id
// @access  Private (Admin+)
export const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id).populate([
      { path: "parentDepartment", select: "name code" },
      { path: "manager", select: "firstName lastName email" },
      { path: "createdBy", select: "firstName lastName" },
      { path: "updatedBy", select: "firstName lastName" },
    ]);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Get department statistics
    const stats = await department.getStats();

    res.status(200).json({
      success: true,
      data: {
        department,
        stats,
      },
    });
  } catch (error) {
    console.error("Get department error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Super Admin only)
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const {
      name,
      code,
      description,
      level,
      parentDepartment,
      manager,
      color,
      settings,
      isActive,
    } = req.body;

    // Check if name or code conflicts with other departments
    if (name || code) {
      const conflictQuery = {
        _id: { $ne: id },
        $or: [],
      };

      if (name) conflictQuery.$or.push({ name });
      if (code) conflictQuery.$or.push({ code: code.toUpperCase() });

      const conflictDept = await Department.findOne(conflictQuery);
      if (conflictDept) {
        return res.status(400).json({
          success: false,
          message: "Department with this name or code already exists",
        });
      }
    }

    // Check if parent department exists (if provided)
    if (parentDepartment) {
      const parentDept = await Department.findById(parentDepartment);
      if (!parentDept) {
        return res.status(400).json({
          success: false,
          message: "Parent department not found",
        });
      }
      // Prevent circular reference
      if (parentDepartment === id) {
        return res.status(400).json({
          success: false,
          message: "Department cannot be its own parent",
        });
      }
    }

    // Check if manager exists (if provided)
    if (manager) {
      const managerUser = await User.findById(manager);
      if (!managerUser) {
        return res.status(400).json({
          success: false,
          message: "Manager user not found",
        });
      }
    }

    // Update department
    const updateData = {};
    if (name) updateData.name = name;
    if (code) updateData.code = code.toUpperCase();
    if (description !== undefined) updateData.description = description;
    if (level) updateData.level = level;
    if (parentDepartment !== undefined)
      updateData.parentDepartment = parentDepartment;
    if (manager !== undefined) updateData.manager = manager;
    if (color) updateData.color = color;
    if (settings) updateData.settings = { ...department.settings, ...settings };
    if (isActive !== undefined) updateData.isActive = isActive;

    updateData.updatedBy = req.user.id;

    const updatedDepartment = await Department.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: "parentDepartment", select: "name code" },
      { path: "manager", select: "firstName lastName email" },
      { path: "createdBy", select: "firstName lastName" },
      { path: "updatedBy", select: "firstName lastName" },
    ]);

    res.status(200).json({
      success: true,
      message: "Department updated successfully",
      data: {
        department: updatedDepartment,
      },
    });
  } catch (error) {
    console.error("Update department error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Delete department (soft delete)
// @route   DELETE /api/departments/:id
// @access  Private (Super Admin only)
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Check if department can be deleted
    const canBeDeleted = await department.canBeDeleted();
    if (!canBeDeleted) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete department. It has associated users or documents.",
      });
    }

    // Soft delete
    department.isActive = false;
    department.updatedBy = req.user.id;
    await department.save();

    res.status(200).json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    console.error("Delete department error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get department users
// @route   GET /api/departments/:id/users
// @access  Private (Admin+)
export const getDepartmentUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const users = await department.getUsers();

    res.status(200).json({
      success: true,
      data: {
        department: {
          id: department._id,
          name: department.name,
          code: department.code,
        },
        users,
        total: users.length,
      },
    });
  } catch (error) {
    console.error("Get department users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get department hierarchy
// @route   GET /api/departments/:id/hierarchy
// @access  Private (Admin+)
export const getDepartmentHierarchy = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const hierarchy = await department.getHierarchy();

    res.status(200).json({
      success: true,
      data: {
        hierarchy,
      },
    });
  } catch (error) {
    console.error("Get department hierarchy error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get department statistics
// @route   GET /api/departments/:id/stats
// @access  Private (Admin+)
export const getDepartmentStats = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const stats = await department.getStats();

    res.status(200).json({
      success: true,
      data: {
        department: {
          id: department._id,
          name: department.name,
          code: department.code,
        },
        stats,
      },
    });
  } catch (error) {
    console.error("Get department stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get active departments for dropdown
// @route   GET /api/departments/active
// @access  Private (All authenticated users)
export const getActiveDepartments = async (req, res) => {
  try {
    const departments = await Department.getActiveDepartments();

    res.status(200).json({
      success: true,
      data: {
        departments,
      },
    });
  } catch (error) {
    console.error("Get active departments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
