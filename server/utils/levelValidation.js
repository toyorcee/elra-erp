import Role from "../models/Role.js";
import Department from "../models/Department.js";

/**
 * Validates role and department assignments based on hierarchical levels
 * Prevents superadmin from making invalid assignments
 */

export const validateRoleAssignment = async (
  currentUser,
  newRoleId,
  targetUserId = null
) => {
  try {
    // Get current user's role
    const currentUserRole = await Role.findById(currentUser.role);
    if (!currentUserRole) {
      return {
        isValid: false,
        message: "Current user role not found",
      };
    }

    // Get new role being assigned
    const newRole = await Role.findById(newRoleId);
    if (!newRole) {
      return {
        isValid: false,
        message: "Invalid role specified",
      };
    }

    // SUPER_ADMIN can assign any role except to themselves
    if (currentUserRole.level === 100) {
      if (
        targetUserId &&
        targetUserId.toString() === currentUser._id.toString()
      ) {
        return {
          isValid: false,
          message: "You cannot change your own role",
        };
      }
      return { isValid: true };
    }

    // Other users can only assign roles lower than their own
    if (newRole.level >= currentUserRole.level) {
      return {
        isValid: false,
        message: `You can only assign roles with level lower than ${currentUserRole.name} (Level ${currentUserRole.level})`,
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error("Role validation error:", error);
    return {
      isValid: false,
      message: "Error validating role assignment",
    };
  }
};

export const validateDepartmentAssignment = async (
  currentUser,
  newDepartmentId,
  targetUserId = null
) => {
  try {
    // Get current user's department
    const currentUserDept = await Department.findById(currentUser.department);
    if (!currentUserDept) {
      return {
        isValid: false,
        message: "Current user department not found",
      };
    }

    // Get new department being assigned
    const newDepartment = await Department.findById(newDepartmentId);
    if (!newDepartment) {
      return {
        isValid: false,
        message: "Invalid department specified",
      };
    }

    // SUPER_ADMIN can assign any department except to themselves
    if (currentUser.role?.level === 100) {
      if (
        targetUserId &&
        targetUserId.toString() === currentUser._id.toString()
      ) {
        return {
          isValid: false,
          message: "You cannot change your own department",
        };
      }
      return { isValid: true };
    }

    // Other users can only assign departments at their level or lower
    if (newDepartment.level > currentUserDept.level) {
      return {
        isValid: false,
        message: `You can only assign departments at level ${currentUserDept.level} or lower. ${newDepartment.name} is at level ${newDepartment.level}`,
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error("Department validation error:", error);
    return {
      isValid: false,
      message: "Error validating department assignment",
    };
  }
};

export const validateRoleDepartmentCompatibility = async (
  roleId,
  departmentId
) => {
  try {
    const role = await Role.findById(roleId);
    const department = await Department.findById(departmentId);

    if (!role || !department) {
      return {
        isValid: false,
        message: "Invalid role or department",
      };
    }

    // Check for logical mismatches
    const incompatibilities = [
      {
        role: "EXTERNAL_USER",
        incompatibleDepartments: [
          "Executive Management",
          "Information Technology",
          "Human Resources",
        ],
        message: "External users cannot be assigned to internal departments",
      },
      {
        role: "JUNIOR_STAFF",
        incompatibleDepartments: ["Executive Management"],
        message: "Junior staff cannot be assigned to Executive Management",
      },
      {
        role: "STAFF",
        incompatibleDepartments: ["Executive Management"],
        message: "Staff cannot be assigned to Executive Management",
      },
    ];

    for (const incompatibility of incompatibilities) {
      if (
        role.name === incompatibility.role &&
        incompatibility.incompatibleDepartments.includes(department.name)
      ) {
        return {
          isValid: false,
          message: incompatibility.message,
        };
      }
    }

    // Check level compatibility (role level should generally be >= department level)
    if (role.level < department.level) {
      return {
        isValid: false,
        message: `Role ${role.name} (Level ${role.level}) is too low for department ${department.name} (Level ${department.level})`,
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error("Role-Department compatibility error:", error);
    return {
      isValid: false,
      message: "Error validating role-department compatibility",
    };
  }
};

export const getAssignmentGuidance = async (currentUser) => {
  try {
    const currentUserRole = await Role.findById(currentUser.role);
    const currentUserDept = await Department.findById(currentUser.department);

    if (!currentUserRole) {
      return "Unable to determine assignment permissions";
    }

    if (currentUserRole.level === 100) {
      return "As SUPER_ADMIN, you can assign any role and department to any user";
    }

    const assignableRoles = await Role.find({
      level: { $lt: currentUserRole.level },
    });
    const assignableDepartments = await Department.find({
      level: { $lte: currentUserDept?.level || 0 },
      company: currentUser.company,
    });

    return {
      roleGuidance: `You can assign roles with level lower than ${currentUserRole.name} (Level ${currentUserRole.level})`,
      departmentGuidance: `You can assign departments at level ${
        currentUserDept?.level || 0
      } or lower`,
      assignableRoles: assignableRoles.map(
        (r) => `${r.name} (Level ${r.level})`
      ),
      assignableDepartments: assignableDepartments.map(
        (d) => `${d.name} (Level ${d.level})`
      ),
    };
  } catch (error) {
    console.error("Assignment guidance error:", error);
    return "Unable to provide assignment guidance";
  }
};
