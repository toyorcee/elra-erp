import TeamMember from "../models/TeamMember.js";
import Project from "../models/Project.js";
import User from "../models/User.js";

// Helper function to get role display name
const getRoleDisplayName = (role) => {
  const roleMap = {
    project_manager: "Project Manager",
    team_lead: "Team Lead",
    developer: "Developer",
    designer: "Designer",
    analyst: "Analyst",
    tester: "Tester",
    consultant: "Consultant",
    support: "Support",
    other: "Other",
  };
  return roleMap[role] || role;
};

// ============================================================================
// TEAM MEMBER CONTROLLERS
// ============================================================================

// @desc    Get all team members (with role-based filtering)
// @route   GET /api/team-members
// @access  Private (Manager+)
export const getAllTeamMembers = async (req, res) => {
  try {
    const currentUser = req.user;
    const { projectId, status, role } = req.query;

    let query = { isActive: true };

    if (currentUser.role.level >= 1000) {
      console.log("🔍 [TEAM MEMBERS] Super Admin - showing all team members");
    }
    // HOD (700) - PM HOD can see all team members, other HODs see department projects
    else if (currentUser.role.level >= 700) {
      if (currentUser.department?.name === "Project Management") {
        console.log(
          "🔍 [TEAM MEMBERS] PM HOD - showing all team members across all projects"
        );
      } else {
        if (!currentUser.department) {
          return res.status(403).json({
            success: false,
            message:
              "You must be assigned to a department to view team members",
          });
        }

        // Get projects in user's department
        const departmentProjects = await Project.find({
          isActive: true,
          $or: [
            { projectManager: currentUser._id },
            { "teamMembers.user": currentUser._id },
          ],
        }).select("_id");

        const projectIds = departmentProjects.map((p) => p._id);
        query.project = { $in: projectIds };

        console.log(
          "🔍 [TEAM MEMBERS] HOD - showing team members for department projects"
        );
      }
    }
    // MANAGER (600) - see team members in projects they manage
    else if (currentUser.role.level >= 600) {
      const managedProjects = await Project.find({
        isActive: true,
        projectManager: currentUser._id,
      }).select("_id");

      const projectIds = managedProjects.map((p) => p._id);
      query.project = { $in: projectIds };

      console.log(
        "🔍 [TEAM MEMBERS] Manager - showing team members for managed projects"
      );
    }
    // STAFF (300) - see only their own team memberships
    else if (currentUser.role.level >= 300) {
      query.user = currentUser._id;
      console.log("🔍 [TEAM MEMBERS] Staff - showing own team memberships");
    }
    // VIEWER (100) - see only their own team memberships
    else if (currentUser.role.level >= 100) {
      query.user = currentUser._id;
      console.log("🔍 [TEAM MEMBERS] Viewer - showing own team memberships");
    } else {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Insufficient permissions to view team members.",
      });
    }

    // Apply filters
    if (projectId) {
      query.project = projectId;
    }
    if (status) {
      query.status = status;
    }
    if (role) {
      query.role = role;
    }

    const teamMembers = await TeamMember.find(query)
      .populate("project", "name code status startDate endDate")
      .populate("user", "firstName lastName email avatar department role")
      .populate("assignedBy", "firstName lastName")
      .sort({ assignedDate: -1 });

    res.status(200).json({
      success: true,
      data: teamMembers,
      total: teamMembers.length,
    });
  } catch (error) {
    console.error("❌ [TEAM MEMBERS] Get all team members error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching team members",
      error: error.message,
    });
  }
};

// @desc    Get team members by project
// @route   GET /api/team-members/project/:projectId
// @access  Private (Manager+)
export const getTeamMembersByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentUser = req.user;
    const { status } = req.query;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check access permissions
    const hasAccess = await checkProjectAccess(currentUser, project);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to view this project's team.",
      });
    }

    const options = {};
    if (status) {
      options.status = status;
    }

    const teamMembers = await TeamMember.getByProject(projectId, options);

    res.status(200).json({
      success: true,
      data: teamMembers,
      total: teamMembers.length,
    });
  } catch (error) {
    console.error(
      "❌ [TEAM MEMBERS] Get team members by project error:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error fetching project team members",
      error: error.message,
    });
  }
};

// @desc    Add team member to project
// @route   POST /api/team-members
// @access  Private (Manager+)
export const addTeamMember = async (req, res) => {
  try {
    const {
      projectId,
      userId,
      role,
      allocationPercentage = 0,
      permissions = {},
    } = req.body;
    const currentUser = req.user;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user exists
    const user = await User.findById(userId)
      .populate("role", "name level")
      .populate("department", "name");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("🔍 [TEAM MEMBERS] Adding team member:");
    console.log(
      `  - Current User: ${currentUser.firstName} ${currentUser.lastName} (${currentUser.role?.name}, Level: ${currentUser.role?.level})`
    );
    console.log(
      `  - Target User: ${user.firstName} ${user.lastName} (${user.role?.name}, Level: ${user.role?.level})`
    );
    console.log(`  - Project: ${project.name} (${project.projectScope})`);

    // Check access permissions
    const canManage = await checkProjectEditAccess(currentUser, project);
    if (!canManage) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to manage this project's team.",
      });
    }

    // Additional validation for external projects
    // PM HOD can manage any project team without restrictions
    if (
      project.projectScope === "external" &&
      currentUser.department?.name !== "Project Management"
    ) {
      const isHRDepartment =
        currentUser.department?.name === "Human Resources" ||
        currentUser.department?.name === "HR" ||
        currentUser.department?.name === "Human Resource Management";

      if (!isHRDepartment || currentUser.role.level < 700) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. Only HR HOD can manage external project teams.",
        });
      }

      // For external projects, ensure user is from HR department (only for non-PM HOD)
      const isUserFromHRDepartment =
        user.department?.name === "Human Resources" ||
        user.department?.name === "HR" ||
        user.department?.name === "Human Resource Management";

      if (!isUserFromHRDepartment) {
        return res.status(400).json({
          success: false,
          message:
            "External projects can only have team members from the HR department.",
        });
      }
    }

    const currentUserRoleLevel = currentUser.role?.level || 0;
    const potentialMemberRoleLevel = user.role?.level || 0;

    if (currentUserRoleLevel >= 1000) {
      console.log("🔍 [TEAM MEMBERS] Super Admin - can assign any user");
    } else if (currentUserRoleLevel >= 700) {
      if (currentUser.department?.name === "Project Management") {
        console.log(
          "🔍 [TEAM MEMBERS] PM HOD - can assign any user to any project"
        );
      } else {
        if (
          potentialMemberRoleLevel > currentUserRoleLevel ||
          (user.department?._id?.toString() || user.department?.toString()) !==
            (currentUser.department?._id?.toString() ||
              currentUser.department?.toString())
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Access denied. HOD can only assign users at their level or below from their department.",
          });
        }
        console.log("🔍 [TEAM MEMBERS] HOD - assigning user at level or below");
      }
    } else if (currentUserRoleLevel >= 600) {
      if (
        potentialMemberRoleLevel > currentUserRoleLevel ||
        (user.department?._id?.toString() || user.department?.toString()) !==
          (currentUser.department?._id?.toString() ||
            currentUser.department?.toString())
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. MANAGER can only assign users at their level or below from their department.",
        });
      }
      console.log(
        "🔍 [TEAM MEMBERS] Manager - assigning user at level or below"
      );
    } else if (currentUserRoleLevel >= 300) {
      if (
        potentialMemberRoleLevel > currentUserRoleLevel ||
        (user.department?._id?.toString() || user.department?.toString()) !==
          (currentUser.department?._id?.toString() ||
            currentUser.department?.toString())
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. STAFF can only assign users at their level or below from their department.",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Insufficient role level to manage team members.",
      });
    }

    // Check if user is already a team member
    const existingMember = await TeamMember.findOne({
      project: projectId,
      user: userId,
      isActive: true,
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: "User is already a team member of this project",
      });
    }

    // Create team member
    const teamMember = new TeamMember({
      project: projectId,
      user: userId,
      role,
      allocationPercentage,
      permissions,
      assignedBy: currentUser._id,
    });

    await teamMember.save();

    // Populate the created team member
    await teamMember.populate(
      "user",
      "firstName lastName email avatar department role"
    );
    await teamMember.populate("assignedBy", "firstName lastName");
    await teamMember.populate(
      "project",
      "name code description startDate endDate status budget category"
    );

    // Send notification to the assigned team member
    try {
      const NotificationService = (
        await import("../services/notificationService.js")
      ).default;
      const notificationService = new NotificationService();

      await notificationService.createNotification({
        recipient: userId,
        type: "TEAM_MEMBER_ASSIGNED",
        title: "You've Been Assigned to a Project",
        message: `You have been assigned to project "${
          teamMember.project.name
        }" as a ${getRoleDisplayName(role)}.`,
        priority: "high",
        data: {
          projectId: projectId,
          projectName: teamMember.project.name,
          projectCode: teamMember.project.code,
          role: role,
          roleDisplay: getRoleDisplayName(role),
          allocationPercentage: allocationPercentage,
          assignedBy: `${currentUser.firstName} ${currentUser.lastName}`,
          assignedDate: teamMember.assignedDate,
          projectDetails: {
            description: teamMember.project.description,
            startDate: teamMember.project.startDate,
            endDate: teamMember.project.endDate,
            status: teamMember.project.status,
            budget: teamMember.project.budget,
            category: teamMember.project.category,
          },
          actionUrl: `/dashboard/modules/self-service/projects`,
        },
      });

      console.log(
        `✅ [TEAM MEMBER] Notification sent to ${teamMember.user.firstName} ${teamMember.user.lastName} for project assignment`
      );

      // Send a welcome notification to the new team member
      try {
        await notificationService.createNotification({
          recipient: userId,
          type: "TEAM_MEMBER_ADDED",
          title: "Welcome to the Team! 🎉",
          message: `Welcome to the ${
            teamMember.project.name
          } project team! We're excited to have you on board as a ${getRoleDisplayName(
            role
          )}.`,
          priority: "medium",
          data: {
            projectId: projectId,
            projectName: teamMember.project.name,
            projectCode: teamMember.project.code,
            role: role,
            roleDisplay: getRoleDisplayName(role),
            welcomeMessage: true,
            actionUrl: `/dashboard/modules/self-service/projects`,
          },
        });

        console.log(
          `🎉 [WELCOME] Welcome notification sent to ${teamMember.user.firstName} ${teamMember.user.lastName}`
        );
      } catch (welcomeError) {
        console.error(
          "❌ [WELCOME] Failed to send welcome notification:",
          welcomeError
        );
      }
    } catch (notificationError) {
      console.error(
        "❌ [TEAM MEMBER] Failed to send notification:",
        notificationError
      );
    }

    // Send notification to all existing team members about the new addition
    try {
      const NotificationService = (
        await import("../services/notificationService.js")
      ).default;
      const notificationService = new NotificationService();

      // Get all existing team members for this project (excluding the newly added one)
      const existingTeamMembers = await TeamMember.find({
        project: projectId,
        user: { $ne: userId },
        isActive: true,
        status: "active",
      }).populate("user", "firstName lastName email");

      console.log(
        `📢 [TEAM NOTIFICATION] Notifying ${existingTeamMembers.length} existing team members about new addition`
      );

      // Send notification to each existing team member
      for (const existingMember of existingTeamMembers) {
        try {
          await notificationService.createNotification({
            recipient: existingMember.user._id,
            type: "TEAM_MEMBER_ADDED",
            title: "New Team Member Added",
            message: `${teamMember.user.firstName} ${
              teamMember.user.lastName
            } has been added to project "${
              teamMember.project.name
            }" as a ${getRoleDisplayName(role)}.`,
            priority: "medium",
            data: {
              projectId: projectId,
              projectName: teamMember.project.name,
              projectCode: teamMember.project.code,
              newMemberName: `${teamMember.user.firstName} ${teamMember.user.lastName}`,
              newMemberRole: getRoleDisplayName(role),
              addedBy: `${currentUser.firstName} ${currentUser.lastName}`,
              addedDate: teamMember.assignedDate,
              actionUrl: `/dashboard/modules/self-service/projects`,
            },
          });

          console.log(
            `✅ [TEAM NOTIFICATION] Notification sent to ${existingMember.user.firstName} ${existingMember.user.lastName} about new team member`
          );
        } catch (memberNotificationError) {
          console.error(
            `❌ [TEAM NOTIFICATION] Failed to notify ${existingMember.user.firstName} ${existingMember.user.lastName}:`,
            memberNotificationError
          );
        }
      }
    } catch (teamNotificationError) {
      console.error(
        "❌ [TEAM NOTIFICATION] Failed to send team notifications:",
        teamNotificationError
      );
    }

    res.status(201).json({
      success: true,
      message: "Team member added successfully",
      data: teamMember,
    });
  } catch (error) {
    console.error("❌ [TEAM MEMBERS] Add team member error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding team member",
      error: error.message,
    });
  }
};

// @desc    Update team member
// @route   PUT /api/team-members/:id
// @access  Private (Manager+)
export const updateTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, allocationPercentage, permissions, status } = req.body;
    const currentUser = req.user;

    const teamMember = await TeamMember.findById(id)
      .populate("project")
      .populate("user", "firstName lastName email");

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: "Team member not found",
      });
    }

    // Check access permissions
    const canManage = await checkProjectEditAccess(
      currentUser,
      teamMember.project
    );
    if (!canManage) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to manage this team member.",
      });
    }

    // Update fields
    if (role) teamMember.role = role;
    if (allocationPercentage !== undefined)
      teamMember.allocationPercentage = allocationPercentage;
    if (permissions)
      teamMember.permissions = { ...teamMember.permissions, ...permissions };
    if (status) teamMember.status = status;

    await teamMember.save();

    // Send notification to the team member about the update
    try {
      const NotificationService = (
        await import("../services/notificationService.js")
      ).default;
      const notificationService = new NotificationService();

      await notificationService.createNotification({
        recipient: teamMember.user._id,
        type: "TEAM_MEMBER_UPDATED",
        title: "Project Assignment Updated",
        message: `Your assignment to project "${teamMember.project.name}" has been updated.`,
        priority: "medium",
        data: {
          projectId: teamMember.project._id,
          projectName: teamMember.project.name,
          projectCode: teamMember.project.code,
          updatedBy: `${currentUser.firstName} ${currentUser.lastName}`,
          updatedDate: new Date(),
          changes: {
            role: role || teamMember.role,
            allocationPercentage:
              allocationPercentage !== undefined
                ? allocationPercentage
                : teamMember.allocationPercentage,
            status: status || teamMember.status,
          },
          actionUrl: `/dashboard/modules/self-service/projects`,
        },
      });

      console.log(
        `✅ [TEAM MEMBER] Notification sent to ${teamMember.user.firstName} ${teamMember.user.lastName} for assignment update`
      );
    } catch (notificationError) {
      console.error(
        "❌ [TEAM MEMBER] Failed to send update notification:",
        notificationError
      );
    }

    res.status(200).json({
      success: true,
      message: "Team member updated successfully",
      data: teamMember,
    });
  } catch (error) {
    console.error("❌ [TEAM MEMBERS] Update team member error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating team member",
      error: error.message,
    });
  }
};

// @desc    Remove team member from project
// @route   DELETE /api/team-members/:id
// @access  Private (Manager+)
export const removeTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const teamMember = await TeamMember.findById(id)
      .populate("project")
      .populate("user", "firstName lastName email");

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: "Team member not found",
      });
    }

    // Check access permissions
    const canManage = await checkProjectEditAccess(
      currentUser,
      teamMember.project
    );
    if (!canManage) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to remove this team member.",
      });
    }

    // Soft delete
    teamMember.isActive = false;
    teamMember.status = "removed";
    await teamMember.save();

    try {
      const NotificationService = (
        await import("../services/notificationService.js")
      ).default;
      const notificationService = new NotificationService();

      await notificationService.createNotification({
        recipient: teamMember.user._id,
        type: "TEAM_MEMBER_REMOVED",
        title: "Project Assignment Update",
        message: `Your assignment to project "${teamMember.project.name}" (${teamMember.project.code}) has been updated. This change allows you to focus on other important tasks and projects. Thank you for your valuable contribution to this project!`,
        priority: "medium",
        data: {
          projectId: teamMember.project._id,
          projectName: teamMember.project.name,
          projectCode: teamMember.project.code,
          removedBy: `${currentUser.firstName} ${currentUser.lastName}`,
          removedDate: new Date(),
          actionUrl: `/dashboard/modules/self-service/projects`,
        },
      });

      console.log(
        `✅ [TEAM MEMBER] Notification sent to ${teamMember.user.firstName} ${teamMember.user.lastName} for project removal`
      );
    } catch (notificationError) {
      console.error(
        "❌ [TEAM MEMBER] Failed to send removal notification:",
        notificationError
      );
    }

    res.status(200).json({
      success: true,
      message: "Team member removed successfully",
    });
  } catch (error) {
    console.error("❌ [TEAM MEMBERS] Remove team member error:", error);
    res.status(500).json({
      success: false,
      message: "Error removing team member",
      error: error.message,
    });
  }
};

// @desc    Get available users for team assignment
// @route   GET /api/team-members/available/:projectId
// @access  Private (Manager+)
export const getAvailableUsers = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentUser = req.user;
    const { search, department } = req.query;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check access permissions
    const canManage = await checkProjectEditAccess(currentUser, project);
    if (!canManage) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You don't have permission to manage this project's team.",
      });
    }

    // Additional validation for external projects
    if (project.projectScope === "external") {
      const isHRDepartment =
        currentUser.department?.name === "Human Resources" ||
        currentUser.department?.name === "HR" ||
        currentUser.department?.name === "Human Resource Management";

      const isPMDepartment =
        currentUser.department?.name === "Project Management";

      if (
        (!isHRDepartment && !isPMDepartment) ||
        currentUser.role.level < 700
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. Only HR HOD or PM HOD can manage external project teams.",
        });
      }
    }

    // Get current team members
    const currentTeamMembers = await TeamMember.find({
      project: projectId,
      isActive: true,
    }).select("user");

    const currentUserIds = currentTeamMembers.map((tm) => tm.user);

    // Build user query
    let userQuery = {
      isActive: true,
      _id: { $nin: currentUserIds },
    };

    // SUPER_ADMIN can see all users
    if (currentUser.role.level >= 1000) {
      console.log(
        "🔍 [TEAM MEMBERS] Super Admin - showing all available users"
      );
    }
    // HOD - PM HOD can see all users, other HODs see department users
    else if (currentUser.role.level >= 700) {
      if (currentUser.department?.name === "Project Management") {
        // PM HOD can see all users across all departments
        console.log(
          "🔍 [TEAM MEMBERS] PM HOD - showing all available users across all departments"
        );
      } else {
        // Other HODs see users in their department at their level or below
        if (!currentUser.department) {
          return res.status(403).json({
            success: false,
            message: "You must be assigned to a department to view users",
          });
        }
        userQuery.department = currentUser.department;
        // HOD can only assign users at their level (700) or below
        userQuery["role.level"] = { $lte: currentUser.role.level };
        console.log(
          "🔍 [TEAM MEMBERS] HOD - showing available users in department at level 700 or below"
        );
      }
    }
    // MANAGER can see users in their department at their level or below
    else if (currentUser.role.level >= 600) {
      if (!currentUser.department) {
        return res.status(403).json({
          success: false,
          message: "You must be assigned to a department to view users",
        });
      }
      userQuery.department = currentUser.department;
      // Manager can only assign users at their level (600) or below
      userQuery["role.level"] = { $lte: currentUser.role.level };
      console.log(
        "🔍 [TEAM MEMBERS] Manager - showing available users in department at level 600 or below"
      );
    }
    // STAFF can see users in their department at their level or below
    else if (currentUser.role.level >= 300) {
      if (!currentUser.department) {
        return res.status(403).json({
          success: false,
          message: "You must be assigned to a department to view users",
        });
      }
      userQuery.department = currentUser.department;
      // Staff can only assign users at their level (300) or below
      userQuery["role.level"] = { $lte: currentUser.role.level };
      console.log(
        "🔍 [TEAM MEMBERS] Staff - showing available users in department at level 300 or below"
      );
    } else {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Insufficient permissions to view available users.",
      });
    }

    if (department) {
      userQuery.department = department;
    }

    if (search) {
      userQuery.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    console.log(
      "🔍 [TEAM MEMBERS] User query:",
      JSON.stringify(userQuery, null, 2)
    );

    const users = await User.find(userQuery)
      .populate("department", "name")
      .populate("role", "name level")
      .select("firstName lastName email avatar department role")
      .sort({ firstName: 1, lastName: 1 })
      .limit(50);

    console.log(
      `🔍 [TEAM MEMBERS] Found ${users.length} available users for assignment`
    );
    users.forEach((user) => {
      console.log(
        `  - ${user.firstName} ${user.lastName} (${user.role?.name}, Level: ${user.role?.level})`
      );
    });

    res.status(200).json({
      success: true,
      data: users,
      total: users.length,
    });
  } catch (error) {
    console.error("❌ [TEAM MEMBERS] Get available users error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching available users",
      error: error.message,
    });
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Check if user has access to view project
const checkProjectAccess = async (user, project) => {
  // SUPER_ADMIN can access everything
  if (user.role.level >= 1000) return true;

  // HOD can access projects in their department or where they're manager
  if (user.role.level >= 700) {
    return (
      (project.projectManager?._id?.toString() ||
        project.projectManager?.toString()) ===
        (user._id?.toString() || user._id) ||
      project.teamMembers.some(
        (member) =>
          (member.user?._id?.toString() || member.user?.toString()) ===
            (user._id?.toString() || user._id) && member.isActive
      ) ||
      (project.company?._id?.toString() || project.company?.toString()) ===
        (user.company?._id?.toString() || user.company?.toString())
    );
  }

  // MANAGER can access projects they manage
  if (user.role.level >= 600) {
    return (
      (project.projectManager?._id?.toString() ||
        project.projectManager?.toString()) ===
      (user._id?.toString() || user._id)
    );
  }

  // STAFF can access projects they're assigned to
  if (user.role.level >= 300) {
    return (
      (project.projectManager?._id?.toString() ||
        project.projectManager?.toString()) ===
        (user._id?.toString() || user._id) ||
      project.teamMembers.some(
        (member) =>
          (member.user?._id?.toString() || member.user?.toString()) ===
            (user._id?.toString() || user._id) && member.isActive
      )
    );
  }

  return false;
};

// Check if user can edit project
const checkProjectEditAccess = async (user, project) => {
  // SUPER_ADMIN can edit everything
  if (user.role.level >= 1000) return true;

  // HOD can edit projects in their department or where they're manager
  if (user.role.level >= 700) {
    return (
      (project.projectManager?._id?.toString() ||
        project.projectManager?.toString()) ===
        (user._id?.toString() || user._id) ||
      (project.company?._id?.toString() || project.company?.toString()) ===
        (user.company?._id?.toString() || user.company?.toString())
    );
  }

  // MANAGER can edit projects they manage
  if (user.role.level >= 600) {
    return (
      (project.projectManager?._id?.toString() ||
        project.projectManager?.toString()) ===
      (user._id?.toString() || user._id)
    );
  }

  return false;
};
