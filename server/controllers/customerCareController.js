import Complaint from "../models/Complaint.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import mongoose from "mongoose";

// Get all complaints with filtering and pagination
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
      search,
      sortBy = "submittedAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter object
    const filter = {};

    // Apply user-based filtering
    if (req.userFilter) {
      Object.assign(filter, req.userFilter);
    }

    // Apply status filter
    if (status) {
      filter.status = status;
    }

    // Apply priority filter
    if (priority) {
      filter.priority = priority;
    }

    // Apply category filter
    if (category) {
      filter.category = category;
    }

    // Apply department filter
    if (department) {
      filter.department = department;
    }

    // Apply assigned to filter
    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    // Apply search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { complaintNumber: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get complaints with pagination
    const complaints = await Complaint.find(filter)
      .populate("submittedBy", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email")
      .populate("department", "name")
      .populate("resolvedBy", "firstName lastName")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Complaint.countDocuments(filter);

    // Calculate pagination info
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

    // Check if user can access this complaint
    const user = req.user;
    const isCustomerCareUser =
      user.department?.name === "Customer Service" ||
      user.department?.name === "Customer Care";

    // Customer Care staff can see all complaints
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

    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and category are required",
      });
    }

    // Create complaint
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

    // Populate the created complaint
    await complaint.populate([
      { path: "submittedBy", select: "firstName lastName email" },
      { path: "department", select: "name" },
    ]);

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
