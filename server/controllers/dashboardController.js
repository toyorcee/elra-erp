import Document from "../models/Document.js";
import User from "../models/User.js";

// Get dashboard data based on user role
export const getDashboardData = async (req, res) => {
  try {
    const currentUser = req.user;

    // Get basic counts
    const totalDocuments = await Document.countDocuments({ isActive: true });
    const myDocuments = await Document.countDocuments({
      uploadedBy: currentUser.userId,
      isActive: true,
    });

    // Get pending approvals (if user can approve)
    let pendingApprovals = 0;
    if (currentUser.role.level >= 70) {
      // Supervisor and above
      pendingApprovals = await Document.countDocuments({
        currentApprover: currentUser.userId,
        status: { $in: ["SUBMITTED", "UNDER_REVIEW"] },
        isActive: true,
      });
    }

    // Get recent documents
    const recentDocuments = await Document.find({ isActive: true })
      .populate("uploadedBy", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    // Get documents by status
    const documentsByStatus = await Document.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Get documents by category
    const documentsByCategory = await Document.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        totalDocuments,
        myDocuments,
        pendingApprovals,
        recentDocuments,
        documentsByStatus,
        documentsByCategory,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    });
  }
};

// Get user's documents
export const getMyDocuments = async (req, res) => {
  try {
    const currentUser = req.user;
    const { status, page = 1, limit = 10 } = req.query;

    let query = {
      uploadedBy: currentUser.userId,
      isActive: true,
    };

    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const documents = await Document.find(query)
      .populate("currentApprover", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Document.countDocuments(query);

    res.json({
      success: true,
      data: documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get my documents error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch documents",
    });
  }
};

// Get pending approvals for user
export const getMyPendingApprovals = async (req, res) => {
  try {
    const currentUser = req.user;

    // Only supervisors and above can have pending approvals
    if (currentUser.role.level < 70) {
      return res.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    const documents = await Document.find({
      currentApprover: currentUser.userId,
      status: { $in: ["SUBMITTED", "UNDER_REVIEW"] },
      isActive: true,
    })
      .populate("uploadedBy", "name email department")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: documents,
      count: documents.length,
    });
  } catch (error) {
    console.error("Get pending approvals error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending approvals",
    });
  }
};
