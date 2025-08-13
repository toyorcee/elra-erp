import SalaryGrade from "../models/SalaryGrade.js";
import RoleSalaryGradeMapping from "../models/RoleSalaryGradeMapping.js";
import Role from "../models/Role.js";

/**
 * Find the appropriate salary grade based on gross salary
 * @param {number} grossSalary - The gross salary amount
 * @returns {Promise<Object|null>} - The salary grade object or null if not found
 */
export const findSalaryGradeByGrossSalary = async (grossSalary) => {
  try {
    const salaryGrade = await SalaryGrade.findByGrossSalary(grossSalary);
    return salaryGrade;
  } catch (error) {
    console.error("Error finding salary grade by gross salary:", error);
    return null;
  }
};

/**
 * Get salary grade for a specific role
 * @param {string} roleId - The role ID
 * @returns {Promise<Object|null>} - The salary grade object or null if not found
 */
export const getSalaryGradeForRole = async (roleId) => {
  try {
    const mapping = await RoleSalaryGradeMapping.getSalaryGradeForRole(roleId);
    return mapping?.salaryGrade || null;
  } catch (error) {
    console.error("Error getting salary grade for role:", error);
    return null;
  }
};

/**
 * Get all active role-salary grade mappings
 * @returns {Promise<Array>} - Array of mappings with populated role and salary grade data
 */
export const getAllRoleSalaryGradeMappings = async () => {
  try {
    const mappings = await RoleSalaryGradeMapping.getActiveMappings();
    return mappings;
  } catch (error) {
    console.error("Error getting role-salary grade mappings:", error);
    return [];
  }
};

/**
 * Create or update role-salary grade mapping
 * @param {string} roleId - The role ID
 * @param {string} salaryGradeId - The salary grade ID
 * @param {string} userId - The user creating/updating the mapping
 * @returns {Promise<Object>} - The created/updated mapping
 */
export const createOrUpdateRoleSalaryGradeMapping = async (
  roleId,
  salaryGradeId,
  userId
) => {
  try {
    // Check if mapping already exists
    const existingMapping = await RoleSalaryGradeMapping.findOne({
      role: roleId,
    });

    if (existingMapping) {
      // Update existing mapping
      existingMapping.salaryGrade = salaryGradeId;
      existingMapping.updatedBy = userId;
      existingMapping.isActive = true;
      await existingMapping.save();
      return existingMapping;
    } else {
      // Create new mapping
      const newMapping = new RoleSalaryGradeMapping({
        role: roleId,
        salaryGrade: salaryGradeId,
        createdBy: userId,
      });
      await newMapping.save();
      return newMapping;
    }
  } catch (error) {
    console.error("Error creating/updating role-salary grade mapping:", error);
    throw error;
  }
};

/**
 * Validate if a gross salary falls within the expected range for a role
 * @param {string} roleId - The role ID
 * @param {number} grossSalary - The gross salary amount
 * @returns {Promise<Object>} - Validation result with details
 */
export const validateSalaryForRole = async (roleId, grossSalary) => {
  try {
    const roleSalaryGrade = await getSalaryGradeForRole(roleId);

    if (!roleSalaryGrade) {
      return {
        isValid: false,
        message: "No salary grade mapping found for this role",
        expectedRange: null,
        actualSalary: grossSalary,
      };
    }

    const isWithinRange =
      grossSalary >= roleSalaryGrade.minGrossSalary &&
      grossSalary <= roleSalaryGrade.maxGrossSalary;

    return {
      isValid: isWithinRange,
      message: isWithinRange
        ? "Salary is within expected range"
        : `Salary should be between ₦${roleSalaryGrade.minGrossSalary.toLocaleString()} and ₦${roleSalaryGrade.maxGrossSalary.toLocaleString()}`,
      expectedRange: {
        min: roleSalaryGrade.minGrossSalary,
        max: roleSalaryGrade.maxGrossSalary,
        grade: roleSalaryGrade.grade,
        name: roleSalaryGrade.name,
      },
      actualSalary: grossSalary,
      suggestedGrade: roleSalaryGrade,
    };
  } catch (error) {
    console.error("Error validating salary for role:", error);
    return {
      isValid: false,
      message: "Error validating salary",
      expectedRange: null,
      actualSalary: grossSalary,
    };
  }
};

/**
 * Get all available roles for selection
 * @returns {Promise<Array>} - Array of roles with their salary grade mappings
 */
export const getAvailableRolesWithSalaryGrades = async () => {
  try {
    const roles = await Role.find({ isActive: true }).sort({ level: -1 });
    const mappings = await getAllRoleSalaryGradeMappings();

    // Create a map of role ID to salary grade
    const salaryGradeMap = {};
    mappings.forEach((mapping) => {
      salaryGradeMap[mapping.role._id.toString()] = mapping.salaryGrade;
    });

    // Add salary grade info to each role
    const rolesWithSalaryGrades = roles.map((role) => ({
      _id: role._id,
      name: role.name,
      level: role.level,
      description: role.description,
      salaryGrade: salaryGradeMap[role._id.toString()] || null,
    }));

    return rolesWithSalaryGrades;
  } catch (error) {
    console.error("Error getting roles with salary grades:", error);
    return [];
  }
};

/**
 * Calculate total compensation for a given salary grade and step
 * @param {string} salaryGradeId - The salary grade ID
 * @param {number} baseSalary - The base salary
 * @param {string} step - The step (default: "Step 1")
 * @returns {Promise<Object>} - Total compensation breakdown
 */
export const calculateTotalCompensation = async (
  salaryGradeId,
  baseSalary,
  step = "Step 1"
) => {
  try {
    const salaryGrade = await SalaryGrade.findById(salaryGradeId);
    if (!salaryGrade) {
      throw new Error("Salary grade not found");
    }

    return salaryGrade.calculateTotalCompensation(baseSalary, step);
  } catch (error) {
    console.error("Error calculating total compensation:", error);
    throw error;
  }
};

/**
 * Check for overlapping salary ranges
 * @param {number} minSalary - Minimum salary of the new grade
 * @param {number} maxSalary - Maximum salary of the new grade
 * @param {string} excludeId - ID to exclude from check (for updates)
 * @returns {Promise<Object>} - Check result with isValid flag and overlapping grade info
 */
export const checkOverlappingSalaryRanges = async (
  minSalary,
  maxSalary,
  excludeId = null
) => {
  try {
    const query = {
      isActive: true,
      $or: [
        // Check if new range overlaps with existing ranges
        {
          $and: [
            { minGrossSalary: { $lte: maxSalary } },
            { maxGrossSalary: { $gte: minSalary } },
          ],
        },
      ],
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const overlappingGrade = await SalaryGrade.findOne(query);

    if (overlappingGrade) {
      return {
        isValid: false,
        overlappingGrade: {
          id: overlappingGrade._id,
          grade: overlappingGrade.grade,
          name: overlappingGrade.name,
          minSalary: overlappingGrade.minGrossSalary,
          maxSalary: overlappingGrade.maxGrossSalary,
        },
        message: `Salary range overlaps with existing grade "${
          overlappingGrade.grade
        } - ${
          overlappingGrade.name
        }" (₦${overlappingGrade.minGrossSalary.toLocaleString(
          "en-NG"
        )} - ₦${overlappingGrade.maxGrossSalary.toLocaleString("en-NG")})`,
      };
    }

    return {
      isValid: true,
      overlappingGrade: null,
      message: "No overlapping salary ranges found",
    };
  } catch (error) {
    console.error("Error checking overlapping salary ranges:", error);
    return {
      isValid: false,
      overlappingGrade: null,
      message: "Error checking salary range overlaps",
    };
  }
};

/**
 * Validate salary grade data
 * @param {Object} data - The salary grade data to validate
 * @param {string} excludeId - ID to exclude from overlap check (for updates)
 * @returns {Promise<Object>} - Validation result with isValid flag and errors array
 */
export const validateSalaryGradeData = async (data, excludeId = null) => {
  const errors = [];

  // Required fields validation
  if (!data.grade || data.grade.trim() === "") {
    errors.push("Grade level is required");
  }

  if (!data.name || data.name.trim() === "") {
    errors.push("Grade name is required");
  }

  if (!data.description || data.description.trim() === "") {
    errors.push("Description is required");
  }

  // Salary range validation
  if (
    !data.minGrossSalary ||
    isNaN(data.minGrossSalary) ||
    data.minGrossSalary <= 0
  ) {
    errors.push("Minimum gross salary must be a positive number");
  }

  if (
    !data.maxGrossSalary ||
    isNaN(data.maxGrossSalary) ||
    data.maxGrossSalary <= 0
  ) {
    errors.push("Maximum gross salary must be a positive number");
  }

  if (
    data.minGrossSalary &&
    data.maxGrossSalary &&
    parseFloat(data.minGrossSalary) >= parseFloat(data.maxGrossSalary)
  ) {
    errors.push(
      "Maximum gross salary must be greater than minimum gross salary"
    );
  }

  // Check for overlapping salary ranges
  if (data.minGrossSalary && data.maxGrossSalary) {
    const overlapCheck = await checkOverlappingSalaryRanges(
      parseFloat(data.minGrossSalary),
      parseFloat(data.maxGrossSalary),
      excludeId
    );

    if (!overlapCheck.isValid) {
      errors.push(overlapCheck.message);
    }
  }

  // Allowances validation
  if (data.allowances) {
    const allowanceFields = ["housing", "transport", "meal", "other"];
    allowanceFields.forEach((field) => {
      if (
        data.allowances[field] &&
        (isNaN(data.allowances[field]) || data.allowances[field] < 0)
      ) {
        errors.push(
          `${
            field.charAt(0).toUpperCase() + field.slice(1)
          } allowance must be a non-negative number`
        );
      }
    });
  }

  // Steps validation
  if (data.steps && Array.isArray(data.steps)) {
    data.steps.forEach((step, index) => {
      if (!step.step || step.step.trim() === "") {
        errors.push(`Step ${index + 1} name is required`);
      }

      if (step.increment && (isNaN(step.increment) || step.increment < 0)) {
        errors.push(
          `Step ${index + 1} increment must be a non-negative number`
        );
      }

      if (
        step.yearsOfService &&
        (isNaN(step.yearsOfService) || step.yearsOfService < 0)
      ) {
        errors.push(
          `Step ${index + 1} years of service must be a non-negative number`
        );
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
