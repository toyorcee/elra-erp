import Project from "../models/Project.js";

export const checkExternalProjectAccess = async (req, res, next) => {
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

    if (project.projectScope === "external") {
      const isProjectManagementHOD =
        currentUser.department?.name === "Project Management";

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

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.projectScope === "external") {
      const isProjectManagementHOD =
        currentUser.department?.name === "Project Management";

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

export const checkExternalProjectDelete = async (req, res, next) => {
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

    if (project.projectScope === "external") {
      const isProjectManagementHOD =
        currentUser.department?.name === "Project Management";

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

export const checkExternalProjectCreate = async (req, res, next) => {
  try {
    const currentUser = req.user;
    const { projectScope } = req.body;

    if (projectScope === "external") {
      const isProjectManagementHOD =
        currentUser.department?.name === "Project Management";

      if (
        !(
          currentUser.role.level >= 1000 ||
          (currentUser.role.level >= 700 && isProjectManagementHOD)
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. Only Project Management HOD or Super Admin can create external projects.",
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
