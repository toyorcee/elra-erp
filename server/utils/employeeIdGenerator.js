import User from "../models/User.js";

/**
 * Generate a unique employee ID based on department code and sequence
 * Format: DEPTCODE + YY + SEQ (e.g., HRM24001, IT24001, FIN24001)
 */
export const generateEmployeeId = async (departmentId = null) => {
  try {
    let deptCode = "GEN"; // Default for general users

    // If department is provided, get its code
    if (departmentId) {
      const Department = (await import("../models/Department.js")).default;
      const department = await Department.findById(departmentId);
      if (department) {
        deptCode =
          department.code ||
          department.name?.slice(0, 3).toUpperCase() ||
          "GEN";
      }
    }

    const year = new Date().getFullYear().toString().slice(-2); // Last 2 digits of year

    // Find the highest sequence number for this department and year
    const regex = new RegExp(`^${deptCode}${year}\\d{3}$`, "i");
    const existingUsers = await User.find({ employeeId: regex });

    let maxSequence = 0;
    existingUsers.forEach((user) => {
      if (user.employeeId) {
        const match = user.employeeId.match(
          new RegExp(`^${deptCode}${year}(\\d{3})$`, "i")
        );
        if (match) {
          const seq = parseInt(match[1]);
          if (seq > maxSequence) {
            maxSequence = seq;
          }
        }
      }
    });

    const nextSequence = maxSequence + 1;
    const employeeId = `${deptCode}${year}${nextSequence
      .toString()
      .padStart(3, "0")}`;

    return employeeId;
  } catch (error) {
    console.error("Error generating employee ID:", error);
    // Fallback: generate a timestamp-based ID
    const timestamp = Date.now().toString().slice(-6);
    return `EMP${timestamp}`;
  }
};

/**
 * Generate employee ID for a specific user and save it
 */
export const assignEmployeeIdToUser = async (userId, departmentId = null) => {
  try {
    const employeeId = await generateEmployeeId(departmentId);

    await User.findByIdAndUpdate(userId, {
      employeeId: employeeId,
    });

    return employeeId;
  } catch (error) {
    console.error("Error assigning employee ID to user:", error);
    throw error;
  }
};
