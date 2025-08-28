import mongoose from "mongoose";

// @desc    Check access to personal project
// @access  Private (Creator, Project Manager, SUPER_ADMIN, or approvers in chain)
export const checkPersonalProjectAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const project = await mongoose.model("Project").findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.projectScope !== "personal") {
      return res.status(400).json({
        success: false,
        message: "This endpoint is only for personal projects",
      });
    }

    if (currentUser.role.level >= 1000) {
      req.project = project;
      return next();
    }

    if (
      project.createdBy.toString() === currentUser._id.toString() ||
      project.projectManager.toString() === currentUser._id.toString()
    ) {
      req.project = project;
      return next();
    }

    const isInApprovalChain = project.approvalChain?.some(
      (step) => step.approver?.toString() === currentUser._id.toString()
    );

    if (isInApprovalChain) {
      req.project = project;
      return next();
    }

    return res.status(403).json({
      success: false,
      message:
        "Access denied. You don't have permission to view this personal project.",
    });
  } catch (error) {
    console.error("❌ [PERSONAL PROJECT ACCESS] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error checking personal project access",
    });
  }
};

// @desc    Check edit access to personal project
// @access  Private (Creator, Project Manager, or SUPER_ADMIN)
export const checkPersonalProjectEdit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const project = await mongoose.model("Project").findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.projectScope !== "personal") {
      return res.status(400).json({
        success: false,
        message: "This endpoint is only for personal projects",
      });
    }

    if (currentUser.role.level >= 1000) {
      req.project = project;
      return next();
    }

    if (
      project.createdBy.toString() === currentUser._id.toString() ||
      project.projectManager.toString() === currentUser._id.toString()
    ) {
      req.project = project;
      return next();
    }

    return res.status(403).json({
      success: false,
      message:
        "Access denied. Only the creator, project manager, or SUPER_ADMIN can edit personal projects.",
    });
  } catch (error) {
    console.error("❌ [PERSONAL PROJECT EDIT] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error checking personal project edit access",
    });
  }
};

// @desc    Check delete access to personal project
// @access  Private (Creator or SUPER_ADMIN)
export const checkPersonalProjectDelete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const project = await mongoose.model("Project").findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.projectScope !== "personal") {
      return res.status(400).json({
        success: false,
        message: "This endpoint is only for personal projects",
      });
    }

    if (currentUser.role.level >= 1000) {
      req.project = project;
      return next();
    }

    if (project.createdBy.toString() === currentUser._id.toString()) {
      req.project = project;
      return next();
    }

    return res.status(403).json({
      success: false,
      message:
        "Access denied. Only the creator or SUPER_ADMIN can delete personal projects.",
    });
  } catch (error) {
    console.error("❌ [PERSONAL PROJECT DELETE] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error checking personal project delete access",
    });
  }
};

// @desc    Check create access for personal project
// @access  Private (Any authenticated user can create personal projects)
export const checkPersonalProjectCreate = async (req, res, next) => {
  try {
    const currentUser = req.user;
    const { projectScope } = req.body;

    if (projectScope !== "personal") {
      return next();
    }

    // Allow any authenticated user, regardless of role level
    if (!currentUser || !currentUser._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to create personal projects.",
      });
    }

    console.log(
      "✅ [PERSONAL PROJECT] Any authenticated user authorized to create personal project"
    );
    return next();
  } catch (error) {
    console.error("❌ [PERSONAL PROJECT CREATE] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error checking personal project create access",
    });
  }
};
