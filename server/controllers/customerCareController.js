import Complaint from "../models/Complaint.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import Session from "../models/Session.js";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";

export const getComplaints = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      category,
      department,
      assignedTo,
      assignedToMe,
      submittedByMe,
      search,
      sortBy = "submittedAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};

    if (req.userFilter) {
      Object.assign(filter, req.userFilter);
    }

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (category) {
      filter.category = category;
    }

    if (department) {
      filter.department = department;
    }

    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    if (assignedToMe === "true") {
      filter.assignedTo = req.user._id;
    }

    if (submittedByMe === "true") {
      filter.submittedBy = req.user._id;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { complaintNumber: { $regex: search, $options: "i" } },
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const complaints = await Complaint.find(filter)
      .populate("submittedBy", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email")
      .populate("department", "name")
      .populate("resolvedBy", "firstName lastName")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Complaint.countDocuments(filter);

    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      data: {
        complaints,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage,
          hasPrevPage,
        },
      },
    });
  } catch (error) {
    console.error("❌ [CUSTOMER CARE] Error getting complaints:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching complaints",
      error: error.message,
    });
  }
};

// Get single complaint by ID
export const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await Complaint.findById(id)
      .populate("submittedBy", "firstName lastName email department")
      .populate("assignedTo", "firstName lastName email")
      .populate("department", "name")
      .populate("resolvedBy", "firstName lastName")
      .populate("notes.addedBy", "firstName lastName")
      .populate("attachments");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    const user = req.user;
    const isCustomerCareUser =
      user.department?.name === "Customer Service" ||
      user.department?.name === "Customer Care";

    if (
      !isCustomerCareUser &&
      complaint.submittedBy._id.toString() !== user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own complaints.",
      });
    }

    res.status(200).json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error("❌ [CUSTOMER CARE] Error getting complaint:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching complaint",
      error: error.message,
    });
  }
};

// Create new complaint
export const createComplaint = async (req, res) => {
  try {
    const { title, description, category, priority, department, tags } =
      req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and category are required",
      });
    }

    const complaint = new Complaint({
      title,
      description,
      category,
      priority: priority || "medium",
      submittedBy: req.user._id,
      department: department || req.user.department._id,
      tags: tags || [],
    });

    await complaint.save();

    await complaint.populate([
      { path: "submittedBy", select: "firstName lastName email" },
      { path: "department", select: "name" },
    ]);

    try {
      const Notification = (await import("../models/Notification.js")).default;
      const User = (await import("../models/User.js")).default;

      const customerCareHODs = await User.find({
        isActive: true,
        department: complaint.department._id,
      })
        .populate("role", "name level")
        .select("_id firstName lastName email role")
        .then((users) =>
          users.filter(
            (user) =>
              user.role && (user.role.name === "HOD" || user.role.level >= 700)
          )
        );

      const superadmins = await User.find({
        isActive: true,
        isSuperadmin: true,
      }).select("_id firstName lastName email role isSuperadmin");

      const allHODs = [...customerCareHODs, ...superadmins];

      const notifications = [];

      const hodNotifications = allHODs.map((user) => ({
        recipient: user._id,
        type: "complaint_submitted",
        title: "New Complaint Awaiting Review",
        message: `New complaint "${title}" submitted by ${complaint.submittedBy.firstName} ${complaint.submittedBy.lastName}. Please review and assign to a team member.`,
        data: {
          complaintId: complaint._id,
          submittedBy: complaint.submittedBy._id,
          category: category,
          priority: priority || "medium",
          requiresAssignment: true,
          status: "pending_review",
        },
        isRead: false,
      }));

      const submitterNotification = {
        recipient: complaint.submittedBy._id,
        type: "complaint_confirmation",
        title: "Complaint Submitted Successfully",
        message: `Your complaint "${title}" has been submitted and is awaiting review by our Customer Care HOD. You'll receive updates once it's assigned to a team member.`,
        data: {
          complaintId: complaint._id,
          category: category,
          priority: priority || "medium",
          complaintNumber: complaint.complaintNumber,
          status: "pending_review",
        },
        isRead: false,
      };

      notifications.push(...hodNotifications, submitterNotification);

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notificationError) {
      console.error(
        "❌ [CUSTOMER CARE] Error creating notifications:",
        notificationError
      );
    }

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      data: complaint,
    });
  } catch (error) {
    console.error("❌ [CUSTOMER CARE] Error creating complaint:", error);
    res.status(500).json({
      success: false,
      message: "Error creating complaint",
      error: error.message,
    });
  }
};

// Update complaint status
export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution, assignedTo } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Update status
    if (status) {
      await complaint.updateStatus(status, req.user._id, resolution);
    }

    // Update assignment
    if (assignedTo) {
      complaint.assignedTo = assignedTo;
      await complaint.save();
    }

    // Populate updated complaint
    await complaint.populate([
      { path: "submittedBy", select: "firstName lastName email" },
      { path: "assignedTo", select: "firstName lastName email" },
      { path: "department", select: "name" },
      { path: "resolvedBy", select: "firstName lastName" },
    ]);

    res.status(200).json({
      success: true,
      message: "Complaint updated successfully",
      data: complaint,
    });
  } catch (error) {
    console.error("❌ [CUSTOMER CARE] Error updating complaint:", error);
    res.status(500).json({
      success: false,
      message: "Error updating complaint",
      error: error.message,
    });
  }
};

// Add note to complaint
export const addComplaintNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({
        success: false,
        message: "Note is required",
      });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    await complaint.addNote(note, req.user._id);

    // Populate updated complaint
    await complaint.populate([
      { path: "submittedBy", select: "firstName lastName email" },
      { path: "assignedTo", select: "firstName lastName email" },
      { path: "department", select: "name" },
      { path: "resolvedBy", select: "firstName lastName" },
      { path: "notes.addedBy", select: "firstName lastName" },
    ]);

    res.status(200).json({
      success: true,
      message: "Note added successfully",
      data: complaint,
    });
  } catch (error) {
    console.error("❌ [CUSTOMER CARE] Error adding note:", error);
    res.status(500).json({
      success: false,
      message: "Error adding note",
      error: error.message,
    });
  }
};

// Get complaint statistics
export const getComplaintStatistics = async (req, res) => {
  try {
    const { department, dateFrom, dateTo } = req.query;

    // Build filter object
    const filter = {};
    if (department) {
      filter.department = department;
    }
    if (dateFrom || dateTo) {
      filter.submittedAt = {};
      if (dateFrom) {
        filter.submittedAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.submittedAt.$lte = new Date(dateTo);
      }
    }

    // Apply user-based filtering
    if (req.userFilter) {
      Object.assign(filter, req.userFilter);
    }

    const statistics = await Complaint.getStatistics(filter);

    // Get additional metrics
    const totalComplaints = await Complaint.countDocuments(filter);
    const resolvedComplaints = await Complaint.countDocuments({
      ...filter,
      status: { $in: ["resolved", "closed"] },
    });
    const averageResolutionTime = await Complaint.aggregate([
      { $match: { ...filter, status: { $in: ["resolved", "closed"] } } },
      {
        $group: {
          _id: null,
          avgResolutionTime: {
            $avg: {
              $divide: [
                { $subtract: ["$resolvedAt", "$submittedAt"] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
        },
      },
    ]);

    const satisfactionRating = await Complaint.aggregate([
      { $match: { ...filter, satisfactionRating: { $exists: true } } },
      {
        $group: {
          _id: null,
          avgSatisfaction: { $avg: "$satisfactionRating" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...statistics,
        totalComplaints,
        resolvedComplaints,
        resolutionRate:
          totalComplaints > 0
            ? ((resolvedComplaints / totalComplaints) * 100).toFixed(2)
            : 0,
        averageResolutionTime:
          averageResolutionTime[0]?.avgResolutionTime?.toFixed(2) || 0,
        satisfactionRating:
          satisfactionRating[0]?.avgSatisfaction?.toFixed(2) || 0,
      },
    });
  } catch (error) {
    console.error("❌ [CUSTOMER CARE] Error getting statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
};

// Get complaint trends (monthly data)
export const getComplaintTrends = async (req, res) => {
  try {
    const { months = 6 } = req.query;

    const dateFrom = new Date();
    dateFrom.setMonth(dateFrom.getMonth() - parseInt(months));

    const trends = await Complaint.aggregate([
      {
        $match: {
          submittedAt: { $gte: dateFrom },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$submittedAt" },
            month: { $month: "$submittedAt" },
          },
          total: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $in: ["$status", ["resolved", "closed"]] }, 1, 0],
            },
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
          },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error("❌ [CUSTOMER CARE] Error getting trends:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching trends",
      error: error.message,
    });
  }
};

// Get department breakdown
export const getDepartmentBreakdown = async (req, res) => {
  try {
    const breakdown = await Complaint.aggregate([
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $in: ["$status", ["resolved", "closed"]] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "department",
        },
      },
      {
        $unwind: "$department",
      },
      {
        $project: {
          department: "$department.name",
          count: 1,
          resolved: 1,
          resolutionRate: {
            $multiply: [{ $divide: ["$resolved", "$count"] }, 100],
          },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: breakdown,
    });
  } catch (error) {
    console.error(
      "❌ [CUSTOMER CARE] Error getting department breakdown:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error fetching department breakdown",
      error: error.message,
    });
  }
};

// Get category breakdown
export const getCategoryBreakdown = async (req, res) => {
  try {
    const breakdown = await Complaint.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $in: ["$status", ["resolved", "closed"]] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          category: "$_id",
          count: 1,
          resolved: 1,
          resolutionRate: {
            $multiply: [{ $divide: ["$resolved", "$count"] }, 100],
          },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: breakdown,
    });
  } catch (error) {
    console.error(
      "❌ [CUSTOMER CARE] Error getting category breakdown:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error fetching category breakdown",
      error: error.message,
    });
  }
};

// Submit feedback for resolved complaint
export const submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { satisfactionRating, feedback } = req.body;

    if (
      !satisfactionRating ||
      satisfactionRating < 1 ||
      satisfactionRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid satisfaction rating (1-5) is required",
      });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Check if user can submit feedback (only the original submitter)
    if (complaint.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only submit feedback for your own complaints",
      });
    }

    // Check if complaint is resolved
    if (!["resolved", "closed"].includes(complaint.status)) {
      return res.status(400).json({
        success: false,
        message: "Feedback can only be submitted for resolved complaints",
      });
    }

    complaint.satisfactionRating = satisfactionRating;
    if (feedback) {
      complaint.feedback = feedback;
    }

    await complaint.save();

    res.status(200).json({
      success: true,
      message: "Feedback submitted successfully",
      data: complaint,
    });
  } catch (error) {
    console.error("❌ [CUSTOMER CARE] Error submitting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting feedback",
      error: error.message,
    });
  }
};

// Get team members for assignment
export const getTeamMembers = async (req, res) => {
  try {
    const User = (await import("../models/User.js")).default;

    const teamMembers = await User.find({
      $or: [
        { "department.name": "Customer Service" },
        { "department.name": "Customer Care" },
      ],
    })
      .populate("role", "name level")
      .populate("department", "name")
      .select("firstName lastName email role department")
      .then((users) =>
        users.filter(
          (user) => user.role && user.role.level >= 300 && user.role.level < 700
        )
      );

    const membersWithCounts = await Promise.all(
      teamMembers.map(async (member) => {
        const assignedCount = await Complaint.countDocuments({
          assignedTo: member._id,
          status: { $nin: ["resolved", "closed"] },
        });

        return {
          ...member.toObject(),
          assignedComplaints: assignedCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: membersWithCounts,
    });
  } catch (error) {
    console.error("❌ [CUSTOMER CARE] Error getting team members:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching team members",
      error: error.message,
    });
  }
};

export const assignComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (complaint.assignedTo) {
      return res.status(400).json({
        success: false,
        message: "Complaint is already assigned",
      });
    }

    complaint.assignedTo = assignedTo;
    complaint.status = "in_progress";
    complaint.lastUpdated = new Date();
    await complaint.save();

    await complaint.populate([
      { path: "submittedBy", select: "firstName lastName email" },
      { path: "assignedTo", select: "firstName lastName email" },
      { path: "department", select: "name" },
    ]);

    try {
      const Notification = (await import("../models/Notification.js")).default;

      const assignmentNotification = {
        recipient: assignedTo,
        type: "complaint_assigned",
        title: "New Complaint Assigned",
        message: `You have been assigned a new complaint: "${complaint.title}"`,
        data: {
          complaintId: complaint._id,
          complaintTitle: complaint.title,
          complaintCategory: complaint.category,
          complaintPriority: complaint.priority,
          submittedBy: complaint.submittedBy._id,
          assignedBy: req.user._id,
        },
        isRead: false,
      };

      await Notification.create(assignmentNotification);
    } catch (notificationError) {
      console.error(
        "❌ [CUSTOMER CARE] Error creating assignment notification:",
        notificationError
      );
    }

    res.status(200).json({
      success: true,
      message: "Complaint assigned successfully",
      data: complaint,
    });
  } catch (error) {
    console.error("❌ [CUSTOMER CARE] Error assigning complaint:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning complaint",
      error: error.message,
    });
  }
};

// @desc    Save chat session
// @route   POST /api/customer-care/sessions
// @access  Private (Customer Care)
export const saveSession = async (req, res) => {
  try {
    const {
      complaintId,
      responderId,
      responderName,
      sessionTranscript,
      startTime,
      endTime,
      status,
      resolution,
      notes,
    } = req.body;

    const responder = await User.findById(responderId).populate(
      "department",
      "name"
    );
    const responderDepartment =
      responder?.department?.name || "Unknown Department";

    const session = await Session.create({
      complaintId,
      responderId,
      responderName,
      responderDepartment,
      sessionTranscript,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status,
      resolution: resolution || "pending",
      notes: notes || "",
    });

    res.status(201).json({
      success: true,
      message: "Session saved successfully",
      data: session,
    });
  } catch (error) {
    console.error("❌ [CUSTOMER CARE] Error saving session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save session",
      error: error.message,
    });
  }
};

// @desc    Get sessions by complaint
// @route   GET /api/customer-care/sessions/complaint/:complaintId
// @access  Private (Customer Care)
export const getSessionsByComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;

    const sessions = await Session.getSessionsByComplaint(complaintId);

    res.status(200).json({
      success: true,
      message: "Sessions retrieved successfully",
      data: sessions,
    });
  } catch (error) {
    console.error("❌ [CUSTOMER CARE] Error getting sessions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get sessions",
      error: error.message,
    });
  }
};

// @desc    Get sessions by responder
// @route   GET /api/customer-care/sessions/responder/:responderId
// @access  Private (Customer Care)
export const getSessionsByResponder = async (req, res) => {
  try {
    const { responderId } = req.params;

    const sessions = await Session.getSessionsByResponder(responderId);

    res.status(200).json({
      success: true,
      message: "Sessions retrieved successfully",
      data: sessions,
    });
  } catch (error) {
    console.error("❌ [CUSTOMER CARE] Error getting sessions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get sessions",
      error: error.message,
    });
  }
};

// @desc    Get active sessions
// @route   GET /api/customer-care/sessions/active
// @access  Private (Customer Care)
export const getActiveSessions = async (req, res) => {
  try {
    const sessions = await Session.getActiveSessions();

    res.status(200).json({
      success: true,
      message: "Active sessions retrieved successfully",
      data: sessions,
    });
  } catch (error) {
    console.error("❌ [CUSTOMER CARE] Error getting active sessions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get active sessions",
      error: error.message,
    });
  }
};

export const sendReminderNotification = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const userId = req.user._id;

    const complaint = await Complaint.findById(complaintId)
      .populate("submittedBy", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email")
      .populate("department", "name");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    const customerCareHODs = await User.find({
      isActive: true,
      department: complaint.department._id,
    })
      .populate("role", "name level")
      .select("_id firstName lastName email role")
      .then((users) =>
        users.filter(
          (user) =>
            user.role && (user.role.name === "HOD" || user.role.level >= 700)
        )
      );

    const customerCareStaff = await User.find({
      isActive: true,
      department: complaint.department._id,
    })
      .populate("role", "name level")
      .select("_id firstName lastName email role")
      .then((users) =>
        users.filter(
          (user) => user.role && user.role.level >= 300 && user.role.level < 700
        )
      );

    const notifications = [];

    const hodNotifications = customerCareHODs.map((user) => ({
      recipient: user._id,
      type: "complaint_reminder",
      title: "Complaint Reminder - No Feedback Yet",
      message: `User ${complaint.submittedBy.firstName} ${complaint.submittedBy.lastName} hasn't received feedback on complaint ${complaint.complaintNumber}. Please check and provide an update.`,
      data: {
        complaintId: complaint._id,
        complaintNumber: complaint.complaintNumber,
        submittedBy: complaint.submittedBy._id,
        status: complaint.status,
        priority: complaint.priority,
        requiresUrgentAttention: true,
      },
      isRead: false,
    }));

    if (complaint.assignedTo) {
      const assignedNotification = {
        recipient: complaint.assignedTo._id,
        type: "complaint_reminder",
        title: "Your Assigned Complaint Needs Attention",
        message: `The user is waiting for feedback on complaint ${complaint.complaintNumber}. Please provide an update soon.`,
        data: {
          complaintId: complaint._id,
          complaintNumber: complaint.complaintNumber,
          submittedBy: complaint.submittedBy._id,
          status: complaint.status,
          priority: complaint.priority,
          isAssignedToYou: true,
        },
        isRead: false,
      };
      notifications.push(assignedNotification);
    }

    if (!complaint.assignedTo && customerCareStaff.length > 0) {
      const staffNotifications = customerCareStaff.slice(0, 3).map((user) => ({
        recipient: user._id,
        type: "complaint_reminder",
        title: "Complaint Needs Attention",
        message: `Complaint ${complaint.complaintNumber} needs attention. User is waiting for feedback.`,
        data: {
          complaintId: complaint._id,
          complaintNumber: complaint.complaintNumber,
          submittedBy: complaint.submittedBy._id,
          status: complaint.status,
          priority: complaint.priority,
          needsAssignment: true,
        },
        isRead: false,
      }));
      notifications.push(...staffNotifications);
    }

    notifications.push(...hodNotifications);

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(200).json({
      success: true,
      message: "Reminder notifications sent successfully",
      data: {
        complaintId: complaint._id,
        complaintNumber: complaint.complaintNumber,
        notificationsSent: notifications.length,
        status: complaint.status,
      },
    });
  } catch (error) {
    console.error(
      "❌ [CUSTOMER CARE] Error sending reminder notification:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error sending reminder notification",
      error: error.message,
    });
  }
};
