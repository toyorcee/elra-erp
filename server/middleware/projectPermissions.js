import Project from "../models/Project.js";

// Middleware to check if user can access external projects
export const checkExternalProjectAccess = async (req, res, next) => {
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

    // If it's an external project, check Project Management HOD permissions
    if (project.projectScope === "external") {
      const isProjectManagementHOD =
        currentUser.department?.name === "Project Management";

      // Only Project Management HOD and SUPER_ADMIN can access external projects
      if (
        !(
          currentUser.role.level >= 1000 ||
          (currentUser.role.level >= 700 && isProjectManagementHOD)
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. Only Project Management HOD can access external projects.",
        });
      }
    }

    // Add project to request for use in controller
    req.project = project;
    next();
  } catch (error) {
    console.error("❌ [PROJECT PERMISSIONS] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error checking project permissions",
    });
  }
};

// Middleware to check if user can edit external projects
export const checkExternalProjectEdit = async (req, res, next) => {
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

    // If it's an external project, only Project Management HOD can edit
    if (project.projectScope === "external") {
      const isProjectManagementHOD =
        currentUser.department?.name === "Project Management";

      // Only Project Management HOD and SUPER_ADMIN can edit external projects
      if (
        !(
          currentUser.role.level >= 1000 ||
          (currentUser.role.level >= 700 && isProjectManagementHOD)
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. Only Project Management HOD can edit external projects.",
        });
      }
    }

    // Add project to request for use in controller
    req.project = project;
    next();
  } catch (error) {
    console.error("❌ [PROJECT PERMISSIONS] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error checking project permissions",
    });
  }
};

// Middleware to check if user can delete external projects
export const checkExternalProjectDelete = async (req, res, next) => {
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

    // If it's an external project, only Project Management HOD can delete
    if (project.projectScope === "external") {
      const isProjectManagementHOD =
        currentUser.department?.name === "Project Management";

      // Only Project Management HOD and SUPER_ADMIN can delete external projects
      if (
        !(
          currentUser.role.level >= 1000 ||
          (currentUser.role.level >= 700 && isProjectManagementHOD)
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. Only Project Management HOD can delete external projects.",
        });
      }
    }

    // Add project to request for use in controller
    req.project = project;
    next();
  } catch (error) {
    console.error("❌ [PROJECT PERMISSIONS] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error checking project permissions",
    });
  }
};

// Middleware to check if user can create external projects
export const checkExternalProjectCreate = async (req, res, next) => {
  try {
    const currentUser = req.user;
    const { projectScope } = req.body;

    // If trying to create an external project, check Project Management HOD permissions
    if (projectScope === "external") {
      const isProjectManagementHOD =
        currentUser.department?.name === "Project Management";

      // Only Project Management HOD and SUPER_ADMIN can create external projects
      if (
        !(
          currentUser.role.level >= 1000 ||
          (currentUser.role.level >= 700 && isProjectManagementHOD)
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. Only Project Management HOD can create external projects.",
        });
      }
    }

    next();
  } catch (error) {
    console.error("❌ [PROJECT PERMISSIONS] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error checking project permissions",
    });
  }
};
