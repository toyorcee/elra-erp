import Complaint from "../models/Complaint.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import Session from "../models/Session.js";
import Notification from "../models/Notification.js";
import notificationService from "../services/notificationService.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to load certificate images
const loadCustomerCareImage = (imageName) => {
  try {
    const imagePath = path.resolve(__dirname, "../assets/images", imageName);
    if (fs.existsSync(imagePath)) {
      const imageBuffer = fs.readFileSync(imagePath);
      return `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
    }
  } catch (error) {
    console.warn(`⚠️ Could not load image ${imageName}:`, error.message);
  }
  return null;
};

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
      .populate("submittedBy", "firstName lastName email avatar")
      .populate("assignedTo", "firstName lastName email avatar")
      .populate("department", "name")
      .populate("resolvedBy", "firstName lastName avatar")
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
      .populate("submittedBy", "firstName lastName email department avatar")
      .populate("assignedTo", "firstName lastName email avatar")
      .populate("department", "name")
      .populate("resolvedBy", "firstName lastName avatar")
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
// Forward complaint to department HOD
export const forwardComplaintToHOD = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { departmentId, note } = req.body;

    console.log(
      "🚀 [COMPLAINT FORWARD] Starting complaint forwarding process..."
    );
    console.log("📝 [COMPLAINT FORWARD] Request data:", {
      complaintId,
      departmentId,
      note: note ? note.substring(0, 50) + "..." : "No note",
      forwardedBy: req.user._id,
    });

    if (!departmentId) {
      console.log("❌ [COMPLAINT FORWARD] Missing department ID");
      return res.status(400).json({
        success: false,
        message: "Department ID is required",
      });
    }

    // Find the complaint
    const complaint = await Complaint.findById(complaintId)
      .populate("submittedBy", "firstName lastName email")
      .populate("department", "name");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Find the target department and its HOD
    const Department = (await import("../models/Department.js")).default;
    const User = (await import("../models/User.js")).default;
    const Notification = (await import("../models/Notification.js")).default;

    const targetDepartment = await Department.findById(departmentId);
    if (!targetDepartment) {
      return res.status(404).json({
        success: false,
        message: "Target department not found",
      });
    }

    // Find the HOD of the target department
    const allUsersInDepartment = await User.find({
      department: departmentId,
      isActive: true,
    }).populate("role");

    // Find HOD by checking role level or role name
    let targetHOD = null;

    for (const user of allUsersInDepartment) {
      // Check if user is HOD by level (>= 700) or by role name
      if (
        user.role &&
        (user.role.level >= 700 || /hod/i.test(user.role.name))
      ) {
        targetHOD = user;
        break;
      }
    }

    if (!targetHOD) {
      return res.status(404).json({
        success: false,
        message: "No HOD found for the target department",
      });
    }

    // Create notification for the target HOD
    let notificationMessage = `Complaint "${complaint.title}" from ${complaint.submittedBy.firstName} ${complaint.submittedBy.lastName} (${complaint.department?.name}) has been forwarded to you for awareness and follow-up.`;

    if (note && note.trim()) {
      notificationMessage += `\n\nAdditional Note: ${note.trim()}`;
    }

    const notificationData = {
      recipient: targetHOD._id,
      type: "complaint_forwarded",
      title: "Complaint Forwarded for Awareness",
      message: notificationMessage,
      data: {
        complaintId: complaint._id,
        forwardedBy: req.user._id,
        originalDepartment: complaint.department?._id,
        targetDepartment: departmentId,
        complaintTitle: complaint.title,
        submittedBy: complaint.submittedBy._id,
        status: "forwarded_for_awareness",
        note: note?.trim() || null,
      },
      isRead: false,
    };

    // Import and use notification service
    const NotificationService = (
      await import("../services/notificationService.js")
    ).default;
    const notificationService = new NotificationService();

    await notificationService.createNotification(notificationData);

    // Update complaint with forwarding information
    console.log(
      "🔍 [FORWARD COMPLAINT] Before saving - complaint ID:",
      complaint._id
    );
    console.log("🔍 [FORWARD COMPLAINT] Target HOD ID:", targetHOD._id);
    console.log("🔍 [FORWARD COMPLAINT] Forwarded by:", req.user._id);

    complaint.forwardedTo = {
      department: departmentId,
      hod: targetHOD._id,
      forwardedAt: new Date(),
      forwardedBy: req.user._id,
      note: note?.trim() || null,
    };

    console.log(
      "🔍 [FORWARD COMPLAINT] ForwardedTo data:",
      complaint.forwardedTo
    );

    await complaint.save();

    console.log("✅ [FORWARD COMPLAINT] Complaint saved successfully");

    // Verify the save worked
    const savedComplaint = await Complaint.findById(complaint._id).select(
      "_id title forwardedTo"
    );
    console.log("🔍 [FORWARD COMPLAINT] Verification - saved complaint:", {
      id: savedComplaint._id,
      title: savedComplaint.title,
      forwardedTo: savedComplaint.forwardedTo,
    });

    res.status(200).json({
      success: true,
      message: `Complaint forwarded to ${targetDepartment.name} HOD successfully`,
      data: {
        complaintId: complaint._id,
        forwardedTo: {
          department: targetDepartment.name,
          hod: {
            name: `${targetHOD.firstName} ${targetHOD.lastName}`,
            email: targetHOD.email,
          },
        },
      },
    });
  } catch (error) {
    console.error("❌ [CUSTOMER CARE] Error forwarding complaint:", error);
    res.status(500).json({
      success: false,
      message: "Error forwarding complaint",
      error: error.message,
    });
  }
};

// Get departments for forwarding
export const getDepartments = async (req, res) => {
  try {
    const Department = (await import("../models/Department.js")).default;

    const departments = await Department.find({ isActive: true })
      .select("_id name")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: { departments },
    });
  } catch (error) {
    console.error("❌ [CUSTOMER CARE] Error fetching departments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching departments",
      error: error.message,
    });
  }
};

// Get forwarded complaints for HODs
export const getForwardedComplaints = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority } = req.query;
    const currentUser = req.user;

    // Build query for forwarded complaints
    const query = {
      "forwardedTo.hod": currentUser._id,
    };

    // Add status filter if provided
    if (status && status !== "all") {
      query.status = status;
    }

    // Add priority filter if provided
    if (priority && priority !== "all") {
      query.priority = priority;
    }

    const complaints = await Complaint.find(query)
      .populate("submittedBy", "firstName lastName email")
      .populate("department", "name")
      .populate("forwardedTo.department", "name")
      .populate("forwardedTo.forwardedBy", "firstName lastName")
      .sort({ "forwardedTo.forwardedAt": -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Transform the data to ensure consistent structure
    const transformedComplaints = complaints.map((complaint) => {
      const complaintObj = complaint.toObject();

      // Ensure submittedBy is properly structured
      if (
        complaintObj.submittedBy &&
        typeof complaintObj.submittedBy === "object"
      ) {
        complaintObj.submittedBy = {
          _id: complaintObj.submittedBy._id,
          firstName: complaintObj.submittedBy.firstName || "",
          lastName: complaintObj.submittedBy.lastName || "",
          email: complaintObj.submittedBy.email || "",
        };
      }

      // Ensure department is properly structured
      if (
        complaintObj.department &&
        typeof complaintObj.department === "object"
      ) {
        complaintObj.department = {
          _id: complaintObj.department._id,
          name: complaintObj.department.name || "",
        };
      }

      // Ensure forwardedTo is properly structured
      if (complaintObj.forwardedTo) {
        if (
          complaintObj.forwardedTo.department &&
          typeof complaintObj.forwardedTo.department === "object"
        ) {
          complaintObj.forwardedTo.department = {
            _id: complaintObj.forwardedTo.department._id,
            name: complaintObj.forwardedTo.department.name || "",
          };
        }

        if (
          complaintObj.forwardedTo.forwardedBy &&
          typeof complaintObj.forwardedTo.forwardedBy === "object"
        ) {
          complaintObj.forwardedTo.forwardedBy = {
            _id: complaintObj.forwardedTo.forwardedBy._id,
            firstName: complaintObj.forwardedTo.forwardedBy.firstName || "",
            lastName: complaintObj.forwardedTo.forwardedBy.lastName || "",
          };
        }
      }

      return complaintObj;
    });

    const total = await Complaint.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        complaints: transformedComplaints,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error(
      "❌ [CUSTOMER CARE] Error fetching forwarded complaints:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error fetching forwarded complaints",
      error: error.message,
    });
  }
};

// Get forwarded complaints count for HOD dashboard
export const getForwardedComplaintsCount = async (req, res) => {
  try {
    const currentUser = req.user;

    console.log("🔍 [FORWARDED COUNT] Fetching count for user:", {
      userId: currentUser._id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      role: currentUser.role?.name,
      level: currentUser.role?.level,
    });

    const totalForwarded = await Complaint.countDocuments({
      "forwardedTo.hod": currentUser._id,
    });

    const pendingForwarded = await Complaint.countDocuments({
      "forwardedTo.hod": currentUser._id,
      status: { $in: ["pending", "in_progress"] },
    });

    const resolvedForwarded = await Complaint.countDocuments({
      "forwardedTo.hod": currentUser._id,
      status: "resolved",
    });

    console.log("🔍 [FORWARDED COUNT] Results:", {
      totalForwarded,
      pendingForwarded,
      resolvedForwarded,
    });

    res.status(200).json({
      success: true,
      data: {
        totalForwarded,
        pendingForwarded,
        resolvedForwarded,
      },
    });
  } catch (error) {
    console.error(
      "❌ [CUSTOMER CARE] Error fetching forwarded complaints count:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Error fetching forwarded complaints count",
      error: error.message,
    });
  }
};

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

    const complaintData = {
      title,
      description,
      category,
      priority: priority || "medium",
      submittedBy: req.user._id,
      department: department || req.user.department._id,
      tags: tags || [],
    };

    const complaint = new Complaint(complaintData);
    await complaint.save();

    await complaint.populate([
      { path: "submittedBy", select: "firstName lastName email" },
      { path: "department", select: "name" },
    ]);

    try {
      const Notification = (await import("../models/Notification.js")).default;
      const User = (await import("../models/User.js")).default;
      const Department = (await import("../models/Department.js")).default;

      const customerCareDept = await Department.findOne({
        $or: [{ name: "Customer Service" }, { name: "Customer Care" }],
      });

      const customerCareHODs = customerCareDept
        ? await User.find({
            isActive: true,
            department: customerCareDept._id,
          })
            .populate("role", "name level")
            .select("_id firstName lastName email role")
            .then((users) =>
              users.filter(
                (user) =>
                  user.role &&
                  (user.role.name === "HOD" || user.role.level >= 700)
              )
            )
        : [];

      const superadmins = await User.find({
        isActive: true,
        isSuperadmin: true,
      }).select("_id firstName lastName email role isSuperadmin");

      const allHODs = [...customerCareHODs, ...superadmins];

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

      const allNotifications = [...hodNotifications, submitterNotification];
      await Notification.insertMany(allNotifications);
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

    if (status) {
      await complaint.updateStatus(status, req.user._id, resolution);
    }

    if (assignedTo) {
      complaint.assignedTo = assignedTo;
      await complaint.save();
    }

    await complaint.populate([
      { path: "submittedBy", select: "firstName lastName email" },
      { path: "assignedTo", select: "firstName lastName email" },
      { path: "department", select: "name" },
      { path: "resolvedBy", select: "firstName lastName" },
    ]);

    if (status === "resolved" && status !== complaint.status) {
      console.log(
        `🎯 [CUSTOMER CARE] Complaint ${complaint._id} being resolved by ${req.user.firstName} ${req.user.lastName}`
      );

      try {
        // Notify the complaint creator
        const creatorNotificationData = {
          recipient: complaint.submittedBy._id,
          type: "complaint_resolved",
          title: "Your Complaint Has Been Resolved! 🎉",
          message: `Great news! Your complaint "${complaint.title}" has been resolved by our Customer Care team. Thank you for your patience.`,
          priority: "high",
          data: {
            complaintId: complaint._id,
            complaintNumber: complaint.complaintNumber,
            status: "resolved",
            resolvedBy: req.user._id,
            resolvedAt: new Date(),
          },
        };

        console.log(
          `📧 [CUSTOMER CARE] Creating notification for complaint creator: ${complaint.submittedBy.firstName} ${complaint.submittedBy.lastName} (ID: ${complaint.submittedBy._id})`
        );
        await notificationService.createNotification(creatorNotificationData);
        console.log(
          `✅ [CUSTOMER CARE] Creator notification sent to: ${complaint.submittedBy.firstName} ${complaint.submittedBy.lastName}`
        );

        // Notify the HOD who resolved it (if they're not the same person)
        if (req.user._id.toString() !== complaint.submittedBy._id.toString()) {
          const hodNotificationData = {
            recipient: req.user._id,
            type: "complaint_resolution_confirmation",
            title: "Complaint Resolution Confirmed ✅",
            message: `You have successfully resolved the complaint "${complaint.title}" submitted by ${complaint.submittedBy.firstName} ${complaint.submittedBy.lastName}.`,
            priority: "medium",
            data: {
              complaintId: complaint._id,
              complaintNumber: complaint.complaintNumber,
              status: "resolved",
              submittedBy: complaint.submittedBy._id,
              resolvedAt: new Date(),
            },
          };

          console.log(
            `📧 [CUSTOMER CARE] Creating notification for HOD: ${req.user.firstName} ${req.user.lastName} (ID: ${req.user._id})`
          );
          await notificationService.createNotification(hodNotificationData);
          console.log(
            `✅ [CUSTOMER CARE] HOD notification sent to: ${req.user.firstName} ${req.user.lastName}`
          );
        } else {
          console.log(
            `ℹ️ [CUSTOMER CARE] Creator and resolver are the same person, skipping HOD notification`
          );
        }

        console.log(
          `🎉 [CUSTOMER CARE] SUCCESS: All resolution notifications sent!`
        );
      } catch (notificationError) {
        console.error(
          "❌ [CUSTOMER CARE] Error creating resolution notifications:",
          notificationError
        );
      }
    }

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

    if (req.userFilter) {
      Object.assign(filter, req.userFilter);
    }

    const statistics = await Complaint.getStatistics(filter);

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

// @desc    Get priority breakdown statistics
// @route   GET /api/customer-care/priority-breakdown
// @access  Private (Customer Care+)
export const getPriorityBreakdown = async (req, res) => {
  try {
    const filter = req.userFilter || {};

    const breakdown = await Complaint.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Map to consistent format
    const priorityData = breakdown.map((item) => ({
      priority: item._id,
      count: item.count,
    }));

    res.status(200).json({
      success: true,
      data: priorityData,
    });
  } catch (error) {
    console.error("Error getting priority breakdown:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching priority breakdown",
      error: error.message,
    });
  }
};

// @desc    Get trend calculations (percentage changes)
// @route   GET /api/customer-care/trends
// @access  Private (Customer Care+)
export const getTrendCalculations = async (req, res) => {
  try {
    const filter = req.userFilter || {};
    const { months = 6 } = req.query;

    const currentDate = new Date();
    const previousDate = new Date();
    previousDate.setMonth(previousDate.getMonth() - parseInt(months));

    // Current period data
    const currentPeriod = await Complaint.aggregate([
      { $match: { ...filter, submittedAt: { $gte: previousDate } } },
      {
        $group: {
          _id: null,
          totalComplaints: { $sum: 1 },
          resolvedComplaints: {
            $sum: {
              $cond: [{ $in: ["$status", ["resolved", "closed"]] }, 1, 0],
            },
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $in: ["$status", ["resolved", "closed"]] },
                {
                  $divide: [
                    { $subtract: ["$resolvedAt", "$submittedAt"] },
                    1000 * 60 * 60 * 24,
                  ],
                },
                null,
              ],
            },
          },
          avgSatisfaction: {
            $avg: {
              $cond: [
                { $ne: ["$satisfactionRating", null] },
                "$satisfactionRating",
                null,
              ],
            },
          },
        },
      },
    ]);

    const previousPeriodStart = new Date();
    previousPeriodStart.setMonth(
      previousPeriodStart.getMonth() - parseInt(months) * 2
    );
    const previousPeriodEnd = new Date();
    previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() - parseInt(months));

    const previousPeriod = await Complaint.aggregate([
      {
        $match: {
          ...filter,
          submittedAt: {
            $gte: previousPeriodStart,
            $lt: previousPeriodEnd,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalComplaints: { $sum: 1 },
          resolvedComplaints: {
            $sum: {
              $cond: [{ $in: ["$status", ["resolved", "closed"]] }, 1, 0],
            },
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $in: ["$status", ["resolved", "closed"]] },
                {
                  $divide: [
                    { $subtract: ["$resolvedAt", "$submittedAt"] },
                    1000 * 60 * 60 * 24,
                  ],
                },
                null,
              ],
            },
          },
          avgSatisfaction: {
            $avg: {
              $cond: [
                { $ne: ["$satisfactionRating", null] },
                "$satisfactionRating",
                null,
              ],
            },
          },
        },
      },
    ]);

    const current = currentPeriod[0] || {
      totalComplaints: 0,
      resolvedComplaints: 0,
      avgResolutionTime: 0,
      avgSatisfaction: 0,
    };

    const previous = previousPeriod[0] || {
      totalComplaints: 0,
      resolvedComplaints: 0,
      avgResolutionTime: 0,
      avgSatisfaction: 0,
    };

    // Calculate percentage changes
    const calculatePercentageChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const trends = {
      totalComplaintsChange: calculatePercentageChange(
        current.totalComplaints,
        previous.totalComplaints
      ),
      resolutionRateChange: calculatePercentageChange(
        current.totalComplaints > 0
          ? (current.resolvedComplaints / current.totalComplaints) * 100
          : 0,
        previous.totalComplaints > 0
          ? (previous.resolvedComplaints / previous.totalComplaints) * 100
          : 0
      ),
      resolutionTimeChange: calculatePercentageChange(
        current.avgResolutionTime,
        previous.avgResolutionTime
      ),
      satisfactionChange: calculatePercentageChange(
        current.avgSatisfaction,
        previous.avgSatisfaction
      ),
    };

    res.status(200).json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error("Error getting trend calculations:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching trend calculations",
      error: error.message,
    });
  }
};

// Helper functions for data fetching (without HTTP responses)
const getComplaintStatisticsData = async (filter) => {
  try {
    const stats = await Complaint.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalComplaints: { $sum: 1 },
          resolvedComplaints: {
            $sum: {
              $cond: [{ $in: ["$status", ["resolved", "closed"]] }, 1, 0],
            },
          },
          pendingComplaints: {
            $sum: {
              $cond: [{ $in: ["$status", ["pending", "in_progress"]] }, 1, 0],
            },
          },
          highPriority: {
            $sum: {
              $cond: [{ $eq: ["$priority", "High"] }, 1, 0],
            },
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ["$status", ["pending", "in_progress"]] },
                    {
                      $lt: [
                        "$submittedAt",
                        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $in: ["$status", ["resolved", "closed"]] },
                {
                  $divide: [
                    { $subtract: ["$resolvedAt", "$submittedAt"] },
                    1000 * 60 * 60 * 24,
                  ],
                },
                null,
              ],
            },
          },
          satisfactionRating: {
            $avg: {
              $cond: [
                { $ne: ["$satisfactionRating", null] },
                "$satisfactionRating",
                null,
              ],
            },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalComplaints: 0,
      resolvedComplaints: 0,
      pendingComplaints: 0,
      highPriority: 0,
      overdue: 0,
      avgResolutionTime: 0,
      satisfactionRating: 0,
    };

    return {
      totalComplaints: result.totalComplaints,
      resolvedComplaints: result.resolvedComplaints,
      pendingComplaints: result.pendingComplaints,
      highPriority: result.highPriority,
      overdue: result.overdue,
      averageResolutionTime: Math.round(result.avgResolutionTime * 10) / 10,
      satisfactionScore: Math.round(result.satisfactionRating * 10) / 10,
      resolutionRate:
        result.totalComplaints > 0
          ? Math.round(
              (result.resolvedComplaints / result.totalComplaints) * 100
            )
          : 0,
    };
  } catch (error) {
    console.error("Error getting statistics data:", error);
    return {
      totalComplaints: 0,
      resolvedComplaints: 0,
      pendingComplaints: 0,
      highPriority: 0,
      overdue: 0,
      averageResolutionTime: 0,
      satisfactionScore: 0,
      resolutionRate: 0,
    };
  }
};

const getComplaintTrendsData = async (filter) => {
  try {
    const trends = await Complaint.aggregate([
      { $match: filter },
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
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 6 },
    ]);

    return trends.map((trend) => ({
      month: trend._id.month,
      year: trend._id.year,
      total: trend.total,
      resolved: trend.resolved,
    }));
  } catch (error) {
    console.error("Error getting trends data:", error);
    return [];
  }
};

const getDepartmentBreakdownData = async (filter) => {
  try {
    const breakdown = await Complaint.aggregate([
      { $match: filter },
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
        $unwind: {
          path: "$department",
          preserveNullAndEmptyArrays: true,
        },
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
      { $sort: { count: -1 } },
    ]);

    return breakdown.map((item) => ({
      department: item.department || "Unknown",
      count: item.count,
      resolved: item.resolved,
      resolutionRate: Math.round(item.resolutionRate * 10) / 10,
    }));
  } catch (error) {
    console.error("Error getting department breakdown data:", error);
    return [];
  }
};

const getCategoryBreakdownData = async (filter) => {
  try {
    const breakdown = await Complaint.aggregate([
      { $match: filter },
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
      { $sort: { count: -1 } },
    ]);

    return breakdown.map((item) => ({
      category: item.category,
      count: item.count,
      resolved: item.resolved,
      resolutionRate: Math.round(item.resolutionRate * 10) / 10,
    }));
  } catch (error) {
    console.error("Error getting category breakdown data:", error);
    return [];
  }
};

const getPriorityBreakdownData = async (filter) => {
  try {
    const breakdown = await Complaint.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return breakdown.map((item) => ({
      priority: item._id,
      count: item.count,
    }));
  } catch (error) {
    console.error("Error getting priority breakdown data:", error);
    return [];
  }
};

const getTrendCalculationsData = async (filter) => {
  try {
    const currentDate = new Date();
    const previousDate = new Date();
    previousDate.setMonth(previousDate.getMonth() - 6);

    // Current period data
    const currentPeriod = await Complaint.aggregate([
      { $match: { ...filter, submittedAt: { $gte: previousDate } } },
      {
        $group: {
          _id: null,
          totalComplaints: { $sum: 1 },
          resolvedComplaints: {
            $sum: {
              $cond: [{ $in: ["$status", ["resolved", "closed"]] }, 1, 0],
            },
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $in: ["$status", ["resolved", "closed"]] },
                {
                  $divide: [
                    { $subtract: ["$resolvedAt", "$submittedAt"] },
                    1000 * 60 * 60 * 24,
                  ],
                },
                null,
              ],
            },
          },
          avgSatisfaction: {
            $avg: {
              $cond: [
                { $ne: ["$satisfactionRating", null] },
                "$satisfactionRating",
                null,
              ],
            },
          },
        },
      },
    ]);

    // Previous period data
    const previousPeriodStart = new Date();
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 12);
    const previousPeriodEnd = new Date();
    previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() - 6);

    const previousPeriod = await Complaint.aggregate([
      {
        $match: {
          ...filter,
          submittedAt: {
            $gte: previousPeriodStart,
            $lt: previousPeriodEnd,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalComplaints: { $sum: 1 },
          resolvedComplaints: {
            $sum: {
              $cond: [{ $in: ["$status", ["resolved", "closed"]] }, 1, 0],
            },
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $in: ["$status", ["resolved", "closed"]] },
                {
                  $divide: [
                    { $subtract: ["$resolvedAt", "$submittedAt"] },
                    1000 * 60 * 60 * 24,
                  ],
                },
                null,
              ],
            },
          },
          avgSatisfaction: {
            $avg: {
              $cond: [
                { $ne: ["$satisfactionRating", null] },
                "$satisfactionRating",
                null,
              ],
            },
          },
        },
      },
    ]);

    const current = currentPeriod[0] || {
      totalComplaints: 0,
      resolvedComplaints: 0,
      avgResolutionTime: 0,
      avgSatisfaction: 0,
    };

    const previous = previousPeriod[0] || {
      totalComplaints: 0,
      resolvedComplaints: 0,
      avgResolutionTime: 0,
      avgSatisfaction: 0,
    };

    // Calculate percentage changes
    const calculatePercentageChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      totalComplaintsChange: calculatePercentageChange(
        current.totalComplaints,
        previous.totalComplaints
      ),
      resolutionRateChange: calculatePercentageChange(
        current.totalComplaints > 0
          ? (current.resolvedComplaints / current.totalComplaints) * 100
          : 0,
        previous.totalComplaints > 0
          ? (previous.resolvedComplaints / previous.totalComplaints) * 100
          : 0
      ),
      resolutionTimeChange: calculatePercentageChange(
        current.avgResolutionTime,
        previous.avgResolutionTime
      ),
      satisfactionChange: calculatePercentageChange(
        current.avgSatisfaction,
        previous.avgSatisfaction
      ),
    };
  } catch (error) {
    console.error("Error getting trend calculations data:", error);
    return {
      totalComplaintsChange: 0,
      resolutionRateChange: 0,
      resolutionTimeChange: 0,
      satisfactionChange: 0,
    };
  }
};

// @desc    Export Customer Care report
// @route   GET /api/customer-care/reports/export/:format
// @access  Private (Customer Care+)
export const exportCustomerCareReport = async (req, res) => {
  try {
    const { format } = req.params;
    const { dateRange = "30", departmentFilter = "all" } = req.query;
    const filter = req.userFilter || {};

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(dateRange));

    // Add date filter
    const dateFilter = {
      ...filter,
      submittedAt: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    // Fetch all data needed for the report (without sending responses)
    const [
      statisticsResponse,
      trendsResponse,
      departmentBreakdownResponse,
      categoryBreakdownResponse,
      priorityBreakdownResponse,
      trendCalculationsResponse,
    ] = await Promise.all([
      getComplaintStatisticsData(filter),
      getComplaintTrendsData(filter),
      getDepartmentBreakdownData(filter),
      getCategoryBreakdownData(filter),
      getPriorityBreakdownData(filter),
      getTrendCalculationsData(filter),
    ]);

    const { generateCustomerCareReportPDF } = await import(
      "../utils/pdfUtils.js"
    );

    const reportData = {
      statistics: statisticsResponse,
      trends: trendsResponse,
      departmentBreakdown: departmentBreakdownResponse,
      categoryBreakdown: categoryBreakdownResponse,
      priorityBreakdown: priorityBreakdownResponse,
      trendCalculations: trendCalculationsResponse,
      dateRange: {
        start: startDate,
        end: endDate,
        days: parseInt(dateRange),
      },
      generatedAt: new Date(),
      generatedBy: req.user,
    };

    if (format.toLowerCase() === "pdf") {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const elraGreen = [13, 100, 73];

      const elraLogo = loadCustomerCareImage("elra-logo.jpg");
      if (elraLogo) {
        try {
          doc.addImage(elraLogo, "JPEG", pageWidth / 2 - 10, 15, 20, 20);
          doc.setTextColor(elraGreen[0], elraGreen[1], elraGreen[2]);
          doc.setFontSize(24);
          doc.setFont("helvetica", "bold");
          doc.text("ELRA", pageWidth / 2, 50, { align: "center" });
        } catch (error) {
          console.warn(
            "⚠️ Could not add ELRA logo to customer care report, falling back to text:",
            error.message
          );
          ``;
          doc.setTextColor(elraGreen[0], elraGreen[1], elraGreen[2]);
          doc.setFontSize(24);
          doc.setFont("helvetica", "bold");
          doc.text("ELRA", pageWidth / 2, 25, { align: "center" });
        }
      } else {
        // Fallback to text-only
        doc.setTextColor(elraGreen[0], elraGreen[1], elraGreen[2]);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("ELRA", pageWidth / 2, 25, { align: "center" });
      }

      // Customer Care Report title right under ELRA text
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Customer Care Report", pageWidth / 2, 60, {
        align: "center",
      });

      // Content starts after title with proper spacing
      let yPosition = 80;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(
        `Generated for: ${req.user.firstName} ${req.user.lastName}`,
        20,
        yPosition
      );
      yPosition += 7;
      doc.text(`Department: ${req.user.department?.name}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Position: ${req.user.role?.name}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Report Period: Last ${dateRange} days`, 20, yPosition);
      yPosition += 7;
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition);
      yPosition += 15;

      doc.setFontSize(16);
      doc.setTextColor(elraGreen[0], elraGreen[1], elraGreen[2]);
      doc.text("Executive Summary", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(
        `Total Complaints: ${statisticsResponse.totalComplaints}`,
        20,
        yPosition
      );
      yPosition += 7;
      doc.text(
        `Resolved Complaints: ${statisticsResponse.resolvedComplaints}`,
        20,
        yPosition
      );
      yPosition += 7;
      doc.text(
        `Pending Complaints: ${statisticsResponse.pendingComplaints}`,
        20,
        yPosition
      );
      yPosition += 7;
      doc.text(
        `High Priority: ${statisticsResponse.highPriority}`,
        20,
        yPosition
      );
      yPosition += 7;
      doc.text(
        `Resolution Rate: ${statisticsResponse.resolutionRate}%`,
        20,
        yPosition
      );
      yPosition += 7;
      doc.text(
        `Average Resolution Time: ${statisticsResponse.averageResolutionTime} days`,
        20,
        yPosition
      );
      yPosition += 7;
      doc.text(
        `Satisfaction Score: ${statisticsResponse.satisfactionScore}/5`,
        20,
        yPosition
      );
      yPosition += 15;

      if (departmentBreakdownResponse.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(elraGreen[0], elraGreen[1], elraGreen[2]);
        doc.text("Department Breakdown", 20, yPosition);
        yPosition += 10;

        const deptHeaders = ["Department", "Count", "Resolution Rate"];
        const deptRows = departmentBreakdownResponse.map((dept) => [
          dept.department,
          dept.count.toString(),
          `${dept.resolutionRate.toFixed(1)}%`,
        ]);

        autoTable(doc, {
          head: [deptHeaders],
          body: deptRows,
          startY: yPosition,
          styles: { fontSize: 8 },
          headStyles: { fillColor: elraGreen, textColor: 255 }, // Official ELRA Green
        });

        yPosition = doc.lastAutoTable.finalY + 10;
      }

      if (categoryBreakdownResponse.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(elraGreen[0], elraGreen[1], elraGreen[2]);
        doc.text("Category Breakdown", 20, yPosition);
        yPosition += 10;

        const catHeaders = ["Category", "Count"];
        const catRows = categoryBreakdownResponse.map((cat) => [
          cat.category,
          cat.count.toString(),
        ]);

        autoTable(doc, {
          head: [catHeaders],
          body: catRows,
          startY: yPosition,
          styles: { fontSize: 8 },
          headStyles: { fillColor: elraGreen, textColor: 255 }, // Official ELRA Green
        });

        yPosition = doc.lastAutoTable.finalY + 10;
      }

      if (priorityBreakdownResponse.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(elraGreen[0], elraGreen[1], elraGreen[2]);
        doc.text("Priority Breakdown", 20, yPosition);
        yPosition += 10;

        const priorityHeaders = ["Priority", "Count"];
        const priorityRows = priorityBreakdownResponse.map((priority) => [
          priority.priority,
          priority.count.toString(),
        ]);

        autoTable(doc, {
          head: [priorityHeaders],
          body: priorityRows,
          startY: yPosition,
          styles: { fontSize: 8 },
          headStyles: { fillColor: elraGreen, textColor: 255 }, // Official ELRA Green
        });
      }

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Page ${i} of ${pageCount}`,
          20,
          doc.internal.pageSize.height - 10
        );
      }

      const pdfBuffer = doc.output("arraybuffer");

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="customer-care-report-${
          new Date().toISOString().split("T")[0]
        }.pdf"`
      );
      res.send(Buffer.from(pdfBuffer));
    } else if (format.toLowerCase() === "csv") {
      // Generate CSV content like Company Wallet module
      let csvContent = "Customer Care Report\n";
      csvContent += `Generated for: ${req.user.firstName} ${req.user.lastName}\n`;
      csvContent += `Department: ${req.user.department?.name}\n`;
      csvContent += `Position: ${req.user.role?.name}\n`;
      csvContent += `Report Period: Last ${dateRange} days\n`;
      csvContent += `Generated on: ${new Date().toLocaleString()}\n\n`;

      csvContent += "Executive Summary\n";
      csvContent += "Metric,Value\n";
      csvContent += `Total Complaints,${statisticsResponse.totalComplaints}\n`;
      csvContent += `Resolved Complaints,${statisticsResponse.resolvedComplaints}\n`;
      csvContent += `Pending Complaints,${statisticsResponse.pendingComplaints}\n`;
      csvContent += `High Priority,${statisticsResponse.highPriority}\n`;
      csvContent += `Resolution Rate,${statisticsResponse.resolutionRate}%\n`;
      csvContent += `Average Resolution Time,${statisticsResponse.averageResolutionTime} days\n`;
      csvContent += `Satisfaction Score,${statisticsResponse.satisfactionScore}/5\n\n`;

      if (departmentBreakdownResponse.length > 0) {
        csvContent += "Department Breakdown\n";
        csvContent += "Department,Count,Resolution Rate\n";
        departmentBreakdownResponse.forEach((dept) => {
          csvContent += `${dept.department},${
            dept.count
          },${dept.resolutionRate.toFixed(1)}%\n`;
        });
        csvContent += "\n";
      }

      if (categoryBreakdownResponse.length > 0) {
        csvContent += "Category Breakdown\n";
        csvContent += "Category,Count\n";
        categoryBreakdownResponse.forEach((cat) => {
          csvContent += `${cat.category},${cat.count}\n`;
        });
        csvContent += "\n";
      }

      if (priorityBreakdownResponse.length > 0) {
        csvContent += "Priority Breakdown\n";
        csvContent += "Priority,Count\n";
        priorityBreakdownResponse.forEach((priority) => {
          csvContent += `${priority.priority},${priority.count}\n`;
        });
        csvContent += "\n";
      }

      csvContent += "Trend Analysis\n";
      csvContent += "Metric,Change\n";
      csvContent += `Total Complaints Change,${trendCalculationsResponse.totalComplaintsChange.toFixed(
        1
      )}%\n`;
      csvContent += `Resolution Rate Change,${trendCalculationsResponse.resolutionRateChange.toFixed(
        1
      )}%\n`;
      csvContent += `Resolution Time Change,${trendCalculationsResponse.resolutionTimeChange.toFixed(
        1
      )}%\n`;
      csvContent += `Satisfaction Change,${trendCalculationsResponse.satisfactionChange.toFixed(
        1
      )}%\n`;

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="customer-care-report-${
          new Date().toISOString().split("T")[0]
        }.csv"`
      );
      res.send(csvContent);
    } else if (format.toLowerCase() === "word") {
      let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Customer Care Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; color: #0d6449; margin-bottom: 30px; }
        .section { margin-bottom: 25px; }
        .section h2 { color: #0d6449; border-bottom: 2px solid #0d6449; padding-bottom: 5px; }
        .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .summary-item { background: #f8f9fa; padding: 10px; border-radius: 5px; }
        .summary-item strong { color: #0d6449; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #0d6449; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ELRA Customer Care Report</h1>
        <p>Generated for: ${req.user.firstName} ${req.user.lastName}</p>
        <p>Department: ${req.user.department?.name} | Position: ${
        req.user.role?.name
      }</p>
        <p>Report Period: Last ${dateRange} days | Generated: ${new Date().toLocaleString()}</p>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <div class="summary-grid">
            <div class="summary-item">
                <strong>Total Complaints:</strong> ${
                  statisticsResponse.totalComplaints
                }
            </div>
            <div class="summary-item">
                <strong>Resolved Complaints:</strong> ${
                  statisticsResponse.resolvedComplaints
                }
            </div>
            <div class="summary-item">
                <strong>Pending Complaints:</strong> ${
                  statisticsResponse.pendingComplaints
                }
            </div>
            <div class="summary-item">
                <strong>High Priority:</strong> ${
                  statisticsResponse.highPriority
                }
            </div>
            <div class="summary-item">
                <strong>Resolution Rate:</strong> ${
                  statisticsResponse.resolutionRate
                }%
            </div>
            <div class="summary-item">
                <strong>Average Resolution Time:</strong> ${
                  statisticsResponse.averageResolutionTime
                } days
            </div>
            <div class="summary-item">
                <strong>Satisfaction Score:</strong> ${
                  statisticsResponse.satisfactionScore
                }/5
            </div>
        </div>
    </div>
`;

      if (departmentBreakdownResponse.length > 0) {
        htmlContent += `
    <div class="section">
        <h2>Department Breakdown</h2>
        <table>
            <thead>
                <tr>
                    <th>Department</th>
                    <th>Count</th>
                    <th>Resolution Rate</th>
                </tr>
            </thead>
            <tbody>
`;
        departmentBreakdownResponse.forEach((dept) => {
          htmlContent += `
                <tr>
                    <td>${dept.department}</td>
                    <td>${dept.count}</td>
                    <td>${dept.resolutionRate.toFixed(1)}%</td>
                </tr>
`;
        });
        htmlContent += `
            </tbody>
        </table>
    </div>
`;
      }

      if (categoryBreakdownResponse.length > 0) {
        htmlContent += `
    <div class="section">
        <h2>Category Breakdown</h2>
        <table>
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Count</th>
                </tr>
            </thead>
            <tbody>
`;
        categoryBreakdownResponse.forEach((cat) => {
          htmlContent += `
                <tr>
                    <td>${cat.category}</td>
                    <td>${cat.count}</td>
                </tr>
`;
        });
        htmlContent += `
            </tbody>
        </table>
    </div>
`;
      }

      if (priorityBreakdownResponse.length > 0) {
        htmlContent += `
    <div class="section">
        <h2>Priority Breakdown</h2>
        <table>
            <thead>
                <tr>
                    <th>Priority</th>
                    <th>Count</th>
                </tr>
            </thead>
            <tbody>
`;
        priorityBreakdownResponse.forEach((priority) => {
          htmlContent += `
                <tr>
                    <td>${priority.priority}</td>
                    <td>${priority.count}</td>
                </tr>
`;
        });
        htmlContent += `
            </tbody>
        </table>
    </div>
`;
      }

      htmlContent += `
    <div class="section">
        <h2>Trend Analysis</h2>
        <table>
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Change</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Total Complaints Change</td>
                    <td>${trendCalculationsResponse.totalComplaintsChange.toFixed(
                      1
                    )}%</td>
                </tr>
                <tr>
                    <td>Resolution Rate Change</td>
                    <td>${trendCalculationsResponse.resolutionRateChange.toFixed(
                      1
                    )}%</td>
                </tr>
                <tr>
                    <td>Resolution Time Change</td>
                    <td>${trendCalculationsResponse.resolutionTimeChange.toFixed(
                      1
                    )}%</td>
                </tr>
                <tr>
                    <td>Satisfaction Change</td>
                    <td>${trendCalculationsResponse.satisfactionChange.toFixed(
                      1
                    )}%</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>Report generated by ELRA Customer Care System</p>
        <p>For support, contact: support@elra.com</p>
    </div>
</body>
</html>
`;

      res.setHeader("Content-Type", "text/html");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="customer-care-report-${
          new Date().toISOString().split("T")[0]
        }.html"`
      );
      res.send(htmlContent);
    } else {
      return res.status(400).json({
        success: false,
        message: "Unsupported export format",
      });
    }
  } catch (error) {
    console.error("Error exporting Customer Care report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export report",
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
    const currentUser = req.user;
    const currentUserLevel = currentUser.role?.level || 300;

    const teamMembers = await User.find({
      $or: [
        { "department.name": "Customer Service" },
        { "department.name": "Customer Care" },
      ],
    })
      .populate("role", "name level")
      .populate("department", "name")
      .select("firstName lastName email role department avatar")
      .then((users) =>
        users.filter(
          (user) =>
            user.role &&
            user.role.level < currentUserLevel &&
            user.role.level >= 300 &&
            user._id.toString() !== currentUser._id.toString()
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

    console.log(
      `✅ [CUSTOMER CARE] Returning ${membersWithCounts.length} team members with counts`
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

// @desc    Get all departments with their HODs
// @route   GET /api/customer-care/departments-with-hods
// @access  Private (Staff+)
export const getDepartmentsWithHODs = async (req, res) => {
  try {
    const Department = (await import("../models/Department.js")).default;
    const User = (await import("../models/User.js")).default;

    const departments = await Department.find({ isActive: true })
      .select("name code description")
      .sort({ name: 1 });

    // Find the HOD role first
    const Role = (await import("../models/Role.js")).default;
    const hodRole = await Role.findOne({ name: "HOD" });

    if (!hodRole) {
      return res.status(404).json({
        success: false,
        message: "HOD role not found in system",
      });
    }

    // For each department, find the HOD using the role ID
    const departmentsWithHODs = await Promise.all(
      departments.map(async (dept) => {
        const hod = await User.findOne({
          department: dept._id,
          role: hodRole._id,
        })
          .select("firstName lastName email role avatar")
          .populate("role", "name level")
          .populate("avatar");

        return {
          ...dept.toObject(),
          hod: hod || null,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: departmentsWithHODs,
    });
  } catch (error) {
    console.error("Error fetching departments with HODs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch departments with HODs",
      error: error.message,
    });
  }
};

// @desc    Send complaint details to a department HOD
// @route   POST /api/customer-care/complaints/:id/send-to-hod
// @access  Private (Staff+)
export const sendComplaintToHOD = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetDepartmentId, targetHODId, message } = req.body;
    const currentUser = req.user;

    // Find the complaint
    const complaint = await Complaint.findById(id)
      .populate("submittedBy", "firstName lastName email department")
      .populate("department", "name")
      .populate("assignedTo", "firstName lastName email");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    // Find the target department first
    const Department = (await import("../models/Department.js")).default;
    const targetDepartment = await Department.findById(targetDepartmentId);

    if (!targetDepartment) {
      return res.status(404).json({
        success: false,
        message: "Target department not found",
      });
    }

    // Find the HOD role
    const Role = (await import("../models/Role.js")).default;
    const hodRole = await Role.findOne({ name: "HOD" });

    if (!hodRole) {
      return res.status(404).json({
        success: false,
        message: "HOD role not found in system",
      });
    }

    const User = (await import("../models/User.js")).default;
    const targetHOD = await User.findOne({
      role: hodRole._id,
      department: targetDepartmentId,
    })
      .populate("department", "name")
      .populate("role", "name level");

    if (!targetHOD) {
      return res.status(404).json({
        success: false,
        message: `No HOD found for ${targetDepartment.name} department`,
      });
    }

    const NotificationService = (
      await import("../services/notificationService.js")
    ).default;
    const notificationService = new NotificationService();

    const notificationData = {
      recipient: targetHODId,
      type: "complaint_forwarded",
      title: "Complaint Forwarded to Your Department",
      message:
        message ||
        `Complaint #${complaint.complaintNumber} has been forwarded to your department for review.`,
      priority: "high",
      data: {
        complaintId: complaint._id,
        complaintNumber: complaint.complaintNumber,
        complaintTitle: complaint.title,
        complaintCategory: complaint.category,
        complaintPriority: complaint.priority,
        complaintStatus: complaint.status,
        submittedBy: complaint.submittedBy._id,
        submittedByName: `${complaint.submittedBy.firstName} ${complaint.submittedBy.lastName}`,
        submittedByDepartment: complaint.submittedBy.department?.name || "N/A",
        forwardedBy: currentUser._id,
        forwardedByName: `${currentUser.firstName} ${currentUser.lastName}`,
        forwardedByDepartment: currentUser.department?.name || "N/A",
        targetDepartmentId: targetDepartmentId,
        targetDepartmentName: targetHOD.department?.name || "N/A",
        forwardedAt: new Date(),
        actionUrl: `/dashboard/modules/customer-care/complaint-management`,
      },
    };

    await notificationService.createNotification(notificationData);

    console.log(
      `✅ [CUSTOMER CARE] Complaint #${complaint.complaintNumber} forwarded to ${targetHOD.firstName} ${targetHOD.lastName} (${targetHOD.department?.name} HOD)`
    );

    res.status(200).json({
      success: true,
      message: "Complaint details sent to department HOD",
      data: {
        complaintId: complaint._id,
        complaintNumber: complaint.complaintNumber,
        targetHOD: {
          id: targetHOD._id,
          name: `${targetHOD.firstName} ${targetHOD.lastName}`,
          department: targetHOD.department?.name,
        },
        forwardedBy: {
          id: currentUser._id,
          name: `${currentUser.firstName} ${currentUser.lastName}`,
        },
      },
    });
  } catch (error) {
    console.error("Error sending complaint to HOD:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send complaint to HOD",
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
      const NotificationService = (
        await import("../services/notificationService.js")
      ).default;
      const notificationService = new NotificationService();

      const assignmentNotificationData = {
        recipient: assignedTo,
        type: "complaint_assigned",
        title: "New Complaint Assigned to You",
        message: `You have been assigned a new complaint: "${complaint.title}" from ${complaint.submittedBy.firstName} ${complaint.submittedBy.lastName}. Please review and take action.`,
        priority: "high",
        data: {
          complaintId: complaint._id,
          complaintNumber: complaint.complaintNumber,
          complaintTitle: complaint.title,
          complaintCategory: complaint.category,
          complaintPriority: complaint.priority,
          submittedBy: complaint.submittedBy._id,
          submittedByName: `${complaint.submittedBy.firstName} ${complaint.submittedBy.lastName}`,
          assignedBy: req.user._id,
          assignedByName: `${req.user.firstName} ${req.user.lastName}`,
          assignedAt: new Date(),
          actionUrl: `/dashboard/modules/customer-care/my-assignments`,
        },
      };

      await notificationService.createNotification(assignmentNotificationData);

      console.log(
        `✅ [CUSTOMER CARE] Notification sent to ${complaint.assignedTo.firstName} ${complaint.assignedTo.lastName} for complaint assignment`
      );
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
      .populate("submittedBy", "firstName lastName email avatar")
      .populate("assignedTo", "firstName lastName email avatar")
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

    // Send notifications using proper service
    console.log(
      `📧 [CUSTOMER CARE] Sending ${hodNotifications.length} reminder notifications`
    );

    for (const notification of hodNotifications) {
      try {
        await notificationService.createNotification(notification);
        console.log(
          `✅ [CUSTOMER CARE] Reminder notification sent to: ${notification.recipient}`
        );
      } catch (error) {
        console.error(
          `❌ [CUSTOMER CARE] Failed to send reminder notification:`,
          error
        );
      }
    }

    if (staffNotifications && staffNotifications.length > 0) {
      console.log(
        `📧 [CUSTOMER CARE] Sending ${staffNotifications.length} staff reminder notifications`
      );

      for (const notification of staffNotifications) {
        try {
          await notificationService.createNotification(notification);
          console.log(
            `✅ [CUSTOMER CARE] Staff reminder notification sent to: ${notification.recipient}`
          );
        } catch (error) {
          console.error(
            `❌ [CUSTOMER CARE] Failed to send staff reminder notification:`,
            error
          );
        }
      }
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
