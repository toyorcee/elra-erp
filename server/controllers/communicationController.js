import Announcement from "../models/Announcement.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Document from "../models/Document.js";
import NotificationService from "../services/notificationService.js";

const notificationService = new NotificationService();

const isHRHODOrSuperAdmin = (user) => {
  const isSuper = user?.role?.level >= 1000 || user?.isSuperadmin;
  const isHRHOD =
    user?.role?.level >= 700 &&
    (user?.department?.name === "Human Resources" ||
      user?.department === "Human Resources");
  return isSuper || isHRHOD;
};

const isHODOrSuperAdmin = (user) => {
  const isSuper = user?.role?.level >= 1000 || user?.isSuperadmin;
  const isHOD = user?.role?.level >= 700;
  return isSuper || isHOD;
};

export const listAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 10, departmentId, search } = req.query;

    const filter = { isActive: true };

    const audienceConditions = [];
    if (departmentId) {
      audienceConditions.push(
        { audienceScope: "all" },
        { audienceScope: "department", department: departmentId }
      );
    } else {
      audienceConditions.push(
        { audienceScope: "all" },
        { audienceScope: "department" }
      );
    }

    // Build search filter
    const searchConditions = [];
    if (search) {
      searchConditions.push(
        { title: { $regex: search, $options: "i" } },
        { body: { $regex: search, $options: "i" } }
      );
    }

    // Combine filters
    if (audienceConditions.length > 0 && searchConditions.length > 0) {
      filter.$and = [{ $or: audienceConditions }, { $or: searchConditions }];
    } else if (audienceConditions.length > 0) {
      filter.$or = audienceConditions;
    } else if (searchConditions.length > 0) {
      filter.$or = searchConditions;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Announcement.find(filter)
        .populate("createdBy", "firstName lastName role department avatar")
        .populate("department", "name code")
        .populate(
          "attachments",
          "title fileName originalFileName fileUrl fileSize mimeType"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Announcement.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: { items, total, page: Number(page), pageSize: Number(limit) },
    });
  } catch (error) {
    console.error("Announcements list error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch announcements" });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    console.log("🔍 [createAnnouncement] Request body:", req.body);
    console.log("🔍 [createAnnouncement] Request files:", req.files);

    if (req.body.audienceScope === "all") {
      if (!isHRHODOrSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message:
            "Only HR HOD or Super Admin can create company-wide announcements",
        });
      }
    } else if (req.body.audienceScope === "department") {
      if (!isHODOrSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message:
            "Only HOD or Super Admin can create department announcements",
        });
      }
    } else {
      // Default to HR HOD or Super Admin for backward compatibility
      if (!isHRHODOrSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Only HR HOD or Super Admin can create announcements",
        });
      }
    }

    // Handle attachments - extract Document IDs from uploaded files
    let attachmentIds = [];
    if (req.body.attachments) {
      let attachments = [];
      if (typeof req.body.attachments === "string") {
        try {
          attachments = JSON.parse(req.body.attachments);
        } catch (error) {
          console.error("Error parsing attachments:", error);
          attachments = [];
        }
      } else if (Array.isArray(req.body.attachments)) {
        attachments = req.body.attachments;
      }

      // Extract document IDs from the uploaded files
      attachmentIds = attachments
        .map((att) => att.documentId)
        .filter((id) => id);
    }

    console.log(
      "🔍 [createAnnouncement] Attachment Document IDs:",
      attachmentIds
    );

    const payload = {
      title: req.body.title,
      body: req.body.body,
      audienceScope: req.body.audienceScope || "all",
      department: req.body.department || req.user.department?._id || undefined,
      priority: req.body.priority || "normal",
      attachments: attachmentIds,
      createdBy: req.user._id,
    };

    console.log("🔍 [createAnnouncement] Payload before attachments:", payload);

    const item = await Announcement.create(payload);
    console.log(
      "✅ [communicationController] Announcement created successfully:",
      {
        announcementId: item._id,
        title: item.title,
        audienceScope: item.audienceScope,
        department: item.department,
        priority: item.priority,
        attachments: item.attachments,
      }
    );

    try {
      let usersToNotify = [];

      if (item.audienceScope === "all") {
        usersToNotify = await User.find({ isActive: true })
          .select("_id")
          .lean();
      } else if (item.audienceScope === "department" && item.department) {
        usersToNotify = await User.find({
          isActive: true,
          department: item.department,
        })
          .select("_id")
          .lean();
      }

      const notifyPromises = usersToNotify
        .filter((u) => u._id.toString() !== req.user._id.toString())
        .map((u) =>
          notificationService.createNotification({
            recipient: u._id,
            type: "ANNOUNCEMENT_CREATED",
            title: `New ${
              item.audienceScope === "all" ? "Company" : "Department"
            } Announcement: ${item.title}`,
            message: (() => {
              let message =
                item.body.length > 100
                  ? `${item.body.substring(0, 100)}...`
                  : item.body;

              // Add attachment info if there are attachments
              if (item.attachments && item.attachments.length > 0) {
                const attachmentText =
                  item.attachments.length === 1
                    ? "1 attachment"
                    : `${item.attachments.length} attachments`;
                message += ` (${attachmentText})`;
              }

              return message;
            })(),
            data: {
              announcementId: item._id,
              audienceScope: item.audienceScope,
              department: item.department,
              actionUrl:
                item.audienceScope === "department"
                  ? "/dashboard/modules/department-management/announcements"
                  : "/dashboard/modules/communication/announcements",
              priority: "medium",
              attachments: item.attachments || [],
            },
          })
        );
      const notificationResults = await Promise.allSettled(notifyPromises);
      const successfulNotifications = notificationResults.filter(
        (result) => result.status === "fulfilled"
      ).length;
      const failedNotifications = notificationResults.filter(
        (result) => result.status === "rejected"
      ).length;

      if (failedNotifications > 0) {
        console.log(
          "⚠️ [communicationController] Some announcement notifications failed:",
          notificationResults
            .filter((result) => result.status === "rejected")
            .map((r) => r.reason)
        );
      }

      await Notification.create({
        recipient: req.user._id,
        type: "ANNOUNCEMENT_CREATED",
        title: "Announcement Created Successfully",
        message: `Your announcement "${item.title}" has been created and notifications sent to ${usersToNotify.length} users.`,
        data: {
          announcementId: item._id,
          title: item.title,
          audienceScope: item.audienceScope,
          notificationsSent: usersToNotify.length,
          actionUrl:
            item.audienceScope === "department"
              ? "/dashboard/modules/department-management/announcements"
              : "/dashboard/modules/communication/announcements",
        },
      });
    } catch (notifyErr) {
      console.error(
        "❌ [communicationController] Announcement notification error:",
        notifyErr
      );
    }

    // Emit socket event for real-time update
    try {
      if (global.io) {
        global.io.emit("communication:announcementCreated", {
          _id: item._id,
          title: item.title,
          body: item.body,
          audienceScope: item.audienceScope,
          department: item.department,
          createdAt: item.createdAt,
        });
      }
    } catch (socketErr) {
      console.error(
        "❌ [communicationController] Failed to emit announcementCreated socket:",
        socketErr
      );
    }

    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error("Create announcement error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create announcement" });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    console.log("🔍 [updateAnnouncement] Request body:", req.body);
    console.log("🔍 [updateAnnouncement] Request files:", req.files);
    console.log("🔍 [updateAnnouncement] Announcement ID:", req.params.id);

    // First, get the announcement to check its scope
    const existingAnnouncement = await Announcement.findById(req.params.id);
    if (!existingAnnouncement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    // Check permissions based on announcement scope
    if (existingAnnouncement.audienceScope === "all") {
      // Company-wide announcements require HR HOD or Super Admin
      if (!isHRHODOrSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message:
            "Only HR HOD or Super Admin can update company-wide announcements",
        });
      }
    } else if (existingAnnouncement.audienceScope === "department") {
      // Department announcements require any HOD or Super Admin
      if (!isHODOrSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message:
            "Only HOD or Super Admin can update department announcements",
        });
      }

      // For department announcements, HODs can only edit their own announcements
      // Super Admins can edit any department announcement

      if (
        !req.user.isSuperadmin &&
        existingAnnouncement.createdBy.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only edit announcements you created",
        });
      }
    } else {
      if (!isHRHODOrSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Only HR HOD or Super Admin can update announcements",
        });
      }
    }
    const { id } = req.params;

    // Handle attachments - extract Document IDs from uploaded files
    let attachmentIds = [];
    if (req.body.attachments) {
      let attachments = [];
      if (typeof req.body.attachments === "string") {
        try {
          attachments = JSON.parse(req.body.attachments);
        } catch (error) {
          console.error("Error parsing attachments:", error);
          attachments = [];
        }
      } else if (Array.isArray(req.body.attachments)) {
        attachments = req.body.attachments;
      }

      // Extract document IDs from the uploaded files
      attachmentIds = attachments
        .map((att) => att.documentId)
        .filter((id) => id);
    }

    console.log(
      "🔍 [updateAnnouncement] Attachment Document IDs:",
      attachmentIds
    );

    const update = {
      title: req.body.title,
      body: req.body.body,
      audienceScope: req.body.audienceScope,
      department: req.body.department,
      priority: req.body.priority,
      attachments: attachmentIds,
    };

    console.log("🔍 [updateAnnouncement] Update payload:", update);
    const item = await Announcement.findByIdAndUpdate(id, update, {
      new: true,
    });
    console.log(
      "✅ [communicationController] Announcement updated successfully"
    );

    try {
      let usersToNotify = [];
      if (item.audienceScope === "all") {
        usersToNotify = await User.find({ isActive: true })
          .select("_id")
          .lean();
      } else if (item.audienceScope === "department" && item.department) {
        usersToNotify = await User.find({
          isActive: true,
          department: item.department,
        })
          .select("_id")
          .lean();
      }

      const notifyPromises = usersToNotify
        .filter((u) => u._id.toString() !== req.user._id.toString())
        .map((u) =>
          notificationService.createNotification({
            recipient: u._id,
            type: "ANNOUNCEMENT_UPDATED",
            title: `${
              item.audienceScope === "all" ? "Company" : "Department"
            } Announcement Updated: ${item.title}`,
            message: (() => {
              let message = `The announcement "${item.title}" has been updated.`;

              // Add attachment info if there are attachments
              if (item.attachments && item.attachments.length > 0) {
                const attachmentText =
                  item.attachments.length === 1
                    ? "1 attachment"
                    : `${item.attachments.length} attachments`;
                message += ` (${attachmentText})`;
              }

              return message;
            })(),
            data: {
              announcementId: item._id,
              audienceScope: item.audienceScope,
              department: item.department,
              actionUrl:
                item.audienceScope === "department"
                  ? "/dashboard/modules/department-management/announcements"
                  : "/dashboard/modules/communication/announcements",
              priority: "medium",
              attachments: item.attachments || [],
            },
          })
        );
      await Promise.allSettled(notifyPromises);

      // Also notify the updater (HR HOD) about successful update
      await Notification.create({
        recipient: req.user._id,
        type: "ANNOUNCEMENT_UPDATED",
        title: "Announcement Updated Successfully",
        message: `Your announcement "${item.title}" has been updated and notifications sent to ${usersToNotify.length} users.`,
        data: {
          announcementId: item._id,
          title: item.title,
          audienceScope: item.audienceScope,
          notificationsSent: usersToNotify.length,
          actionUrl:
            item.audienceScope === "department"
              ? "/dashboard/modules/department-management/announcements"
              : "/dashboard/modules/communication/announcements",
        },
      });
    } catch (notifyErr) {
      console.error("Announcement update notification error:", notifyErr);
    }

    // Emit socket event for real-time update
    try {
      if (global.io) {
        global.io.emit("communication:announcementUpdated", {
          _id: item._id,
          title: item.title,
          body: item.body,
          audienceScope: item.audienceScope,
          department: item.department,
          updatedAt: item.updatedAt,
        });
      }
    } catch (socketErr) {
      console.error(
        "❌ [communicationController] Failed to emit announcementUpdated socket:",
        socketErr
      );
    }

    return res.json({ success: true, data: item });
  } catch (error) {
    console.error("Update announcement error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update announcement" });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    // Check permissions based on announcement scope
    if (announcement.audienceScope === "all") {
      // Company-wide announcements require HR HOD or Super Admin
      if (!isHRHODOrSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message:
            "Only HR HOD or Super Admin can delete company-wide announcements",
        });
      }
    } else if (announcement.audienceScope === "department") {
      // Department announcements require any HOD or Super Admin
      if (!isHODOrSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message:
            "Only HOD or Super Admin can delete department announcements",
        });
      }

      // For department announcements, HODs can only delete their own announcements
      // Super Admins can delete any department announcement

      if (
        !req.user.isSuperadmin &&
        announcement.createdBy.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only delete announcements you created",
        });
      }
    } else {
      // Default to HR HOD or Super Admin for backward compatibility
      if (!isHRHODOrSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Only HR HOD or Super Admin can delete announcements",
        });
      }
    }

    await Announcement.findByIdAndUpdate(id, { isActive: false });
    console.log(
      "✅ [communicationController] Announcement deleted successfully"
    );

    try {
      await Notification.create({
        recipient: req.user._id,
        type: "ANNOUNCEMENT_DELETED",
        title: "Announcement Deleted Successfully",
        message: `Your announcement "${announcement.title}" has been deleted.`,
        data: {
          announcementId: announcement._id,
          title: announcement.title,
          audienceScope: announcement.audienceScope,
          actionUrl:
            item.audienceScope === "department"
              ? "/dashboard/modules/department-management/announcements"
              : "/dashboard/modules/communication/announcements",
        },
      });
    } catch (notifyErr) {
      console.error(
        "❌ [communicationController] Announcement deletion notification error:",
        notifyErr
      );
    }

    // Emit socket event for real-time update
    try {
      if (global.io) {
        global.io.emit("communication:announcementDeleted", {
          announcementId: id,
          title: announcement.title,
          audienceScope: announcement.audienceScope,
          department: announcement.department,
        });
      }
    } catch (socketErr) {
      console.error(
        "❌ [communicationController] Failed to emit announcementDeleted socket:",
        socketErr
      );
    }

    return res.json({ success: true, message: "Announcement removed" });
  } catch (error) {
    console.error("Delete announcement error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete announcement" });
  }
};

// Simple API to fetch all events for authenticated users
export const getAllEvents = async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = { isActive: true };

    // Add date filtering if provided
    if (from || to) {
      const dateFilter = {};
      if (from) {
        dateFilter.end = { $gte: new Date(from) };
      }
      if (to) {
        dateFilter.start = { $lte: new Date(to) };
      }
      if (Object.keys(dateFilter).length > 0) {
        Object.assign(filter, dateFilter);
      }
    }

    // Get user's department for filtering
    const userDepartment = req.user.department;

    // Filter events based on audience scope
    if (userDepartment) {
      filter.$or = [
        { audienceScope: "all" },
        { audienceScope: "department", department: userDepartment },
      ];
    } else {
      // If user has no department, only show company-wide events
      filter.audienceScope = "all";
    }

    const events = await Event.find(filter)
      .populate("createdBy", "firstName lastName role department avatar")
      .populate("lastUpdatedBy", "firstName lastName role department avatar")
      .populate(
        "updateHistory.updatedBy",
        "firstName lastName role department avatar"
      )
      .populate("department", "name code")
      .sort({ start: 1 });

    res.json({
      success: true,
      data: events,
      count: events.length,
    });
  } catch (error) {
    console.error("Error fetching all events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
    });
  }
};

export const listEvents = async (req, res) => {
  try {
    const { from, to, departmentId, page, limit } = req.query;
    const filter = { isActive: true };
    if (from || to) {
      const dateFilter = {};
      if (from) {
        dateFilter.end = { $gte: new Date(from) };
      }
      if (to) {
        dateFilter.start = { $lte: new Date(to) };
      }
      if (Object.keys(dateFilter).length > 0) {
        Object.assign(filter, dateFilter);
      }
    }
    if (departmentId) {
      filter.$or = [
        { audienceScope: "all" },
        { audienceScope: "department", department: departmentId },
      ];
    }

    const query = Event.find(filter)
      .populate("createdBy", "firstName lastName role department avatar")
      .populate("lastUpdatedBy", "firstName lastName role department avatar")
      .populate(
        "updateHistory.updatedBy",
        "firstName lastName role department avatar"
      )
      .populate("department", "name code")
      .sort({ start: 1 });

    if (page && limit) {
      const skip = (Number(page) - 1) * Number(limit);
      const [items, total] = await Promise.all([
        query.skip(skip).limit(Number(limit)),
        Event.countDocuments(filter),
      ]);
      return res.json({
        success: true,
        data: { items, total, page: Number(page), pageSize: Number(limit) },
      });
    }

    const items = await query;
    return res.json({ success: true, data: items });
  } catch (error) {
    console.error("Events list error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch events" });
  }
};

export const createEvent = async (req, res) => {
  try {
    console.log("🚀 [communicationController] Creating event");

    // Check permissions based on event scope
    if (req.body.audienceScope === "all") {
      // Company-wide events require HR HOD or Super Admin
      if (!isHRHODOrSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Only HR HOD or Super Admin can create company-wide events",
        });
      }
    } else if (req.body.audienceScope === "department") {
      // Department events require any HOD or Super Admin
      if (!isHODOrSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Only HOD or Super Admin can create department events",
        });
      }
    } else {
      // Default to HR HOD or Super Admin for backward compatibility
      if (!isHRHODOrSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Only HR HOD or Super Admin can create events",
        });
      }
    }

    // Only accept AM/PM format
    if (
      !req.body.startDate ||
      !req.body.startTime ||
      !req.body.startMeridiem ||
      !req.body.endDate ||
      !req.body.endTime ||
      !req.body.endMeridiem
    ) {
      return res.status(400).json({
        success: false,
        message:
          "startDate, startTime, startMeridiem, endDate, endTime, endMeridiem are required",
      });
    }

    const to24 = (timeStr, mer) => {
      if (!timeStr) return "00:00";
      const [hhStr, mmStr] = timeStr.split(":");
      let hh = parseInt(hhStr || "0", 10);
      const mm = parseInt(mmStr || "0", 10);
      if (mer === "PM" && hh < 12) hh += 12;
      if (mer === "AM" && hh === 12) hh = 0;
      return `${hh.toString().padStart(2, "0")}:${mm
        .toString()
        .padStart(2, "0")}`;
    };
    const start24 = to24(req.body.startTime, req.body.startMeridiem);
    const end24 = to24(req.body.endTime, req.body.endMeridiem);
    const start = new Date(`${req.body.startDate}T${start24}:00`);
    const end = new Date(`${req.body.endDate}T${end24}:00`);

    const payload = {
      title: req.body.title,
      description: req.body.description || "",
      start,
      end,
      location: req.body.location || "",
      category: req.body.category || "meeting",
      audienceScope: req.body.audienceScope || "all",
      department: req.body.department || req.user.department?._id || undefined,
      isAllDay: !!req.body.isAllDay,
      createdBy: req.user._id,
      eventState: "created",
      originalStart: start,
      originalEnd: end,
    };
    const item = await Event.create(payload);
    console.log("✅ [communicationController] Event created successfully:", {
      eventId: item._id,
      title: item.title,
      audienceScope: item.audienceScope,
      department: item.department,
      start: item.start,
      end: item.end,
    });

    try {
      let usersToNotify = [];

      if (item.audienceScope === "all") {
        usersToNotify = await User.find({ isActive: true })
          .select("_id")
          .lean();
      } else if (item.audienceScope === "department" && item.department) {
        usersToNotify = await User.find({
          isActive: true,
          department: item.department,
        })
          .select("_id")
          .lean();
      }

      const notifyPromises = usersToNotify
        .filter((u) => u._id.toString() !== req.user._id.toString())
        .map((u) =>
          notificationService.createNotification({
            recipient: u._id,
            type: "EVENT_CREATED",
            title: `New ${
              item.audienceScope === "all" ? "Company" : "Department"
            } Event: ${item.title}`,
            message: `${item.title} scheduled for ${new Date(
              item.start
            ).toLocaleString()}`,
            data: {
              eventId: item._id,
              audienceScope: item.audienceScope,
              department: item.department,
              start: item.start,
              end: item.end,
              actionUrl: "/dashboard/modules/communication/events",
              priority: "medium",
            },
          })
        );
      const notificationResults = await Promise.allSettled(notifyPromises);
      const successfulNotifications = notificationResults.filter(
        (result) => result.status === "fulfilled"
      ).length;
      const failedNotifications = notificationResults.filter(
        (result) => result.status === "rejected"
      ).length;

      if (failedNotifications > 0) {
        console.log(
          "⚠️ [communicationController] Some notifications failed:",
          notificationResults
            .filter((result) => result.status === "rejected")
            .map((r) => r.reason)
        );
      }

      // Also notify the creator (HR HOD) about successful creation
      await Notification.create({
        recipient: req.user._id,
        type: "EVENT_CREATED",
        title: "Event Created Successfully",
        message: `Your event "${item.title}" has been created and notifications sent to ${usersToNotify.length} users.`,
        data: {
          eventId: item._id,
          title: item.title,
          audienceScope: item.audienceScope,
          notificationsSent: usersToNotify.length,
          actionUrl: "/dashboard/modules/communication/events",
        },
      });
    } catch (notifyErr) {
      console.error(
        "❌ [communicationController] Event notification error:",
        notifyErr
      );
    }
    try {
      if (global.io) {
        global.io.emit("communication:eventCreated", {
          _id: item._id,
          title: item.title,
          start: item.start,
          end: item.end,
          audienceScope: item.audienceScope,
          department: item.department,
          location: item.location,
          description: item.description,
          isAllDay: item.isAllDay,
          createdAt: item.createdAt,
        });
      }
    } catch (socketErr) {
      console.error(
        "❌ [communicationController] Failed to emit eventCreated socket:",
        socketErr
      );
    }
    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error("Create event error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create event" });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // First, get the event to check its scope
    const existingEvent = await Event.findById(id);
    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check permissions based on event scope
    if (existingEvent.audienceScope === "all") {
      // Company-wide events require HR HOD or Super Admin
      if (!isHRHODOrSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Only HR HOD or Super Admin can update company-wide events",
        });
      }
    } else if (existingEvent.audienceScope === "department") {
      // Department events require any HOD or Super Admin
      if (!isHODOrSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Only HOD or Super Admin can update department events",
        });
      }
    } else {
      // Default to HR HOD or Super Admin for backward compatibility
      if (!isHRHODOrSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Only HR HOD or Super Admin can update events",
        });
      }
    }

    // Handle AM/PM format for updates too
    let start, end;
    if (
      req.body.startDate &&
      req.body.startTime &&
      req.body.startMeridiem &&
      req.body.endDate &&
      req.body.endTime &&
      req.body.endMeridiem
    ) {
      const to24 = (timeStr, mer) => {
        if (!timeStr) return "00:00";
        const [hhStr, mmStr] = timeStr.split(":");
        let hh = parseInt(hhStr || "0", 10);
        const mm = parseInt(mmStr || "0", 10);
        if (mer === "PM" && hh < 12) hh += 12;
        if (mer === "AM" && hh === 12) hh = 0;
        return `${hh.toString().padStart(2, "0")}:${mm
          .toString()
          .padStart(2, "0")}`;
      };
      const start24 = to24(req.body.startTime, req.body.startMeridiem);
      const end24 = to24(req.body.endTime, req.body.endMeridiem);
      start = new Date(`${req.body.startDate}T${start24}:00`);
      end = new Date(`${req.body.endDate}T${end24}:00`);
    } else {
      start = req.body.start;
      end = req.body.end;
    }

    const isRescheduled =
      existingEvent.start.getTime() !== start.getTime() ||
      existingEvent.end.getTime() !== end.getTime();

    const update = {
      title: req.body.title,
      description: req.body.description,
      start,
      end,
      location: req.body.location,
      category: req.body.category,
      audienceScope: req.body.audienceScope,
      department: req.body.department,
      isAllDay: req.body.isAllDay,
      eventState: isRescheduled ? "rescheduled" : "updated",
      lastUpdatedBy: req.user._id,
      $push: {
        updateHistory: {
          updatedAt: new Date(),
          updatedBy: req.user._id,
          changes: isRescheduled
            ? `Event rescheduled from ${existingEvent.start.toLocaleString()} to ${start.toLocaleString()}`
            : "Event details updated",
          previousStart: existingEvent.start,
          previousEnd: existingEvent.end,
        },
      },
    };
    const item = await Event.findByIdAndUpdate(id, update, { new: true });
    console.log("✅ [communicationController] Event updated successfully");

    try {
      let usersToNotify = [];
      if (item.audienceScope === "all") {
        usersToNotify = await User.find({ isActive: true })
          .select("_id")
          .lean();
      } else if (item.audienceScope === "department" && item.department) {
        usersToNotify = await User.find({
          isActive: true,
          department: item.department,
        })
          .select("_id")
          .lean();
      }

      const notifyPromises = usersToNotify
        .filter((u) => u._id.toString() !== req.user._id.toString())
        .map((u) =>
          notificationService.createNotification({
            recipient: u._id,
            type: "EVENT_UPDATED",
            title: `${
              item.audienceScope === "all" ? "Company" : "Department"
            } Event Updated: ${item.title}`,
            message: `${item.title} has been updated. New time: ${new Date(
              item.start
            ).toLocaleString()}`,
            data: {
              eventId: item._id,
              audienceScope: item.audienceScope,
              department: item.department,
              start: item.start,
              end: item.end,
              actionUrl: "/dashboard/modules/communication/events",
              priority: "medium",
            },
          })
        );
      await Promise.allSettled(notifyPromises);

      // Also notify the updater (HR HOD) about successful update
      await Notification.create({
        recipient: req.user._id,
        type: "EVENT_UPDATED",
        title: "Event Updated Successfully",
        message: `Your event "${item.title}" has been updated and notifications sent to ${usersToNotify.length} users.`,
        data: {
          eventId: item._id,
          title: item.title,
          audienceScope: item.audienceScope,
          notificationsSent: usersToNotify.length,
          actionUrl: "/dashboard/modules/communication/events",
        },
      });
    } catch (notifyErr) {
      console.error("Event update notification error:", notifyErr);
    }

    // Emit socket event for real-time update
    try {
      if (global.io) {
        global.io.emit("communication:eventUpdated", {
          _id: item._id,
          title: item.title,
          start: item.start,
          end: item.end,
          audienceScope: item.audienceScope,
          department: item.department,
          location: item.location,
          description: item.description,
          isAllDay: item.isAllDay,
          updatedAt: item.updatedAt,
        });
      }
    } catch (socketErr) {
      console.error(
        "❌ [communicationController] Failed to emit eventUpdated socket:",
        socketErr
      );
    }

    return res.json({ success: true, data: item });
  } catch (error) {
    console.error("Update event error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update event" });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    console.log("🗑️ [communicationController] Deleting event");

    const { id } = req.params;

    // Get the event before deleting to send notifications
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check permissions based on event scope
    if (event.audienceScope === "all") {
      // Company-wide events require HR HOD or Super Admin
      if (!isHRHODOrSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Only HR HOD or Super Admin can delete company-wide events",
        });
      }
    } else if (event.audienceScope === "department") {
      // Department events require any HOD or Super Admin
      if (!isHODOrSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Only HOD or Super Admin can delete department events",
        });
      }
    } else {
      // Default to HR HOD or Super Admin for backward compatibility
      if (!isHRHODOrSuperAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Only HR HOD or Super Admin can delete events",
        });
      }
    }

    console.log("📋 [communicationController] Event to delete:", {
      title: event.title,
      audienceScope: event.audienceScope,
      department: event.department,
      start: event.start,
    });

    // Soft delete the event
    await Event.findByIdAndUpdate(id, { isActive: false });
    console.log("✅ [communicationController] Event deleted successfully");

    try {
      let usersToNotify = [];

      if (event.audienceScope === "all") {
        usersToNotify = await User.find({ isActive: true })
          .select("_id")
          .lean();
      } else if (event.audienceScope === "department" && event.department) {
        usersToNotify = await User.find({
          isActive: true,
          department: event.department,
        })
          .select("_id")
          .lean();
      }

      const notifyPromises = usersToNotify
        .filter((u) => u._id.toString() !== req.user._id.toString())
        .map((u) =>
          notificationService.createNotification({
            recipient: u._id,
            type: "EVENT_CANCELLED",
            title: `${
              event.audienceScope === "all" ? "Company" : "Department"
            } Event Cancelled: ${event.title}`,
            message: `${event.title} scheduled for ${new Date(
              event.start
            ).toLocaleString()} has been cancelled.`,
            data: {
              eventId: event._id,
              audienceScope: event.audienceScope,
              department: event.department,
              start: event.start,
              end: event.end,
              actionUrl: "/dashboard/modules/communication/events",
              priority: "medium",
            },
          })
        );

      const notificationResults = await Promise.allSettled(notifyPromises);
      const successfulNotifications = notificationResults.filter(
        (result) => result.status === "fulfilled"
      ).length;
      const failedNotifications = notificationResults.filter(
        (result) => result.status === "rejected"
      ).length;

      if (failedNotifications > 0) {
        console.log(
          "⚠️ [communicationController] Some cancellation notifications failed:",
          notificationResults
            .filter((result) => result.status === "rejected")
            .map((r) => r.reason)
        );
      }

      // Also notify the deleter (HR HOD) about successful deletion
      await Notification.create({
        recipient: req.user._id,
        type: "EVENT_CANCELLED",
        title: "Event Deleted Successfully",
        message: `Your event "${event.title}" has been deleted and cancellation notifications sent to ${usersToNotify.length} users.`,
        data: {
          eventId: event._id,
          title: event.title,
          audienceScope: event.audienceScope,
          notificationsSent: usersToNotify.length,
          actionUrl: "/dashboard/modules/communication/events",
        },
      });
    } catch (notifyErr) {
      console.error(
        "❌ [communicationController] Event cancellation notification error:",
        notifyErr
      );
    }

    // Emit socket event for real-time update
    try {
      if (global.io) {
        global.io.emit("communication:eventDeleted", {
          eventId: id,
          title: event.title,
          audienceScope: event.audienceScope,
          department: event.department,
        });
      }
    } catch (socketErr) {
      console.error(
        "❌ [communicationController] Failed to emit eventDeleted socket:",
        socketErr
      );
    }

    return res.json({
      success: true,
      message: "Event cancelled and notifications sent",
    });
  } catch (error) {
    console.error("❌ [communicationController] Delete event error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete event" });
  }
};

// Upload attachments for announcements
export const uploadAnnouncementAttachments = async (req, res) => {
  try {
    if (!isHODOrSuperAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Only HOD or Super Admin can upload attachments",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    console.log(
      `📄 [uploadAnnouncementAttachments] Processing ${req.files.length} files`
    );

    const uploadedDocuments = [];
    const errors = [];

    // Process each uploaded file and save to Documents model
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      try {
        const document = new Document({
          title: file.originalname,
          description: `Announcement attachment: ${file.originalname}`,
          fileName: file.filename,
          originalFileName: file.originalname,
          fileUrl: file.path.replace(/\\/g, "/"),
          fileSize: file.size,
          mimeType: file.mimetype,
          documentType: "other",
          category: "administrative",
          status: "approved",
          department: req.user.department,
          createdBy: req.user._id,
          uploadedBy: req.user._id,
          customCategory: "announcement",
          metadata: {
            originalName: file.originalname,
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.size,
            uploadedBy: req.user._id,
            category: "announcement",
            uploadDate: new Date(),
          },
        });

        await document.save();

        uploadedDocuments.push({
          documentId: document._id,
          name: file.originalname,
          type: file.mimetype,
          size: file.size,
          url: file.path.replace(/\\/g, "/"),
          filename: file.filename,
        });
      } catch (docError) {
        console.error(
          `❌ [uploadAnnouncementAttachments] Error saving document ${file.originalname}:`,
          docError
        );
        errors.push({
          file: file.originalname,
          error: docError.message,
          details: docError.stack,
        });
      }
    }

    if (errors.length > 0) {
      console.warn(
        `⚠️ [uploadAnnouncementAttachments] ${errors.length} files failed to upload`
      );
    }

    return res.json({
      success: true,
      message: `${uploadedDocuments.length} file(s) uploaded successfully`,
      data: uploadedDocuments,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Upload attachments error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to upload attachments" });
  }
};
