import Policy from "../models/Policy.js";
import Department from "../models/Department.js";
import User from "../models/User.js";
import NotificationService from "../services/notificationService.js";

// Create a new policy
export const createPolicy = async (req, res) => {
  try {
    const {
      title,
      category,
      status,
      version,
      effectiveDate,
      description,
      content,
      department,
      attachments,
    } = req.body;

    // Check if user has permission (HOD or Super Admin)
    if (req.user.role.level < 700) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only HOD and Super Admin can create policies.",
      });
    }

    const policy = await Policy.create({
      title,
      category,
      status,
      version,
      effectiveDate,
      description,
      content,
      department: department || null,
      createdBy: req.user._id,
      attachments: attachments || [],
    });

    const populatedPolicy = await Policy.findById(policy._id)
      .populate("department", "name")
      .populate("createdBy", "firstName lastName email");

    try {
      const notificationService = new NotificationService();
      await notificationService.sendPolicyNotification(
        populatedPolicy,
        "created",
        req.user
      );
    } catch (notificationError) {
      console.error("Error sending policy notifications:", notificationError);
    }

    res.status(201).json({
      success: true,
      data: populatedPolicy,
      message: "Policy created successfully",
    });
  } catch (error) {
    console.error("Create policy error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create policy",
    });
  }
};

// Get all policies with filtering and pagination
export const getPolicies = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      search,
      department,
    } = req.query;

    const query = { isActive: true };

    // Apply filters
    if (status && status !== "All") {
      query.status = status;
    }

    if (category && category !== "All") {
      query.category = category;
    }

    if (department) {
      query.department = department;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const policies = await Policy.find(query)
      .populate("department", "name")
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Policy.countDocuments(query);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        policies,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
        },
      },
      message: "Policies retrieved successfully",
    });
  } catch (error) {
    console.error("Get policies error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch policies",
    });
  }
};

// Get policy by ID
export const getPolicyById = async (req, res) => {
  try {
    const { id } = req.params;

    const policy = await Policy.findOne({ _id: id, isActive: true })
      .populate("department", "name")
      .populate("createdBy", "firstName lastName email");

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: "Policy not found",
      });
    }

    res.json({
      success: true,
      data: policy,
      message: "Policy retrieved successfully",
    });
  } catch (error) {
    console.error("Get policy by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch policy",
    });
  }
};

// Update policy
export const updatePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if user has permission (HOD or Super Admin)
    if (req.user.role.level < 700) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only HOD and Super Admin can update policies.",
      });
    }

    const policy = await Policy.findOne({ _id: id, isActive: true });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: "Policy not found",
      });
    }

    // Update lastUpdated timestamp
    updateData.lastUpdated = new Date();

    const updatedPolicy = await Policy.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("department", "name")
      .populate("createdBy", "firstName lastName email");

    try {
      const notificationService = new NotificationService();
      await notificationService.sendPolicyNotification(
        updatedPolicy,
        "updated",
        req.user
      );
    } catch (notificationError) {
      console.error("Error sending policy notifications:", notificationError);
    }

    res.json({
      success: true,
      data: updatedPolicy,
      message: "Policy updated successfully",
    });
  } catch (error) {
    console.error("Update policy error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update policy",
    });
  }
};

// Delete policy (soft delete)
export const deletePolicy = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has permission (Super Admin only)
    if (req.user.role.level < 1000) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Super Admin can delete policies.",
      });
    }

    const policy = await Policy.findOne({ _id: id, isActive: true });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: "Policy not found",
      });
    }

    // Soft delete
    policy.isActive = false;
    await policy.save();

    res.json({
      success: true,
      message: "Policy deleted successfully",
    });
  } catch (error) {
    console.error("Delete policy error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete policy",
    });
  }
};

// Get policy statistics
export const getPolicyStats = async (req, res) => {
  try {
    const stats = await Policy.getStats();

    res.json({
      success: true,
      data: stats,
      message: "Policy statistics retrieved successfully",
    });
  } catch (error) {
    console.error("Get policy stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch policy statistics",
    });
  }
};

// Update policy version
export const updatePolicyVersion = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role.level < 700) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only HOD and Super Admin can update policy versions.",
      });
    }

    const policy = await Policy.findOne({ _id: id, isActive: true });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: "Policy not found",
      });
    }

    await policy.incrementVersion();

    const updatedPolicy = await Policy.findById(id)
      .populate("department", "name")
      .populate("createdBy", "firstName lastName email");

    res.json({
      success: true,
      data: updatedPolicy,
      message: "Policy version updated successfully",
    });
  } catch (error) {
    console.error("Update policy version error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update policy version",
    });
  }
};

// Get policies by department
export const getPoliciesByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const policies = await Policy.find({
      department: departmentId,
      isActive: true,
    })
      .populate("department", "name")
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Policy.countDocuments({
      department: departmentId,
      isActive: true,
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        policies,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
        },
      },
      message: "Department policies retrieved successfully",
    });
  } catch (error) {
    console.error("Get policies by department error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch department policies",
    });
  }
};

export const getPolicyOptions = async (req, res) => {
  try {
    const categories = Policy.schema.path("category").enumValues;
    const statuses = Policy.schema.path("status").enumValues;

    res.json({
      success: true,
      data: {
        categories: categories || [],
        statuses: statuses || [],
      },
    });
  } catch (error) {
    console.error("Get policy options error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get policy options",
    });
  }
};
