import ComplianceProgram from "../models/ComplianceProgram.js";
import Compliance from "../models/Compliance.js";
import User from "../models/User.js";
import NotificationService from "../services/notificationService.js";

// Create a new compliance program
export const createComplianceProgram = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      customCategory,
      status,
      priority,
      effectiveDate,
      reviewDate,
      complianceScope,
      applicableProjectScopes,
      programOwner,
      objectives,
      kpis,
      documentation,
    } = req.body;

    // Check if user has permission (Legal HOD or Super Admin)
    if (req.user.role.level < 700) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Legal HOD and Super Admin can create compliance programs.",
      });
    }

    // Validate program owner exists
    if (programOwner) {
      const owner = await User.findById(programOwner);
      if (!owner) {
        return res.status(400).json({
          success: false,
          message: "Program owner not found",
        });
      }
    }

    const complianceProgram = await ComplianceProgram.create({
      name,
      description,
      category: category === "Other" && customCategory ? "Other" : category,
      customCategory:
        category === "Other" && customCategory ? customCategory : undefined,
      status,
      priority,
      effectiveDate,
      reviewDate,
      complianceScope: complianceScope || "legal",
      applicableProjectScopes: applicableProjectScopes || [],
      programOwner: programOwner || "ELRA",
      createdBy: req.user._id,
      objectives: objectives || [],
      kpis: kpis || [],
      documentation: documentation || [],
    });

    await complianceProgram.populate([
      { path: "programOwner", select: "firstName lastName email" },
      { path: "createdBy", select: "firstName lastName email" },
    ]);

    try {
      await sendComplianceProgramNotifications(
        complianceProgram,
        "created",
        req.user
      );
    } catch (notificationError) {
      console.error(
        "Error sending compliance program notifications:",
        notificationError
      );
    }

    res.status(201).json({
      success: true,
      message: "Compliance program created successfully",
      data: {
        complianceProgram,
      },
    });
  } catch (error) {
    console.error("Error creating compliance program:", error);
    res.status(500).json({
      success: false,
      message: "Error creating compliance program",
      error: error.message,
    });
  }
};

// Get all compliance programs
export const getCompliancePrograms = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      complianceScope,
    } = req.query;

    // Check if user has permission (Legal HOD or Super Admin)
    if (req.user.role.level < 700) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Legal HOD and Super Admin can view compliance programs.",
      });
    }

    // Build filter object
    const filter = { isActive: true };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (complianceScope) filter.complianceScope = complianceScope;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const compliancePrograms = await ComplianceProgram.find(filter)
      .populate("programOwner", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .populate("complianceItemsCount")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ComplianceProgram.countDocuments(filter);

    res.json({
      success: true,
      data: {
        compliancePrograms,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching compliance programs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching compliance programs",
      error: error.message,
    });
  }
};

// Get compliant compliance programs (all items are compliant)
export const getCompliantCompliancePrograms = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      complianceScope,
    } = req.query;

    // Check if user has permission (Legal HOD or Super Admin)
    if (req.user.role.level < 700) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Legal HOD and Super Admin can view compliance programs.",
      });
    }

    // Build filter object
    const filter = { isActive: true };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (complianceScope) filter.complianceScope = complianceScope;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const compliancePrograms = await ComplianceProgram.find(filter)
      .populate("programOwner", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .populate("complianceItemsCount")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const compliantPrograms = [];

    for (const program of compliancePrograms) {
      const isReady = await program.isReadyForAttachment();
      if (isReady) {
        compliantPrograms.push(program);
      }
    }

    const total = await ComplianceProgram.countDocuments(filter);

    res.json({
      success: true,
      data: {
        compliancePrograms: compliantPrograms,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching compliant compliance programs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching compliant compliance programs",
      error: error.message,
    });
  }
};

// Get compliance program by ID
export const getComplianceProgramById = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role.level < 700) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Legal HOD and Super Admin can view compliance programs.",
      });
    }

    const complianceProgram = await ComplianceProgram.findById(id)
      .populate("programOwner", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .populate("complianceItemsCount");

    if (!complianceProgram) {
      return res.status(404).json({
        success: false,
        message: "Compliance program not found",
      });
    }

    const complianceItems = await Compliance.find({
      complianceProgram: id,
      isActive: true,
    })
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    const complianceStats = await complianceProgram.getComplianceStats();

    res.json({
      success: true,
      data: {
        complianceProgram,
        complianceItems,
        complianceStats,
      },
    });
  } catch (error) {
    console.error("Error fetching compliance program:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching compliance program",
      error: error.message,
    });
  }
};

export const updateComplianceProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if user has permission (Legal HOD or Super Admin)
    if (req.user.role.level < 700) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Legal HOD and Super Admin can update compliance programs.",
      });
    }

    const complianceProgram = await ComplianceProgram.findById(id);

    if (!complianceProgram) {
      return res.status(404).json({
        success: false,
        message: "Compliance program not found",
      });
    }

    // Check if user can update (creator or Super Admin)
    if (
      complianceProgram.createdBy.toString() !== req.user._id.toString() &&
      req.user.role.level < 1000
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only the creator or Super Admin can update this compliance program.",
      });
    }

    // Handle custom category
    if (updateData.category === "Other" && updateData.customCategory) {
      updateData.category = "Other";
    } else if (updateData.category !== "Other") {
      updateData.customCategory = undefined;
    }

    const updatedProgram = await ComplianceProgram.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: "programOwner", select: "firstName lastName email" },
      { path: "createdBy", select: "firstName lastName email" },
    ]);

    // Send notifications to all HODs for compliance program update
    try {
      await sendComplianceProgramNotifications(
        updatedProgram,
        "updated",
        req.user
      );
    } catch (notificationError) {
      console.error(
        "Error sending compliance program notifications:",
        notificationError
      );
    }

    res.json({
      success: true,
      message: "Compliance program updated successfully",
      data: {
        complianceProgram: updatedProgram,
      },
    });
  } catch (error) {
    console.error("Error updating compliance program:", error);
    res.status(500).json({
      success: false,
      message: "Error updating compliance program",
      error: error.message,
    });
  }
};

// Delete compliance program
export const deleteComplianceProgram = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has permission (Legal HOD or Super Admin)
    if (req.user.role.level < 700) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Legal HOD and Super Admin can delete compliance programs.",
      });
    }

    const complianceProgram = await ComplianceProgram.findById(id);

    if (!complianceProgram) {
      return res.status(404).json({
        success: false,
        message: "Compliance program not found",
      });
    }

    // Check if user can delete (creator or Super Admin)
    if (
      complianceProgram.createdBy.toString() !== req.user._id.toString() &&
      req.user.role.level < 1000
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only the creator or Super Admin can delete this compliance program.",
      });
    }

    // Check if there are compliance items associated with this program
    const complianceItemsCount = await Compliance.countDocuments({
      complianceProgram: id,
      isActive: true,
    });

    if (complianceItemsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete compliance program. It has ${complianceItemsCount} associated compliance items. Please delete or reassign the compliance items first.`,
      });
    }

    // Soft delete the compliance program
    await ComplianceProgram.findByIdAndUpdate(id, { isActive: false });

    res.json({
      success: true,
      message: "Compliance program deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting compliance program:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting compliance program",
      error: error.message,
    });
  }
};

// Get compliance program statistics
export const getComplianceProgramStats = async (req, res) => {
  try {
    // Check if user has permission (Legal HOD or Super Admin)
    if (req.user.role.level < 700) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Legal HOD and Super Admin can view compliance program statistics.",
      });
    }

    const stats = await ComplianceProgram.getProgramStats();

    // Get additional statistics
    const totalPrograms = await ComplianceProgram.countDocuments({
      isActive: true,
    });

    const programsDueForReview = await ComplianceProgram.countDocuments({
      isActive: true,
      reviewDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, // 30 days from now
    });

    res.json({
      success: true,
      data: {
        programStats: stats,
        totalPrograms,
        programsDueForReview,
      },
    });
  } catch (error) {
    console.error("Error fetching compliance program statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching compliance program statistics",
      error: error.message,
    });
  }
};

// Get available compliance program categories
export const getComplianceProgramCategories = async (req, res) => {
  try {
    // Check if user has permission (Legal HOD or Super Admin)
    if (req.user.role.level < 700) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only Legal HOD and Super Admin can view compliance program categories.",
      });
    }

    const existingCategories = await ComplianceProgram.distinct("category", {
      isActive: true,
    });

    const schemaCategories =
      ComplianceProgram.schema.path("category").enumValues;

    const allCategories = [
      ...new Set([...schemaCategories, ...existingCategories]),
    ];

    res.json({
      success: true,
      data: {
        categories: allCategories,
      },
    });
  } catch (error) {
    console.error("Error fetching compliance program categories:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching compliance program categories",
      error: error.message,
    });
  }
};

const sendComplianceProgramNotifications = async (program, action, creator) => {
  try {
    const notificationService = new NotificationService();

    const allHODs = await User.find({
      isActive: true,
      _id: { $ne: creator._id },
    })
      .populate("role")
      .populate("department")
      .then((users) =>
        users.filter(
          (user) =>
            user.role && (user.role.name === "HOD" || user.role.level >= 700)
        )
      );

    const notifications = [];

    for (const hod of allHODs) {
      if (hod._id.toString() === creator._id.toString()) {
        continue;
      }

      const notification = await notificationService.createNotification({
        recipient: hod._id,
        type:
          action === "created"
            ? "COMPLIANCE_PROGRAM_CREATED"
            : action === "updated"
            ? "COMPLIANCE_PROGRAM_UPDATED"
            : "COMPLIANCE_PROGRAM_DELETED",
        title: `Compliance Program ${
          action === "created"
            ? "Created"
            : action === "updated"
            ? "Updated"
            : "Deleted"
        }`,
        message: `A compliance program "${program.name}" has been ${action} by ${creator.firstName} ${creator.lastName}`,
        data: {
          complianceProgramId: program._id,
          programName: program.name,
          action: action,
          creatorId: creator._id,
          creatorName: `${creator.firstName} ${creator.lastName}`,
        },
      });

      if (notification) notifications.push(notification);
    }

    if (creator.role.level >= 700) {
      const personalNotification = await notificationService.createNotification(
        {
          recipient: creator._id,
          type:
            action === "created"
              ? "COMPLIANCE_PROGRAM_CREATED_PERSONAL"
              : action === "updated"
              ? "COMPLIANCE_PROGRAM_UPDATED_PERSONAL"
              : "COMPLIANCE_PROGRAM_DELETED_PERSONAL",
          title: `Your Compliance Program ${
            action === "created"
              ? "Created"
              : action === "updated"
              ? "Updated"
              : "Deleted"
          }`,
          message: `You have successfully ${action} the compliance program "${program.name}"`,
          data: {
            complianceProgramId: program._id,
            programName: program.name,
            action: action,
          },
        }
      );

      if (personalNotification) notifications.push(personalNotification);
      console.log(
        `📧 [COMPLIANCE PROGRAM] Personal notification sent to Legal HOD: ${creator.firstName} ${creator.lastName}`
      );
    }

    const superAdmins = await User.find({
      $or: [{ "role.level": 1000 }, { isSuperadmin: true }],
      isActive: true,
      _id: { $ne: creator._id },
    }).populate("role department");

    const superAdmin = superAdmins.length > 0 ? superAdmins[0] : null;

    if (superAdmin) {
      if (superAdmin._id.toString() !== creator._id.toString()) {
        const notification = await notificationService.createNotification({
          recipient: superAdmin._id,
          type:
            action === "created"
              ? "COMPLIANCE_PROGRAM_CREATED"
              : action === "updated"
              ? "COMPLIANCE_PROGRAM_UPDATED"
              : "COMPLIANCE_PROGRAM_DELETED",
          title: `Compliance Program ${
            action === "created"
              ? "Created"
              : action === "updated"
              ? "Updated"
              : "Deleted"
          }`,
          message: `A compliance program "${program.name}" has been ${action} by ${creator.firstName} ${creator.lastName}`,
          data: {
            complianceProgramId: program._id,
            programName: program.name,
            action: action,
            creatorId: creator._id,
            creatorName: `${creator.firstName} ${creator.lastName}`,
          },
        });

        if (notification) notifications.push(notification);
        console.log(
          `📧 [COMPLIANCE PROGRAM] Notified Super Admin: ${superAdmin.firstName} ${superAdmin.lastName}`
        );
      } else {
        console.log(
          `📧 [COMPLIANCE PROGRAM] Super Admin is the creator - skipped generic notification (already got personal notification)`
        );
      }
    }

    console.log(
      `📧 [COMPLIANCE PROGRAM] Sent ${notifications.length} notifications for ${action} program: ${program.name}`
    );
    return notifications;
  } catch (error) {
    console.error("Error sending compliance program notifications:", error);
    throw error;
  }
};
