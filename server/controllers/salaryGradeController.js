import SalaryGrade from "../models/SalaryGrade.js";
import RoleSalaryGradeMapping from "../models/RoleSalaryGradeMapping.js";
import { validateSalaryGradeData } from "../utils/salaryGradeUtils.js";
import AuditService from "../services/auditService.js";

// Get all salary grades
const getAllSalaryGrades = async (req, res) => {
  try {
    const salaryGrades = await SalaryGrade.find({ isActive: true }).sort({
      grade: 1,
    });

    // Fetch role mappings for each salary grade
    const salaryGradesWithMappings = await Promise.all(
      salaryGrades.map(async (grade) => {
        const mappings = await RoleSalaryGradeMapping.find({
          salaryGrade: grade._id,
          isActive: true,
        }).populate("role", "name level");

        return {
          ...grade.toObject(),
          roleMappings: mappings,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: salaryGradesWithMappings,
      message: "Salary grades retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching salary grades:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch salary grades",
      error: error.message,
    });
  }
};

// Get single salary grade by ID
const getSalaryGradeById = async (req, res) => {
  try {
    const { id } = req.params;
    const salaryGrade = await SalaryGrade.findById(id);

    if (!salaryGrade) {
      return res.status(404).json({
        success: false,
        message: "Salary grade not found",
      });
    }

    // Fetch role mappings for this salary grade
    const mappings = await RoleSalaryGradeMapping.find({
      salaryGrade: id,
      isActive: true,
    }).populate("role", "name level");

    const salaryGradeWithMappings = {
      ...salaryGrade.toObject(),
      roleMappings: mappings,
    };

    res.status(200).json({
      success: true,
      data: salaryGradeWithMappings,
      message: "Salary grade retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching salary grade:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch salary grade",
      error: error.message,
    });
  }
};

// Create new salary grade
const createSalaryGrade = async (req, res) => {
  try {
    // Check user permissions (Super Admin or HOD level 600+)
    if (req.user.level < 600) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super Admin or HOD level required.",
      });
    }

    const salaryGradeData = req.body;

    // Auto-generate grade name if not provided
    if (!salaryGradeData.grade) {
      const existingGrades = await SalaryGrade.find({ isActive: true }).sort({
        grade: -1,
      });
      const lastGrade = existingGrades[0];

      if (lastGrade) {
        const lastGradeNumber = parseInt(lastGrade.grade.split(" ")[1]) || 0;
        salaryGradeData.grade = `Grade ${lastGradeNumber + 1}`;
      } else {
        salaryGradeData.grade = "Grade 1";
      }
    }

    // Debug: Log the incoming data
    console.log(
      "🔍 [SALARY_GRADE] Incoming data:",
      JSON.stringify(salaryGradeData, null, 2)
    );

    // Validate the data
    const validation = await validateSalaryGradeData(salaryGradeData);
    console.log("🔍 [SALARY_GRADE] Validation result:", validation);

    if (!validation.isValid) {
      console.log("❌ [SALARY_GRADE] Validation failed:", validation.errors);
      return res.status(400).json({
        success: false,
        message: "Invalid salary grade data",
        errors: validation.errors,
      });
    }

    // Check if grade name already exists
    const existingGrade = await SalaryGrade.findOne({
      grade: salaryGradeData.grade,
      isActive: true,
    });

    if (existingGrade) {
      return res.status(400).json({
        success: false,
        message: "Salary grade with this name already exists",
      });
    }

    // Create the salary grade
    const newSalaryGrade = new SalaryGrade({
      ...salaryGradeData,
      createdBy: req.user._id,
      isActive: true,
    });

    const savedSalaryGrade = await newSalaryGrade.save();

    // Handle role mapping (required)
    if (!salaryGradeData.selectedRole) {
      return res.status(400).json({
        success: false,
        message: "Role mapping is required for salary grade creation",
      });
    }

    try {
      const existingMapping = await RoleSalaryGradeMapping.findOne({
        role: salaryGradeData.selectedRole,
        isActive: true,
      });

      if (existingMapping) {
        existingMapping.salaryGrade = savedSalaryGrade._id;
        existingMapping.updatedBy = req.user._id;
        await existingMapping.save();
        console.log(
          `✅ [SALARY_GRADE] Updated existing role mapping for grade ${savedSalaryGrade.grade}`
        );
      } else {
        await RoleSalaryGradeMapping.create({
          role: salaryGradeData.selectedRole,
          salaryGrade: savedSalaryGrade._id,
          createdBy: req.user._id,
        });
        console.log(
          `✅ [SALARY_GRADE] Created new role mapping for grade ${savedSalaryGrade.grade}`
        );
      }
    } catch (mappingError) {
      console.error(
        "❌ [SALARY_GRADE] Error creating role mapping:",
        mappingError
      );
      return res.status(500).json({
        success: false,
        message: "Failed to create role mapping",
        error: mappingError.message,
      });
    }

    // Log the activity
    await AuditService.logSalaryGradeAction(
      req.user._id,
      "SALARY_GRADE_CREATED",
      savedSalaryGrade._id,
      {
        gradeName: savedSalaryGrade.grade,
        gradeLevel: savedSalaryGrade.name,
        salaryRange: `₦${savedSalaryGrade.minGrossSalary.toLocaleString()} - ₦${savedSalaryGrade.maxGrossSalary.toLocaleString()}`,
        description: savedSalaryGrade.description,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );

    res.status(201).json({
      success: true,
      data: savedSalaryGrade,
      message: "Salary grade created successfully",
    });
  } catch (error) {
    console.error("Error creating salary grade:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create salary grade",
      error: error.message,
    });
  }
};

// Update salary grade
const updateSalaryGrade = async (req, res) => {
  try {
    // Check user permissions (Super Admin or HOD level 600+)
    if (req.user.level < 600) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super Admin or HOD level required.",
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Validate the data
    const validation = await validateSalaryGradeData(updateData, id);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid salary grade data",
        errors: validation.errors,
      });
    }

    // Check if grade name already exists (excluding current grade)
    const existingGrade = await SalaryGrade.findOne({
      grade: updateData.grade,
      _id: { $ne: id },
      isActive: true,
    });

    if (existingGrade) {
      return res.status(400).json({
        success: false,
        message: "Salary grade with this name already exists",
      });
    }

    // Update the salary grade
    const updatedSalaryGrade = await SalaryGrade.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updatedBy: req.user._id,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedSalaryGrade) {
      return res.status(404).json({
        success: false,
        message: "Salary grade not found",
      });
    }

    if (!updateData.selectedRole) {
      return res.status(400).json({
        success: false,
        message: "Role mapping is required for salary grade updates",
      });
    }

    try {
      const existingMapping = await RoleSalaryGradeMapping.findOne({
        role: updateData.selectedRole,
        salaryGrade: { $ne: id },
        isActive: true,
      });

      if (existingMapping) {
        existingMapping.salaryGrade = id;
        existingMapping.updatedBy = req.user._id;
        await existingMapping.save();
        console.log(
          `✅ [SALARY_GRADE] Updated existing role mapping for grade ${updatedSalaryGrade.grade}`
        );
      } else {
        // Remove existing mappings for this salary grade
        await RoleSalaryGradeMapping.deleteMany({ salaryGrade: id });

        // Create new mapping
        await RoleSalaryGradeMapping.create({
          role: updateData.selectedRole,
          salaryGrade: id,
          createdBy: req.user._id,
        });
        console.log(
          `✅ [SALARY_GRADE] Created new role mapping for grade ${updatedSalaryGrade.grade}`
        );
      }
    } catch (mappingError) {
      console.error(
        "❌ [SALARY_GRADE] Error updating role mapping:",
        mappingError
      );
      return res.status(500).json({
        success: false,
        message: "Failed to update role mapping",
        error: mappingError.message,
      });
    }

    // Log the activity
    await AuditService.logSalaryGradeAction(
      req.user._id,
      "SALARY_GRADE_UPDATED",
      updatedSalaryGrade._id,
      {
        gradeName: updatedSalaryGrade.grade,
        gradeLevel: updatedSalaryGrade.name,
        salaryRange: `₦${updatedSalaryGrade.minGrossSalary.toLocaleString()} - ₦${updatedSalaryGrade.maxGrossSalary.toLocaleString()}`,
        description: updatedSalaryGrade.description,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );

    res.status(200).json({
      success: true,
      data: updatedSalaryGrade,
      message: "Salary grade updated successfully",
    });
  } catch (error) {
    console.error("Error updating salary grade:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update salary grade",
      error: error.message,
    });
  }
};

// Delete salary grade (soft delete)
const deleteSalaryGrade = async (req, res) => {
  try {
    // Check user permissions (Super Admin or HOD level 600+)
    if (req.user.level < 600) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super Admin or HOD level required.",
      });
    }

    const { id } = req.params;

    // Check if salary grade is being used by any users
    const User = (await import("../models/User.js")).default;
    const usersWithGrade = await User.find({
      salaryGrade: id,
      isActive: true,
    });

    if (usersWithGrade.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete salary grade. It is currently assigned to users.",
        userCount: usersWithGrade.length,
      });
    }

    // Soft delete the salary grade
    const deletedSalaryGrade = await SalaryGrade.findByIdAndUpdate(
      id,
      {
        isActive: false,
        deletedBy: req.user._id,
        deletedAt: new Date(),
      },
      { new: true }
    );

    if (!deletedSalaryGrade) {
      return res.status(404).json({
        success: false,
        message: "Salary grade not found",
      });
    }

    await RoleSalaryGradeMapping.deleteMany({
      salaryGrade: id,
    });

    await AuditService.logSalaryGradeAction(
      req.user._id,
      "SALARY_GRADE_DELETED",
      deletedSalaryGrade._id,
      {
        gradeName: deletedSalaryGrade.grade,
        gradeLevel: deletedSalaryGrade.name,
        salaryRange: `₦${deletedSalaryGrade.minGrossSalary.toLocaleString()} - ₦${deletedSalaryGrade.maxGrossSalary.toLocaleString()}`,
        description: deletedSalaryGrade.description,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      }
    );

    res.status(200).json({
      success: true,
      message: "Salary grade deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting salary grade:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete salary grade",
      error: error.message,
    });
  }
};

// Get salary grades for dropdown (simplified data)
const getSalaryGradesForDropdown = async (req, res) => {
  try {
    const salaryGrades = await SalaryGrade.find({ isActive: true })
      .select("grade name minGrossSalary maxGrossSalary")
      .sort({ grade: 1 });

    res.status(200).json({
      success: true,
      data: salaryGrades,
      message: "Salary grades for dropdown retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching salary grades for dropdown:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch salary grades for dropdown",
      error: error.message,
    });
  }
};

export {
  getAllSalaryGrades,
  getSalaryGradeById,
  createSalaryGrade,
  updateSalaryGrade,
  deleteSalaryGrade,
  getSalaryGradesForDropdown,
};
