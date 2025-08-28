import Project from "../models/Project.js";

// Middleware to check if user can access departmental projects
export const checkDepartmentalProjectAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // If it's a departmental project, check department access
    if (project.projectScope === "departmental") {
      // HOD can access projects in their department
      const isHODOfProjectDepartment =
        currentUser.role.level >= 700 &&
        currentUser.department &&
        project.department &&
        (currentUser.department._id?.toString() ===
          project.department.toString() ||
          currentUser.department.toString() === project.department.toString());

      // SUPER_ADMIN can access all departmental projects
      if (!(currentUser.role.level >= 1000 || isHODOfProjectDepartment)) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. Only HOD of the project department can access this departmental project.",
        });
      }
    }

    // Add project to request for use in controller
    req.project = project;
    next();
  } catch (error) {
    console.error("❌ [DEPARTMENTAL PROJECT PERMISSIONS] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error checking departmental project permissions",
    });
  }
};

// Middleware to check if user can edit departmental projects
export const checkDepartmentalProjectEdit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Get the project to check its scope
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // If it's a departmental project, check department access
    if (project.projectScope === "departmental") {
      // HOD can edit projects in their department
      const isHODOfProjectDepartment =
        currentUser.role.level >= 700 &&
        currentUser.department &&
        project.department &&
        (currentUser.department._id?.toString() ===
          project.department.toString() ||
          currentUser.department.toString() === project.department.toString());

      // SUPER_ADMIN can edit all departmental projects
      if (!(currentUser.role.level >= 1000 || isHODOfProjectDepartment)) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. Only HOD of the project department can edit this departmental project.",
        });
      }
    }

    // Add project to request for use in controller
    req.project = project;
    next();
  } catch (error) {
    console.error("❌ [DEPARTMENTAL PROJECT PERMISSIONS] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error checking departmental project permissions",
    });
  }
};

// Middleware to check if user can delete departmental projects
export const checkDepartmentalProjectDelete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Get the project to check its scope
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // If it's a departmental project, check department access
    if (project.projectScope === "departmental") {
      // HOD can delete projects in their department
      const isHODOfProjectDepartment =
        currentUser.role.level >= 700 &&
        currentUser.department &&
        project.department &&
        (currentUser.department._id?.toString() ===
          project.department.toString() ||
          currentUser.department.toString() === project.department.toString());

      // SUPER_ADMIN can delete all departmental projects
      if (!(currentUser.role.level >= 1000 || isHODOfProjectDepartment)) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. Only HOD of the project department can delete this departmental project.",
        });
      }
    }

    // Add project to request for use in controller
    req.project = project;
    next();
  } catch (error) {
    console.error("❌ [DEPARTMENTAL PROJECT PERMISSIONS] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error checking departmental project permissions",
    });
  }
};

// Middleware to check if user can create departmental projects
export const checkDepartmentalProjectCreate = async (req, res, next) => {
  try {
    const currentUser = req.user;
    const { projectScope } = req.body;

    // If trying to create a departmental project, check HOD permissions
    if (projectScope === "departmental") {
      // Only HOD (700+) can create departmental projects
      if (currentUser.role.level < 700) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Only HOD can create departmental projects.",
        });
      }
    }

    next();
  } catch (error) {
    console.error("❌ [DEPARTMENTAL PROJECT PERMISSIONS] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error checking departmental project permissions",
    });
  }
};
